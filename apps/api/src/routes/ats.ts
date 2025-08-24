import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
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

// Job scraping monitoring utility
class JobScrapingMonitor {
  static logScrapingResult(url: string, result: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      url: url.substring(0, 100),
      domain: new URL(url).hostname,
      status: result.success ? 'success' : 'failed',
      contentLength: result.content?.length || 0,
      title: result.title?.substring(0, 50) || '',
      errorType: result.error ? this.categorizeError(result.error) : null,
      reason: result.reason || null
    };
    
    console.info('diag:scraping:result', logEntry);
    
    // Log failed scrapes separately for analysis
    if (!result.success) {
      console.warn('diag:scraping:failed', {
        ...logEntry,
        fullError: result.error
      });
    }
    
    return logEntry;
  }
  
  static categorizeError(error: string): string {
    if (error.includes('filled') || error.includes('no longer available')) return 'job_filled';
    if (error.includes('403') || error.includes('forbidden')) return 'access_blocked';
    if (error.includes('404') || error.includes('not found')) return 'page_not_found';
    if (error.includes('timeout')) return 'timeout';
    if (error.includes('Insufficient content')) return 'insufficient_content';
    if (error.includes('LinkedIn') && error.includes('authentication')) return 'linkedin_auth_required';
    if (error.includes('rate limit') || error.includes('429')) return 'rate_limited';
    return 'unknown';
  }
  
  static getScrapingMetrics() {
    // This could be enhanced to track metrics in a database or cache
    return {
      timestamp: new Date().toISOString(),
      note: 'Metrics tracking can be enhanced with database storage'
    };
  }
}

const TMP_DIR = process.env.RENDER ? "/opt/render/project/tmp" : os.tmpdir();

// Ensure tmp directory exists on Render
async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
  } catch (error) {
    console.warn("Could not create tmp directory:", error);
  }
}

// Advanced content extraction strategies
class AdvancedContentExtractor {
  private static EXTRACTION_STRATEGIES = [
    'main_content_extraction',
    'job_specific_extraction', 
    'article_extraction',
    'paragraph_consolidation',
    'body_fallback'
  ];

  static async applyAdvancedExtraction($: cheerio.CheerioAPI, url: string): Promise<{content: string, title: string, quality: number}> {
    console.info('diag:extraction:start', { url: url.substring(0, 100) });

    // Remove unwanted elements first
    this.removeUnwantedElements($);

    let bestContent = '';
    let bestTitle = '';
    let bestQuality = 0;
    let bestStrategy = '';

    // Try each extraction strategy
    for (const strategy of this.EXTRACTION_STRATEGIES) {
      try {
        const result = await this.executeStrategy($, strategy, url);
        const quality = this.calculateQualityScore(result.content);
        
        console.info('diag:extraction:strategy_result', {
          strategy,
          contentLength: result.content.length,
          quality,
          title: result.title?.substring(0, 50)
        });

        if (quality > bestQuality && result.content.length > 100) {
          bestContent = result.content;
          bestTitle = result.title || bestTitle;
          bestQuality = quality;
          bestStrategy = strategy;
        }
      } catch (error) {
        console.warn('diag:extraction:strategy_failed', { strategy, error: (error as Error).message });
      }
    }

    console.info('diag:extraction:best_result', {
      strategy: bestStrategy,
      quality: bestQuality,
      contentLength: bestContent.length
    });

    return {
      content: bestContent,
      title: bestTitle,
      quality: bestQuality
    };
  }

  private static removeUnwantedElements($: cheerio.CheerioAPI): void {
    // Remove elements we don't want according to the extraction prompt
    $('script, style, noscript').remove(); // Technical elements
    $('header, .header, [role="banner"]').remove(); // Website headers  
    $('footer, .footer, [role="contentinfo"]').remove(); // Website footers
    $('nav, .nav, .navigation, .navbar, .menu').remove(); // Navigation
    $('aside, .sidebar, .side-panel').remove(); // Sidebars
    $('.cookie, .cookies, .cookie-banner, .cookie-notice, .gdpr').remove(); // Cookie notices
    $('.social-media, .social-share, .social, .share-buttons').remove(); // Social media widgets
    $('.ad, .ads, .advertisement, .banner, .promo').remove(); // Ads
    $('.comments, .comment, .comment-section').remove(); // Comments
    $('.breadcrumb, .breadcrumbs, .pagination').remove(); // Navigation aids
    $('.popup, .modal, .overlay, .lightbox').remove(); // Popups
  }

  private static async executeStrategy($: cheerio.CheerioAPI, strategy: string, url: string): Promise<{content: string, title: string}> {
    switch (strategy) {
      case 'main_content_extraction':
        return this.extractMainContent($);
      case 'job_specific_extraction':
        return this.extractJobSpecificContent($);
      case 'article_extraction':
        return this.extractArticleContent($);
      case 'paragraph_consolidation':
        return this.extractParagraphContent($);
      case 'body_fallback':
        return this.extractBodyFallback($);
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  private static extractMainContent($: cheerio.CheerioAPI): {content: string, title: string} {
    const mainSelectors = [
      'main', '[role="main"]', '.main', '.main-content',
      '.content', '.page-content', '.post-content', '.article-content',
      '#main', '#content', '#main-content'
    ];

    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length) {
        const content = element.text().trim();
        if (content.length > 200) {
          return {
            content,
            title: this.extractTitle($, element)
          };
        }
      }
    }

    throw new Error('No main content found');
  }

  private static extractJobSpecificContent($: cheerio.CheerioAPI): {content: string, title: string} {
    const jobSelectors = [
      '[class*="job-description"]', '[class*="job-detail"]', '[class*="job-content"]',
      '[id*="job-description"]', '[id*="job-detail"]', '[class*="description"]',
      '.position-description', '.role-description', '.job-posting', '.job-info'
    ];

    for (const selector of jobSelectors) {
      const element = $(selector);
      if (element.length) {
        const content = element.text().trim();
        if (content.length > 200) {
          return {
            content,
            title: this.extractTitle($, element)
          };
        }
      }
    }

    throw new Error('No job-specific content found');
  }

