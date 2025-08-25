'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link, Zap, Search, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useToast } from '../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useAdvancedScan } from '../../../hooks/useAdvancedScan';

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

// Feature flag for advanced AI scanner
const ADVANCED_AI_SCAN = process.env.NEXT_PUBLIC_ADVANCED_AI_SCAN === 'true' || true; // Enable by default

const ATSScanner: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { startScan: startAdvancedScan, isLoading: isAdvancedLoading, progress: advancedProgress } = useAdvancedScan();
  const [resumeData, setResumeData] = useState<ResumeData>({ text: '', source: 'text' });
  const [jobData, setJobData] = useState<JobData>({ text: '', source: 'text' });
  const [isProcessing, setIsProcessing] = useState(false);
  const resumeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [urlInputs, setUrlInputs] = useState({ resume: '', job: '' });
  const [saveResume, setSaveResume] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [errors, setErrors] = useState<{ resume?: string; job?: string }>({});
  const [ocrStatus, setOcrStatus] = useState<{
    resume?: { show: boolean; running: boolean; jobId?: string; s3Key?: string; filename?: string; fileBuffer?: string };
    job?: { show: boolean; running: boolean; jobId?: string; s3Key?: string; filename?: string; fileBuffer?: string };
  }>({});

  const handleFileUpload = async (file: File, type: 'resume' | 'job') => {
    setIsUploading(true);
    setErrors(prev => ({ ...prev, [type]: undefined }));

    const formData = new FormData();
    formData.append('resume', file);
    
    console.info("File upload initiated", {
      uploadType: type,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

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
      
      // Enhanced debug logging for uploads
      console.info("Upload response received", { 
        status: response.status, 
        success: result?.success,
        textLength: result?.text?.length || 0, 
        textType: typeof result?.text,
        hasText: !!result?.text,
        fileType: file.type,
        filename: result?.filename,
        uploadType: type,
        resultKeys: Object.keys(result || {})
      });
      
      if (!response.ok) {
        let msg = "Upload failed";
        if (result?.error === "pdf_no_extractable_text") {
          if (result?.can_ocr) {
            // Handle OCR capability - don't show error, show OCR prompt instead
            handleOcrPrompt(result, type);
            return;
          } else {
            msg = "This PDF has no selectable text. Upload a text-based PDF or use DOCX/TXT. If it's scanned, try OCR.";
          }
        } else if (result?.error === "pdf_parse_unsupported") {
          msg = "We couldn't read this PDF. Try exporting it again or upload DOCX.";
        } else if (result?.error === "unsupported_type") {
          msg = "Unsupported file type. Use PDF, DOC, DOCX, or TXT.";
        } else if (response.status === 413) {
          msg = "File too large. Max 10MB.";
        } else if (result?.error === "no_file_uploaded") {
          msg = "No file detected. Please choose a file and try again.";
        } else if (result?.error === "no_extractable_text") {
          msg = "The uploaded file contains no readable text. Please try a different format or file.";
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
        console.info("About to set resume data", { 
          textLength: result.text?.length || 0,
          textPreview: result.text?.substring(0, 80) + "...",
          currentResumeText: resumeData.text.length,
          willOverwrite: !!resumeData.text
        });
        
        const newResumeData = {
          text: result.text || '',
          filename: result.filename,
          source: 'file' as const
        };
        
        console.info("New resume data object", newResumeData);
        setResumeData(newResumeData);
        
        // Verify state update after a brief delay
        setTimeout(() => {
          console.info("State verification check", {
            stateTextLength: resumeData.text.length,
            expectedLength: result.text?.length || 0,
            textareaValue: resumeTextareaRef.current?.value?.length || 0,
            textareaExists: !!resumeTextareaRef.current
          });
        }, 100);
        
        showToast({ 
          icon: '✅', 
          title: 'Success', 
          message: `Resume uploaded successfully! (${result.text?.length || 0} characters)` 
        });
      } else {
        console.info("Setting job data", { 
          textLength: result.text?.length || 0,
          textPreview: result.text?.substring(0, 80) + "...",
          currentJobText: jobData.text.length,
          willOverwrite: !!jobData.text
        });
        
        const newJobData = {
          text: result.text || '',
          title: result.filename,
          source: 'file' as const
        };
        
        console.info("New job data object", newJobData);
        setJobData(newJobData);
        
        // Verify state update after a brief delay
        setTimeout(() => {
          console.info("Job state verification check", {
            stateTextLength: jobData.text.length,
            expectedLength: result.text?.length || 0
          });
        }, 100);
        
        showToast({ 
          icon: '✅', 
          title: 'Success', 
          message: `Job description uploaded successfully! (${result.text?.length || 0} characters)` 
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

  const handleOcrPrompt = (result: any, type: 'resume' | 'job') => {
    console.info("OCR prompt triggered", { type, s3Key: result.s3Key, filename: result.filename, hasBuffer: !!result.fileBuffer });
    
    setOcrStatus(prev => ({
      ...prev,
      [type]: {
        show: true,
        running: false,
        s3Key: result.s3Key,
        filename: result.filename,
        fileBuffer: result.fileBuffer // Store the file buffer for OCR
      }
    }));
  };

  const startOcr = async (type: 'resume' | 'job') => {
    const ocrInfo = ocrStatus[type];
    if ((!ocrInfo?.s3Key && !ocrInfo?.fileBuffer) || !user) return;

    console.info("Starting OCR", { type, s3Key: ocrInfo.s3Key, hasBuffer: !!ocrInfo.fileBuffer });

    setOcrStatus(prev => ({
      ...prev,
      [type]: { ...prev[type]!, running: true }
    }));

    try {
      const authToken = await user.getIdToken();
      
      // Start OCR job
      const startResponse = await fetch(`${API_BASE_URL}/api/ats/ocr/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key: ocrInfo.s3Key,
          filename: ocrInfo.filename,
          fileBuffer: ocrInfo.fileBuffer
        }),
      });

      const startResult = await startResponse.json();
      
      if (!startResponse.ok || !startResult.ok) {
        throw new Error(startResult.error || 'Failed to start OCR');
      }

      const jobId = startResult.jobId;
      console.info("OCR job started", { type, jobId });

      setOcrStatus(prev => ({
        ...prev,
        [type]: { ...prev[type]!, jobId }
      }));

      // Poll for results
      pollOcrStatus(jobId, type);

    } catch (error: any) {
      console.error("OCR start failed", { type, error: error.message });
      
      setOcrStatus(prev => ({
        ...prev,
        [type]: { ...prev[type]!, running: false }
      }));

      setErrors(prev => ({ 
        ...prev, 
        [type]: `OCR failed to start: ${error.message}` 
      }));
    }
  };

  const pollOcrStatus = async (jobId: string, type: 'resume' | 'job') => {
    if (!user) return;

    try {
      const authToken = await user.getIdToken();
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/ats/ocr/status?jobId=${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const statusResult = await statusResponse.json();
      
      if (statusResult.status === 'succeeded') {
        console.info("OCR completed successfully", { type, textLength: statusResult.text?.length || 0 });
        
        // Update the appropriate data state
        if (type === 'resume') {
          setResumeData({
            text: statusResult.text || '',
            filename: statusResult.filename,
            source: 'file'
          });
        } else {
          setJobData({
            text: statusResult.text || '',
            title: statusResult.filename,
            source: 'file'
          });
        }

        // Hide OCR status
        setOcrStatus(prev => ({
          ...prev,
          [type]: { show: false, running: false }
        }));

        showToast({
          icon: '✅',
          title: 'OCR Complete',
          message: `Text extracted successfully! (${statusResult.text?.length || 0} characters)`
        });

      } else if (statusResult.status === 'failed') {
        console.error("OCR failed", { type, error: statusResult.error });
        
        setOcrStatus(prev => ({
          ...prev,
          [type]: { show: false, running: false }
        }));

        setErrors(prev => ({ 
          ...prev, 
          [type]: `OCR failed: ${statusResult.error || 'Unknown error'}` 
        }));

      } else if (statusResult.status === 'running') {
        // Continue polling
        setTimeout(() => pollOcrStatus(jobId, type), 2000);
      }

    } catch (error: any) {
      console.error("OCR polling failed", { type, error: error.message });
      
      setOcrStatus(prev => ({
        ...prev,
        [type]: { show: false, running: false }
      }));

      setErrors(prev => ({ 
        ...prev, 
        [type]: `OCR polling failed: ${error.message}` 
      }));
    }
  };

  const cancelOcr = (type: 'resume' | 'job') => {
    setOcrStatus(prev => ({
      ...prev,
      [type]: { show: false, running: false }
    }));
  };

  const handleUrlProcess = async (url: string, type: 'resume' | 'job') => {
    if (!url.trim()) {
      setErrors(prev => ({ ...prev, [type]: 'Please enter a valid URL' }));
      return;
    }
    
    console.info("URL processing started", { type, url: url.substring(0, 50) + "..." });
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
      
      console.info("URL processing response", { 
        type, 
        success: result.success, 
        contentLength: result.content?.length || 0,
        title: result.title,
        error: result.error
      });
      
      if (result.success) {
        // Clear the URL input after successful processing
        setUrlInputs(prev => ({ ...prev, [type]: '' }));
        
        if (type === 'resume') {
          setResumeData({
            text: result.content || '',
            filename: result.title || 'URL Content',
            source: 'url'
          });
          showToast({ 
            icon: '✅', 
            title: 'Success', 
            message: `Resume extracted from URL! (${result.content?.length || 0} characters)` 
          });
        } else {
          setJobData({
            text: result.content || '',
            title: result.title || 'URL Content',
            source: 'url'
          });
          showToast({ 
            icon: '✅', 
            title: 'Success', 
            message: `Job description extracted from URL! (${result.content?.length || 0} characters)` 
          });
        }
      } else {
        const errorMsg = result.error || 'Failed to extract content from URL';
        setErrors(prev => ({ ...prev, [type]: errorMsg }));
        showToast({ 
          icon: '❌', 
          title: 'URL Processing Failed', 
          message: errorMsg
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

    if (!user) {
      showToast({ 
        icon: '❌', 
        title: 'Authentication Error', 
        message: 'Please log in again' 
      });
      return;
    }

    setErrors({});

    // Use advanced scan if feature flag is enabled
    if (ADVANCED_AI_SCAN) {
      try {
        const scanId = await startAdvancedScan({
          resumeText: resumeData.text,
          jobDescription: jobData.text,
          jobUrl: urlInputs.job || undefined,
          fileMeta: resumeData.filename ? {
            name: resumeData.filename,
            type: resumeData.filename.endsWith('.pdf') ? 'application/pdf' : 
                  resumeData.filename.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                  'text/plain'
          } : undefined,
        });

        if (scanId) {
          showToast({ 
            icon: '🎉', 
            title: 'Advanced Analysis Complete', 
            message: 'Revolutionary AI analysis completed! Redirecting to results...' 
          });
          router.push(`/ats-scanner/results/${scanId}`);
        }
      } catch (error) {
        const errorMsg = (error as Error).message || 'Advanced analysis failed. Please try again.';
        setErrors({ resume: errorMsg });
        showToast({
          icon: '❌',
          title: 'Advanced Analysis Failed',
          message: errorMsg
        });
      }
      return;
    }

    // Fallback to legacy scan logic
    setIsProcessing(true);

    try {
      const authToken = await user.getIdToken();
      
      showToast({ 
        icon: '🧠', 
        title: 'AI Analysis Started', 
        message: 'Running AI analysis...' 
      });

      const response = await fetch(`${API_BASE_URL}/api/ats/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          resumeText: resumeData.text,
          jobDescription: jobData.text,
          companyName: jobData.title || null,
        }),
      });

      // Handle token expiration for legacy endpoint
      if (response.status === 401) {
        console.info("Token expired during scan, refreshing...");
        const newToken = await user.getIdToken(true);
        
        const retryResponse = await fetch(`${API_BASE_URL}/api/ats/analyze`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            resumeText: resumeData.text,
            jobDescription: jobData.text,
            companyName: jobData.title || null,
          }),
        });
        
        const retryResult = await retryResponse.json();
        if (retryResult.id) {
          showToast({ 
            icon: '🎉', 
            title: 'Analysis Complete', 
            message: 'Analysis completed! Redirecting to results...' 
          });
          router.push(`/ats-scanner/results/${retryResult.id}`);
          return;
        } else {
          throw new Error(retryResult.error || 'Analysis failed after token refresh');
        }
      }

      const result = await response.json();
      
      if (result.scanId) {
        showToast({ 
          icon: '🎉', 
          title: 'Advanced Analysis Complete', 
          message: 'Revolutionary career intelligence analysis completed! Redirecting to results...' 
        });
        router.push(`/ats-scanner/results/${result.scanId}`);
      } else {
        throw new Error(result.error || 'Advanced analysis failed');
      }
    } catch (error) {
      const errorMsg = (error as Error).message || 'Advanced analysis failed. Please try again.';
      setErrors({ resume: errorMsg });
      showToast({
        icon: '❌',
        title: 'Advanced Analysis Failed',
        message: errorMsg 
      });
      console.error("Advanced scan error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Advanced ATS Scanner</h1>
            <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full flex items-center gap-1">
              <span className="text-xs">🧠</span>
              <span>AI Powered</span>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Revolutionary career intelligence with industry insights, hire probability prediction, and salary negotiation analysis
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

            {/* Debug Info - Remove after fixing */}
            <div className="mb-2 p-2 bg-yellow-50 text-xs text-gray-600 border border-yellow-200 rounded">
              Debug: Resume text length: {resumeData.text.length} | Source: {resumeData.source} | 
              {resumeData.filename && ` File: ${resumeData.filename}`}
            </div>

            {/* Resume Text Area */}
            <div className="mb-4">
              <textarea
                ref={resumeTextareaRef}
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste resume text here..."
                value={resumeData.text}
                onChange={(e) => {
                  console.info("Textarea manual change", {
                    newLength: e.target.value.length,
                    oldLength: resumeData.text.length,
                    source: 'manual_typing'
                  });
                  setResumeData(prev => ({ 
                    ...prev, 
                    text: e.target.value, 
                    source: 'text' 
                  }));
                }}
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
            
            {/* OCR Prompt for Resume */}
            {ocrStatus.resume?.show && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      This PDF looks scanned
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      We couldn't extract text directly. Run OCR to convert the image content to text.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => startOcr('resume')}
                        disabled={ocrStatus.resume?.running}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {ocrStatus.resume?.running ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing OCR...
                          </>
                        ) : (
                          'Run OCR'
                        )}
                      </button>
                      <button
                        onClick={() => cancelOcr('resume')}
                        disabled={ocrStatus.resume?.running}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* URL Input */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex flex-1">
                  <input
                    type="url"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Google Drive or cloud storage URL"
                    value={urlInputs.resume}
                    onChange={(e) => setUrlInputs(prev => ({ ...prev, resume: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (urlInputs.resume.trim()) handleUrlProcess(urlInputs.resume, 'resume');
                      }
                    }}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isUrlProcessing || !urlInputs.resume.trim()}
                    onClick={() => {
                      if (urlInputs.resume.trim()) handleUrlProcess(urlInputs.resume, 'resume');
                    }}
                  >
                    {isUrlProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Info Icon with Tooltip */}
                <div className="relative group">
                  <AlertCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium mb-1">URL Support Info</div>
                      <div>✅ Google Drive, Indeed, Glassdoor, Monster</div>
                      <div>✅ ZipRecruiter, Company career pages</div>
                      <div>❌ LinkedIn (requires authentication)</div>
                      <div className="text-gray-300 mt-1">For LinkedIn: Copy text manually</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
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

            {/* Debug Info - Remove after fixing */}
            <div className="mb-2 p-2 bg-yellow-50 text-xs text-gray-600 border border-yellow-200 rounded">
              Debug: Job text length: {jobData.text.length} | Source: {jobData.source} | 
              {jobData.title && ` File: ${jobData.title}`}
            </div>

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
            
            {/* OCR Prompt for Job Description */}
            {ocrStatus.job?.show && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      This PDF looks scanned
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      We couldn't extract text directly. Run OCR to convert the image content to text.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => startOcr('job')}
                        disabled={ocrStatus.job?.running}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {ocrStatus.job?.running ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing OCR...
                          </>
                        ) : (
                          'Run OCR'
                        )}
                      </button>
                      <button
                        onClick={() => cancelOcr('job')}
                        disabled={ocrStatus.job?.running}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* URL Input */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex flex-1">
                  <input
                    type="url"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter job posting URL (LinkedIn, Indeed, etc.)"
                    value={urlInputs.job}
                    onChange={(e) => setUrlInputs(prev => ({ ...prev, job: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (urlInputs.job.trim()) handleUrlProcess(urlInputs.job, 'job');
                      }
                    }}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isUrlProcessing || !urlInputs.job.trim()}
                    onClick={() => {
                      if (urlInputs.job.trim()) handleUrlProcess(urlInputs.job, 'job');
                    }}
                  >
                    {isUrlProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Info Icon with Tooltip */}
                <div className="relative group">
                  <AlertCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium mb-1">URL Support Info</div>
                      <div>✅ Indeed, Glassdoor, Monster, ZipRecruiter</div>
                      <div>✅ Company career pages & job boards</div>
                      <div>❌ LinkedIn (requires authentication)</div>
                      <div className="text-gray-300 mt-1">For LinkedIn: Copy job description manually</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
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
            disabled={isProcessing || isUploading || isUrlProcessing || isAdvancedLoading}
          >
            {(isProcessing || isAdvancedLoading) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{ADVANCED_AI_SCAN ? advancedProgress.message || 'Analyzing...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>{ADVANCED_AI_SCAN ? 'Advanced AI Scan' : 'Scan Resume'}</span>
              </>
            )}
          </button>
        </div>

        {/* Advanced Scan Progress */}
        {ADVANCED_AI_SCAN && isAdvancedLoading && (
          <div className="mt-6 bg-white border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Advanced AI Analysis in Progress</h3>
              <div className="text-sm text-blue-600 font-medium">
                Step {advancedProgress.step + 1} of 8
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 animate-pulse"></div>
                {advancedProgress.message}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((advancedProgress.step + 1) / 8) * 100}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                Our AI is analyzing your resume with industry intelligence, market trends, and predictive insights...
              </div>
            </div>
          </div>
        )}

        {/* Best Results Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">For best results:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Upload your resume in PDF,DOC or DOCX format </li>
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
