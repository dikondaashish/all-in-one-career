import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { extractTextFromFile } from '../utils/fileParser';
import { extractResumeFields, extractSkills, calculateMatchScore, tokenize } from '../utils/textProcessor';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Validation schemas
const scanRequestSchema = z.object({
  jobDescription: z.string().optional()
});

export default function createAtsRouter(prisma: PrismaClient): express.Router {
  // POST /api/ats/scan - Upload and scan resume
  router.post('/scan', upload.single('resume'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
      }

      // Validate request body
      const { jobDescription } = scanRequestSchema.parse(req.body);
      
      const userId = req.user?.uid; // From authenticateToken middleware
      const file = req.file;
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      try {
        // Extract text from uploaded file
        const resumeText = await extractTextFromFile(file.path, fileExt);
        
        // Parse resume into structured data
        const parsedResume = extractResumeFields(resumeText);
        
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
        }
        
        // Save scan to database
        const scan = await prisma.atsScan.create({
          data: {
            userId,
            fileName: file.originalname,
            fileType: fileExt,
            jdText: jobDescription || null,
            parsedJson: parsedResume,
            matchScore: matchResult.score,
            missingSkills: matchResult.missingSkills,
            extraSkills: matchResult.extraSkills
          }
        });
        
        // Save keyword stats
        const allKeywords = new Set([...parsedResume.skills, ...jdSkills]);
        const keywordStats = Array.from(allKeywords).map(keyword => ({
          scanId: scan.id,
          keyword,
          inResume: parsedResume.skills.includes(keyword),
          inJobDesc: jdSkills.includes(keyword),
          weight: 1.0
        }));
        
        if (keywordStats.length > 0) {
          await prisma.atsKeywordStat.createMany({
            data: keywordStats
          });
        }
        
        // Update user's ATS scan count
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { atsScans: { increment: 1 } }
          });
        }
        
        // Return response
        const response = {
          scanId: scan.id,
          matchScore: matchResult.score,
          summary: {
            name: parsedResume.name,
            email: parsedResume.email,
            phone: parsedResume.phone,
            skills: parsedResume.skills
          },
          missingSkills: matchResult.missingSkills,
          extraSkills: matchResult.extraSkills,
          keywords: keywordStats
        };
        
        res.json(response);
        
      } finally {
        // Clean up temp file
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.warn('Failed to delete temp file:', file.path);
        }
      }
      
    } catch (error) {
      console.error('Error in ATS scan:', error);
      
      // Clean up temp file on error
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.warn('Failed to delete temp file on error:', req.file.path);
        }
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      
      res.status(500).json({ error: 'Failed to process resume scan' });
    }
  });
  
  // GET /api/ats/scans - Get user's scan history
  router.get('/scans', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const scans = await prisma.atsScan.findMany({
        where: { userId },
        select: {
          id: true,
          fileName: true,
          matchScore: true,
          createdAt: true,
          fileType: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      
      const total = await prisma.atsScan.count({
        where: { userId }
      });
      
      res.json({
        scans,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
      
    } catch (error) {
      console.error('Error fetching ATS scans:', error);
      res.status(500).json({ error: 'Failed to fetch scan history' });
    }
  });
  
  // GET /api/ats/scans/:id - Get specific scan details
  router.get('/scans/:id', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const scanId = req.params.id;
      
      const scan = await prisma.atsScan.findFirst({
        where: {
          id: scanId,
          userId
        },
        include: {
          keywords: true
        }
      });
      
      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }
      
      res.json(scan);
      
    } catch (error) {
      console.error('Error fetching ATS scan:', error);
      res.status(500).json({ error: 'Failed to fetch scan details' });
    }
  });
  
  // DELETE /api/ats/scans/:id - Delete a scan
  router.delete('/scans/:id', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const scanId = req.params.id;
      
      const scan = await prisma.atsScan.findFirst({
        where: {
          id: scanId,
          userId
        }
      });
      
      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }
      
      // Delete scan (keywords will be deleted due to cascade)
      await prisma.atsScan.delete({
        where: { id: scanId }
      });
      
      // Update user's ATS scan count
      await prisma.user.update({
        where: { id: userId },
        data: { atsScans: { decrement: 1 } }
      });
      
      res.json({ message: 'Scan deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting ATS scan:', error);
      res.status(500).json({ error: 'Failed to delete scan' });
    }
  });
  
  return router;
}