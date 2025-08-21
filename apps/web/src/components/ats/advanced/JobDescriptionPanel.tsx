'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Briefcase, Link, FileText, Globe, Target, Users } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { URLExtractor } from './URLExtractor';
import { TextEditor } from './TextEditor';

interface JobDescription {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  content: string;
  source: 'manual' | 'file' | 'url';
  url?: string;
  extractedAt: Date;
}

interface JobDescriptionPanelProps {
  onDataChange: (data: JobDescription | null) => void;
  isAnalyzing: boolean;
  currentData: JobDescription | null;
}

export const JobDescriptionPanel: React.FC<JobDescriptionPanelProps> = ({
  onDataChange,
  isAnalyzing,
  currentData
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'url' | 'upload'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobPortalInfo, setJobPortalInfo] = useState<{ platform: string; detected: boolean } | null>(null);

  // Process job description content
  const processJobContent = useCallback((content: string, source: 'manual' | 'file' | 'url', url?: string): JobDescription => {
    const processedData = extractJobDescriptionFields(content);
    
    return {
      ...processedData,
      content,
      source,
      url,
      extractedAt: new Date()
    };
  }, []);

  // Extract structured data from job description text
  const extractJobDescriptionFields = (content: string): Omit<JobDescription, 'content' | 'source' | 'url' | 'extractedAt'> => {
    const text = content.toLowerCase();
    
    // Extract title (look for common patterns)
    let title = 'Not specified';
    const titlePatterns = [
      /(?:job title|position|role):\s*([^\n]+)/i,
      /^([^\n]+?)(?:\s*-\s*[^\n]*)?$/m
    ];
    
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }

    // Extract company (look for common patterns)
    let company = 'Not specified';
    const companyPatterns = [
      /(?:company|organization|employer):\s*([^\n]+)/i,
      /at\s+([A-Z][^\n,]+?)(?:\s*,|\s*$)/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        company = match[1].trim();
        break;
      }
    }

    // Extract requirements
    const requirements = extractListItems(content, [
      /(?:requirements|required qualifications|must have|essential)[\s\S]*?(?=(?:responsibilities|qualifications|preferred|benefits|about|$))/i
    ]);

    // Extract responsibilities
    const responsibilities = extractListItems(content, [
      /(?:responsibilities|duties|you will|role involves|key tasks)[\s\S]*?(?=(?:requirements|qualifications|benefits|about|$))/i
    ]);

    // Extract qualifications
    const qualifications = extractListItems(content, [
      /(?:qualifications|preferred|nice to have|bonus|plus)[\s\S]*?(?=(?:requirements|responsibilities|benefits|about|$))/i
    ]);

    // Extract keywords
    const keywords = extractKeywords(content);

    // Determine experience level
    const experience_level = determineExperienceLevel(content);

    return {
      title,
      company,
      requirements,
      responsibilities,
      qualifications,
      keywords,
      experience_level
    };
  };

  // Extract list items from text sections
  const extractListItems = (content: string, patterns: RegExp[]): string[] => {
    const items: string[] = [];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const section = match[0];
        
        // Extract bullet points and numbered lists
        const bulletPatterns = [
          /[•·▪▫–-]\s*([^\n]+)/g,
          /\d+\.\s*([^\n]+)/g,
          /^\s*[-*]\s*([^\n]+)/gm
        ];
        
        for (const bulletPattern of bulletPatterns) {
          let bulletMatch;
          while ((bulletMatch = bulletPattern.exec(section)) !== null) {
            const item = bulletMatch[1].trim();
            if (item.length > 10 && !items.includes(item)) {
              items.push(item);
            }
          }
        }
        
        // If no bullets found, split by sentences
        if (items.length === 0) {
          const sentences = section.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
          items.push(...sentences.slice(0, 5));
        }
        
        break;
      }
    }
    
    return items.slice(0, 10); // Limit to 10 items
  };

  // Extract keywords from job description
  const extractKeywords = (content: string): string[] => {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'shall', 'can', 'a', 'an', 'as', 'if', 'then', 'than', 'so', 'such',
      'experience', 'work', 'working', 'team', 'company', 'role', 'position',
      'job', 'candidate', 'successful', 'ability', 'strong', 'excellent'
    ]);

    // Extract technical terms and skills
    const technicalPatterns = [
      /\b[A-Z][a-z]*(?:\.[a-z]+)*\b/g, // Technologies like React.js, Node.js
      /\b\w+(?:\+\+|#)\b/g, // Languages like C++, C#
      /\b[A-Z]{2,}\b/g, // Acronyms like AWS, API, SQL
    ];

    const keywords = new Set<string>();
    
    // Extract using patterns
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 1 && !commonWords.has(match.toLowerCase())) {
          keywords.add(match);
        }
      });
    });

    // Extract common tech skills
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node.js', 'express', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure',
      'docker', 'kubernetes', 'git', 'jenkins', 'terraform', 'ansible',
      'microservices', 'rest', 'api', 'graphql', 'nosql', 'sql', 'html',
      'css', 'sass', 'bootstrap', 'tailwind', 'webpack', 'babel', 'npm',
      'yarn', 'redux', 'mobx', 'spring', 'django', 'flask', 'rails'
    ];

    const contentLower = content.toLowerCase();
    skillKeywords.forEach(skill => {
      if (contentLower.includes(skill)) {
        keywords.add(skill);
      }
    });

    return Array.from(keywords).slice(0, 30); // Limit to 30 keywords
  };

  // Determine experience level from job description
  const determineExperienceLevel = (content: string): 'entry' | 'mid' | 'senior' | 'executive' => {
    const text = content.toLowerCase();
    
    if (text.includes('ceo') || text.includes('cto') || text.includes('vp') || 
        text.includes('director') || text.includes('head of')) {
      return 'executive';
    }
    
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') ||
        text.includes('architect') || /\b\d+\+?\s*years?\s*experience/.test(text)) {
      const yearsMatch = text.match(/(\d+)\+?\s*years?\s*experience/);
      if (yearsMatch) {
        const years = parseInt(yearsMatch[1]);
        if (years >= 7) return 'senior';
        if (years >= 3) return 'mid';
      }
      return 'senior';
    }
    
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate') ||
        text.includes('intern') || text.includes('new grad')) {
      return 'entry';
    }
    
    return 'mid';
  };

  // Supported job portals
  const jobPortals = [
    { name: 'LinkedIn Jobs', pattern: /linkedin\.com\/jobs/i, icon: '💼' },
    { name: 'Indeed', pattern: /indeed\.com/i, icon: '🔍' },
    { name: 'Glassdoor', pattern: /glassdoor\.com/i, icon: '🏢' },
    { name: 'Monster', pattern: /monster\.com/i, icon: '👹' },
    { name: 'ZipRecruiter', pattern: /ziprecruiter\.com/i, icon: '📮' },
    { name: 'Dice', pattern: /dice\.com/i, icon: '🎲' },
    { name: 'Stack Overflow Jobs', pattern: /stackoverflow\.com\/jobs/i, icon: '📚' },
    { name: 'AngelList', pattern: /angel\.co|wellfound\.com/i, icon: '😇' },
    { name: 'Remote.co', pattern: /remote\.co/i, icon: '🏠' },
    { name: 'FlexJobs', pattern: /flexjobs\.com/i, icon: '⚡' }
  ];

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/upload/extract-text`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to extract text from file');
      }

      const result = await response.json();
      const jobData = processJobContent(result.text, 'file');
      onDataChange(jobData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
      onDataChange(null);
    } finally {
      setIsProcessing(false);
    }
  }, [processJobContent, onDataChange]);

  // Handle URL extraction
  const handleURLExtraction = useCallback(async (url: string) => {
    setIsProcessing(true);
    setError(null);

    // Detect job portal
    const portal = jobPortals.find(p => p.pattern.test(url));
    setJobPortalInfo(portal ? { platform: portal.name, detected: true } : { platform: 'Unknown', detected: false });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/ats/scrape-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to extract job description from URL');
      }

      const result = await response.json();
      const jobData = processJobContent(result.content, 'url', url);
      onDataChange(jobData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while extracting job description from URL');
      onDataChange(null);
    } finally {
      setIsProcessing(false);
    }
  }, [processJobContent, onDataChange, jobPortals]);

  // Handle manual input
  const handleManualInput = useCallback((content: string) => {
    if (content.trim()) {
      const jobData = processJobContent(content, 'manual');
      onDataChange(jobData);
    } else {
      onDataChange(null);
    }
  }, [processJobContent, onDataChange]);

  // Clear current data
  const handleClear = useCallback(() => {
    onDataChange(null);
    setError(null);
    setJobPortalInfo(null);
  }, [onDataChange]);

  return (
    <div className="job-description-panel bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Job Description
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter job details, upload a file, or paste a job posting URL
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'manual'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Manual Input
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'url'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Job Portal URL
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'upload'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-2" />
          File Upload
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Job Portal Info */}
        {jobPortalInfo && (
          <div className={`mb-6 border rounded-lg p-4 ${
            jobPortalInfo.detected 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <p className={`text-sm ${
              jobPortalInfo.detected 
                ? 'text-green-700 dark:text-green-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {jobPortalInfo.detected ? '✅' : '⚠️'} 
              {jobPortalInfo.detected 
                ? ` Detected ${jobPortalInfo.platform} job posting`
                : ` Platform not recognized - basic extraction will be attempted`
              }
            </p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'manual' && (
          <TextEditor
            onTextChange={handleManualInput}
            isProcessing={isProcessing}
            placeholder="Paste the job description here..."
            initialValue={currentData?.source === 'manual' ? currentData.content : ''}
          />
        )}

        {activeTab === 'url' && (
          <div className="space-y-6">
            <URLExtractor
              onURLSubmit={handleURLExtraction}
              isProcessing={isProcessing}
            />
            
            {/* Supported Job Portals */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Supported Job Portals
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {jobPortals.slice(0, 8).map((portal, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{portal.icon}</span>
                    <span>{portal.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <FileUploader
            onFileSelect={handleFileUpload}
            isProcessing={isProcessing}
            acceptedTypes=".pdf,.doc,.docx,.txt"
            maxSize={10 * 1024 * 1024}
          />
        )}

        {/* Current Data Summary */}
        {currentData && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Job Description Analyzed
              </h3>
              <button
                onClick={handleClear}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Clear
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Position:</span>
                <span className="ml-2">{currentData.title}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Company:</span>
                <span className="ml-2">{currentData.company}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Level:</span>
                <span className="ml-2 capitalize">{currentData.experience_level}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Keywords:</span>
                <span className="ml-2">{currentData.keywords.length}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Requirements:</span>
                <span className="ml-2">{currentData.requirements.length}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Source:</span>
                <span className="ml-2 capitalize">{currentData.source}</span>
              </div>
            </div>

            {/* Preview key requirements */}
            {currentData.requirements.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Key Requirements Preview:
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  {currentData.requirements.slice(0, 3).map((req, index) => (
                    <li key={index} className="truncate">• {req}</li>
                  ))}
                  {currentData.requirements.length > 3 && (
                    <li className="text-blue-600 dark:text-blue-400">
                      +{currentData.requirements.length - 3} more requirements...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDescriptionPanel;
