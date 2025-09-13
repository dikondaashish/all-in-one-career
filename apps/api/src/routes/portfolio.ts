import { Router } from 'express';
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
  bioGenerated?: string; // AI-generated "About Me" section
}

// Generate AI bio from structured resume data
async function generateAIBio(parsedData: ParsedResumeData): Promise<string> {
  const systemPrompt = `You are creating a personal bio for a professional portfolio website. Write warm, engaging, and concise About Me sections that sound natural and professional.`;
  
  const userPrompt = `Based on the following resume data, write a warm and concise "About Me" paragraph (2-3 sentences) for a personal portfolio website. Make it engaging and professional:

RESUME DATA:
Name: ${parsedData.name}
${parsedData.headline ? `Title: ${parsedData.headline}` : ''}
${parsedData.summary ? `Summary: ${parsedData.summary}` : ''}

Experience: ${parsedData.experience.map(exp => `${exp.title} at ${exp.company}`).join(', ')}

Skills: ${parsedData.skills.join(', ')}

${parsedData.education.length > 0 ? `Education: ${parsedData.education.map(edu => `${edu.degree} from ${edu.school}`).join(', ')}` : ''}

Write a compelling About Me that introduces them professionally but warmly. Return ONLY the bio text, no quotes or formatting.`;

  try {
    const generatedBio = await geminiGenerate('gemini-2.0-flash-exp', systemPrompt, userPrompt);
    return generatedBio.trim();
  } catch (error) {
    console.error('Failed to generate AI bio:', error);
    // Return a fallback bio
    return `${parsedData.name} is a dedicated professional with experience in ${parsedData.experience.length > 0 ? parsedData.experience[0]?.title || 'their field' : 'their field'}. ${parsedData.skills.length > 0 ? `Skilled in ${parsedData.skills.slice(0, 3).join(', ')}.` : ''} Passionate about delivering excellent results and continuous learning.`;
  }
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

  // Test endpoint without file processing
  router.post('/test-upload', authenticateToken, async (req: any, res) => {
    try {
      console.log('📁 Test upload request received');
      const userId = req.user?.uid || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      res.json({
        success: true,
        message: 'Test endpoint working',
        userId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Test endpoint error:', error);
      res.status(500).json({ 
        error: 'Test endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload and extract text from resume/LinkedIn PDF (Simplified without multer)
  router.post('/upload-resume', authenticateToken, async (req: any, res) => {
    try {
      console.log('📁 Portfolio upload request received');
      
      const userId = req.user?.uid || req.user?.id;
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(401).json({ error: 'User authentication required' });
      }

      console.log('✅ Simulating file upload and text extraction...');
      
      // Simulate extracted text for now
      const extractedText = `Sample Resume Text for Testing
John Doe
Senior Software Engineer
Experience: 5 years in web development
Skills: React, Node.js, TypeScript
Education: Computer Science Degree`;

      // Create basic parsed data for now (skip AI parsing to isolate issues)
      console.log('📝 Creating basic parsed data structure...');
      const parsedResumeData: ParsedResumeData = {
        name: 'Extracted Name',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        contact: {},
        bioGenerated: 'Basic bio will be generated here'
      };
      
      console.log(`✅ Basic parsed data created`);

      console.log('✅ Returning simulated response...');

      res.json({
        success: true,
        data: {
          filename: 'test-resume.pdf',
          extractedText: extractedText.trim(),
          wordCount: extractedText.trim().split(/\s+/).length,
          parsedData: parsedResumeData
        }
      });

    } catch (error) {
      console.error('❌ Error processing resume upload:', error);
      
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
11. Use the bioGenerated field for the About/Bio section if available

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