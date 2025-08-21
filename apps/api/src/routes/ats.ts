import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { extractTextFromFile } from '../utils/fileParser';
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

// Multer configuration for file uploads
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only DOC and DOCX files are currently supported. PDF support coming soon.'));
    }
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
          .filter(word => word.length > 3)
          .map(word => word.replace(/[^\w]/g, ''))
      );
      
      const jdWords = jobDescription.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .map(word => word.replace(/[^\w]/g, ''));
      
      const jdWordsUnique = Array.from(new Set(jdWords));
      
      const keywordMatches = jdWordsUnique.filter(word => resumeWords.has(word));

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

  return router;
}