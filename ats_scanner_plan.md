ATS Scanner Development Project - Complete Cursor AI Implementation Guide
Project Overview
Develop a comprehensive ATS (Applicant Tracking System) scanner for the Climbly.ai platform using Next.js, Node.js, TypeScript, and Gemini AI. This tool will analyze resumes against job descriptions and provide detailed scoring and recommendations.
Tech Stack

Frontend: Next.js 14+ with TypeScript
Backend: Node.js with Express.js
Database: Neon PostgreSQL
File Storage: Amazon S3
AI: Google Gemini API
Styling: Tailwind CSS
File Processing: PDF-parse, Mammoth (for DOCX), Cheerio (for web scraping)


Phase 1: Project Setup & Navigation Integration
1.1 Navigation Menu Update
typescript// Update your main navigation component to include ATS Scanner
// Location: components/Navigation.tsx or similar

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'ATS Scanner', href: '/ats-scanner', icon: ScanIcon }, // Add this
  { name: 'Portfolio', href: '/portfolio', icon: PortfolioIcon },
  // ... other items
];
1.2 Create ATS Scanner Route Structure
bash# Create directory structure
pages/
├── ats-scanner/
│   ├── index.tsx                 # Main scanner interface
│   ├── scan/
│   │   └── [id].tsx             # Individual scan results page
└── api/
    ├── ats/
    │   ├── upload-resume.ts      # Handle resume uploads
    │   ├── process-url.ts        # Handle URL scraping
    │   ├── analyze.ts            # Main analysis endpoint
    │   └── save-scan.ts          # Save scan results

Phase 2: Database Schema Implementation
2.1 Create Database Tables
sql-- Execute these SQL commands in your Neon database

-- ATS Scans table
CREATE TABLE ats_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    resume_text TEXT NOT NULL,
    resume_filename VARCHAR(255),
    job_description TEXT NOT NULL,
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    overall_score INTEGER,
    match_rate INTEGER,
    searchability_score INTEGER,
    ats_compatibility_score INTEGER,
    detailed_analysis JSONB,
    missing_keywords TEXT[],
    found_keywords TEXT[],
    recruiter_tips JSONB,
    improvement_suggestions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved Resumes table
CREATE TABLE saved_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    resume_name VARCHAR(255),
    resume_text TEXT,
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences for ATS scanner
CREATE TABLE ats_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    auto_save_resumes BOOLEAN DEFAULT false,
    default_industry VARCHAR(100),
    notification_settings JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

Phase 3: Backend API Development
3.1 Resume Upload & Processing API
typescript// pages/api/ats/upload-resume.ts

import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { uploadToS3 } from '../../../lib/s3';

interface ResumeProcessResult {
  success: boolean;
  text?: string;
  filename?: string;
  fileUrl?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResumeProcessResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => {
        return (
          mimetype === 'application/pdf' ||
          mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimetype === 'application/msword' ||
          mimetype === 'text/plain'
        );
      }
    });

    const [fields, files] = await form.parse(req);
    const file = files.resume?.[0];

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    let extractedText = '';
    
    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.filepath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else if (file.mimetype?.includes('wordprocessingml') || file.mimetype === 'application/msword') {
      const result = await mammoth.extractRawText({ path: file.filepath });
      extractedText = result.value;
    } else if (file.mimetype === 'text/plain') {
      extractedText = fs.readFileSync(file.filepath, 'utf8');
    }

    // Upload to S3
    const fileBuffer = fs.readFileSync(file.filepath);
    const s3Url = await uploadToS3(fileBuffer, file.originalFilename || 'resume', file.mimetype);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      text: extractedText,
      filename: file.originalFilename,
      fileUrl: s3Url
    });

  } catch (error) {
    console.error('Resume processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process resume' 
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
3.2 URL Scraping API
typescript// pages/api/ats/process-url.ts

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pdf from 'pdf-parse';

interface UrlProcessResult {
  success: boolean;
  content?: string;
  title?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UrlProcessResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url, type } = req.body; // type: 'resume' | 'job'

  try {
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      const fileId = extractGoogleDriveFileId(url);
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      const data = await pdf(response.data);
      
      return res.status(200).json({
        success: true,
        content: data.text,
        title: 'Google Drive Document'
      });
    }

    // Handle regular web pages (job descriptions)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    let content = '';
    let title = $('title').text();

    // LinkedIn job scraping
    if (url.includes('linkedin.com/jobs')) {
      content = $('.description__text').text() || $('.show-more-less-html__markup').text();
      title = $('.top-card-layout__title').text() || $('h1').first().text();
    }
    // Indeed job scraping
    else if (url.includes('indeed.com')) {
      content = $('#jobDescriptionText').text() || $('.jobsearch-jobDescriptionText').text();
      title = $('h1[data-jk]').text() || $('.jobsearch-JobInfoHeader-title').text();
    }
    // Generic job page scraping
    else {
      // Remove script and style elements
      $('script, style').remove();
      
      // Try to find job description content
      const jobSelectors = [
        '[class*="job-description"]',
        '[class*="description"]',
        '[id*="job-description"]',
        '[id*="description"]',
        'main',
        '.content'
      ];
      
      for (const selector of jobSelectors) {
        const element = $(selector);
        if (element.length && element.text().length > 100) {
          content = element.text();
          break;
        }
      }
      
      if (!content) {
        content = $('body').text();
      }
    }

    // Clean up the extracted text
    content = content.replace(/\s+/g, ' ').trim();

    res.status(200).json({
      success: true,
      content,
      title: title.trim()
    });

  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process URL' 
    });
  }
}

