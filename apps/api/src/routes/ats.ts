import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import mammoth from 'mammoth';
import { extractPdfText } from '../lib/pdf-parser';
import { extractPdfTextWithGemini } from '../lib/gemini';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth';
import { profileImageS3Service } from '../services/s3Service';
import { atsDiagHandler } from './diag';
import ocrRouter from './ocr';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

const TMP_DIR = process.env.RENDER ? "/opt/render/project/tmp" : os.tmpdir();

// Ensure tmp directory exists on Render
async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
  } catch (error) {
    console.warn("Could not create tmp directory:", error);
  }
}

export default function atsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  // Diagnostic endpoint (temporary)
  router.get('/_diag', atsDiagHandler);

  // Upload and process resume
  router.post('/upload-resume', authenticateToken, async (req: any, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "method_not_allowed" });
    }

    console.info("diag:upload:start", { method: req.method, url: req.url, ts: Date.now() });
    
    // Ensure tmp directory exists
    await ensureTmpDir();
    
    try {
      const form = formidable({
        uploadDir: TMP_DIR,
        keepExtensions: true,
        multiples: false,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowEmptyFiles: false,
        filter: ({ mimetype }) => {
          const allowed = [
            "application/pdf",
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
          ];
          return allowed.includes(mimetype || "");
        },
      });

      // Formidable v3 returns [fields, files] — keep it consistent.
      const [fields, files] = await form.parse(req);
      console.info("diag:upload:parsed", {
        fieldsCount: Object.keys(fields || {}).length,
        fileKeys: Object.keys(files || {}),
        resumeLen: (files as any)?.resume?.length ?? 0,
        fileLen: (files as any)?.file?.length ?? 0,
        uploadLen: (files as any)?.upload?.length ?? 0,
      });

      const uploadFile =
        (files as any)?.resume?.[0] ||
        (files as any)?.file?.[0] ||
        (files as any)?.upload?.[0];

      if (!uploadFile) {
        return res.status(400).json({ success: false, error: "no_file_uploaded" });
      }

      const mime = uploadFile.mimetype || "application/octet-stream";
      const filePath = uploadFile.filepath;
      console.info("diag:upload:filemeta", {
        name: uploadFile?.originalFilename,
        mime: uploadFile?.mimetype,
        size: uploadFile?.size,
        filepath: uploadFile?.filepath,
      });

      const buf = await fs.readFile(filePath);
      console.info("diag:upload:buffer", { bytes: buf?.length ?? 0 });

      if (!buf?.length) {
        return res.status(400).json({ success: false, error: "empty_file" });
      }

      let extractedText = "";
      
      // Upload to S3 if available (do this early so we have s3Key for OCR fallback)
      let s3Url = '';
      if (profileImageS3Service.isAvailable()) {
        try {
          const fileBuffer = buf; // Already read above
          const result = await profileImageS3Service.uploadProfileImage(
            req.user?.uid || req.user?.id || '', 
            fileBuffer, 
            uploadFile.originalFilename || 'resume', 
            uploadFile.mimetype || 'application/pdf'
          );
          if (result.success) {
            // For now, we'll get the file URL through a different method
            // This can be enhanced later to return the actual S3 URL
            s3Url = `uploaded-${Date.now()}`;
          }
        } catch (s3Error) {
          logger.error('S3 upload failed: ' + (s3Error as Error).message);
          // Continue without S3 upload
        }
      }

      if (mime === "application/pdf") {
        console.info("diag:pdf:processing_start", { 
          bufferSize: buf?.length || 0, 
          filename: uploadFile?.originalFilename,
          mime: uploadFile?.mimetype 
        });
        
        if (!buf || buf.length === 0) {
          console.error("diag:pdf:empty_buffer");
          return res.status(400).json({ success: false, error: "empty_file" });
        }
        
        try {
          console.time("diag:pdfjs:extract");
          const r = await extractPdfText(buf);
          console.timeEnd("diag:pdfjs:extract");
          console.info("diag:pdfjs:result", {
            textLen: r?.text?.length ?? 0,
            pages: r?.numPages,
            scanned: r?.isLikelyScanned
          });

                          if (!r.text || r.text.length < 10) {
                  // Fallback if pdf.js returned little/no text
                  console.warn("diag:pdf:using_fallback_pdf-parse");
                  try {
                    const pdf = (await import('pdf-parse')).default;
                    const data = await pdf(buf, {
                      // Add options for better parsing
                      max: 0, // Don't limit pages
                      version: 'v1.10.100' // Use specific version
                    });
                    extractedText = (data.text || "").trim();
                    console.info("diag:pdf:fallback_success", { 
                      textLen: extractedText.length,
                      pages: data.numpages,
                      preview: extractedText.substring(0, 100) + "..."
                    });
                  } catch (fallbackErr: any) {
                    console.error("diag:pdf:fallback_failed", { err: fallbackErr?.message, stack: fallbackErr?.stack });
                    console.warn("diag:pdf:trying_gemini_after_minimal_text");
                    
                    // Try Gemini AI as final fallback (non-blocking)
                    try {
                      console.time("diag:gemini:extract_after_minimal");
                      const geminiResult = await extractPdfTextWithGemini(buf);
                      console.timeEnd("diag:gemini:extract_after_minimal");
                      if (geminiResult && geminiResult.length >= 10) {
                        extractedText = geminiResult;
                        console.info("diag:gemini:success_after_minimal", { textLen: extractedText.length });
                      } else {
                        console.warn("diag:gemini:insufficient_after_minimal");
                        extractedText = '';
                      }
                    } catch (geminiErr: any) {
                      console.error("diag:gemini:failed_after_minimal", { err: geminiErr?.message });
                      extractedText = '';
                    }
                  }
                } else {
                  extractedText = r.text;
                }
        } catch (e: any) {
          console.error("diag:pdfjs:throw", { err: e?.message, stack: e?.stack });
          // Try fallback parser
          try {
            console.time("diag:pdfparse:extract");
            const pdf = (await import('pdf-parse')).default;
            const data = await pdf(buf, {
              max: 0, // Don't limit pages
              version: 'v1.10.100' // Use specific version
            });
            console.timeEnd("diag:pdfparse:extract");
            extractedText = (data.text || "").trim();
            console.info("diag:pdf:fallback_after_error", { 
              textLen: extractedText.length,
              pages: data.numpages,
              preview: extractedText.substring(0, 100) + "..."
            });
          } catch (e2: any) {
            console.error("diag:pdfparse:throw", { err: e2?.message, stack: e2?.stack });
            console.warn("diag:pdf:trying_gemini_fallback");
            
            // Try Gemini AI as final fallback for complex PDFs (non-blocking)
            try {
              console.time("diag:gemini:extract");
              const geminiResult = await extractPdfTextWithGemini(buf);
              console.timeEnd("diag:gemini:extract");
              if (geminiResult && geminiResult.length >= 10) {
                extractedText = geminiResult;
                console.info("diag:gemini:success", { textLen: extractedText.length });
              } else {
                console.warn("diag:gemini:insufficient");
                extractedText = '';
                console.warn("diag:pdf:all_parsers_failed");
              }
            } catch (geminiErr: any) {
              console.error("diag:gemini:failed", { err: geminiErr?.message });
              extractedText = '';
              console.warn("diag:pdf:all_parsers_failed");
            }
          }
        }

        // Enforce minimum text requirement for success
        // Also check if text is just the filename (which shouldn't happen now)
        const isFilenameOnly = extractedText && uploadFile?.originalFilename && 
          extractedText.trim() === uploadFile.originalFilename.replace(/\.[^.]+$/, '');
        
        if (!extractedText || extractedText.trim().length < 10 || isFilenameOnly) {
          console.warn("diag:pdf:insufficient_text", { 
            textLen: extractedText?.length || 0, 
            text: extractedText?.substring(0, 50),
            isFilenameOnly 
          });
          
          // If S3 upload was successful, offer OCR
          if (s3Url) {
            return res.status(422).json({
              success: false,
              error: "pdf_no_extractable_text",
              can_ocr: true,
              s3Key: s3Url, // This should be the S3 key, not URL
              filename: uploadFile.originalFilename || "document.pdf",
              hint: "This PDF appears to be image-only or scanned. Try OCR to extract text.",
            });
          } else {
            return res.status(422).json({
              success: false,
              error: "pdf_no_extractable_text", 
              can_ocr: false,
              hint: "This PDF appears to be image-only, password-protected, or has no selectable text. Try OCR or upload DOCX/TXT.",
            });
          }
        }
      } else if (mime === "application/msword" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const r = await mammoth.extractRawText({ buffer: buf });
        extractedText = (r.value || "").trim();
      } else if (mime === "text/plain") {
        extractedText = buf.toString("utf8");
      } else {
        return res.status(415).json({ success: false, error: "unsupported_type" });
      }



      // Final validation - ensure we always have meaningful text
      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(422).json({
          success: false,
          error: "no_extractable_text",
          hint: "The uploaded file contains no readable text. Please try a different format or file.",
        });
      }

      console.info("diag:upload:success", { 
        filename: uploadFile.originalFilename,
        textLength: extractedText.length,
        textPreview: extractedText.substring(0, 100) + "..."
      });

      // (Optional) cleanup — formidable removes tmp on its own; explicit unlink is optional.
      // await fs.unlink(filePath).catch(() => {}); 

      return res.status(200).json({
        success: true,
        text: extractedText,
        filename: uploadFile.originalFilename || "resume",
        fileUrl: undefined,
        s3Key: s3Url || undefined,
      });

    } catch (e: any) {
      console.error("diag:upload:error", { err: e?.message, stack: e?.stack });
      return res.status(500).json({ success: false, error: "server_pdf_parse_failed" });
    }
  });

  // Process URL (for job descriptions or resumes)
  router.post('/process-url', authenticateToken, async (req: any, res) => {
    try {
      const { url, type } = req.body; // type: 'resume' | 'job'

      if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      // Handle Google Drive links
      if (url.includes('drive.google.com')) {
        const fileId = extractGoogleDriveFileId(url);
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        // PDF processing from Google Drive temporarily disabled
        return res.status(400).json({
          success: false,
          error: 'PDF processing from Google Drive is temporarily disabled. Please download the file and upload it directly, or use DOC/DOCX format.'
        });
      }

      // Handle regular web pages (job descriptions)
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      let content = '';
      let title = $('title').text();

      // LinkedIn job scraping
      if (url.includes('linkedin.com/jobs')) {
        content = $('.description__text').text() || $('.show-more-less-html__markup').text();
        title = $('.top-card-layout__title').text() || $('h1').first().text();
      }
      // Indeed job scraping
      else if (url.includes('indeed.com')) {
        content = $('#jobDescriptionText').text() || $('.jobsearch-jobDescriptionText').text();
        title = $('h1[data-jk]').text() || $('.jobsearch-JobInfoHeader-title').text();
      }
      // Generic job page scraping
      else {
        // Remove script and style elements
        $('script, style').remove();
        
        // Try to find job description content
        const jobSelectors = [
          '[class*="job-description"]',
          '[class*="description"]',
          '[id*="job-description"]',
          '[id*="description"]',
          'main',
          '.content'
        ];
        
        for (const selector of jobSelectors) {
          const element = $(selector);
          if (element.length && element.text().length > 100) {
            content = element.text();
            break;
          }
        }
        
        if (!content) {
          content = $('body').text();
        }
      }

      // Clean up the extracted text
      content = content.replace(/\s+/g, ' ').trim();

      res.status(200).json({
        success: true,
        content,
        title: title.trim()
      });

    } catch (error) {
      logger.error('URL processing error: ' + (error as Error).message);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process URL' 
      });
    }
  });

  // Main analysis endpoint using Gemini AI
  router.post('/analyze', authenticateToken, async (req: any, res) => {
    try {
      const { resumeText, jobDescription, saveResume, resumeName } = req.body;
      const userId = req.user?.uid || req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!resumeText?.trim() || !jobDescription?.trim()) {
        return res.status(400).json({ 
          error: 'Resume text and job description are required' 
        });
      }

      // Generate analysis using Gemini AI
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const analysisPrompt = `
      You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze the following resume against the job description and provide a comprehensive assessment.

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${jobDescription}

      Provide your analysis in the following JSON format:
      {
        "overallScore": [0-100],
        "matchRate": [0-100],
        "searchability": [0-100], 
        "atsCompatibility": [0-100],
        "contactInformation": {"score": [0-100], "status": "excellent|good|needs_improvement", "feedback": "detailed feedback"},
        "professionalSummary": {"score": [0-100], "status": "excellent|good|needs_improvement", "feedback": "detailed feedback"},
        "technicalSkills": {"score": [0-100], "status": "excellent|good|needs_improvement", "feedback": "detailed feedback"},
        "qualifiedAchievements": {"score": [0-100], "status": "excellent|good|needs_improvement", "feedback": "detailed feedback"},
        "educationCertifications": {"score": [0-100], "status": "excellent|good|needs_improvement", "feedback": "detailed feedback"},
        "atsFormat": {"score": [0-100], "status": "excellent|good|needs_improvement", "feedback": "detailed feedback"},
        "hardSkillsFound": ["skill1", "skill2"],
        "hardSkillsMissing": ["missing_skill1", "missing_skill2"],
        "recruiterTips": [
          {
            "category": "Technical Foundation",
            "title": "Strong Technical Foundation", 
            "description": "Detailed tip description",
            "priority": "high"
          }
        ],
        "keywordAnalysis": {
          "totalJobKeywords": [number],
          "foundKeywords": ["keyword1", "keyword2"],
          "missingKeywords": ["missing1", "missing2"],
          "optimizationSuggestions": ["suggestion1", "suggestion2"]
        },
        "improvementSuggestions": ["suggestion1", "suggestion2"]
      }

      Focus on:
      1. ATS compatibility (formatting, keywords, sections)
      2. Keyword matching between resume and job description
      3. Professional presentation and impact
      4. Specific, actionable recommendations
      5. Industry-specific best practices
      `;

      const result = await model.generateContent(analysisPrompt);
      const response = result.response.text();
      
      // Parse the AI response
      const analysisData = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));

      // Generate unique ID for this scan
      const scanId = crypto.randomUUID();

      // Save to database
      const savedScan = await prisma.atsScan.create({
        data: {
          id: scanId,
          userId: userId,
          resumeText: resumeText,
          jobDescription: jobDescription,
          overallScore: analysisData.overallScore,
          matchRate: analysisData.matchRate,
          searchabilityScore: analysisData.searchability,
          atsCompatibilityScore: analysisData.atsCompatibility,
          detailedAnalysis: {
            contactInformation: analysisData.contactInformation,
            professionalSummary: analysisData.professionalSummary,
            technicalSkills: analysisData.technicalSkills,
            qualifiedAchievements: analysisData.qualifiedAchievements,
            educationCertifications: analysisData.educationCertifications,
            atsFormat: analysisData.atsFormat,
          },
          foundKeywords: analysisData.hardSkillsFound || [],
          missingKeywords: analysisData.hardSkillsMissing || [],
          recruiterTips: analysisData.recruiterTips || [],
          improvementSuggestions: analysisData.keywordAnalysis?.optimizationSuggestions || []
        }
      });

      // Save resume if requested
      if (saveResume && resumeName) {
        await prisma.savedResume.create({
          data: {
            userId: userId,
            resumeName: resumeName,
            resumeText: resumeText
          }
        });
      }

      // Structure the response
      const analysisResult = {
        id: scanId,
        overallScore: analysisData.overallScore,
        matchRate: analysisData.matchRate,
        searchability: analysisData.searchability,
        atsCompatibility: analysisData.atsCompatibility,
        detailedAnalysis: {
          contactInformation: analysisData.contactInformation,
          professionalSummary: analysisData.professionalSummary,
          technicalSkills: analysisData.technicalSkills,
          qualifiedAchievements: analysisData.qualifiedAchievements,
          educationCertifications: analysisData.educationCertifications,
          atsFormat: analysisData.atsFormat,
        },
        hardSkills: {
          found: analysisData.hardSkillsFound || [],
          missing: analysisData.hardSkillsMissing || [],
          matchPercentage: Math.round((analysisData.hardSkillsFound?.length || 0) / 
            ((analysisData.hardSkillsFound?.length || 0) + (analysisData.hardSkillsMissing?.length || 0)) * 100)
        },
        recruiterTips: analysisData.recruiterTips || [],
        keywordOptimization: {
          score: analysisData.matchRate,
          totalKeywords: analysisData.keywordAnalysis?.totalJobKeywords || 0,
          foundKeywords: analysisData.keywordAnalysis?.foundKeywords || [],
          missingKeywords: analysisData.keywordAnalysis?.missingKeywords || [],
          suggestions: analysisData.keywordAnalysis?.optimizationSuggestions || []
        },
        competitiveAnalysis: {
          score: Math.round((analysisData.overallScore + analysisData.matchRate) / 2),
          comparison: [
            { metric: 'Keyword Match Rate', userScore: analysisData.matchRate, marketAverage: 75 },
            { metric: 'Skills Coverage', userScore: analysisData.technicalSkills.score, marketAverage: 80 },
            { metric: 'Experience Relevance', userScore: analysisData.qualifiedAchievements.score, marketAverage: 78 },
            { metric: 'ATS Readability', userScore: analysisData.atsCompatibility, marketAverage: 85 }
          ]
        }
      };

      res.status(200).json(analysisResult);

    } catch (error) {
      logger.error('Analysis error: ' + (error as Error).message);
      res.status(500).json({ error: 'Failed to analyze resume' });
    }
  });

  // Get scan results by ID
  router.get('/scan-results/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid || req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const scan = await prisma.atsScan.findFirst({
        where: {
          id: id,
          userId: userId
        }
      });

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Transform data to match frontend interface
      const response = {
        id: scan.id,
        overallScore: scan.overallScore,
        matchRate: scan.matchRate,
        searchability: scan.searchabilityScore,
        atsCompatibility: scan.atsCompatibilityScore,
        detailedAnalysis: scan.detailedAnalysis,
        hardSkills: {
          found: scan.foundKeywords || [],
          missing: scan.missingKeywords || [],
          matchPercentage: Math.round(
            (scan.foundKeywords?.length || 0) / 
            ((scan.foundKeywords?.length || 0) + (scan.missingKeywords?.length || 0)) * 100
          )
        },
        recruiterTips: scan.recruiterTips || [],
        keywordOptimization: {
          score: scan.matchRate,
          totalKeywords: (scan.foundKeywords?.length || 0) + (scan.missingKeywords?.length || 0),
          foundKeywords: scan.foundKeywords || [],
          missingKeywords: scan.missingKeywords || [],
          suggestions: scan.improvementSuggestions || []
        },
        competitiveAnalysis: {
          score: Math.round(((scan.overallScore || 0) + (scan.matchRate || 0)) / 2),
          comparison: [
            { metric: 'Keyword Match Rate', userScore: scan.matchRate, marketAverage: 75 },
            { metric: 'Skills Coverage', userScore: (scan.detailedAnalysis as any)?.technicalSkills?.score || 80, marketAverage: 80 },
            { metric: 'Experience Relevance', userScore: (scan.detailedAnalysis as any)?.qualifiedAchievements?.score || 78, marketAverage: 78 },
            { metric: 'ATS Readability', userScore: scan.atsCompatibilityScore, marketAverage: 85 }
          ]
        },
        createdAt: scan.createdAt
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error fetching scan results: ' + (error as Error).message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user's scan history
  router.get('/history', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.uid || req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const scans = await prisma.atsScan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          overallScore: true,
          matchRate: true,
          createdAt: true
        }
      });

      res.status(200).json(scans);

    } catch (error) {
      logger.error('Error fetching scan history: ' + (error as Error).message);
      res.status(500).json({ error: 'Failed to fetch scan history' });
    }
  });

  // Get saved resumes
  router.get('/saved-resumes', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.uid || req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const resumes = await prisma.savedResume.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          resumeName: true,
          createdAt: true
        }
      });

      res.status(200).json(resumes);

    } catch (error) {
      logger.error('Error fetching saved resumes: ' + (error as Error).message);
      res.status(500).json({ error: 'Failed to fetch saved resumes' });
    }
  });

  // OCR routes
  router.use('/ocr', ocrRouter);

  return router;
}

// Helper function to extract Google Drive file ID
function extractGoogleDriveFileId(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || '';
}
