import { Router } from 'express';
import multer from 'multer';
import type { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { geminiGenerate } from '../lib/gemini';
import { extractTextFromPDF } from '../lib/pdf-parser';
import fs from 'fs';
import os from 'os';

// Interface for parsed resume data
interface ParsedResumeData {
  name: string;
  summary?: string;
  headline?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year?: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
}

// Parse resume text into structured JSON using AI
async function parseResumeText(resumeText: string): Promise<ParsedResumeData> {
  const systemPrompt = `You are a professional resume parser. Extract structured information from resume text and return it as valid JSON. Always return complete, valid JSON even if some information is missing.`;
  
  const userPrompt = `Parse the following resume text and extract structured information. Return ONLY valid JSON with this exact structure:

{
  "name": "Full Name",
  "summary": "Professional summary or objective (if present)",
  "headline": "Professional title or headline (if present)",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Date range (e.g., 2020-2023, Jan 2020 - Present)",
      "description": "Job description or key achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "Institution Name", 
      "year": "Graduation year or date range"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username",
    "portfolio": "portfolio-url.com"
  }
}

Resume Text:
${resumeText}

Return only the JSON object, no explanations or markdown formatting.`;

  try {
    const aiResponse = await geminiGenerate('gemini-2.0-flash-exp', systemPrompt, userPrompt);
    
    // Clean the response and try to parse JSON
    let cleanResponse = aiResponse.trim();
    
    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    // Find JSON object in response
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
    }
    
    const parsedData = JSON.parse(cleanResponse);
    
    // Validate and ensure required fields exist
    const validatedData: ParsedResumeData = {
      name: parsedData.name || 'Name Not Found',
      summary: parsedData.summary || undefined,
      headline: parsedData.headline || undefined,
      experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
      contact: {
        email: parsedData.contact?.email || undefined,
        phone: parsedData.contact?.phone || undefined,
        location: parsedData.contact?.location || undefined,
        linkedin: parsedData.contact?.linkedin || undefined,
        portfolio: parsedData.contact?.portfolio || undefined,
      }
    };
    
    return validatedData;
    
  } catch (error) {
    console.error('Failed to parse resume with AI:', error);
    
    // Return a basic fallback structure
    return {
      name: 'Name Not Found',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      contact: {}
    } as ParsedResumeData;
  }
}

export default function portfolioRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Configure multer for file uploads
  const upload = multer({
    dest: os.tmpdir(), // Use system temp directory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit as per specification
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
      }
    },
  });

  // Upload and extract text from resume/LinkedIn PDF
  router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req: any, res) => {
    try {
      console.log('📁 Portfolio upload request received');
      
      const userId = req.user?.uid || req.user?.id;
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!req.file) {
        console.log('❌ No file found in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Processing uploaded resume:', req.file.originalname, 'Type:', req.file.mimetype);

      let extractedText = '';

      // Handle different file types
      try {
        if (req.file.mimetype === 'text/plain') {
          console.log('📄 Processing TXT file');
          // Read TXT file directly
          extractedText = fs.readFileSync(req.file.path, 'utf-8');
        } else if (req.file.mimetype === 'application/pdf') {
          console.log('📄 Processing PDF file');
          // Extract text from PDF
          extractedText = await extractTextFromPDF(req.file.path);
        } else if (req.file.mimetype === 'application/msword' || 
                   req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          console.log('📄 DOC/DOCX file detected - not supported yet');
          // For DOC/DOCX files, we'll use a simple fallback for now
          // In a production environment, you'd want to use a proper DOC/DOCX parser
          return res.status(400).json({ 
            error: 'DOC/DOCX file processing is not yet supported. Please convert to PDF or TXT format.' 
          });
        }
      } catch (fileProcessingError) {
        console.error('❌ File processing error:', fileProcessingError);
        return res.status(500).json({ 
          error: 'Failed to process file. Please ensure the file is not corrupted.',
          details: fileProcessingError instanceof Error ? fileProcessingError.message : 'Unknown file processing error'
        });
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: 'Could not extract text from file. Please ensure the file contains readable text.' });
      }

      console.log(`✅ Extracted ${extractedText.length} characters from ${req.file.originalname}`);

      // Parse the extracted text into structured data
      console.log('🧠 Starting AI parsing of resume text...');
      const parsedResumeData = await parseResumeText(extractedText);
      
      console.log(`✅ Parsed resume data for: ${parsedResumeData.name}`);

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
          wordCount: extractedText.trim().split(/\s+/).length,
          parsedData: parsedResumeData
        }
      });

    } catch (error) {
      console.error('❌ Error processing resume upload:', error);
      
      // Clean up temporary file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up temporary file after error');
        } catch (cleanupError) {
          console.warn('⚠️ Could not delete temporary file after error:', cleanupError);
        }
      }
      
      // More detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('📊 Error details:', errorMessage);
      
      res.status(500).json({ 
        error: 'Failed to process resume upload',
        details: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Generate portfolio from resume text and template
  router.post('/generate', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.uid || req.user?.id;
      const { resumeText, parsedData, templateId, templateStyle } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!resumeText || !templateId) {
        return res.status(400).json({ error: 'Resume text and template ID are required' });
      }

      console.log(`Generating portfolio for user ${userId} with template ${templateId}`);

      // Generate portfolio content using Gemini AI
      const systemPrompt = `You are a professional web developer specializing in creating beautiful portfolio websites. Generate complete HTML pages with embedded CSS that are responsive, modern, and professional.`;
      
      const userPrompt = `Create a professional portfolio website in HTML and CSS format using the following structured resume data:

STRUCTURED RESUME DATA:
${JSON.stringify(parsedData, null, 2)}

TEMPLATE STYLE: ${templateStyle || 'modern'}

Requirements:
1. Complete HTML document with embedded <style> section
2. Professional design matching the ${templateStyle || 'modern'} aesthetic
3. Responsive layout that works on mobile and desktop
4. Use the structured data to create sections for: Header/Hero, About, Experience, Skills, Education, Projects, Contact
5. Use appropriate colors, typography, and spacing for ${templateStyle || 'modern'} style
6. Make it visually appealing and modern
7. Include all available information from the structured data
8. Format experience and education chronologically
9. Display skills as badges or organized lists
10. Include contact information in a professional manner

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