  private static extractArticleContent($: cheerio.CheerioAPI): {content: string, title: string} {
    const articleSelectors = [
      'article', '.article', '.post', '.entry', '.post-body',
      '.entry-content', '.article-body', '.content-body'
    ];

    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length) {
        const content = element.text().trim();
        if (content.length > 200) {
          return {
            content,
            title: this.extractTitle($, element)
          };
        }
      }
    }

    throw new Error('No article content found');
  }

  private static extractParagraphContent($: cheerio.CheerioAPI): {content: string, title: string} {
    const paragraphs = $('p');
    let content = '';
    
    paragraphs.each(function() {
      const pText = $(this).text().trim();
      if (pText.length > 50) {
        content += pText + '\n\n';
      }
    });

    if (content.length > 200) {
      return {
        content: content.trim(),
        title: this.extractTitle($)
      };
    }

    throw new Error('Insufficient paragraph content');
  }

  private static extractBodyFallback($: cheerio.CheerioAPI): {content: string, title: string} {
    const bodyText = $('body').text().trim();
    
    if (bodyText.length > 200) {
      return {
        content: bodyText,
        title: this.extractTitle($)
      };
    }

    throw new Error('Insufficient body content');
  }

  private static extractTitle($: cheerio.CheerioAPI, context?: cheerio.Cheerio<any>): string {
    const titleSelectors = [
      'h1', '.page-title', '.post-title', '.article-title',
      '.job-title', '.title', '[class*="title"]'
    ];

    // If context is provided, search within it first
    if (context) {
      for (const selector of titleSelectors) {
        const titleElement = context.find(selector).first();
        if (titleElement.length) {
          const title = titleElement.text().trim();
          if (title && title.length > 5 && title.length < 200) {
            return title;
          }
        }
      }
    }

    // Search in the full document
    for (const selector of titleSelectors) {
      const titleElement = $(selector).first();
      if (titleElement.length) {
        const title = titleElement.text().trim();
        if (title && title.length > 5 && title.length < 200) {
          return title;
        }
      }
    }

    // Fallback to page title
    return $('title').text().trim();
  }

  static calculateQualityScore(content: string): number {
    const factors = {
      has_responsibilities: /responsibilities?|duties|role|what you.?ll do/i.test(content),
      has_requirements: /requirements?|qualifications?|skills|experience|must have/i.test(content),
      has_company_info: /company|organization|about us|who we are/i.test(content),
      sufficient_length: content.split(/\s+/).length > 100,
      has_job_keywords: /position|role|job|career|opportunity|hiring/i.test(content),
      good_structure: content.includes('\n') || content.includes('.') 
    };

    const score = Object.values(factors).filter(Boolean).length / Object.keys(factors).length;
    console.info('diag:quality:score', { score, factors });
    return score;
  }
}

// Fallback analysis generator for when Gemini AI fails
function generateFallbackAnalysis(resumeText: string, jobDescription: string): string {
  console.info('diag:analyze:fallback_start', { 
    resumeLength: resumeText.length, 
    jobLength: jobDescription.length 
  });

  // Simple keyword matching for basic analysis
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  // Common technical skills to look for
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
    'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'typescript',
    'angular', 'vue', 'mongodb', 'postgresql', 'redis', 'restful', 'api'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    resumeLower.includes(skill) && jobLower.includes(skill)
  );
  
  const missingSkills = commonSkills.filter(skill => 
    jobLower.includes(skill) && !resumeLower.includes(skill)
  );
  
  // Basic scoring
  const hasContact = /\b\w+@\w+\.\w+\b/.test(resumeText) || /\(\d{3}\)\s?\d{3}-?\d{4}/.test(resumeText);
  const hasExperience = /experience|worked|developed|built|managed/i.test(resumeText);
  const hasEducation = /university|college|degree|bachelor|master|phd/i.test(resumeText);
  
  const matchRate = Math.min(90, Math.max(40, (foundSkills.length / Math.max(1, foundSkills.length + missingSkills.length)) * 100));
  const overallScore = Math.min(95, Math.max(45, matchRate * 0.8 + (hasContact ? 10 : 0) + (hasExperience ? 10 : 0)));
  
  return JSON.stringify({
    overallScore: Math.round(overallScore),
    matchRate: Math.round(matchRate),
    searchability: Math.round(overallScore * 0.9),
    atsCompatibility: Math.round(overallScore * 0.85),
    contactInformation: {
      score: hasContact ? 90 : 60,
      status: hasContact ? "excellent" : "needs_improvement",
      feedback: hasContact ? "Contact information found" : "Please ensure contact information is clearly visible"
    },
    professionalSummary: {
      score: 75,
      status: "good",
      feedback: "Summary section detected and appears professional"
    },
    technicalSkills: {
      score: Math.round(matchRate),
      status: matchRate > 70 ? "excellent" : matchRate > 50 ? "good" : "needs_improvement",
      feedback: `Found ${foundSkills.length} matching technical skills`
    },
    qualifiedAchievements: {
      score: hasExperience ? 75 : 50,
      status: hasExperience ? "good" : "needs_improvement",
      feedback: hasExperience ? "Experience and achievements detected" : "Consider adding more specific achievements"
    },
    educationCertifications: {
      score: hasEducation ? 80 : 60,
      status: hasEducation ? "good" : "needs_improvement",
      feedback: hasEducation ? "Education information found" : "Education section could be more detailed"
    },
    atsFormat: {
      score: 70,
      status: "good",
      feedback: "Document format appears to be ATS-compatible"
    },
    hardSkillsFound: foundSkills.slice(0, 10),
    hardSkillsMissing: missingSkills.slice(0, 8),
    recruiterTips: [
      {
        category: "Technical Skills",
        title: "Skill Matching",
        description: `Your resume matches ${foundSkills.length} key technical skills from the job description.`,
        priority: "high"
      }
    ],
    keywordAnalysis: {
      totalJobKeywords: foundSkills.length + missingSkills.length,
      foundKeywords: foundSkills.slice(0, 10),
      missingKeywords: missingSkills.slice(0, 8),
      optimizationSuggestions: missingSkills.length > 0 ? 
        [`Consider adding experience with ${missingSkills.slice(0, 3).join(', ')}`] : 
        ["Great keyword coverage!"]
    },
    improvementSuggestions: [
      "Add specific metrics and achievements to quantify your impact",
      "Include relevant certifications and training",
      "Ensure all technical skills from the job description are represented"
    ]
  });
}

