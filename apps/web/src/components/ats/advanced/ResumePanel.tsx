'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Link, Trash2, Eye, Download } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { URLExtractor } from './URLExtractor';
import { TextEditor } from './TextEditor';

interface ResumeData {
  content: string;
  wordCount: number;
  characterCount: number;
  sections: ResumeSection[];
  source: 'manual' | 'file' | 'url';
  filename?: string;
  extractedAt: Date;
}

interface ResumeSection {
  type: 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'summary';
  content: string;
  keywords: string[];
  startIndex: number;
  endIndex: number;
}

interface ResumePanelProps {
  onDataChange: (data: ResumeData | null) => void;
  isAnalyzing: boolean;
  currentData: ResumeData | null;
}

export const ResumePanel: React.FC<ResumePanelProps> = ({
  onDataChange,
  isAnalyzing,
  currentData
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'manual'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process text content and extract sections
  const processTextContent = useCallback((content: string, source: 'manual' | 'file' | 'url', filename?: string): ResumeData => {
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;
    
    // Extract sections using patterns
    const sections = extractSections(content);
    
    return {
      content,
      wordCount,
      characterCount,
      sections,
      source,
      filename,
      extractedAt: new Date()
    };
  }, []);

  // Extract resume sections using regex patterns
  const extractSections = (content: string): ResumeSection[] => {
    const sections: ResumeSection[] = [];
    const text = content.toLowerCase();
    
    // Define section patterns
    const sectionPatterns = [
      {
        type: 'personal' as const,
        patterns: [
          /(?:personal\s+information|contact\s+details?|personal\s+details?)[\s\S]*?(?=(?:objective|summary|experience|education|skills|projects)|$)/i,
          /^[\s\S]*?(?=(?:objective|summary|experience|education|skills|projects))/i
        ]
      },
      {
        type: 'summary' as const,
        patterns: [
          /(?:professional\s+summary|career\s+summary|summary|objective|profile)[\s\S]*?(?=(?:experience|education|skills|projects)|$)/i
        ]
      },
      {
        type: 'experience' as const,
        patterns: [
          /(?:professional\s+experience|work\s+experience|employment\s+history|experience)[\s\S]*?(?=(?:education|skills|projects|certifications)|$)/i
        ]
      },
      {
        type: 'education' as const,
        patterns: [
          /(?:education|academic\s+background|qualifications)[\s\S]*?(?=(?:skills|projects|certifications|achievements)|$)/i
        ]
      },
      {
        type: 'skills' as const,
        patterns: [
          /(?:technical\s+skills|core\s+competencies|skills|technologies|expertise)[\s\S]*?(?=(?:projects|certifications|achievements)|$)/i
        ]
      },
      {
        type: 'projects' as const,
        patterns: [
          /(?:projects|portfolio|key\s+projects|notable\s+projects)[\s\S]*?(?=(?:certifications|achievements|references)|$)/i
        ]
      }
    ];

    // Extract each section
    sectionPatterns.forEach(({ type, patterns }) => {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const sectionContent = match[0].trim();
          const startIndex = match.index || 0;
          const endIndex = startIndex + sectionContent.length;
          
          // Extract keywords from section
          const keywords = extractKeywords(sectionContent);
          
          sections.push({
            type,
            content: sectionContent,
            keywords,
            startIndex,
            endIndex
          });
          break;
        }
      }
    });

    return sections;
  };

  // Extract keywords from text
  const extractKeywords = (text: string): string[] => {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'shall', 'can', 'a', 'an', 'as', 'if', 'then', 'than', 'so', 'such'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 50); // Limit to top 50 keywords
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please upload PDF, DOC, DOCX, or TXT files.');
      }

      setProcessingProgress(25);

      // Extract text from file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/upload/extract-text`, {
        method: 'POST',
        body: formData
      });

      setProcessingProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to extract text from file');
      }

      const result = await response.json();
      setProcessingProgress(100);

      // Process the extracted text
      const resumeData = processTextContent(result.text, 'file', file.name);
      onDataChange(resumeData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
      onDataChange(null);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [processTextContent, onDataChange]);

  // Handle URL extraction
  const handleURLExtraction = useCallback(async (url: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/ats/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to extract content from URL');
      }

      const result = await response.json();
      const resumeData = processTextContent(result.content, 'url');
      onDataChange(resumeData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while extracting content from URL');
      onDataChange(null);
    } finally {
      setIsProcessing(false);
    }
  }, [processTextContent, onDataChange]);

  // Handle manual text input
  const handleManualInput = useCallback((content: string) => {
    if (content.trim()) {
      const resumeData = processTextContent(content, 'manual');
      onDataChange(resumeData);
    } else {
      onDataChange(null);
    }
  }, [processTextContent, onDataChange]);

  // Clear current data
  const handleClear = useCallback(() => {
    onDataChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onDataChange]);

  return (
    <div className="resume-panel bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Resume Input
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your resume, paste a URL, or enter text manually
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'upload'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          File Upload
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'url'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link className="w-4 h-4 inline mr-2" />
          URL Extract
        </button>
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
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Processing Progress */}
        {isProcessing && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Processing...
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {processingProgress}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <FileUploader
            onFileSelect={handleFileUpload}
            isProcessing={isProcessing}
            acceptedTypes=".pdf,.doc,.docx,.txt"
            maxSize={10 * 1024 * 1024}
          />
        )}

        {activeTab === 'url' && (
          <URLExtractor
            onURLSubmit={handleURLExtraction}
            isProcessing={isProcessing}
          />
        )}

        {activeTab === 'manual' && (
          <TextEditor
            onTextChange={handleManualInput}
            isProcessing={isProcessing}
            placeholder="Paste your resume content here..."
            initialValue={currentData?.source === 'manual' ? currentData.content : ''}
          />
        )}

        {/* Current Data Summary */}
        {currentData && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                Resume Loaded Successfully
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Clear resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 dark:text-green-300">Source:</span>
                <span className="ml-2 capitalize">{currentData.source}</span>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300">Words:</span>
                <span className="ml-2">{currentData.wordCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300">Characters:</span>
                <span className="ml-2">{currentData.characterCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300">Sections:</span>
                <span className="ml-2">{currentData.sections.length}</span>
              </div>
              {currentData.filename && (
                <div className="col-span-2">
                  <span className="text-green-700 dark:text-green-300">File:</span>
                  <span className="ml-2 truncate">{currentData.filename}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePanel;
