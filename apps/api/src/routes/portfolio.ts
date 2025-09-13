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

// Generate complete portfolio HTML with embedded CSS
function generatePortfolioTemplate(templateId: string, templateStyle: string, parsedData: ParsedResumeData): string {
  const templates = {
    modern: generateModernTemplate,
    classic: generateClassicTemplate,
    creative: generateCreativeTemplate,
    minimal: generateMinimalTemplate
  };

  const generator = templates[templateId as keyof typeof templates] || templates.modern;
  return generator(parsedData);
}

function generateModernTemplate(data: ParsedResumeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            box-shadow: 0 0 50px rgba(0,0,0,0.1);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="50" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="80" r="1.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .name {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
        }
        
        .title {
            font-size: 1.5rem;
            opacity: 0.9;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            opacity: 0.9;
        }
        
        /* Main Content */
        .content {
            padding: 3rem 2rem;
        }
        
        .section {
            margin-bottom: 3rem;
        }
        
        .section-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: #1f2937;
            position: relative;
            padding-bottom: 0.5rem;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 50px;
            height: 3px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        /* About Section */
        .about {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #4b5563;
        }
        
        /* Experience Section */
        .experience-item {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        
        .job-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .company {
            font-size: 1.1rem;
            color: #667eea;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .duration {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .job-description {
            color: #4b5563;
            line-height: 1.6;
        }
        
        /* Skills Section */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
        }
        
        .skill {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 25px;
            text-align: center;
            font-weight: 500;
            transition: transform 0.2s ease;
        }
        
        .skill:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        /* Education Section */
        .education-item {
            background: #f1f5f9;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 1rem;
        }
        
        .degree {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .school {
            color: #667eea;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .year {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        /* Projects Section */
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .project-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .project-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .project-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .project-description {
            color: #4b5563;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            background: #e0e7ff;
            color: #3730a3;
            padding: 0.25rem 0.75rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .name {
                font-size: 2.5rem;
            }
            
            .title {
                font-size: 1.2rem;
            }
            
            .content {
                padding: 2rem 1rem;
            }
            
            .header {
                padding: 3rem 1rem;
            }
            
            .contact-info {
                gap: 1rem;
            }
            
            .skills-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
            
            .projects-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .name {
                font-size: 2rem;
            }
            
            .section-title {
                font-size: 1.5rem;
            }
            
            .experience-item,
            .education-item,
            .project-card {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <header class="header">
            <div class="header-content">
                <h1 class="name">${data.name || 'Your Name'}</h1>
                <p class="title">${data.headline || data.summary || 'Professional Title'}</p>
                <div class="contact-info">
                    ${data.contact?.email ? `<div class="contact-item">📧 ${data.contact.email}</div>` : ''}
                    ${data.contact?.phone ? `<div class="contact-item">📞 ${data.contact.phone}</div>` : ''}
                    ${data.contact?.location ? `<div class="contact-item">📍 ${data.contact.location}</div>` : ''}
                    ${data.contact?.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="content">
            <!-- About Section -->
            ${data.bioGenerated || data.summary ? `
            <section class="section">
                <h2 class="section-title">About Me</h2>
                <div class="about">
                    ${data.bioGenerated || data.summary || 'Passionate professional dedicated to excellence and innovation.'}
                </div>
            </section>
            ` : ''}

            <!-- Experience Section -->
            ${data.experience && data.experience.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Experience</h2>
                ${data.experience.map(exp => `
                    <div class="experience-item">
                        <h3 class="job-title">${exp.title || 'Position Title'}</h3>
                        <div class="company">${exp.company || 'Company Name'}</div>
                        <div class="duration">${exp.duration || 'Duration'}</div>
                        ${exp.description ? `<div class="job-description">${exp.description}</div>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Skills Section -->
            ${data.skills && data.skills.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Skills</h2>
                <div class="skills-grid">
                    ${data.skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Education</h2>
                ${data.education.map(edu => `
                    <div class="education-item">
                        <h3 class="degree">${edu.degree || 'Degree'}</h3>
                        <div class="school">${edu.school || 'Institution'}</div>
                        <div class="year">${edu.year || 'Year'}</div>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Projects Section -->
            ${data.projects && data.projects.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Projects</h2>
                <div class="projects-grid">
                    ${data.projects.map(project => `
                        <div class="project-card">
                            <h3 class="project-name">${project.name || 'Project Name'}</h3>
                            <p class="project-description">${project.description || 'Project description'}</p>
                            ${project.technologies && project.technologies.length > 0 ? `
                                <div class="project-tech">
                                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}
        </main>
    </div>
</body>
</html>`;
}

function generateClassicTemplate(data: ParsedResumeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.6;
            color: #2d3748;
            background: #f7fafc;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            box-shadow: 0 0 30px rgba(0,0,0,0.1);
        }
        
        /* Header Section */
        .header {
            background: #2d3748;
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            border-bottom: 4px solid #4a5568;
        }
        
        .name {
            font-size: 3rem;
            font-weight: 400;
            margin-bottom: 0.5rem;
            letter-spacing: 0.05em;
        }
        
        .title {
            font-size: 1.3rem;
            opacity: 0.9;
            margin-bottom: 1.5rem;
            font-style: italic;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
            font-size: 0.9rem;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* Main Content */
        .content {
            padding: 2.5rem 2rem;
        }
        
        .section {
            margin-bottom: 2.5rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2rem;
        }
        
        .section:last-child {
            border-bottom: none;
        }
        
        .section-title {
            font-size: 1.8rem;
            font-weight: 400;
            margin-bottom: 1.5rem;
            color: #2d3748;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: 2px solid #4a5568;
            padding-bottom: 0.5rem;
        }
        
        /* About Section */
        .about {
            font-size: 1rem;
            line-height: 1.8;
            color: #4a5568;
            text-align: justify;
        }
        
        /* Experience Section */
        .experience-item {
            margin-bottom: 1.5rem;
            padding-left: 1rem;
            border-left: 3px solid #4a5568;
        }
        
        .job-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.25rem;
        }
        
        .company {
            font-size: 1rem;
            color: #4a5568;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .duration {
            color: #718096;
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
            font-style: italic;
        }
        
        .job-description {
            color: #4a5568;
            line-height: 1.6;
        }
        
        /* Skills Section */
        .skills-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 0.5rem;
            list-style: none;
        }
        
        .skill {
            padding: 0.5rem 1rem;
            background: #edf2f7;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            text-align: center;
            font-weight: 500;
            color: #2d3748;
        }
        
        /* Education Section */
        .education-item {
            margin-bottom: 1rem;
            padding-left: 1rem;
            border-left: 3px solid #4a5568;
        }
        
        .degree {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.25rem;
        }
        
        .school {
            color: #4a5568;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .year {
            color: #718096;
            font-size: 0.9rem;
            font-style: italic;
        }
        
        /* Projects Section */
        .project-item {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
        }
        
        .project-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .project-description {
            color: #4a5568;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            background: #2d3748;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .name {
                font-size: 2.2rem;
            }
            
            .title {
                font-size: 1.1rem;
            }
            
            .content {
                padding: 2rem 1rem;
            }
            
            .header {
                padding: 2rem 1rem;
            }
            
            .contact-info {
                gap: 1rem;
                flex-direction: column;
                align-items: center;
            }
            
            .skills-list {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
        }
        
        @media (max-width: 480px) {
            .name {
                font-size: 1.8rem;
            }
            
            .section-title {
                font-size: 1.4rem;
            }
            
            .project-item {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <header class="header">
            <h1 class="name">${data.name || 'Your Name'}</h1>
            <p class="title">${data.headline || data.summary || 'Professional Title'}</p>
            <div class="contact-info">
                ${data.contact?.email ? `<div class="contact-item">Email: ${data.contact.email}</div>` : ''}
                ${data.contact?.phone ? `<div class="contact-item">Phone: ${data.contact.phone}</div>` : ''}
                ${data.contact?.location ? `<div class="contact-item">Location: ${data.contact.location}</div>` : ''}
                ${data.contact?.linkedin ? `<div class="contact-item">LinkedIn Profile</div>` : ''}
            </div>
        </header>

        <!-- Main Content -->
        <main class="content">
            <!-- About Section -->
            ${data.bioGenerated || data.summary ? `
            <section class="section">
                <h2 class="section-title">Professional Summary</h2>
                <div class="about">
                    ${data.bioGenerated || data.summary || 'Dedicated professional with a commitment to excellence and continuous growth.'}
                </div>
            </section>
            ` : ''}

            <!-- Experience Section -->
            ${data.experience && data.experience.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Professional Experience</h2>
                ${data.experience.map(exp => `
                    <div class="experience-item">
                        <h3 class="job-title">${exp.title || 'Position Title'}</h3>
                        <div class="company">${exp.company || 'Company Name'}</div>
                        <div class="duration">${exp.duration || 'Duration'}</div>
                        ${exp.description ? `<div class="job-description">${exp.description}</div>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Skills Section -->
            ${data.skills && data.skills.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Core Competencies</h2>
                <div class="skills-list">
                    ${data.skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Education</h2>
                ${data.education.map(edu => `
                    <div class="education-item">
                        <h3 class="degree">${edu.degree || 'Degree'}</h3>
                        <div class="school">${edu.school || 'Institution'}</div>
                        <div class="year">${edu.year || 'Year'}</div>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Projects Section -->
            ${data.projects && data.projects.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Notable Projects</h2>
                ${data.projects.map(project => `
                    <div class="project-item">
                        <h3 class="project-name">${project.name || 'Project Name'}</h3>
                        <p class="project-description">${project.description || 'Project description'}</p>
                        ${project.technologies && project.technologies.length > 0 ? `
                            <div class="project-tech">
                                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}
        </main>
    </div>
</body>
</html>`;
}

function generateCreativeTemplate(data: ParsedResumeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Creative Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            min-height: 100vh;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            min-height: 100vh;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(254, 202, 87, 0.9));
            color: white;
            padding: 4rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="3" fill="white" opacity="0.2"/><circle cx="80" cy="40" r="2" fill="white" opacity="0.2"/><circle cx="40" cy="70" r="4" fill="white" opacity="0.1"/><circle cx="70" cy="10" r="2" fill="white" opacity="0.3"/></svg>');
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .name {
            font-size: 4rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            font-weight: 300;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        
        .contact-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 25px;
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease;
        }
        
        .contact-item:hover {
            transform: translateY(-2px);
        }
        
        /* Main Content */
        .content {
            padding: 3rem 2rem;
        }
        
        .section {
            margin-bottom: 3rem;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.8s ease forwards;
        }
        
        .section:nth-child(1) { animation-delay: 0.1s; }
        .section:nth-child(2) { animation-delay: 0.2s; }
        .section:nth-child(3) { animation-delay: 0.3s; }
        .section:nth-child(4) { animation-delay: 0.4s; }
        .section:nth-child(5) { animation-delay: 0.5s; }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 60px;
            height: 4px;
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            border-radius: 2px;
        }
        
        /* About Section */
        .about {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #4a5568;
            background: linear-gradient(135deg, #f7fafc, #edf2f7);
            padding: 2rem;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            position: relative;
        }
        
        .about::before {
            content: '"';
            position: absolute;
            top: -10px;
            left: 20px;
            font-size: 4rem;
            color: #ff6b6b;
            font-family: serif;
        }
        
        /* Experience Section */
        .experience-item {
            margin-bottom: 2rem;
            padding: 2rem;
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(254, 202, 87, 0.1));
            border-radius: 20px;
            border: 2px solid transparent;
            background-clip: padding-box;
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .experience-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .experience-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            border-radius: 20px;
            z-index: -1;
            margin: -2px;
        }
        
        .job-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .company {
            font-size: 1.1rem;
            color: #ff6b6b;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .duration {
            color: #718096;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            font-style: italic;
        }
        
        .job-description {
            color: #4a5568;
            line-height: 1.6;
        }
        
        /* Skills Section */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 1rem;
        }
        
        .skill {
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            color: white;
            padding: 1rem;
            border-radius: 20px;
            text-align: center;
            font-weight: 600;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        }
        
        .skill:hover {
            transform: translateY(-5px) rotate(2deg);
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
        }
        
        .skill:nth-child(even) {
            background: linear-gradient(45deg, #48dbfb, #ff9ff3);
        }
        
        .skill:nth-child(even):hover {
            box-shadow: 0 10px 25px rgba(72, 219, 251, 0.3);
        }
        
        /* Education Section */
        .education-item {
            background: linear-gradient(135deg, rgba(72, 219, 251, 0.1), rgba(255, 159, 243, 0.1));
            padding: 1.5rem;
            border-radius: 15px;
            margin-bottom: 1rem;
            border-left: 4px solid #48dbfb;
        }
        
        .degree {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .school {
            color: #48dbfb;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .year {
            color: #718096;
            font-size: 0.9rem;
        }
        
        /* Projects Section */
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }
        
        .project-card {
            background: white;
            border-radius: 25px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .project-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
        }
        
        .project-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        
        .project-name {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .project-description {
            color: #4a5568;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            background: linear-gradient(45deg, #ff9ff3, #48dbfb);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .name {
                font-size: 2.5rem;
            }
            
            .title {
                font-size: 1.2rem;
            }
            
            .content {
                padding: 2rem 1rem;
            }
            
            .header {
                padding: 3rem 1rem;
            }
            
            .contact-info {
                gap: 1rem;
            }
            
            .skills-grid {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            }
            
            .projects-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .name {
                font-size: 2rem;
            }
            
            .section-title {
                font-size: 1.8rem;
            }
            
            .experience-item,
            .education-item,
            .project-card {
                padding: 1.5rem;
            }
            
            .about {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <header class="header">
            <div class="header-content">
                <h1 class="name">${data.name || 'Your Name'}</h1>
                <p class="title">${data.headline || data.summary || 'Creative Professional'}</p>
                <div class="contact-info">
                    ${data.contact?.email ? `<div class="contact-item">📧 ${data.contact.email}</div>` : ''}
                    ${data.contact?.phone ? `<div class="contact-item">📞 ${data.contact.phone}</div>` : ''}
                    ${data.contact?.location ? `<div class="contact-item">📍 ${data.contact.location}</div>` : ''}
                    ${data.contact?.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="content">
            <!-- About Section -->
            ${data.bioGenerated || data.summary ? `
            <section class="section">
                <h2 class="section-title">About Me</h2>
                <div class="about">
                    ${data.bioGenerated || data.summary || 'Creative professional passionate about innovative design and meaningful projects.'}
                </div>
            </section>
            ` : ''}

            <!-- Experience Section -->
            ${data.experience && data.experience.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Experience</h2>
                ${data.experience.map(exp => `
                    <div class="experience-item">
                        <h3 class="job-title">${exp.title || 'Position Title'}</h3>
                        <div class="company">${exp.company || 'Company Name'}</div>
                        <div class="duration">${exp.duration || 'Duration'}</div>
                        ${exp.description ? `<div class="job-description">${exp.description}</div>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Skills Section -->
            ${data.skills && data.skills.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Skills</h2>
                <div class="skills-grid">
                    ${data.skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Education</h2>
                ${data.education.map(edu => `
                    <div class="education-item">
                        <h3 class="degree">${edu.degree || 'Degree'}</h3>
                        <div class="school">${edu.school || 'Institution'}</div>
                        <div class="year">${edu.year || 'Year'}</div>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Projects Section -->
            ${data.projects && data.projects.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Projects</h2>
                <div class="projects-grid">
                    ${data.projects.map(project => `
                        <div class="project-card">
                            <h3 class="project-name">${project.name || 'Project Name'}</h3>
                            <p class="project-description">${project.description || 'Project description'}</p>
                            ${project.technologies && project.technologies.length > 0 ? `
                                <div class="project-tech">
                                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}
        </main>
    </div>
</body>
</html>`;
}

function generateMinimalTemplate(data: ParsedResumeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            font-weight: 300;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        /* Header Section */
        .header {
            padding: 4rem 0;
            text-align: center;
            border-bottom: 1px solid #eee;
            margin-bottom: 3rem;
        }
        
        .name {
            font-size: 3rem;
            font-weight: 300;
            margin-bottom: 0.5rem;
            color: #2c3e50;
            letter-spacing: -0.02em;
        }
        
        .title {
            font-size: 1.2rem;
            color: #7f8c8d;
            margin-bottom: 2rem;
            font-weight: 300;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
            font-size: 0.9rem;
            color: #7f8c8d;
        }
        
        .contact-item {
            text-decoration: none;
            color: inherit;
            transition: color 0.3s ease;
        }
        
        .contact-item:hover {
            color: #2c3e50;
        }
        
        /* Main Content */
        .content {
            padding-bottom: 4rem;
        }
        
        .section {
            margin-bottom: 3rem;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 400;
            margin-bottom: 2rem;
            color: #2c3e50;
            position: relative;
            padding-bottom: 0.5rem;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 30px;
            height: 1px;
            background: #bdc3c7;
        }
        
        /* About Section */
        .about {
            font-size: 1rem;
            line-height: 1.8;
            color: #555;
            text-align: left;
        }
        
        /* Experience Section */
        .experience-item {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .experience-item:last-child {
            border-bottom: none;
        }
        
        .job-title {
            font-size: 1.1rem;
            font-weight: 400;
            color: #2c3e50;
            margin-bottom: 0.25rem;
        }
        
        .company {
            font-size: 1rem;
            color: #7f8c8d;
            margin-bottom: 0.25rem;
        }
        
        .duration {
            color: #95a5a6;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .job-description {
            color: #555;
            line-height: 1.6;
            font-size: 0.95rem;
        }
        
        /* Skills Section */
        .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .skill {
            color: #7f8c8d;
            font-size: 0.9rem;
            position: relative;
        }
        
        .skill::after {
            content: '•';
            margin-left: 1rem;
            color: #bdc3c7;
        }
        
        .skill:last-child::after {
            display: none;
        }
        
        /* Education Section */
        .education-item {
            margin-bottom: 1.5rem;
        }
        
        .degree {
            font-size: 1.1rem;
            font-weight: 400;
            color: #2c3e50;
            margin-bottom: 0.25rem;
        }
        
        .school {
            color: #7f8c8d;
            margin-bottom: 0.25rem;
        }
        
        .year {
            color: #95a5a6;
            font-size: 0.9rem;
        }
        
        /* Projects Section */
        .project-item {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .project-item:last-child {
            border-bottom: none;
        }
        
        .project-name {
            font-size: 1.1rem;
            font-weight: 400;
            color: #2c3e50;
            margin-bottom: 0.5rem;
        }
        
        .project-description {
            color: #555;
            margin-bottom: 1rem;
            line-height: 1.6;
            font-size: 0.95rem;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .tech-tag {
            color: #7f8c8d;
            font-size: 0.85rem;
            position: relative;
        }
        
        .tech-tag::after {
            content: '•';
            margin-left: 1rem;
            color: #bdc3c7;
        }
        
        .tech-tag:last-child::after {
            display: none;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                padding: 0 1rem;
            }
            
            .name {
                font-size: 2.5rem;
            }
            
            .title {
                font-size: 1.1rem;
            }
            
            .header {
                padding: 3rem 0;
            }
            
            .contact-info {
                gap: 1rem;
                flex-direction: column;
                align-items: center;
            }
            
            .skills-container,
            .project-tech {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .skill::after,
            .tech-tag::after {
                display: none;
            }
        }
        
        @media (max-width: 480px) {
            .name {
                font-size: 2rem;
            }
            
            .section-title {
                font-size: 1.3rem;
            }
            
            .header {
                padding: 2rem 0;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white;
            }
            
            .container {
                max-width: none;
                padding: 0;
            }
            
            .header {
                padding: 2rem 0;
            }
            
            .section {
                page-break-inside: avoid;
                margin-bottom: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <header class="header">
            <h1 class="name">${data.name || 'Your Name'}</h1>
            <p class="title">${data.headline || data.summary || 'Professional'}</p>
            <div class="contact-info">
                ${data.contact?.email ? `<a href="mailto:${data.contact.email}" class="contact-item">${data.contact.email}</a>` : ''}
                ${data.contact?.phone ? `<span class="contact-item">${data.contact.phone}</span>` : ''}
                ${data.contact?.location ? `<span class="contact-item">${data.contact.location}</span>` : ''}
                ${data.contact?.linkedin ? `<a href="${data.contact.linkedin}" class="contact-item">LinkedIn</a>` : ''}
            </div>
        </header>

        <!-- Main Content -->
        <main class="content">
            <!-- About Section -->
            ${data.bioGenerated || data.summary ? `
            <section class="section">
                <h2 class="section-title">About</h2>
                <div class="about">
                    ${data.bioGenerated || data.summary || 'Professional dedicated to excellence and continuous improvement.'}
                </div>
            </section>
            ` : ''}

            <!-- Experience Section -->
            ${data.experience && data.experience.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Experience</h2>
                ${data.experience.map(exp => `
                    <div class="experience-item">
                        <h3 class="job-title">${exp.title || 'Position Title'}</h3>
                        <div class="company">${exp.company || 'Company Name'}</div>
                        <div class="duration">${exp.duration || 'Duration'}</div>
                        ${exp.description ? `<div class="job-description">${exp.description}</div>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Skills Section -->
            ${data.skills && data.skills.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Skills</h2>
                <div class="skills-container">
                    ${data.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Education</h2>
                ${data.education.map(edu => `
                    <div class="education-item">
                        <h3 class="degree">${edu.degree || 'Degree'}</h3>
                        <div class="school">${edu.school || 'Institution'}</div>
                        <div class="year">${edu.year || 'Year'}</div>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            <!-- Projects Section -->
            ${data.projects && data.projects.length > 0 ? `
            <section class="section">
                <h2 class="section-title">Projects</h2>
                ${data.projects.map(project => `
                    <div class="project-item">
                        <h3 class="project-name">${project.name || 'Project Name'}</h3>
                        <p class="project-description">${project.description || 'Project description'}</p>
                        ${project.technologies && project.technologies.length > 0 ? `
                            <div class="project-tech">
                                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}
        </main>
    </div>
</body>
</html>`;
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

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      if (!resumeText || !templateId) {
        return res.status(400).json({ error: 'Resume text and template ID are required' });
      }

      console.log(`Generating portfolio for user ${userId} with template ${templateId}`);

      // Generate portfolio content using predefined templates
      const generatedContent = generatePortfolioTemplate(templateId, templateStyle || 'modern', parsedData);
      
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