function extractGoogleDriveFileId(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}
3.3 Main Analysis API with Gemini AI
typescript// pages/api/ats/analyze.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../lib/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface AnalysisResult {
  id: string;
  overallScore: number;
  matchRate: number;
  searchability: number;
  atsCompatibility: number;
  detailedAnalysis: {
    contactInformation: { score: number; status: string; feedback: string };
    professionalSummary: { score: number; status: string; feedback: string };
    technicalSkills: { score: number; status: string; feedback: string };
    qualifiedAchievements: { score: number; status: string; feedback: string };
    educationCertifications: { score: number; status: string; feedback: string };
    atsFormat: { score: number; status: string; feedback: string };
  };
  hardSkills: {
    found: string[];
    missing: string[];
    matchPercentage: number;
  };
  recruiterTips: Array<{
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  keywordOptimization: {
    score: number;
    totalKeywords: number;
    foundKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  };
  competitiveAnalysis: {
    score: number;
    comparison: Array<{
      metric: string;
      userScore: number;
      marketAverage: number;
    }>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resumeText, jobDescription, userId, saveResume, resumeName } = req.body;

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

    // Structure the response
    const analysisResult: AnalysisResult = {
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

    // Save to database
    await db.query(`
      INSERT INTO ats_scans (
        id, user_id, resume_text, job_description, overall_score, 
        match_rate, searchability_score, ats_compatibility_score,
        detailed_analysis, found_keywords, missing_keywords, 
        recruiter_tips, improvement_suggestions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      scanId, userId, resumeText, jobDescription, 
      analysisResult.overallScore, analysisResult.matchRate,
      analysisResult.searchability, analysisResult.atsCompatibility,
      JSON.stringify(analysisResult.detailedAnalysis),
      analysisResult.hardSkills.found,
      analysisResult.hardSkills.missing,
      JSON.stringify(analysisResult.recruiterTips),
      JSON.stringify(analysisResult.keywordOptimization.suggestions)
    ]);

    // Save resume if requested
    if (saveResume && resumeName) {
      await db.query(`
        INSERT INTO saved_resumes (user_id, resume_name, resume_text)
        VALUES ($1, $2, $3)
      `, [userId, resumeName, resumeText]);
    }

    res.status(200).json(analysisResult);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
}

Phase 4: Frontend Components
4.1 Main ATS Scanner Interface
typescript// pages/ats-scanner/index.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Upload, Link, Zap, Search, AlertCircle } from 'lucide-react';

interface ResumeData {
  text: string;
  filename?: string;
  source: 'text' | 'file' | 'url';
}

interface JobData {
  text: string;
  title?: string;
  source: 'text' | 'file' | 'url';
}

const ATSScanner: React.FC = () => {
  const router = useRouter();
  const [resumeData, setResumeData] = useState<ResumeData>({ text: '', source: 'text' });
  const [jobData, setJobData] = useState<JobData>({ text: '', source: 'text' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveResume, setSaveResume] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [errors, setErrors] = useState<{ resume?: string; job?: string }>({});

  const handleFileUpload = async (file: File, type: 'resume' | 'job') => {
    const formData = new FormData();
    formData.append(type, file);

    try {
      const response = await fetch('/api/ats/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        if (type === 'resume') {
          setResumeData({
            text: result.text,
            filename: result.filename,
            source: 'file'
          });
        } else {
          setJobData({
            text: result.text,
            title: result.filename,
            source: 'file'
          });
        }
      } else {
        setErrors(prev => ({ ...prev, [type]: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [type]: 'Upload failed' }));
    }
  };

  const handleUrlProcess = async (url: string, type: 'resume' | 'job') => {
    try {
      const response = await fetch('/api/ats/process-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (type === 'resume') {
          setResumeData({
            text: result.content,
            filename: result.title,
            source: 'url'
          });
        } else {
          setJobData({
            text: result.content,
            title: result.title,
            source: 'url'
          });
        }
      } else {
        setErrors(prev => ({ ...prev, [type]: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [type]: 'URL processing failed' }));
    }
  };

  const handleScan = async () => {
    if (!resumeData.text.trim() || !jobData.text.trim()) {
      setErrors({
        resume: !resumeData.text.trim() ? 'Resume is required' : undefined,
        job: !jobData.text.trim() ? 'Job description is required' : undefined,
      });
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      const response = await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeData.text,
          jobDescription: jobData.text,
          userId: 'user-id', // Get from auth context
          saveResume,
          resumeName: saveResume ? resumeName : undefined,
        }),
      });

      const result = await response.json();
      
      if (result.id) {
        router.push(`/ats-scanner/scan/${result.id}`);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      setErrors({ resume: 'Analysis failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ATS Scanner</h1>
          <p className="text-lg text-gray-600">
            Optimize your resume to get past Applicant Tracking Systems
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resume Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Resume</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm">
                📋 Saved Resumes
              </button>
            </div>

            {/* Resume Text Area */}
            <div className="mb-4">
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste resume text..."
                value={resumeData.text}
                onChange={(e) => setResumeData(prev => ({ ...prev, text: e.target.value, source: 'text' }))}
              />
              {errors.resume && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.resume}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700">Upload a file</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'resume');
                      }}
                    />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT files only
                </p>
              </div>
            </div>

            {/* URL Input */}
            <div className="mb-6">
              <div className="flex">
                <input
                  type="url"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Google Drive or cloud storage URL"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value;
                      if (url) handleUrlProcess(url, 'resume');
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                    if (input?.value) handleUrlProcess(input.value, 'resume');
                  }}
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Save Resume Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="saveResume"
                className="w-4 h-4 text-blue-600"
                checked={saveResume}
                onChange={(e) => setSaveResume(e.target.checked)}
              />
              <label htmlFor="saveResume" className="text-sm text-gray-700">
                Save resume
              </label>
              {saveResume && (
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Resume name"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Job Description Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>

            {/* Job Description Text Area */}
            <div className="mb-4">
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Copy and paste job description here"
                value={jobData.text}
                onChange={(e) => setJobData(prev => ({ ...prev, text: e.target.value, source: 'text' }))}
              />
              {errors.job && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.job}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Tip: Include requirements, skills, and qualifications for better analysis
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700">Upload a file</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'job');
                      }}
                    />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT files only
                </p>
              </div>
            </div>

            {/* URL Input */}
            <div className="mb-6">
              <div className="flex">
                <input
                  type="url"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter job posting URL (LinkedIn, Indeed, etc.)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value;
                      if (url) handleUrlProcess(url, 'job');
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-RetryClaude does not have the ability to run the code it generates yet.AContinueEdittypescript                 className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                 onClick={() => {
                   const input = document.querySelector('input[type="url"]:last-of-type') as HTMLInputElement;
                   if (input?.value) handleUrlProcess(input.value, 'job');
                 }}
               >
                 <Link className="w-4 h-4" />
               </button>
             </div>
           </div>
         </div>
       </div>

       {/* Action Buttons */}
       <div className="flex justify-center space-x-4 mt-8">
         <button
           className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
           onClick={() => {
             // Show "Coming Soon" modal
             alert('Power Edit feature coming soon!');
           }}
         >
           <Zap className="w-5 h-5" />
           <span>Power Edit</span>
         </button>
         
         <button
           className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
           onClick={handleScan}
           disabled={isProcessing}
         >
           <Search className="w-5 h-5" />
           <span>{isProcessing ? 'Scanning...' : 'Scan'}</span>
         </button>
       </div>

       {/* Best Results Tips */}
       <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
         <div className="flex items-start space-x-3">
           <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
             <span className="text-white text-sm font-bold">i</span>
           </div>
           <div>
             <h3 className="text-lg font-medium text-blue-900 mb-2">For best results:</h3>
             <ul className="text-blue-800 space-y-1 text-sm">
               <li>• Upload your resume in PDF, DOC, or DOCX format</li>
               <li>• Include the complete job description you're applying for</li>
               <li>• Ensure your resume includes contact information and skills</li>
             </ul>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default ATSScanner;
4.2 Scan Results Page Component
typescript// pages/ats-scanner/scan/[id].tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Download, 
  Share2, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Users,
  Target,
  FileText,
  Lightbulb
} from 'lucide-react';

interface ScanResult {
  id: string;
  overallScore: number;
  matchRate: number;
  searchability: number;
  atsCompatibility: number;
  detailedAnalysis: any;
  hardSkills: any;
  recruiterTips: any[];
  keywordOptimization: any;
  competitiveAnalysis: any;
  createdAt: string;
}

const ScanResultsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchScanResults();
    }
  }, [id]);

  const fetchScanResults = async () => {
    try {
      const response = await fetch(`/api/ats/scan-results/${id}`);
      const data = await response.json();
      setScanData(data);
    } catch (error) {
      console.error('Failed to fetch scan results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'needs_improvement': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Scan results not found</p>
          <button 
            onClick={() => router.push('/ats-scanner')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/ats-scanner')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Scanner</span>
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">ATS Scan Report</h1>
                <p className="text-sm text-gray-500">Generated {new Date(scanData.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.matchRate)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.matchRate)}`}>
                {scanData.matchRate}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Match Rate</h3>
            <p className="text-sm text-gray-600">Based on keyword matching and format analysis</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.searchability)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.searchability)}`}>
                {scanData.searchability}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Searchability</h3>
            <p className="text-sm text-gray-600">How easily recruiters can find your profile</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.atsCompatibility)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.atsCompatibility)}`}>
                {scanData.atsCompatibility}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility</h3>
            <p className="text-sm text-gray-600">How well ATS systems can read your resume</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.overallScore)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.overallScore)}`}>
                {scanData.overallScore}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
            <p className="text-sm text-gray-600">Combined assessment of all factors</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Sections Analysis */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Resume Analysis</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(scanData.detailedAnalysis).map(([key, analysis]: [string, any]) => (
                  <div key={key} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200">
                    {getStatusIcon(analysis.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreBackground(analysis.score)} ${getScoreColor(analysis.score)}`}>
                          {analysis.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{analysis.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hard Skills Analysis */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Hard Skills</h2>
                <p className="text-sm text-gray-600">
                  Skills match: {scanData.hardSkills.matchPercentage}% ({scanData.hardSkills.found.length} found)
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Found Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scanData.hardSkills.found.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Missing Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scanData.hardSkills.missing.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Analysis */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Competitive Analysis</h2>
                <p className="text-sm text-gray-600">How you compare to other applicants: {scanData.competitiveAnalysis.score}%</p>
              </div>
              <div className="p-6 space-y-4">
                {scanData.competitiveAnalysis.comparison.map((metric: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{metric.metric}</span>
                      <span className="text-gray-600">{metric.userScore}% vs {metric.marketAverage}% avg</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(metric.userScore / 100) * 100}%` }}
                        ></div>
                      </div>
                      <div 
                        className="absolute top-0 h-2 w-0.5 bg-gray-500"
                        style={{ left: `${metric.marketAverage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tips and Optimization */}
          <div className="space-y-6">
            {/* Recruiter Tips */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Recruiter Tips
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {scanData.recruiterTips.map((tip: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                      tip.priority === 'high' ? 'bg-red-100 text-red-800' :
                      tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tip.priority} priority
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Optimization */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Keyword Optimization</h2>
                <p className="text-sm text-gray-600">Score: {scanData.keywordOptimization.score}%</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {scanData.keywordOptimization.missingKeywords.slice(0, 10).map((keyword: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Suggestions</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {scanData.keywordOptimization.suggestions.slice(0, 5).map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Resume Info */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Resume Info</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">File Name:</span>
                  <span className="font-medium">resume.pdf</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Word Count:</span>
                  <span className="font-medium">847 words</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Scan Date:</span>
                  <span className="font-medium">{new Date(scanData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultsPage;
4.3 Additional API Endpoint for Fetching Results
typescript// pages/api/ats/scan-results/[id].ts

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const result = await db.query(`
      SELECT 
        id,
        overall_score,
        match_rate,
        searchability_score,
        ats_compatibility_score,
        detailed_analysis,
        found_keywords,
        missing_keywords,
        recruiter_tips,
        improvement_suggestions,
        created_at
      FROM ats_scans 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const scanData = result.rows[0];

    // Transform data to match frontend interface
    const response = {
      id: scanData.id,
      overallScore: scanData.overall_score,
      matchRate: scanData.match_rate,
      searchability: scanData.searchability_score,
      atsCompatibility: scanData.ats_compatibility_score,
      detailedAnalysis: scanData.detailed_analysis,
      hardSkills: {
        found: scanData.found_keywords || [],
        missing: scanData.missing_keywords || [],
        matchPercentage: Math.round(
          (scanData.found_keywords?.length || 0) / 
          ((scanData.found_keywords?.length || 0) + (scanData.missing_keywords?.length || 0)) * 100
        )
      },
      recruiterTips: scanData.recruiter_tips || [],
      keywordOptimization: {
        score: scanData.match_rate,
        totalKeywords: (scanData.found_keywords?.length || 0) + (scanData.missing_keywords?.length || 0),
        foundKeywords: scanData.found_keywords || [],
        missingKeywords: scanData.missing_keywords || [],
        suggestions: scanData.improvement_suggestions || []
      },
      competitiveAnalysis: {
        score: Math.round((scanData.overall_score + scanData.match_rate) / 2),
        comparison: [
          { metric: 'Keyword Match Rate', userScore: scanData.match_rate, marketAverage: 75 },
          { metric: 'Skills Coverage', userScore: scanData.detailed_analysis?.technicalSkills?.score || 80, marketAverage: 80 },
          { metric: 'Experience Relevance', userScore: scanData.detailed_analysis?.qualifiedAchievements?.score || 78, marketAverage: 78 },
          { metric: 'ATS Readability', userScore: scanData.ats_compatibility_score, marketAverage: 85 }
        ]
      },
      createdAt: scanData.created_at
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching scan results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

Phase 5: Utility Functions and Configuration
5.1 S3 Upload Utility
typescript// lib/s3.ts

import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string
): Promise<string> => {
  const timestamp = Date.now();
  const key = `resumes/${timestamp}-${fileName}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'private',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};
5.2 Database Connection
typescript// lib/database.ts

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
5.3 Environment Variables
bash# .env.local

# Database
DATABASE_URL=your_neon_database_url

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

Phase 6: Testing and Quality Assurance
6.1 Test Cases to Implement
typescript// tests/ats-scanner.test.ts

describe('ATS Scanner', () => {
  test('should upload and process PDF resume', async () => {
    // Test PDF upload and text extraction
  });

  test('should scrape job description from URL', async () => {
    // Test URL processing for different job sites
  });

  test('should analyze resume with Gemini AI', async () => {
    // Test AI analysis functionality
  });

  test('should generate unique scan ID', async () => {
    // Test unique ID generation
  });

  test('should save scan results to database', async () => {
    // Test database operations
  });
});

Phase 7: Deployment and Final Steps
7.1 Deployment Checklist

 Set up environment variables in production
 Configure AWS S3 bucket permissions
 Set up Neon database in production
 Configure Gemini AI API access
 Test file upload limits
 Implement rate limiting
 Add error monitoring (Sentry)
 Set up analytics tracking

7.2 Performance Optimization

 Implement caching for common analyses
 Optimize database queries
 Add CDN for file uploads
 Implement lazy loading for results
 Add loading states and progress indicators

7.3 Security Considerations

 Validate file types and sizes
 Sanitize URL inputs
 Implement user authentication
 Add CSRF protection
 Secure API endpoints
 Encrypt sensitive data


Implementation Timeline
phase 1-2: Foundation

Set up database schema
Create basic API endpoints
Implement file upload functionality

phase 3-4: Core Features

Develop AI analysis system
Build main scanner interface
Implement URL scraping

phase 5-6: Results Page

Create detailed results component
Add visualization elements
Implement data persistence

phase 7-8: Polish & Testing

Add error handling
Implement responsive design
Perform thorough testing
Deploy to production


Success Metrics
Technical Metrics

Page load time < 3 seconds
File processing time < 30 seconds
99.9% uptime
Zero data loss

Business Metrics

User engagement rate > 70%
User satisfaction score > 4.5/5
Competitive advantage in market