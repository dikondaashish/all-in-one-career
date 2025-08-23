'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link, Zap, Search, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useToast } from '../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://all-in-one-career.onrender.com';

const ATSScanner: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData>({ text: '', source: 'text' });
  const [jobData, setJobData] = useState<JobData>({ text: '', source: 'text' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [saveResume, setSaveResume] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [errors, setErrors] = useState<{ resume?: string; job?: string }>({});

  const handleFileUpload = async (file: File, type: 'resume' | 'job') => {
    setIsUploading(true);
    setErrors(prev => ({ ...prev, [type]: undefined }));

    const formData = new FormData();
    formData.append('resume', file);

    try {
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('No user authentication available');
      }

      let response = await fetch(`${API_BASE_URL}/api/ats/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          response = await fetch(`${API_BASE_URL}/api/ats/upload-resume`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${freshToken}`,
            },
            body: formData,
          });
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }

      const result = await response.json().catch(() => ({} as any));
      
      if (!response.ok) {
        let msg = "Upload failed";
        if (result?.error === "pdf_no_extractable_text") {
          msg = "This PDF has no selectable text. Upload a text-based PDF or use DOCX/TXT. If it's scanned, try OCR.";
        } else if (result?.error === "pdf_parse_unsupported") {
          msg = "We couldn't read this PDF. Try exporting it again or upload DOCX.";
        } else if (result?.error === "unsupported_type") {
          msg = "Unsupported file type. Use PDF, DOC, DOCX, or TXT.";
        } else if (response.status === 413) {
          msg = "File too large. Max 10MB.";
        } else if (result?.error === "no_file_uploaded") {
          msg = "No file detected. Please choose a file and try again.";
        } else if (result?.error === "empty_file") {
          msg = "Empty file received. Please try again.";
        } else if (result?.error === "method_not_allowed") {
          msg = "Request method not allowed. Please try again.";
        } else if (result?.error === "server_pdf_parse_failed") {
          msg = "Server error processing file. Please try again or use a different format.";
        } else if (result?.error) {
          msg = result.error;
        }
        setErrors(prev => ({ ...prev, [type]: msg }));
        showToast({ 
          icon: '❌', 
          title: 'Upload Failed', 
          message: msg 
        });
        return;
      }

      // Success case
      if (type === 'resume') {
        setResumeData({
          text: result.text,
          filename: result.filename,
          source: 'file'
        });
        showToast({ 
          icon: '✅', 
          title: 'Success', 
          message: 'Resume uploaded successfully!' 
        });
      } else {
        setJobData({
          text: result.text,
          title: result.filename,
          source: 'file'
        });
        showToast({ 
          icon: '✅', 
          title: 'Success', 
          message: 'Job description uploaded successfully!' 
        });
      }
    } catch (error) {
      const errorMsg = 'Network error. Please check your connection and try again.';
      setErrors(prev => ({ ...prev, [type]: errorMsg }));
      showToast({ 
        icon: '❌', 
        title: 'Upload Failed', 
        message: errorMsg 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlProcess = async (url: string, type: 'resume' | 'job') => {
    if (!url.trim()) return;
    
    setIsUrlProcessing(true);
    setErrors(prev => ({ ...prev, [type]: undefined }));

    try {
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('No user authentication available');
      }

      let response = await fetch(`${API_BASE_URL}/api/ats/process-url`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ url, type }),
      });

      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          response = await fetch(`${API_BASE_URL}/api/ats/process-url`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${freshToken}`,
            },
            body: JSON.stringify({ url, type }),
          });
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }

      const result = await response.json();
      
      if (result.success) {
        if (type === 'resume') {
          setResumeData({
            text: result.content,
            filename: result.title,
            source: 'url'
          });
          showToast({ 
            icon: '✅', 
            title: 'Success', 
            message: 'Resume extracted from URL successfully!' 
          });
        } else {
          setJobData({
            text: result.content,
            title: result.title,
            source: 'url'
          });
          showToast({ 
            icon: '✅', 
            title: 'Success', 
            message: 'Job description extracted from URL successfully!' 
          });
        }
      } else {
        setErrors(prev => ({ ...prev, [type]: result.error }));
        showToast({ 
          icon: '❌', 
          title: 'URL Processing Failed', 
          message: result.error || 'URL processing failed' 
        });
      }
    } catch (error) {
      const errorMsg = 'URL processing failed';
      setErrors(prev => ({ ...prev, [type]: errorMsg }));
      showToast({ 
        icon: '❌', 
        title: 'URL Processing Failed', 
        message: errorMsg 
      });
    } finally {
      setIsUrlProcessing(false);
    }
  };

  const handleScan = async () => {
    if (!resumeData.text.trim() || !jobData.text.trim()) {
      setErrors({
        resume: !resumeData.text.trim() ? 'Resume is required' : undefined,
        job: !jobData.text.trim() ? 'Job description is required' : undefined,
      });
      showToast({ 
        icon: '⚠️', 
        title: 'Missing Information', 
        message: 'Please provide both resume and job description' 
      });
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/ats/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText: resumeData.text,
          jobDescription: jobData.text,
          saveResume,
          resumeName: saveResume ? resumeName : undefined,
        }),
      });

      const result = await response.json();
      
      if (result.id) {
        showToast({ 
          icon: '🎉', 
          title: 'Analysis Complete', 
          message: 'Analysis completed! Redirecting to results...' 
        });
        router.push(`/ats-scanner/results/${result.id}`);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      const errorMsg = (error as Error).message || 'Analysis failed. Please try again.';
      setErrors({ resume: errorMsg });
      showToast({ 
        icon: '❌', 
        title: 'Analysis Failed', 
        message: errorMsg 
      });
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
              <button 
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                onClick={() => router.push('/ats-scanner/saved-resumes')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Saved Resumes
              </button>
            </div>

            {/* Resume Text Area */}
            <div className="mb-4">
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste resume text here..."
                value={resumeData.text}
                onChange={(e) => setResumeData(prev => ({ 
                  ...prev, 
                  text: e.target.value, 
                  source: 'text' 
                }))}
              />
              {errors.resume && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.resume}
                </p>
              )}
              {resumeData.filename && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Loaded: {resumeData.filename}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                    <p className="mt-2 text-sm text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <>
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
                      PDF, DOC, DOCX, TXT files only (max 10MB)
                    </p>
                  </>
                )}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isUrlProcessing}
                  onClick={() => {
                    const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                    if (input?.value) handleUrlProcess(input.value, 'resume');
                  }}
                >
                  {isUrlProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
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
                Save resume for future use
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
                placeholder="Copy and paste job description here..."
                value={jobData.text}
                onChange={(e) => setJobData(prev => ({ 
                  ...prev, 
                  text: e.target.value, 
                  source: 'text' 
                }))}
              />
              {errors.job && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.job}
                </p>
              )}
              {jobData.title && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Loaded: {jobData.title}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Tip: Include requirements, skills, and qualifications for better analysis
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                    <p className="mt-2 text-sm text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <>
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
                      PDF, DOC, DOCX, TXT files only (max 10MB)
                    </p>
                  </>
                )}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isUrlProcessing}
                  onClick={() => {
                    const inputs = document.querySelectorAll('input[type="url"]');
                    const input = inputs[1] as HTMLInputElement; // Second URL input
                    if (input?.value) handleUrlProcess(input.value, 'job');
                  }}
                >
                  {isUrlProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
            onClick={() => {
              showToast({ 
                icon: '🚀', 
                title: 'Coming Soon', 
                message: 'Power Edit feature coming soon!' 
              });
            }}
            disabled={isProcessing}
          >
            <Zap className="w-5 h-5" />
            <span>Power Edit</span>
          </button>
          
          <button
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleScan}
            disabled={isProcessing || isUploading || isUrlProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Scan Resume</span>
              </>
            )}
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
                <li>• Upload your resume in DOC or DOCX format (PDF temporarily disabled)</li>
                <li>• Include the complete job description you're applying for</li>
                <li>• Ensure your resume includes contact information and skills</li>
                <li>• Use standard section headers (Experience, Education, Skills)</li>
                <li>• Include relevant keywords from the job posting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScanner;
