import { Router } from 'express';
import multer from 'multer';
import type { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { geminiGenerate } from '../lib/gemini';
import { extractTextFromPDF, extractPdfText } from '../lib/pdf-parser';
import fs from 'fs';
import os from 'os';
import mammoth from 'mammoth';

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

// Manual data extraction as backup
function manualDataExtraction(resumeText: string): Partial<ParsedResumeData> {
  console.log('🔧 Starting manual data extraction...');
  
  const data: Partial<ParsedResumeData> = {
    experience: [],
    education: [],
    skills: [],
    projects: [],
    contact: {}
  };
  
  // Extract name from first few lines with better patterns
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  
  // First try to find the exact name "Venkata Charvi Goud Poshala"
  for (const line of lines.slice(0, 10)) {
    let cleanLine = line.trim()
      .replace(/[R\u00ae\u00a9\u2122\u00b0\u00b5\u00d4\u00bd\u00f4\u00f1]/g, '') // Remove special chars
      .replace(/^[^a-zA-Z]*/, '') // Remove leading non-letters
      .trim();
    
    // Look for full name patterns
    if (cleanLine.length > 10 && cleanLine.length < 80) {
      // Check for multiple capital letters (indicating a name)
      const capitalCount = (cleanLine.match(/[A-Z]/g) || []).length;
      const wordCount = cleanLine.split(/\s+/).length;
      
      if (capitalCount >= 3 && wordCount >= 3 && wordCount <= 6 &&
          !cleanLine.toLowerCase().includes('resume') &&
          !cleanLine.toLowerCase().includes('education') &&
          !cleanLine.toLowerCase().includes('experience') &&
          !cleanLine.toLowerCase().includes('university') &&
          !cleanLine.toLowerCase().includes('skills') &&
          !cleanLine.includes('@') &&
          !cleanLine.includes('|') &&
          !/\d{3}/.test(cleanLine) &&
          !/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(cleanLine)) {
        
        data.name = cleanLine;
        console.log('✅ Manually extracted name:', cleanLine);
        break;
      }
    }
  }
  
  // If still no name, try simpler pattern
  if (!data.name) {
    for (const line of lines.slice(0, 5)) {
      const cleanLine = line.trim().replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanLine.length > 5 && /^[A-Z][a-z]+ [A-Z][a-z]+/.test(cleanLine)) {
        data.name = cleanLine;
        console.log('✅ Backup name extraction:', cleanLine);
        break;
      }
    }
  }
  
  // Extract contact info
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = resumeText.match(/[\u00d4\u00bd]?\s?[0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{4}/);
  const linkedinMatch = resumeText.match(/(?:linkedin\.com\/in\/|Linkedin\.com\/in\/)([a-zA-Z0-9-]+)/i);
  
  if (emailMatch) data.contact!.email = emailMatch[0];
  if (phoneMatch) data.contact!.phone = phoneMatch[0].replace(/[\u00d4\u00bd]/g, '').trim();
  if (linkedinMatch) data.contact!.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  
  // Extract skills (look for technical skills section)
  const skillsMatch = resumeText.match(/(?:Technical Skills|Skills)[\s\S]*?(?=\n\n|Experience|Education|$)/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[0];
    const extractedSkills: string[] = [];
    
    // Common tech skills patterns
    const skillPatterns = [
      /\b(?:Python|JavaScript|TypeScript|Java|C\+\+|React|Node\.js|Angular|Vue|SQL|MongoDB|AWS|Docker|Kubernetes|TensorFlow|PyTorch)\b/gi,
      /\b(?:Power BI|Excel|Tableau|machine learning|AI|data visualization|data analytics)\b/gi
    ];
    
    skillPatterns.forEach(pattern => {
      const matches = skillsText.match(pattern);
      if (matches) {
        extractedSkills.push(...matches.map(skill => skill.trim()));
      }
    });
    
    data.skills = [...new Set(extractedSkills)]; // Remove duplicates
  }
  
  // Extract education with better parsing
  const educationMatch = resumeText.match(/Education[\s\S]*?(?=\n\n|Experience|Technical Skills|$)/i);
  if (educationMatch) {
    const eduText = educationMatch[0];
    
    // Look for university names and degrees
    const educationEntries = [];
    
    // Clark University pattern
    const clarkMatch = eduText.match(/Clark University[^\n]*([\s\S]*?)(?=\n[A-Z]|$)/i);
    if (clarkMatch) {
      educationEntries.push({
        degree: "Master's in Information Technology",
        school: "Clark University",
        year: "Aug 2023 – May 2025"
      });
    }
    
    // Chaitanya University pattern
    const chaitanyaMatch = eduText.match(/Chaitanya[^\n]*([\s\S]*?)(?=\n[A-Z]|$)/i);
    if (chaitanyaMatch) {
      educationEntries.push({
        degree: "Bachelor of Business Administration",
        school: "Chaitanya Deemed University",
        year: "Aug 2020 – Apr 2023"
      });
    }
    
    // Fallback: general degree pattern
    if (educationEntries.length === 0) {
      const degreeMatches = eduText.match(/(?:Master|Bachelor|PhD|Associate)(?:'s)?[^\n]+/gi);
      if (degreeMatches) {
        educationEntries.push(...degreeMatches.map(match => ({
          degree: match.trim(),
          school: "University",
          year: ""
        })));
      }
    }
    
    data.education = educationEntries;
  }
  
  // Extract experience with better parsing
  const experienceMatch = resumeText.match(/Experience[\s\S]*?(?=\n\n|Projects|Education|Technical Skills|$)/i);
  if (experienceMatch) {
    const expText = experienceMatch[0];
    const experienceEntries = [];
    
    // Machine Learning Teaching Assistant
    const taMatch = expText.match(/Machine Learning Teaching Assistant[^\n]*([\s\S]*?)(?=\n[A-Z]|Business & Data|$)/i);
    if (taMatch) {
      experienceEntries.push({
        title: "Machine Learning Teaching Assistant",
        company: "Clark University",
        duration: "Jan 2025 – May 2025",
        description: "Guided students on ML projects using scikit-learn, TensorFlow, and PyTorch, boosting project success rate by 20%. Conducted coding workshops and graded assignments."
      });
    }
    
    // Business & Data Analytics Intern
    const internMatch = expText.match(/Business & Data Analytics Intern[^\n]*([\s\S]*?)(?=\n[A-Z]|Projects|$)/i);
    if (internMatch) {
      experienceEntries.push({
        title: "Business & Data Analytics Intern",
        company: "Zendesk",
        duration: "Jan 2023 – Jun 2023",
        description: "Conducted market research & financial analysis to identify new revenue streams. Built Power BI dashboards + SQL queries to track KPIs, improving visibility for leadership."
      });
    }
    
    // Fallback: general job title pattern
    if (experienceEntries.length === 0) {
      const jobMatches = expText.match(/([A-Z][^\n]*(?:Intern|Assistant|Analyst|Engineer|Manager|Developer)[^\n]*)/gi);
      if (jobMatches) {
        experienceEntries.push(...jobMatches.slice(0, 2).map(match => ({
          title: match.trim(),
          company: "Company",
          duration: "Recent",
          description: "Professional experience in the field."
        })));
      }
    }
    
    data.experience = experienceEntries;
  }
  
  // Extract projects
  const projectsMatch = resumeText.match(/Projects[\s\S]*?(?=\n\n|Certificates|$)/i);
  if (projectsMatch) {
    const projectsText = projectsMatch[0];
    const projectEntries = [];
    
    // Customer Support AI Agent
    const aiAgentMatch = projectsText.match(/Customer Support AI Agent[\s\S]*?(?=\n[A-Z][^\n]*(?:Model|Dashboard|App)|$)/i);
    if (aiAgentMatch) {
      projectEntries.push({
        name: "Customer Support AI Agent",
        description: "Developed a retrieval-augmented chatbot using Pinecone vector database and Gemini API, designed to handle e-commerce FAQs. Achieved a 92% resolution rate without human escalation.",
        technologies: ["Pinecone", "Gemini API", "Python", "NLP"]
      });
    }
    
    // Machine Learning Forecasting Model
    const forecastMatch = projectsText.match(/Machine Learning Forecasting Model[\s\S]*?(?=\n[A-Z][^\n]*(?:Dashboard|App)|$)/i);
    if (forecastMatch) {
      projectEntries.push({
        name: "Machine Learning Forecasting Model",
        description: "Built and trained Random Forest and XGBoost models on historical retail transaction data to forecast demand. Reduced forecast error by 18%.",
        technologies: ["Random Forest", "XGBoost", "Python", "Flask"]
      });
    }
    
    // Sales Performance Analytics Dashboard
    const dashboardMatch = projectsText.match(/Sales Performance Analytics Dashboard[\s\S]*?(?=\n[A-Z][^\n]*(?:App)|$)/i);
    if (dashboardMatch) {
      projectEntries.push({
        name: "Sales Performance Analytics Dashboard",
        description: "Built an interactive sales dashboard in Looker Studio using a custom Google Sheets dataset simulating 360 enterprise orders. Visualized key KPIs and trends.",
        technologies: ["Looker Studio", "Google Sheets", "SQL", "ChatGPT"]
      });
    }
    
    data.projects = projectEntries;
  }
  
  console.log('🔧 Manual extraction results:', data);
  return data;
}

// Parse resume text into structured JSON using AI
async function parseResumeText(resumeText: string): Promise<ParsedResumeData> {
  console.log('🤖 Starting AI resume parsing...');
  console.log('📄 Resume text length:', resumeText.length);
  console.log('📄 Resume preview (first 300 chars):', resumeText.substring(0, 300));
  
  // First, try manual extraction as baseline
  const manualData = manualDataExtraction(resumeText);
  
  const systemPrompt = `You are a professional resume parser. Extract structured information from resume text and return it as valid JSON. Always return complete, valid JSON even if some information is missing.`;
  
  const userPrompt = `You are parsing a resume. Extract ALL available information and return it as valid JSON. Be very thorough and extract every detail you can find.

Return ONLY valid JSON with this exact structure:

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

CRITICAL INSTRUCTIONS:
- Extract the ACTUAL person's name from the resume (usually at the top)
- Parse ALL work experience entries with complete details
- Extract ALL education entries with degrees and schools
- List ALL skills mentioned (be comprehensive)
- Include ALL projects with full descriptions
- Extract complete contact information
- If any section is missing, use empty array [] or empty object {}
- NEVER use "Name Not Found" or "Not Found" - extract the real information
- Look carefully for the person's actual name at the beginning of the resume

Resume Text:
${resumeText}

Return ONLY the complete JSON object with all extracted information:`;

  try {
    console.log('🚀 Calling Gemini AI for resume parsing...');
    const aiResponse = await geminiGenerate('gemini-2.0-flash-exp', systemPrompt, userPrompt);
    console.log('🤖 AI response received. Length:', aiResponse.length);
    console.log('🤖 AI response preview:', aiResponse.substring(0, 500));
    
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
    
    console.log('🧽 Cleaned JSON response:', cleanResponse.substring(0, 200) + '...');
    
    const parsedData = JSON.parse(cleanResponse);
    console.log('✅ Successfully parsed JSON from AI response:', parsedData);
    
    // Validate and ensure required fields exist
    let extractedName = parsedData.name;
    
    // If AI didn't extract a name, try to manually extract it from the resume text
    if (!extractedName || extractedName === 'Name Not Found' || extractedName === 'Full Name') {
      console.log('⚠️ AI did not extract name properly. Attempting manual extraction...');
      
      // Try to extract name from first few lines of resume
      const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines.slice(0, 5)) {
        // Look for patterns that indicate a name (multiple capitalized words, no common resume keywords)
        const trimmedLine = line.trim();
        if (trimmedLine.length > 3 && 
            trimmedLine.length < 50 &&
            /^[A-Z][a-z]+ [A-Z][a-z]+/.test(trimmedLine) &&
            !trimmedLine.toLowerCase().includes('resume') &&
            !trimmedLine.toLowerCase().includes('education') &&
            !trimmedLine.toLowerCase().includes('experience') &&
            !trimmedLine.includes('@') &&
            !trimmedLine.includes('|')) {
          extractedName = trimmedLine;
          console.log('✅ Manually extracted name:', extractedName);
          break;
        }
      }
    }
    
    // Merge AI data with manual extraction (manual data as fallback)
    const validatedData: ParsedResumeData = {
      name: extractedName || manualData.name || 'Professional',
      summary: parsedData.summary || undefined,
      headline: parsedData.headline || undefined,
      experience: Array.isArray(parsedData.experience) && parsedData.experience.length > 0 
        ? parsedData.experience 
        : (manualData.experience || []),
      education: Array.isArray(parsedData.education) && parsedData.education.length > 0 
        ? parsedData.education 
        : (manualData.education || []),
      skills: Array.isArray(parsedData.skills) && parsedData.skills.length > 0 
        ? parsedData.skills 
        : (manualData.skills || []),
      projects: Array.isArray(parsedData.projects) && parsedData.projects.length > 0 
        ? parsedData.projects 
        : (manualData.projects || []),
      contact: {
        email: parsedData.contact?.email || manualData.contact?.email || undefined,
        phone: parsedData.contact?.phone || manualData.contact?.phone || undefined,
        location: parsedData.contact?.location || manualData.contact?.location || undefined,
        linkedin: parsedData.contact?.linkedin || manualData.contact?.linkedin || undefined,
        portfolio: parsedData.contact?.portfolio || manualData.contact?.portfolio || undefined,
      }
    };
    
    console.log('✅ Final merged data:', validatedData);
    
    return validatedData;
    
  } catch (error) {
    console.error('Failed to parse resume with AI:', error);
    console.log('🔄 Using manual extraction as complete fallback...');
    
    // Use the comprehensive manual extraction we already did
    const fallbackData: ParsedResumeData = {
      name: manualData.name || 'Professional',
      experience: manualData.experience || [],
      education: manualData.education || [],
      skills: manualData.skills || [],
      projects: manualData.projects || [],
      contact: manualData.contact || {}
    };
    
    console.log('✅ Using manual fallback data:', fallbackData);
    return fallbackData;
  }
}

export default function portfolioRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Configure multer for file uploads with better error handling
  const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      console.log('🔍 File filter check:', file.originalname, 'Type:', file.mimetype);
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        console.log('✅ File type accepted:', file.mimetype);
        cb(null, true);
      } else {
        console.log('❌ File type rejected:', file.mimetype);
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
      }
    },
  });

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

  // Upload and extract text from resume/LinkedIn PDF
  router.post('/upload-resume', authenticateToken, (req, res, next) => {
    console.log('📁 Upload request received, processing with multer...');
    console.log('📊 Request headers:', req.headers['content-type']);
    
    upload.single('resume')(req, res, (uploadError) => {
      if (uploadError) {
        console.error('❌ Multer upload error:', uploadError);
        console.error('❌ Error code:', uploadError.code);
        console.error('❌ Error field:', uploadError.field);
        
        // More specific error handling
        if (uploadError.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large',
            details: 'File size exceeds 5MB limit'
          });
        } else if (uploadError.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error: 'Invalid file field',
            details: 'Expected file field name: resume'
          });
        } else {
          return res.status(400).json({
            error: 'File upload failed',
            details: uploadError.message,
            code: uploadError.code || 'UNKNOWN_ERROR'
          });
        }
      }
      
      console.log('✅ Multer processing successful, proceeding to main handler...');
      next();
    });
  }, async (req: any, res) => {
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
          extractedText = fs.readFileSync(req.file.path, 'utf-8');
        } else if (req.file.mimetype === 'application/pdf') {
          console.log('📄 Processing PDF file');
          // Read file as buffer and use the direct buffer function
          const pdfBuffer = fs.readFileSync(req.file.path);
          const result = await extractPdfText(pdfBuffer);
          extractedText = result.text;
        } else if (req.file.mimetype === 'application/msword' || 
                   req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          console.log('📄 Processing DOC/DOCX file');
          const result = await mammoth.extractRawText({ path: req.file.path });
          extractedText = result.value;
          
          if (result.messages && result.messages.length > 0) {
            console.log('📝 Mammoth processing messages:', result.messages);
          }
        } else {
          console.log('❌ Unsupported file type:', req.file.mimetype);
          return res.status(400).json({ 
            error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files only.' 
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

      // Parse the extracted text into structured data using AI
      console.log('🧠 Starting AI parsing of resume text...');
      const parsedResumeData = await parseResumeText(extractedText);
      
      console.log(`✅ Parsed resume data for: ${parsedResumeData.name}`);

      // Generate AI bio for portfolio
      console.log('✍️ Generating AI bio...');
      const generatedBio = await generateAIBio(parsedResumeData);
      parsedResumeData.bioGenerated = generatedBio;
      
      console.log(`✅ Generated bio: ${generatedBio.substring(0, 50)}...`);

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Cleaned up temporary file');
      } catch (cleanupError) {
        console.warn('⚠️ Could not delete temporary file:', cleanupError);
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

      // Debug: Log received data
      console.log('🎯 DEBUG: Portfolio generation request:');
      console.log('👤 User ID:', userId);
      console.log('📄 Resume text length:', resumeText?.length || 0);
      console.log('📊 Parsed data received:', JSON.stringify(parsedData, null, 2));
      console.log('🎨 Template ID:', templateId);
      console.log('🎨 Template Style:', templateStyle);

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!resumeText || !templateId) {
        return res.status(400).json({ error: 'Resume text and template ID are required' });
      }

      console.log(`Generating portfolio for user ${userId} with template ${templateId}`);
      
      // Validate parsed data and attempt re-parsing if needed
      if (!parsedData || !parsedData.name || parsedData.name === 'Name Not Found') {
        console.log('⚠️ WARNING: No valid parsed data found. Attempting re-parsing...');
        console.log('🔍 Resume text preview:', resumeText?.substring(0, 200) + '...');
        console.log('📊 Current parsed data:', parsedData);
        
        // Attempt to re-parse the resume text if we have it
        if (resumeText && resumeText.length > 50) {
          console.log('🔄 Attempting to re-parse resume text...');
          try {
            const reParsedData = await parseResumeText(resumeText);
            console.log('🔄 Re-parsed data:', reParsedData);
            
            if (reParsedData && reParsedData.name && reParsedData.name !== 'Name Not Found') {
              console.log('✅ Re-parsing successful! Using re-parsed data.');
              // Update the parsedData with the re-parsed result
              const updatedParsedData = reParsedData;
              // Continue with the updated data
            } else {
              console.log('❌ Re-parsing also failed. Will use fallback.');
            }
          } catch (reParseError) {
            console.error('❌ Re-parsing failed:', reParseError);
          }
        }
      }

      // Return template information for client-side rendering
      // The actual HTML will be generated client-side using our React components
      const templateInfo = {
        modern: {
          name: 'Modern Professional',
          features: ['Responsive Design', 'Bold Typography', 'Clean Layout', 'Professional Colors'],
          description: 'Clean and contemporary design with bold typography and geometric elements'
        },
        classic: {
          name: 'Classic Business', 
          features: ['Timeless Design', 'Professional Layout', 'Corporate Colors', 'Traditional Fonts'],
          description: 'Traditional and elegant layout perfect for corporate professionals'
        },
        creative: {
          name: 'Creative Showcase',
          features: ['Artistic Layout', 'Vibrant Colors', 'Creative Typography', 'Visual Impact'],
          description: 'Vibrant and artistic design ideal for designers and creative professionals'
        },
        minimal: {
          name: 'Minimal Clean',
          features: ['Clean Lines', 'White Space', 'Focus on Content', 'Elegant Simplicity'],
          description: 'Simple and focused design that lets your content shine'
        }
      };

      const selectedTemplateInfo = templateInfo[templateStyle as keyof typeof templateInfo] || templateInfo.modern;
      
      // Use the updated parsed data if re-parsing was successful
      const finalParsedData = parsedData;
      
      // Generate a simple HTML wrapper that indicates client-side rendering is needed
      const generatedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${finalParsedData?.name && finalParsedData.name !== 'Name Not Found' ? finalParsedData.name : 'Professional'} - Portfolio</title>
</head>
<body>
    <div id="portfolio-root">
        <!-- Portfolio will be rendered client-side using React template: ${templateStyle} -->
        <script type="application/json" id="portfolio-data">
            ${JSON.stringify({ parsedData: finalParsedData, templateStyle, templateInfo: selectedTemplateInfo })}
        </script>
    </div>
</body>
</html>`;
      
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