// AI-powered job content refinement
async function refineJobContentWithGemini(rawContent: string, genAI: GoogleGenerativeAI): Promise<string> {
  console.info('diag:ai:refinement_start', { contentLength: rawContent.length });
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `You are a webpage content cleaner. Your task is to remove unwanted website elements while preserving the original job description EXACTLY as written.

CRITICAL: DO NOT reformat, restructure, or reorganize the content. Keep the original text structure and wording intact.

ONLY REMOVE these unwanted elements:
- Website navigation menus and links
- Header/footer content  
- Sidebar content
- Advertisement banners
- Cookie notices and privacy warnings
- Social media sharing buttons
- Related job suggestions or "You might also like"
- Comments sections
- Website branding and promotional text
- "Apply now", "Save job", "Share" buttons
- Page navigation elements

PRESERVE EXACTLY:
- All job description text in original order
- Company information and about sections
- Job title, salary, location, requirements
- All bullet points and formatting
- Original paragraph structure
- All technical skills and qualifications
- Application instructions that are part of the job posting

If the content doesn't contain a job posting, return "NOT_JOB_CONTENT".
Otherwise, return the cleaned job description with original formatting preserved.

Content to clean:
${rawContent}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const refinedText = response.text().trim();
    
    console.info('diag:ai:refinement_result', { 
      originalLength: rawContent.length,
      refinedLength: refinedText.length,
      isJobContent: !refinedText.includes('NOT_JOB_CONTENT')
    });
    
    // Return empty string if AI determined it's not job content
    if (refinedText.includes('NOT_JOB_CONTENT')) {
      return '';
    }
    
    return refinedText;
  } catch (error) {
    console.error('diag:ai:refinement_error', { error: (error as Error).message });
    throw error;
  }
}

export default function atsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  // Diagnostic endpoint (temporary)
  router.get('/_diag', atsDiagHandler);
  
  // Enhanced diagnostic endpoint for analyze issues
  router.get('/_diag-analyze', authenticateToken, async (req: any, res) => {
    try {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          isRender: !!process.env.RENDER,
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
          geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 8) || 'none'
        },
        database: {
          connected: false,
          error: null as string | null
        },
        gemini: {
          configured: false,
          error: null as string | null,
          testResult: null as string | null
        }
      };

      // Test database connection
      try {
        await prisma.$queryRaw`SELECT 1`;
        diagnostics.database.connected = true;
      } catch (dbError: any) {
        diagnostics.database.error = dbError.message;
      }

      // Test Gemini AI
      if (process.env.GEMINI_API_KEY) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const testResult = await model.generateContent('Say "OK" if you can read this.');
          const response = testResult.response.text();
          diagnostics.gemini.configured = true;
          diagnostics.gemini.testResult = response.substring(0, 50);
        } catch (geminiError: any) {
          diagnostics.gemini.error = geminiError.message;
        }
      }

      res.json(diagnostics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
          if (result.success && result.data) {
            // Get the actual S3 key for OCR processing
            s3Url = result.data.s3Key;
            console.info('diag:s3:upload_success', { s3Key: s3Url });
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
            isFilenameOnly,
            s3Available: !!s3Url
          });
          
          // Always offer OCR for now - we'll upload to S3 when OCR is requested
          return res.status(422).json({
            success: false,
            error: "pdf_no_extractable_text",
            can_ocr: true,
            s3Key: s3Url || null,
            filename: uploadFile.originalFilename || "document.pdf",
            fileBuffer: buf.toString('base64'), // Temporary: send file data for OCR
            hint: "This PDF appears to be image-only or scanned. Try OCR to extract text.",
          });
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
        if (!fileId) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Google Drive URL. Please ensure the link is publicly accessible.'
          });
        }
        
        console.info('diag:url:google_drive_processing', { fileId, originalUrl: url });
        
        // Strategy 1: Try as Google Document (text export)
        try {
          const textExportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
          console.info('diag:url:trying_doc_export', { textExportUrl });
          
          const docResponse = await axios.get(textExportUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
          });
          
          if (docResponse.data && docResponse.data.trim().length > 10) {
            console.info('diag:url:doc_export_success', { textLength: docResponse.data.trim().length });
            return res.status(200).json({
              success: true,
              content: docResponse.data.trim(),
              title: `Google Doc ${fileId}`,
              source: 'google-drive-doc'
            });
          }
        } catch (docError: any) {
          console.warn('diag:url:doc_export_failed', { fileId, error: docError?.message, status: docError?.response?.status });
        }
        
        // Strategy 2: Try direct file download (for PDFs, Word docs, etc.)
        try {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          console.info('diag:url:trying_file_download', { downloadUrl });
          
          const fileResponse = await axios.get(downloadUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000,
            responseType: 'arraybuffer'
          });
          
          const buffer = Buffer.from(fileResponse.data);
          console.info('diag:url:file_download_success', { bufferSize: buffer.length });
          
          // Try to extract text based on content type
          const contentType = fileResponse.headers['content-type'] || '';
          let extractedText = '';
          
          if (contentType.includes('pdf') || buffer.subarray(0, 4).toString() === '%PDF') {
            // It's a PDF - extract text
            try {
              const pdfResult = await extractPdfText(buffer);
              extractedText = pdfResult.text || '';
              console.info('diag:url:pdf_extraction', { textLength: extractedText.length });
            } catch (pdfError: any) {
              console.warn('diag:url:pdf_extraction_failed', { error: pdfError?.message });
            }
          } else if (contentType.includes('msword') || contentType.includes('wordprocessingml')) {
            // It's a Word document
            try {
              const wordResult = await mammoth.extractRawText({ buffer });
              extractedText = wordResult.value || '';
              console.info('diag:url:word_extraction', { textLength: extractedText.length });
            } catch (wordError: any) {
              console.warn('diag:url:word_extraction_failed', { error: wordError?.message });
            }
          } else if (contentType.includes('text/plain')) {
            // It's a text file
            extractedText = buffer.toString('utf8');
            console.info('diag:url:text_extraction', { textLength: extractedText.length });
          }
          
          if (extractedText && extractedText.trim().length > 10) {
            return res.status(200).json({
              success: true,
              content: extractedText.trim(),
              title: `Google Drive File ${fileId}`,
              source: 'google-drive-file'
            });
          }
        } catch (fileError: any) {
          console.warn('diag:url:file_download_failed', { fileId, error: fileError?.message, status: fileError?.response?.status });
        }
        
        // Strategy 3: Try alternative download URL format
        try {
          const altDownloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
          console.info('diag:url:trying_alt_download', { altDownloadUrl });
          
          const altResponse = await axios.get(altDownloadUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
          });
          
          if (altResponse.data && typeof altResponse.data === 'string' && altResponse.data.trim().length > 10) {
            console.info('diag:url:alt_download_success', { textLength: altResponse.data.trim().length });
            return res.status(200).json({
              success: true,
              content: altResponse.data.trim(),
              title: `Google Drive Content ${fileId}`,
              source: 'google-drive-alt'
            });
          }
        } catch (altError: any) {
          console.warn('diag:url:alt_download_failed', { fileId, error: altError?.message });
        }
        
        // All strategies failed
        return res.status(400).json({
          success: false,
          error: 'Could not extract content from Google Drive. Please ensure the file is publicly accessible (Anyone with the link can view) and try again, or download it and upload directly.'
        });
      }

      console.info('diag:url:processing_start', { url: url.substring(0, 100), type });

      // Special handling for LinkedIn job URLs
      let processUrl = url;
      if (url.includes('linkedin.com/jobs')) {
        // Convert collection URLs to direct job view URLs if possible
        const jobIdMatch = url.match(/currentJobId=(\d+)/);
        if (jobIdMatch) {
          const directJobUrl = `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}`;
          console.info('diag:url:linkedin_redirect', { originalUrl: url, directUrl: directJobUrl });
          processUrl = directJobUrl;
        }
      }

            // Enhanced retry mechanism for handling anti-bot protection and job unavailability
      let response;
      let lastError;
      
      // Enhanced user agent rotation with realistic headers
      const strategies = [
        {
          name: 'chrome_windows',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
          }
        },
        {
          name: 'firefox_windows',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        },
        {
          name: 'safari_mac',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
          }
        },
        {
          name: 'mobile_ios',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        }
      ];

      for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
        const strategy = strategies[strategyIndex];
        if (!strategy) continue; // Skip if strategy is undefined
        
        const maxAttemptsPerStrategy = 2; // Try each strategy up to 2 times
        
        for (let attempt = 1; attempt <= maxAttemptsPerStrategy; attempt++) {
          try {
            console.info('diag:url:trying_strategy', { 
              strategy: strategy.name, 
              attempt,
              url: processUrl.substring(0, 100) 
            });
            
            // Exponential backoff delay for retries
            if (attempt > 1) {
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Cap at 5 seconds
              console.info('diag:url:retry_delay', { delay, attempt });
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            response = await axios.get(processUrl, {
              headers: strategy.headers,
              timeout: 30000,
              maxRedirects: 5,
              validateStatus: (status) => status < 500 // Accept 4xx but retry on 5xx
            });

            if (response.status === 200) {
              console.info('diag:url:strategy_success', { 
                strategy: strategy.name, 
                attempt,
                status: response.status,
                contentLength: response.data?.length || 0
              });
              break; // Break out of attempt loop
            } else if (response.status === 403 || response.status === 429) {
              console.warn('diag:url:strategy_blocked', { 
                strategy: strategy.name, 
                attempt,
                status: response.status 
              });
              lastError = new Error(`HTTP ${response.status}: Access forbidden or rate limited`);
              
              // For rate limiting, wait longer before retry
              if (response.status === 429 && attempt < maxAttemptsPerStrategy) {
                const retryAfter = response.headers['retry-after'];
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
                console.info('diag:url:rate_limited_delay', { delay, retryAfter });
                await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
              }
              continue; // Try this strategy again
            }
          } catch (error: any) {
            console.warn('diag:url:strategy_failed', { 
              strategy: strategy.name, 
              attempt,
              error: error.message,
              code: error.code
            });
            lastError = error;
            
            // Don't retry on certain errors
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.info('diag:url:fatal_error_no_retry', { 
                strategy: strategy.name, 
                code: error.code 
              });
              break; // Break out of attempt loop for this strategy
            }
          }
        }
        
        // If we got a successful response, break out of strategy loop
        if (response && response.status === 200) {
          break;
        }
        
        // Wait between different strategies
        if (strategyIndex < strategies.length - 1) {
          const interStrategyDelay = 2000; // 2 seconds between strategies
          console.info('diag:url:inter_strategy_delay', { delay: interStrategyDelay });
          await new Promise(resolve => setTimeout(resolve, interStrategyDelay));
        }
      }

      if (!response || response.status !== 200) {
        console.error('diag:url:all_strategies_failed', { 
          url: processUrl.substring(0, 100),
          lastError: lastError?.message,
          status: response?.status
        });
        
        return res.status(400).json({
          success: false,
          error: 'Access forbidden. The website may be blocking automated requests. Please try:\n\n1. Copy the job description text manually\n2. Use a different job board\n3. Try the mobile version of the site\n\nSome sites (Indeed, LinkedIn) actively block automated access to protect user privacy.'
        });
      }

      const $ = cheerio.load(response.data);
      
      let content = '';
      let title = $('title').text().trim();

      // Enhanced job status detection and validation
      const pageText = $('body').text().toLowerCase();
      const jobUnavailableMessages = [
        'job you are trying to apply for has been filled',
        'this job is no longer available',
        'job posting has expired',
        'position has been filled',
        'job not found',
        'page not found',
        'job no longer exists',
        'sorry, this job is not available',
        'this position is no longer accepting applications',
        'application deadline has passed',
        'posting has been removed'
      ];

      const isJobUnavailable = jobUnavailableMessages.some(msg => pageText.includes(msg));
      
      if (isJobUnavailable) {
        console.warn('diag:url:job_unavailable', { 
          url: processUrl.substring(0, 100),
          detectedMessage: jobUnavailableMessages.find(msg => pageText.includes(msg)),
          pageLength: pageText.length
        });
        
        // Extract useful information for alternative suggestions
        const suggestions = [];
        
        // Extract job ID from URL
        const jobIdMatches = processUrl.match(/(?:job|position|posting)[\/\-_]?(\d+)/i) || 
                           processUrl.match(/\/(\d+)(?:[\/\?]|$)/) ||
                           processUrl.match(/id[=\/](\d+)/i);
        
        if (jobIdMatches) {
          const jobId = jobIdMatches[1];
          suggestions.push(`Search for job ID "${jobId}" on LinkedIn, Indeed, or Glassdoor`);
        }
        
        // Extract company name
        const domain = new URL(processUrl).hostname.replace('www.', '').replace('jobs.', '').replace('careers.', '');
        const companyName = domain.split('.')[0];
        suggestions.push(`Check ${companyName}'s main careers page`);
        suggestions.push(`Search for similar positions at ${companyName} on other job boards`);
        
        const errorResult = {
          success: false,
          error: `This job posting is no longer available or has been filled.\n\nDetected: "${jobUnavailableMessages.find(msg => pageText.includes(msg))}"\n\nSuggestions:\n• ${suggestions.join('\n• ')}\n• Try cached versions on web.archive.org\n• Contact the company directly about similar openings`,
          reason: 'job_unavailable'
        };
        
        // Log the scraping result for monitoring
        JobScrapingMonitor.logScrapingResult(url, errorResult);
        
        return res.status(400).json(errorResult);
      }

      // LinkedIn job scraping
      if (url.includes('linkedin.com/jobs')) {
        // Check if we hit the login page instead of job content
        if ($('title').text().toLowerCase().includes('sign in') || 
            $('h1').text().toLowerCase().includes('sign in') ||
            $('.login-form').length > 0 ||
            response.data.includes('Sign in with Apple') ||
            response.data.includes('Keep me logged in')) {
          
          console.warn('diag:url:linkedin_auth_required', { url: url.substring(0, 100) });
          return res.status(400).json({
            success: false,
            error: 'LinkedIn requires authentication to access job details. Please try one of these alternatives:\n\n1. Use the direct job URL format: https://www.linkedin.com/jobs/view/JOB_ID\n2. Copy the job description text manually and paste it\n3. Try a different job board (Indeed, Glassdoor, etc.)\n\nNote: LinkedIn blocks automated access to protect user privacy.'
          });
        }
        
        // Try different LinkedIn job content selectors
        const jobSelectors = [
          '.description__text',
          '.show-more-less-html__markup',
          '.jobs-description-content__text',
          '.jobs-box__html-content',
          '.jobs-description__content',
          '[data-job-description]',
          '.jobs-details__main-content'
        ];
        
        for (const selector of jobSelectors) {
          const jobContent = $(selector).text();
          if (jobContent && jobContent.trim().length > 100) {
            content = jobContent;
            break;
          }
        }
        
        // Try different title selectors
        const titleSelectors = [
          '.top-card-layout__title',
          '.jobs-unified-top-card__job-title',
          '.job-details-jobs-unified-top-card__job-title',
          'h1[data-job-title]',
          '.jobs-details__main-content h1'
        ];
        
        for (const selector of titleSelectors) {
          const jobTitle = $(selector).text();
          if (jobTitle && jobTitle.trim().length > 0) {
            title = jobTitle;
            break;
          }
        }
        
        if (!content || content.trim().length < 50) {
          console.warn('diag:url:linkedin_no_content', { 
            url: url.substring(0, 100),
            contentLength: content?.length || 0,
            pageTitle: $('title').text()
          });
          
          return res.status(400).json({
            success: false,
            error: 'Could not extract job content from LinkedIn. This may be due to:\n\n1. The job posting is private or requires login\n2. The URL format is not supported\n3. LinkedIn\'s anti-bot protection\n\nSuggestions:\n• Try the direct job URL: https://www.linkedin.com/jobs/view/JOB_ID\n• Copy the job description manually\n• Use alternative job boards'
          });
        }
      }
      // Indeed job scraping
      else if (url.includes('indeed.com')) {
        // Check if we're on a search results page vs. individual job page
        if (url.includes('/jobs?') || url.includes('l-') && url.includes('-jobs.html')) {
          console.warn('diag:url:indeed_search_page', { url: url.substring(0, 100) });
          return res.status(400).json({
            success: false,
            error: 'This appears to be an Indeed search results page. Please click on a specific job posting and use that URL instead.\n\nTip: Look for URLs that contain "/viewjob?jk=" for individual job postings.'
          });
        }

        // Try multiple Indeed job content selectors
        const indeedSelectors = [
          '#jobDescriptionText',
          '.jobsearch-jobDescriptionText',
          '.jobsearch-JobComponent-description',
          '[data-jk] .jobsearch-jobDescriptionText',
          '.jobDescriptionContent',
          '#vjs-desc',
          '.vjs-desc',
          '.jobDescription'
        ];
        
        for (const selector of indeedSelectors) {
          const jobContent = $(selector).text();
          if (jobContent && jobContent.trim().length > 100) {
            content = jobContent;
            break;
          }
        }
        
        // Try different title selectors for Indeed
        const indeedTitleSelectors = [
          'h1[data-jk]',
          '.jobsearch-JobInfoHeader-title',
          '.jobsearch-JobInfoHeader-title span',
          'h1.jobsearch-JobInfoHeader-title',
          '.vjs-jobtitle',
          'h1'
        ];
        
        for (const selector of indeedTitleSelectors) {
          const jobTitle = $(selector).text();
          if (jobTitle && jobTitle.trim().length > 0) {
            title = jobTitle;
            break;
          }
        }

        if (!content || content.trim().length < 50) {
          console.warn('diag:url:indeed_no_content', { 
            url: url.substring(0, 100),
            contentLength: content?.length || 0,
            pageTitle: $('title').text()
          });
          
          return res.status(400).json({
            success: false,
            error: 'Could not extract job content from Indeed. This may be due to:\n\n1. Anti-bot protection blocking the request\n2. The job posting has been removed\n3. You\'re on a search results page instead of individual job\n\nSuggestions:\n• Use the direct job URL (contains "/viewjob?jk=")\n• Try copying the job description manually\n• Use alternative job boards'
          });
        }
      }
      // Glassdoor job scraping
      else if (url.includes('glassdoor.com')) {
        const glassdoorSelectors = [
          '.jobDescriptionContent',
          '[data-test="jobDescription"]',
          '.desc',
          '.jobDesc',
          '.jobDescription'
        ];
        
        for (const selector of glassdoorSelectors) {
          const jobContent = $(selector).text();
          if (jobContent && jobContent.trim().length > 100) {
            content = jobContent;
            break;
          }
        }
        
        title = $('h1[data-test="job-title"]').text() || $('h1').first().text();
      }
      // Monster job scraping
      else if (url.includes('monster.com')) {
        content = $('.job-description').text() || $('.jobview-description').text();
        title = $('h1.job-title').text() || $('h1').first().text();
      }
      // ZipRecruiter job scraping  
      else if (url.includes('ziprecruiter.com')) {
        content = $('.job_description').text() || $('.jobDescriptionSection').text();
        title = $('h1.job_title').text() || $('h1').first().text();
      }
      // Generic job page scraping for company career pages
      else {
        console.info('diag:url:generic_extraction', { url: processUrl.substring(0, 100) });
        
        // Apply advanced extraction strategies
        const extractionResult = await AdvancedContentExtractor.applyAdvancedExtraction($, processUrl);
        content = extractionResult.content;
        title = extractionResult.title || title;
      }

      // Apply AI-powered content refinement for job descriptions (can be disabled with DISABLE_URL_AI_REFINEMENT=true)
      if (content && content.length > 100 && process.env.GEMINI_API_KEY && process.env.DISABLE_URL_AI_REFINEMENT !== 'true') {
        try {
          const refinedContent = await refineJobContentWithGemini(content, genAI);
          if (refinedContent && refinedContent.length > 50 && !refinedContent.includes('NOT_JOB_CONTENT')) {
            // Only use AI refined content if it's significantly better or similar length
            const originalQuality = AdvancedContentExtractor.calculateQualityScore(content);
            const refinedQuality = AdvancedContentExtractor.calculateQualityScore(refinedContent);
            
            console.info('diag:url:ai_comparison', { 
              originalLength: content.length,
              originalQuality,
              refinedLength: refinedContent.length,
              refinedQuality
            });
            
            // Use AI refined content if quality is better or similar with reasonable length
            if (refinedQuality >= originalQuality || 
                (refinedContent.length >= content.length * 0.7 && refinedQuality >= originalQuality * 0.9)) {
              content = refinedContent;
              console.info('diag:url:ai_refined_used', { reason: 'quality_improvement' });
            } else {
              console.info('diag:url:ai_refined_skipped', { reason: 'quality_degradation' });
            }
          }
        } catch (error) {
          console.warn('diag:url:ai_refinement_failed', { error: (error as Error).message });
          // Continue with basic cleaning if AI refinement fails
        }
      }

      // Enhanced basic cleanup 
      content = content.replace(/\s+/g, ' ').trim();
      
      // Remove common unwanted text patterns
      const unwantedPatterns = [
        /\b(cookies?|privacy policy|terms of service|accept|agree)\b/gi,
        /\b(subscribe|newsletter|follow us|social media|share|like|tweet)\b/gi,
        /\b(apply now|save job|view similar|related jobs|you might also like)\b/gi,
        /\b(sign up|log in|create account|register|login)\b/gi,
        /\b(contact us|about us|careers|help|support|faq)\b/gi,
        /\b(home|search|browse|menu|navigation|sidebar)\b/gi
      ];
      
      unwantedPatterns.forEach(pattern => {
        content = content.replace(pattern, '');
      });
      
      // Clean up multiple spaces and trim
      content = content.replace(/\s{2,}/g, ' ').trim();
      
      console.info('diag:url:basic_cleanup_complete', { 
        finalLength: content.length,
        aiRefinementUsed: process.env.DISABLE_URL_AI_REFINEMENT !== 'true' && !!process.env.GEMINI_API_KEY
      });

      // Enhanced content validation with minimum length requirements
      const MIN_CONTENT_LENGTH = 300; // Job descriptions should be at least 300 characters
      const IDEAL_CONTENT_LENGTH = 500; // Warn if below this threshold
      
      console.info('diag:url:extraction_result', { 
        url: url.substring(0, 100), 
        contentLength: content.length,
        title: title?.substring(0, 50),
        type,
        meetsMinLength: content.length >= MIN_CONTENT_LENGTH,
        meetsIdealLength: content.length >= IDEAL_CONTENT_LENGTH
      });

      // Check for insufficient content
      if (!content || content.length < MIN_CONTENT_LENGTH) {
        console.warn('diag:url:insufficient_content', { 
          contentLength: content?.length || 0,
          url: url.substring(0, 100),
          pageTitle: title,
          contentPreview: content?.substring(0, 100)
        });
        
        // Check if this might be a job board that requires specific handling
        const domain = new URL(url).hostname;
        let domainSpecificHelp = '';
        
        if (domain.includes('workday')) {
          domainSpecificHelp = '\n\nWorkday sites often require specific URLs. Try accessing the job through the company\'s main careers page.';
        } else if (domain.includes('greenhouse')) {
          domainSpecificHelp = '\n\nGreenhouse job boards may require direct job URLs. Look for "View Job" or "Apply" links.';
        } else if (domain.includes('lever')) {
          domainSpecificHelp = '\n\nLever job boards work best with direct job posting URLs, not search results.';
        } else if (domain.includes('bamboohr')) {
          domainSpecificHelp = '\n\nBambooHR sites may have dynamic content. Try the direct job posting link.';
        }
        
        const errorResult = {
          success: false,
          error: `Insufficient content extracted from the URL (found ${content?.length || 0} characters, need at least ${MIN_CONTENT_LENGTH}).\n\nThis could indicate:\n• The job posting has been removed or filled\n• The page requires JavaScript to load content\n• The URL is a search results page instead of a direct job posting\n• The website blocks automated access\n\nSuggestions:\n• Use the direct job posting URL (not search results)\n• Copy the job description text manually\n• Try accessing through the company's main careers page${domainSpecificHelp}`,
          reason: 'insufficient_content',
          contentLength: content?.length || 0
        };
        
        // Log the scraping result for monitoring
        JobScrapingMonitor.logScrapingResult(url, errorResult);
        
        return res.status(400).json(errorResult);
      }

      // Warn about potentially incomplete content
      if (content.length < IDEAL_CONTENT_LENGTH) {
        console.warn('diag:url:below_ideal_length', {
          contentLength: content.length,
          idealLength: IDEAL_CONTENT_LENGTH,
          url: url.substring(0, 100)
        });
      }

      const successResult = {
        success: true,
        content,
        title: title.trim() || 'Web Content',
        source: 'web-scraping'
      };
      
      // Log the scraping result for monitoring
      JobScrapingMonitor.logScrapingResult(url, successResult);
      
      res.status(200).json(successResult);

    } catch (error: any) {
      console.error('diag:url:processing_error', { 
        requestUrl: req.body.url?.substring(0, 100), 
        error: error?.message,
        code: error?.code,
        status: error?.response?.status
      });
      
      let errorMessage = 'Failed to process URL';
      if (error?.code === 'ENOTFOUND') {
        errorMessage = 'URL not found. Please check the URL and try again.';
      } else if (error?.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The website may be blocking automated requests.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Access forbidden. The website may be blocking automated requests.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Page not found. Please check the URL.';
      } else if (error?.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The website took too long to respond.';
      }
      
      res.status(500).json({ 
        success: false, 
        error: errorMessage
      });
    }
  });

  // Main analysis endpoint using Gemini AI
  router.post('/analyze', authenticateToken, async (req: any, res) => {
    try {
      console.info('diag:analyze:start', { userId: req.user?.uid || req.user?.id });
      
      const { resumeText, jobDescription, saveResume, resumeName } = req.body;
      const userId = req.user?.uid || req.user?.id;

      if (!userId) {
        console.warn('diag:analyze:no_user');
        return res.status(401).json({ error: 'User authentication required' });
      }

      console.info('diag:analyze:input_validation', {
        hasResumeText: !!resumeText?.trim(),
        resumeLength: resumeText?.length || 0,
        hasJobDescription: !!jobDescription?.trim(),
        jobDescriptionLength: jobDescription?.length || 0,
        saveResume,
        resumeName: resumeName?.substring(0, 50)
      });

      if (!resumeText?.trim() || !jobDescription?.trim()) {
        console.warn('diag:analyze:missing_content', {
          resumeText: resumeText?.length || 0,
          jobDescription: jobDescription?.length || 0
        });
        return res.status(400).json({ 
          error: 'Resume text and job description are required' 
        });
      }

      // Check Gemini API availability
      if (!process.env.GEMINI_API_KEY) {
        console.error('diag:analyze:no_gemini_key');
        return res.status(500).json({ error: 'AI analysis service not configured' });
      }

      // Generate analysis using Gemini AI
      console.info('diag:analyze:gemini_start');
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const analysisPrompt = `
      You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze the following resume against the job description and provide a comprehensive assessment.

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${jobDescription}

      Provide your analysis in the following JSON format (RETURN ONLY VALID JSON, NO MARKDOWN):
      {
        "overallScore": 75,
        "matchRate": 80,
        "searchability": 70, 
        "atsCompatibility": 85,
        "contactInformation": {"score": 90, "status": "excellent", "feedback": "Contact information is complete and professional"},
        "professionalSummary": {"score": 75, "status": "good", "feedback": "Summary effectively highlights key qualifications"},
        "technicalSkills": {"score": 80, "status": "good", "feedback": "Strong technical skill alignment with job requirements"},
        "qualifiedAchievements": {"score": 70, "status": "good", "feedback": "Achievements demonstrate impact and results"},
        "educationCertifications": {"score": 85, "status": "excellent", "feedback": "Education matches job requirements well"},
        "atsFormat": {"score": 80, "status": "good", "feedback": "Format is ATS-friendly with clear sections"},
        "hardSkillsFound": ["JavaScript", "React", "Node.js"],
        "hardSkillsMissing": ["Python", "AWS"],
        "recruiterTips": [
          {
            "category": "Technical Foundation",
            "title": "Strong Technical Foundation", 
            "description": "Candidate shows solid technical skills",
            "priority": "high"
          }
        ],
        "keywordAnalysis": {
          "totalJobKeywords": 20,
          "foundKeywords": ["JavaScript", "React", "Node.js"],
          "missingKeywords": ["Python", "AWS"],
          "optimizationSuggestions": ["Add Python experience", "Include AWS certifications"]
        },
        "improvementSuggestions": ["Add quantified achievements", "Include relevant certifications"]
      }

      Focus on:
      1. ATS compatibility (formatting, keywords, sections)
      2. Keyword matching between resume and job description
      3. Professional presentation and impact
      4. Specific, actionable recommendations
      5. Industry-specific best practices
      `;

      let result, response, analysisData;
      
      try {
        result = await model.generateContent(analysisPrompt);
        response = result.response.text();
        console.info('diag:analyze:gemini_response', { 
          responseLength: response.length,
          hasJsonMarkers: response.includes('```')
        });
      } catch (geminiError: any) {
        console.error('diag:analyze:gemini_error', { 
          error: geminiError.message,
          stack: geminiError.stack,
          code: geminiError.code
        });
        
        // Check if it's a configuration issue
        if (geminiError.message?.includes('API_KEY') || geminiError.message?.includes('401')) {
          return res.status(500).json({ 
            error: 'AI service configuration error. Please contact support.' 
          });
        }
        
        // Check if it's a quota issue
        if (geminiError.message?.includes('quota') || geminiError.message?.includes('429')) {
          return res.status(500).json({ 
            error: 'AI service temporarily unavailable due to quota limits. Please try again later.' 
          });
        }
        
        // For other errors, use fallback analysis
        console.warn('diag:analyze:using_fallback_analysis');
        response = generateFallbackAnalysis(resumeText, jobDescription);
        analysisData = JSON.parse(response);
        console.info('diag:analyze:fallback_analysis_generated');
      }
      
      // Parse the AI response with better error handling (only if not already parsed from fallback)
      if (!analysisData) {
        try {
          const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
          analysisData = JSON.parse(cleanedResponse);
          console.info('diag:analyze:json_parsed', { success: true });
        } catch (parseError: any) {
          console.error('diag:analyze:json_parse_error', { 
            error: parseError.message,
            responsePreview: response.substring(0, 200)
          });
          
          // Use fallback analysis if JSON parsing fails
          console.warn('diag:analyze:json_parse_failed_using_fallback');
          response = generateFallbackAnalysis(resumeText, jobDescription);
          analysisData = JSON.parse(response);
          console.info('diag:analyze:fallback_after_parse_error');
        }
      }

      // Generate unique ID for this scan
      const scanId = crypto.randomUUID();

      // Save to database with error handling
      let savedScan;
      try {
        console.info('diag:analyze:db_save_start', { scanId });
        savedScan = await prisma.atsScan.create({
          data: {
            id: scanId,
            userId: userId,
            resumeText: resumeText,
            jobDescription: jobDescription,
            overallScore: analysisData.overallScore || 0,
            matchRate: analysisData.matchRate || 0,
            searchabilityScore: analysisData.searchability || 0,
            atsCompatibilityScore: analysisData.atsCompatibility || 0,
            detailedAnalysis: {
              contactInformation: analysisData.contactInformation || {},
              professionalSummary: analysisData.professionalSummary || {},
              technicalSkills: analysisData.technicalSkills || {},
              qualifiedAchievements: analysisData.qualifiedAchievements || {},
              educationCertifications: analysisData.educationCertifications || {},
              atsFormat: analysisData.atsFormat || {},
            },
            foundKeywords: JSON.stringify(analysisData.hardSkillsFound || []),
            missingKeywords: JSON.stringify(analysisData.hardSkillsMissing || []),
            recruiterTips: analysisData.recruiterTips || [],
            improvementSuggestions: analysisData.keywordAnalysis?.optimizationSuggestions || []
          }
        });
        console.info('diag:analyze:db_save_success', { scanId });
      } catch (dbError: any) {
        console.error('diag:analyze:db_save_error', { 
          error: dbError.message,
          code: dbError.code,
          stack: dbError.stack
        });
        return res.status(500).json({ 
          error: 'Failed to save analysis results. Please try again.' 
        });
      }

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

    } catch (error: any) {
      console.error('diag:analyze:unexpected_error', { 
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      logger.error('Analysis error: ' + error.message);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to analyze resume';
      if (error.message?.includes('GEMINI_API_KEY')) {
        errorMessage = 'AI analysis service not configured. Please contact support.';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'AI analysis service temporarily unavailable. Please try again later.';
      } else if (error.message?.includes('database') || error.code?.startsWith('P')) {
        errorMessage = 'Database error. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Analysis took too long. Please try again with shorter content.';
      }
      
      res.status(500).json({ error: errorMessage });
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
          found: scan.foundKeywords ? JSON.parse(scan.foundKeywords as string) : [],
          missing: scan.missingKeywords ? JSON.parse(scan.missingKeywords as string) : [],
          matchPercentage: Math.round(
            ((scan.foundKeywords ? JSON.parse(scan.foundKeywords as string).length : 0)) / 
            (((scan.foundKeywords ? JSON.parse(scan.foundKeywords as string).length : 0)) + ((scan.missingKeywords ? JSON.parse(scan.missingKeywords as string).length : 0))) * 100
          )
        },
        recruiterTips: scan.recruiterTips || [],
        keywordOptimization: {
          score: scan.matchRate,
          totalKeywords: ((scan.foundKeywords ? JSON.parse(scan.foundKeywords as string).length : 0)) + ((scan.missingKeywords ? JSON.parse(scan.missingKeywords as string).length : 0)),
          foundKeywords: scan.foundKeywords ? JSON.parse(scan.foundKeywords as string) : [],
          missingKeywords: scan.missingKeywords ? JSON.parse(scan.missingKeywords as string) : [],
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
  // Handle different Google Drive URL formats:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://docs.google.com/document/d/FILE_ID/edit
  // https://docs.google.com/spreadsheets/d/FILE_ID/edit
  
  let match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  
  match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  
  return '';
}
