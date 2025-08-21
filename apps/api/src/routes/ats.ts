import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { extractTextFromFile } from '../utils/fileParser';
import { extractTextFromFile as extractTextFromBuffer } from '../lib/extractText';
import { 
  extractResumeFields, 
  calculateMatchScore, 
  extractSkills,
  generateSearchabilityItems,
  generateRecruiterTips,
  generateSkillsComparison,
  analyzeResumeFormat
} from '../utils/textProcessor';

const router = Router();

// Multer configuration for file uploads (memory storage for better performance)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ok = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ].includes(file.mimetype);
    cb(ok ? null : (new Error('Unsupported file type') as any), ok);
  }
});

// Validation schemas
const scanRequestSchema = z.object({
  jobDescription: z.string().optional()
});

const paginationSchema = z.object({
  limit: z.string().optional().default('20').transform(Number),
  offset: z.string().optional().default('0').transform(Number)
});

export default function createAtsRouter(prisma: PrismaClient): express.Router {
  // POST /api/ats/scan - Upload and scan resume
  router.post('/scan', upload.single('resume'), async (req: any, res) => {
    let tempFilePath: string | null = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
      }

      const { jobDescription } = scanRequestSchema.parse(req.body);
      const userId = req.user?.uid; // User ID from authenticated token

      const file = req.file;
      const fileExt = path.extname(file.originalname);
      tempFilePath = file.path;

      console.log(`Processing file: ${file.originalname}, size: ${file.size}, type: ${fileExt}`);

      // Extract text from file
      const resumeText = await extractTextFromFile(file.path, fileExt);
      
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error('Could not extract text from the uploaded file. Please ensure it contains readable text.');
      }
      
      console.log(`Extracted text length: ${resumeText.length} characters`);
      
      // Parse resume into structured data
      const parsedResume = extractResumeFields(resumeText);
      
      console.log(`Parsed resume - Name: ${parsedResume.name}, Email: ${parsedResume.email}, Skills: ${parsedResume.skills.length}`);
      
      // Extract skills from job description if provided
      let jdSkills: string[] = [];
      let matchResult: { score: number; missingSkills: string[]; extraSkills: string[] } = { 
        score: 0, 
        missingSkills: [], 
        extraSkills: parsedResume.skills 
      };
      
      if (jobDescription && jobDescription.trim()) {
        jdSkills = extractSkills(jobDescription);
        matchResult = calculateMatchScore(parsedResume.skills, jdSkills);
        console.log(`JD skills: ${jdSkills.length}, Match score: ${matchResult.score}%`);
      }

      // Save scan to database
      const atsScan = await prisma.atsScan.create({
        data: {
          userId: userId || null, // Allow guests if no user ID
          fileName: file.originalname,
          fileType: fileExt,
          jdText: jobDescription || null,
          parsedJson: parsedResume as any, // Prisma Json type
          matchScore: matchResult.score,
          missingSkills: matchResult.missingSkills,
          extraSkills: matchResult.extraSkills,
        }
      });

      console.log(`Created ATS scan with ID: ${atsScan.id}`);

      // Save keywords stats
      const keywordsToCreate = [];
      
      // Add resume skills
      for (const skill of parsedResume.skills) {
        keywordsToCreate.push({
          scanId: atsScan.id,
          keyword: skill,
          inResume: true,
          inJobDesc: jdSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase()),
        });
      }
      
      // Add missing skills from JD
      for (const jdSkill of jdSkills) {
        if (!parsedResume.skills.map(s => s.toLowerCase()).includes(jdSkill.toLowerCase())) {
          keywordsToCreate.push({
            scanId: atsScan.id,
            keyword: jdSkill,
            inResume: false,
            inJobDesc: true,
          });
        }
      }
      
      if (keywordsToCreate.length > 0) {
        await prisma.atsKeywordStat.createMany({
          data: keywordsToCreate,
          skipDuplicates: true,
        });
        console.log(`Created ${keywordsToCreate.length} keyword stats`);
      }

      // Update user's ATS scan count if authenticated
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { atsScans: { increment: 1 } }
        });
      }

      // Generate enhanced analysis
      const searchabilityItems = generateSearchabilityItems(parsedResume, fileExt);
      const recruiterTips = generateRecruiterTips(parsedResume, matchResult.score, matchResult.missingSkills);
      const skillsComparison = generateSkillsComparison(parsedResume.skills, jdSkills);
      const formatAnalysis = analyzeResumeFormat(resumeText, parsedResume);

      // Prepare enhanced response
      const response = {
        scanId: atsScan.id,
        matchScore: atsScan.matchScore,
        summary: {
          name: parsedResume.name,
          email: parsedResume.email,
          phone: parsedResume.phone,
          skills: parsedResume.skills,
        },
        missingSkills: atsScan.missingSkills,
        extraSkills: atsScan.extraSkills,
        keywords: keywordsToCreate.map(k => ({
          keyword: k.keyword,
          inResume: k.inResume,
          inJobDesc: k.inJobDesc,
          weight: 1 // Default weight for MVP
        })),
        // Enhanced analysis data
        searchabilityItems,
        recruiterTips,
        skillsComparison,
        formatAnalysis,
        analyzedAt: new Date().toISOString()
      };

      console.log(`Scan completed successfully for ${file.originalname}`);
      res.json(response);

    } catch (error: any) {
      console.error('ATS Scan Error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: error.issues 
        });
      }
      
      // Handle specific error types
      if (error.message.includes('PDF parsing') || error.message.includes('not supported')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Failed to process resume scan. Please try again or contact support if the issue persists.' 
      });
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        try { 
          fs.unlinkSync(tempFilePath); 
          console.log(`Cleaned up temp file: ${tempFilePath}`);
        } catch (err) {
          console.warn('Failed to delete temp file:', tempFilePath, err);
        }
      }
    }
  });

  // GET /api/ats/scans - Get user's scan history
  router.get('/scans', async (req: any, res) => {
    try {
      const { limit, offset } = paginationSchema.parse(req.query);
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const [scans, total] = await Promise.all([
        prisma.atsScan.findMany({
          where: { userId },
          select: {
            id: true,
            fileName: true,
            matchScore: true,
            createdAt: true,
            fileType: true,
            jdText: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.atsScan.count({
          where: { userId }
        })
      ]);

      res.json({
        scans: scans.map(scan => ({
          ...scan,
          hasJobDescription: !!scan.jdText
        })),
        total,
        limit,
        offset
      });

    } catch (error: any) {
      console.error('Get scans error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters', 
          details: error.issues 
        });
      }
      
      res.status(500).json({ error: 'Failed to fetch scan history' });
    }
  });

  // GET /api/ats/scans/:id - Get specific scan details
  router.get('/scans/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const scan = await prisma.atsScan.findFirst({
        where: { 
          id,
          userId // Ensure user can only access their own scans
        },
        include: {
          keywords: true
        }
      });

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Generate enhanced analysis for the scan detail
      const parsedResume = scan.parsedJson as any;
      const jdSkills = scan.jdText ? extractSkills(scan.jdText) : [];
      
      const searchabilityItems = generateSearchabilityItems(parsedResume, scan.fileType);
      const recruiterTips = generateRecruiterTips(parsedResume, scan.matchScore, scan.missingSkills);
      const skillsComparison = generateSkillsComparison(parsedResume.skills, jdSkills);
      const formatAnalysis = analyzeResumeFormat('', parsedResume); // Text not needed for stored scan

      const enhancedScan = {
        ...scan,
        searchabilityItems,
        recruiterTips,
        skillsComparison,
        formatAnalysis,
        hasJobDescription: !!scan.jdText
      };

      res.json(enhancedScan);

    } catch (error: any) {
      console.error('Get scan detail error:', error);
      res.status(500).json({ error: 'Failed to fetch scan details' });
    }
  });

  // DELETE /api/ats/scans/:id - Delete a scan
  router.delete('/scans/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if scan exists and belongs to user
      const scan = await prisma.atsScan.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Delete scan (keywords will be cascade deleted)
      await prisma.atsScan.delete({
        where: { id }
      });

      // Update user's ATS scan count
      await prisma.user.update({
        where: { id: userId },
        data: { atsScans: { decrement: 1 } }
      });

      res.json({ message: 'Scan deleted successfully' });

    } catch (error: any) {
      console.error('Delete scan error:', error);
      res.status(500).json({ error: 'Failed to delete scan' });
    }
  });

  // POST /api/ats/analyze-preview - Real-time analysis preview
  router.post('/analyze-preview', async (req: any, res) => {
    try {
      const { resumeText, jobDescription } = req.body;
      
      if (!resumeText || !jobDescription) {
        return res.status(400).json({ 
          error: 'Resume text and job description are required' 
        });
      }

      if (resumeText.length < 50) {
        return res.status(400).json({ 
          error: 'Resume text too short for analysis' 
        });
      }

      if (jobDescription.length < 50) {
        return res.status(400).json({ 
          error: 'Job description too short for analysis' 
        });
      }

      // Quick analysis for real-time preview
      const resumeSkills = extractSkills(resumeText);
      const jdSkills = extractSkills(jobDescription);
      
      const matchResult = calculateMatchScore(resumeSkills, jdSkills);
      
      // Simple keyword matching for quick feedback
      const resumeWords = new Set(
        resumeText.toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .map((word: string) => word.replace(/[^\w]/g, ''))
      );
      
      const jdWords = jobDescription.toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3)
        .map((word: string) => word.replace(/[^\w]/g, ''));
      
      const jdWordsUnique: string[] = Array.from(new Set(jdWords));
      
      const keywordMatches = jdWordsUnique.filter((word: string) => resumeWords.has(word));

      res.json({
        matchScore: matchResult.score,
        skillsFound: resumeSkills.slice(0, 5), // Limit for preview
        missingSkills: matchResult.missingSkills.slice(0, 5), // Limit for preview
        keywordCount: keywordMatches.length,
        totalPossibleKeywords: jdWordsUnique.length,
        analyzedAt: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Preview analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze content. Please try again.' 
      });
    }
  });

  // ===== NEW: Multipart upload endpoint =====
  router.post('/scan-file', upload.single('file'), async (req: express.Request, res: express.Response) => {
    try {
      const jdText = String(req.body?.jdText || '').trim();
      if (!jdText || jdText.length < 20) {
        return res.status(400).json({ error: 'jdText is required (≥20 chars)' });
      }
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ error: 'file is required' });
      }

      const { buffer, mimetype, originalname } = file;
      const { text } = await extractTextFromBuffer(mimetype, originalname, buffer);

      // If no selectable text (e.g., scanned image PDF)
      if (!text || text.replace(/\s+/g, '').length < 50) {
        return res.status(422).json({
          error: 'NO_TEXT_IN_FILE',
          message: 'Could not read text. If this is a scanned PDF, upload an OCR copy or DOCX/TXT.'
        });
      }

      // === reuse existing keyword/score logic ===
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w: string) => w.length > 2);

      const jdWords = normalize(jdText);
      const resumeWords = new Set(normalize(text));

      const jdFreq: Record<string, number> = {};
      jdWords.forEach((w: string) => (jdFreq[w] = (jdFreq[w] || 0) + 1));

      const topJD = Object.entries(jdFreq)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,60)
        .map(([w])=>w);

      const present = topJD.filter((w: string) => resumeWords.has(w));
      const missing = topJD.filter((w: string) => !resumeWords.has(w));
      const score = Math.round((present.length / (present.length + missing.length)) * 100);

      const jd = await prisma.jobDescription.create({ data: { title: 'JD', company: '', content: jdText } });

      return res.json({ score, present, missing, jdId: jd.id, extractedChars: text.length });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'PDF_PASSWORD') {
        return res.status(423).json({ error: 'PDF_LOCKED', message: error.message || 'PDF is password protected' });
      }
      return res.status(400).json({ error: 'UPLOAD_PARSE_ERROR', message: error?.message || String(err) });
    }
  });

  // URL content extraction endpoint
  router.post('/extract-url', async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      // Validate URL
      let validUrl: URL;
      try {
        validUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      // Check if it's a supported platform
      const supportedPlatforms = [
        /linkedin\.com/i,
        /github\.com/i,
        /drive\.google\.com/i,
        /dropbox\.com/i,
        /onedrive\.live\.com/i
      ];

      const isSupported = supportedPlatforms.some(pattern => pattern.test(validUrl.hostname));
      
      if (!isSupported) {
        return res.status(400).json({ 
          message: 'URL platform not supported',
          supportedPlatforms: ['LinkedIn', 'GitHub', 'Google Drive', 'Dropbox', 'OneDrive']
        });
      }

      let extractedContent = '';

      if (validUrl.hostname.includes('linkedin.com')) {
        extractedContent = await extractLinkedInProfile(url);
      } else if (validUrl.hostname.includes('github.com')) {
        extractedContent = await extractGitHubProfile(url);
      } else if (validUrl.hostname.includes('drive.google.com')) {
        extractedContent = await extractGoogleDriveContent(url);
      } else {
        extractedContent = await extractGenericWebContent(url);
      }

      res.json({
        success: true,
        content: extractedContent,
        url: url,
        platform: detectPlatform(validUrl.hostname)
      });

    } catch (error) {
      console.error('URL extraction error:', error);
      res.status(500).json({
        message: 'Failed to extract content from URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Job portal scraping endpoint
  router.post('/scrape-job', async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      // Validate URL
      let validUrl: URL;
      try {
        validUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      // Check if it's a supported job portal
      const jobPortals = [
        { name: 'LinkedIn Jobs', pattern: /linkedin\.com\/jobs/i },
        { name: 'Indeed', pattern: /indeed\.com/i },
        { name: 'Glassdoor', pattern: /glassdoor\.com/i },
        { name: 'Monster', pattern: /monster\.com/i },
        { name: 'ZipRecruiter', pattern: /ziprecruiter\.com/i },
        { name: 'Dice', pattern: /dice\.com/i },
        { name: 'Stack Overflow Jobs', pattern: /stackoverflow\.com\/jobs/i }
      ];

      const portal = jobPortals.find(p => p.pattern.test(url));
      
      if (!portal) {
        // Try generic scraping for unsupported platforms
        const content = await extractGenericWebContent(url);
        return res.json({
          success: true,
          content,
          url,
          platform: 'Generic',
          detected: false
        });
      }

      let jobDescription = '';

      switch (portal.name) {
        case 'LinkedIn Jobs':
          jobDescription = await scrapeLinkedInJob(url);
          break;
        case 'Indeed':
          jobDescription = await scrapeIndeedJob(url);
          break;
        case 'Glassdoor':
          jobDescription = await scrapeGlassdoorJob(url);
          break;
        default:
          jobDescription = await extractGenericWebContent(url);
      }

      res.json({
        success: true,
        content: jobDescription,
        url,
        platform: portal.name,
        detected: true
      });

    } catch (error) {
      console.error('Job scraping error:', error);
      res.status(500).json({
        message: 'Failed to scrape job description',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

// Helper functions for URL extraction
async function extractLinkedInProfile(url: string): Promise<string> {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract profile information using string-based evaluation
    const content = await page.evaluate(`(() => {
      const sections = [];
      
      // Name and title
      const name = document.querySelector('h1')?.textContent?.trim();
      if (name) sections.push('Name: ' + name);
      
      const title = document.querySelector('.text-body-medium')?.textContent?.trim();
      if (title) sections.push('Title: ' + title);
      
      // About section
      const about = document.querySelector('[data-section="summary"] .pv-shared-text-with-see-more span')?.textContent?.trim();
      if (about) sections.push('About: ' + about);
      
      // Experience
      const experiences = Array.from(document.querySelectorAll('[data-section="experience"] .pvs-list__item--line-separated'))
        .map(exp => exp.textContent?.trim())
        .filter(Boolean);
      
      if (experiences.length) {
        sections.push('Experience:');
        sections.push(...experiences);
      }
      
      // Education
      const education = Array.from(document.querySelectorAll('[data-section="education"] .pvs-list__item--line-separated'))
        .map(edu => edu.textContent?.trim())
        .filter(Boolean);
      
      if (education.length) {
        sections.push('Education:');
        sections.push(...education);
      }
      
      return sections.join('\\n\\n');
    })()`);
    
    return content || 'Unable to extract LinkedIn profile content';
    
  } finally {
    await browser.close();
  }
}

async function extractGitHubProfile(url: string): Promise<string> {
  const axios = require('axios');
  const { parse } = require('node-html-parser');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const root = parse(response.data);
    const sections = [];
    
    // Profile name and bio
    const name = root.querySelector('.vcard-fullname')?.text;
    if (name) sections.push(`Name: ${name}`);
    
    const bio = root.querySelector('.user-profile-bio')?.text?.trim();
    if (bio) sections.push(`Bio: ${bio}`);
    
    // README content
    const readme = root.querySelector('[data-target="readme-toc.content"]')?.text?.trim();
    if (readme) sections.push(`README: ${readme}`);
    
    // Repository descriptions
    const repos = root.querySelectorAll('.repo-list-item .repo-list-description')
      .map((repo: any) => repo.text?.trim())
      .filter(Boolean);
    
    if (repos.length) {
      sections.push('Repositories:');
      sections.push(...repos.slice(0, 10)); // Limit to top 10 repos
    }
    
    return sections.join('\n\n') || 'Unable to extract GitHub profile content';
    
  } catch (error) {
    throw new Error(`Failed to extract GitHub profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractGoogleDriveContent(url: string): Promise<string> {
  const axios = require('axios');
  
  // Extract file ID from Google Drive URL
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!fileIdMatch) {
    throw new Error('Invalid Google Drive URL format');
  }
  
  const fileId = fileIdMatch[1];
  const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    const response = await axios.get(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    return response.data;
    
  } catch (error) {
    throw new Error(`Failed to extract Google Drive content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractGenericWebContent(url: string): Promise<string> {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract main content using string-based evaluation
    const content = await page.evaluate(`(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, header, footer');
      scripts.forEach(el => el.remove());
      
      // Try to find main content areas
      const contentSelectors = [
        'main',
        '[role="main"]',
        '.main-content',
        '.content',
        'article',
        '.post-content',
        '.entry-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent?.trim() || '';
        }
      }
      
      // Fall back to body content
      return document.body.textContent?.trim() || '';
    })()`);
    
    return content || 'Unable to extract content from URL';
    
  } finally {
    await browser.close();
  }
}

// Job portal specific scrapers
async function scrapeLinkedInJob(url: string): Promise<string> {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const jobData = await page.evaluate(`(() => {
      const sections = [];
      
      // Job title
      const title = document.querySelector('.top-card-layout__title')?.textContent?.trim();
      if (title) sections.push('Job Title: ' + title);
      
      // Company
      const company = document.querySelector('.topcard__flavor-row .topcard__flavor--black-link')?.textContent?.trim();
      if (company) sections.push('Company: ' + company);
      
      // Job description
      const description = document.querySelector('.description__text')?.textContent?.trim();
      if (description) sections.push('Description: ' + description);
      
      return sections.join('\\n\\n');
    })()`);
    
    return jobData || 'Unable to extract LinkedIn job posting';
    
  } finally {
    await browser.close();
  }
}

async function scrapeIndeedJob(url: string): Promise<string> {
  const axios = require('axios');
  const { parse } = require('node-html-parser');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const root = parse(response.data);
    const sections = [];
    
    // Job title
    const title = root.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.text?.trim();
    if (title) sections.push(`Job Title: ${title}`);
    
    // Company
    const company = root.querySelector('[data-testid="inlineHeader-companyName"]')?.text?.trim();
    if (company) sections.push(`Company: ${company}`);
    
    // Job description
    const description = root.querySelector('#jobDescriptionText')?.text?.trim();
    if (description) sections.push(`Description: ${description}`);
    
    return sections.join('\n\n') || 'Unable to extract Indeed job posting';
    
  } catch (error) {
    throw new Error(`Failed to scrape Indeed job: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function scrapeGlassdoorJob(url: string): Promise<string> {
  const axios = require('axios');
  const { parse } = require('node-html-parser');
  
  // Glassdoor has strong anti-bot measures, so this is a simplified version
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const root = parse(response.data);
    const sections = [];
    
    // Extract any visible job content
    const jobContent = root.querySelector('.jobDescriptionContent')?.text?.trim() ||
                      root.querySelector('.desc')?.text?.trim() ||
                      root.querySelector('[data-test="job-description"]')?.text?.trim();
    
    if (jobContent) {
      sections.push(`Job Description: ${jobContent}`);
    }
    
    return sections.join('\n\n') || 'Unable to extract Glassdoor job posting (may require authentication)';
    
  } catch (error) {
    throw new Error(`Failed to scrape Glassdoor job: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function detectPlatform(hostname: string): string {
  if (hostname.includes('linkedin.com')) return 'LinkedIn';
  if (hostname.includes('github.com')) return 'GitHub';
  if (hostname.includes('drive.google.com')) return 'Google Drive';
  if (hostname.includes('dropbox.com')) return 'Dropbox';
  if (hostname.includes('onedrive.live.com')) return 'OneDrive';
  return 'Generic';
}