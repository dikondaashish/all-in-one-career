import { Router } from 'express';
import multer from 'multer';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import { authenticateToken } from '../middleware/auth';
import { geminiGenerate } from '../lib/gemini';
import { extractTextFromPDF } from '../lib/pdf-parser';
import fs from 'fs';

export default function portfolioRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const router = Router();

  // Configure multer for file uploads
  const upload = multer({
    dest: 'temp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    },
  });

  // Upload and extract text from resume/LinkedIn PDF
  router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user?.uid || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Processing uploaded resume:', req.file.originalname);

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(req.file.path);
      
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: 'Could not extract text from PDF. Please ensure the file contains readable text.' });
      }

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete temporary file:', cleanupError);
      }

      res.json({
        success: true,
        data: {
          filename: req.file.originalname,
          extractedText: extractedText.trim(),
          wordCount: extractedText.trim().split(/\s+/).length
        }
      });

    } catch (error) {
      console.error('Error processing resume upload:', error);
      
      // Clean up temporary file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Could not delete temporary file after error:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate portfolio from resume text and template
  router.post('/generate', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.uid || req.user?.id;
      const { resumeText, templateId, templateStyle } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!resumeText || !templateId) {
        return res.status(400).json({ error: 'Resume text and template ID are required' });
      }

      console.log(`Generating portfolio for user ${userId} with template ${templateId}`);

      // Generate portfolio content using Gemini AI
      const systemPrompt = `You are a professional web developer specializing in creating beautiful portfolio websites. Generate complete HTML pages with embedded CSS that are responsive, modern, and professional.`;
      
      const userPrompt = `Create a professional portfolio website in HTML and CSS format based on the following resume:

RESUME:
${resumeText}

TEMPLATE STYLE: ${templateStyle || 'modern'}

Requirements:
1. Complete HTML document with embedded <style> section
2. Professional design matching the ${templateStyle || 'modern'} aesthetic
3. Responsive layout that works on mobile and desktop
4. Include sections for: Header/Hero, About, Experience, Skills, Education (if applicable), Contact
5. Use appropriate colors, typography, and spacing
6. Make it visually appealing and modern

Return ONLY the complete HTML document with embedded CSS - no explanations, no markdown formatting, no code blocks.`;

      const generatedContent = await geminiGenerate('gemini-2.0-flash-exp', systemPrompt, userPrompt);
      
      if (!generatedContent) {
        return res.status(500).json({ error: 'Failed to generate portfolio content' });
      }

      // For now, return the generated content without saving to database
      // In production, you'd save to a Portfolio table
      console.log(`Portfolio generated successfully for user ${userId}`);

      res.json({
        success: true,
        data: {
          portfolioId: 'portfolio_' + Date.now(),
          htmlContent: generatedContent,
          templateId,
          templateStyle: templateStyle || 'modern'
        }
      });

    } catch (error) {
      console.error('Error generating portfolio:', error);
      res.status(500).json({ 
        error: 'Failed to generate portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Simulate portfolio publishing to subdomain
  router.post('/publish', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.uid || req.user?.id;
      const { portfolioId, htmlContent, subdomain } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!portfolioId || !htmlContent) {
        return res.status(400).json({ error: 'Portfolio ID and HTML content are required' });
      }

      console.log(`Publishing portfolio ${portfolioId} for user ${userId}`);

      // Generate subdomain if not provided
      let finalSubdomain = subdomain;
      if (!finalSubdomain) {
        // Create subdomain from user ID or email
        finalSubdomain = `user${userId.slice(-6)}${Date.now().toString().slice(-4)}`;
      }

      const portfolioUrl = `https://${finalSubdomain}.all-in-one-career.com`;

      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`Portfolio published successfully: ${portfolioUrl}`);

      res.json({
        success: true,
        data: {
          portfolioId,
          portfolioUrl,
          subdomain: finalSubdomain,
          publishedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error publishing portfolio:', error);
      res.status(500).json({ 
        error: 'Failed to publish portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}