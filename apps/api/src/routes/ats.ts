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

// AI-powered job content refinement
async function refineJobContentWithGemini(rawContent: string, genAI: GoogleGenerativeAI): Promise<string> {
  console.info('diag:ai:refinement_start', { contentLength: rawContent.length });
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
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

      // Retry mechanism for handling anti-bot protection
      let response;
      let lastError;
      
      // Try different strategies
      const strategies = [
        {
          name: 'standard',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        },
        {
          name: 'mobile',
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        },
        {
          name: 'simple',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)',
            'Accept': 'text/html'
          }
        }
      ];

      for (const strategy of strategies) {
        try {
          console.info('diag:url:trying_strategy', { strategy: strategy.name, url: processUrl.substring(0, 100) });
          
          response = await axios.get(processUrl, {
            headers: strategy.headers,
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Accept 4xx but retry on 5xx
          });

          if (response.status === 200) {
            console.info('diag:url:strategy_success', { strategy: strategy.name, status: response.status });
            break;
          } else if (response.status === 403 || response.status === 429) {
            console.warn('diag:url:strategy_blocked', { strategy: strategy.name, status: response.status });
            lastError = new Error(`HTTP ${response.status}: Access forbidden or rate limited`);
            continue;
          }
        } catch (error: any) {
          console.warn('diag:url:strategy_failed', { strategy: strategy.name, error: error.message });
          lastError = error;
          
          // Wait a bit before trying next strategy
          if (strategy !== strategies[strategies.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
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

      console.info('diag:url:extraction_result', { 
        url: url.substring(0, 100), 
        contentLength: content.length,
        title: title?.substring(0, 50),
        type
      });

      if (!content || content.length < 20) {
        return res.status(400).json({
          success: false,
          error: `No meaningful content could be extracted from the URL. Found ${content.length} characters. Please try a different URL or copy the content manually.`
        });
      }

      res.status(200).json({
        success: true,
        content,
        title: title.trim() || 'Web Content',
        source: 'web-scraping'
      });

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
          foundKeywords: JSON.stringify(analysisData.hardSkillsFound || []),
          missingKeywords: JSON.stringify(analysisData.hardSkillsMissing || []),
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
