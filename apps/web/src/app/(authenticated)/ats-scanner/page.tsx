'use client';

import { useState, useRef } from 'react';
import { Upload, Star, Zap, Check, AlertCircle } from 'lucide-react';
import { useAtsScanner } from '@/hooks/useAtsScanner';
import { useToast } from '@/components/notifications/ToastContainer';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ScanningProgress from '@/components/ats/ScanningProgress';
import SavedResumes from '@/components/ats/SavedResumes';
import RealTimePreview from '@/components/ats/RealTimePreview';
import { processFile, validateFile, getFileTypeDisplay, formatFileSize } from '@/utils/fileProcessor';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Components
interface ResumeInputSectionProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  file: File | null;
  isDragOver: boolean;
  setIsDragOver: (isDragOver: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File) => void;
  errors: {[key: string]: string};
  onShowSavedResumes: () => void;
  isProcessingFile: boolean;
}

const ResumeInputSection = ({ 
  resumeText, 
  setResumeText, 
  file, 
  isDragOver, 
  setIsDragOver,
  fileInputRef,
  handleFileSelect,
  errors,
  onShowSavedResumes,
  isProcessingFile
}: ResumeInputSectionProps) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume</h3>
        <button 
          onClick={onShowSavedResumes}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Star className="w-4 h-4 mr-1" />
          Saved Resumes
        </button>
      </div>
      
      {/* Text Input Area */}
      <textarea 
        placeholder="Paste resume text..."
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        className={`w-full h-64 p-4 border rounded-lg resize-none mb-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
          errors.resumeText ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-gray-600'
        }`}
      />
      {errors.resumeText && (
        <p className="text-red-500 dark:text-red-400 text-xs mb-4">{errors.resumeText}</p>
      )}
      
      {/* File Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : errors.file 
            ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".doc,.docx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        {isProcessingFile ? (
          <div>
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm font-medium text-blue-600">Processing file...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Extracting text content</p>
          </div>
        ) : file ? (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getFileTypeDisplay(file)} • {formatFileSize(file.size)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Drag & Drop or Upload</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOC, DOCX, TXT files only</p>
          </div>
        )}
      </div>
      {errors.file && (
        <p className="text-red-500 dark:text-red-400 text-xs mt-2">{errors.file}</p>
      )}
    </div>
  );
};

interface JobDescriptionSectionProps {
  jobDescription: string;
  setJobDescription: (description: string) => void;
  errors: {[key: string]: string};
}

const JobDescriptionSection = ({ jobDescription, setJobDescription, errors }: JobDescriptionSectionProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Description</h3>
    <textarea 
      placeholder="Copy and paste job description here"
      value={jobDescription}
      onChange={(e) => setJobDescription(e.target.value)}
      className={`w-full h-80 p-4 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
        errors.jobDescription ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-gray-600'
      }`}
    />
    {errors.jobDescription ? (
      <p className="text-red-500 dark:text-red-400 text-xs mt-2">{errors.jobDescription}</p>
    ) : (
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Tip: Include requirements, skills, and qualifications for better analysis
      </div>
    )}
  </div>
);

export default function AtsScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [availableScans] = useState(4); // This would come from user data
  const [scanProgress, setScanProgress] = useState({
    step: 0,
    progress: 0,
    isScanning: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSavedResumes, setShowSavedResumes] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isScanning } = useAtsScanner();
  const { showToast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const handleFileSelect = async (selectedFile: File) => {
    // Clear previous errors
    setErrors(prev => ({ ...prev, file: '' }));
    
    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      const errorMsg = validation.error || 'Invalid file';
      setErrors(prev => ({ ...prev, file: errorMsg }));
      showToast({
        icon: '❌',
        title: 'Invalid File',
        message: errorMsg
      });
      return;
    }
    
    setFile(selectedFile);
    setIsProcessingFile(true);
    
    try {
      showToast({
        icon: '📄',
        title: 'Processing File',
        message: `Processing ${getFileTypeDisplay(selectedFile)} (${formatFileSize(selectedFile.size)})...`
      });

      // Process the file to extract text
      const extractedText = await processFile(selectedFile);
      
      if (extractedText && extractedText.trim().length > 0) {
        setResumeText(extractedText);
        showToast({
          icon: '✅',
          title: 'File Processed',
          message: `Successfully extracted ${extractedText.length} characters from ${selectedFile.name}`
        });
      } else {
        throw new Error('No text could be extracted from the file');
      }
      
    } catch (error) {
      console.error('File processing error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process file';
      setErrors(prev => ({ ...prev, file: errorMsg }));
      showToast({
        icon: '❌',
        title: 'Processing Failed',
        message: errorMsg
      });
      // Keep the file reference for retry, but clear text
      setResumeText('');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const simulateProgress = () => {
    const steps = [
      { step: 1, progress: 20, delay: 1000 },
      { step: 2, progress: 40, delay: 1500 },
      { step: 3, progress: 60, delay: 1000 },
      { step: 4, progress: 80, delay: 1200 },
      { step: 5, progress: 100, delay: 800 }
    ];
    
    let totalDelay = 0;
    steps.forEach((stepData) => {
      totalDelay += stepData.delay;
      setTimeout(() => {
        setScanProgress({
          step: stepData.step,
          progress: stepData.progress,
          isScanning: stepData.progress < 100
        });
      }, totalDelay);
    });
  };

  const handleScan = async () => {
    // Clear previous errors
    setErrors({});
    
    if (!file && !resumeText.trim()) {
      const errorMsg = 'Please upload a resume file or paste resume text';
      setErrors({ input: errorMsg });
      showToast({
        icon: '⚠️',
        title: 'No Input',
        message: errorMsg
      });
      return;
    }

    // Validate job description length
    if (jobDescription.trim() && jobDescription.trim().length < 10) {
      const errorMsg = 'Job description should be at least 10 characters long for meaningful analysis';
      setErrors({ jobDescription: errorMsg });
      showToast({
        icon: '⚠️',
        title: 'Job Description Too Short',
        message: errorMsg
      });
      return;
    }

    try {
      // Start progress simulation
      setScanProgress({ step: 1, progress: 0, isScanning: true });
      simulateProgress();

      let scanFile = file;
      
      // If no file but text is provided, create a temporary file
      if (!scanFile && resumeText.trim()) {
        if (resumeText.trim().length < 50) {
          const errorMsg = 'Resume text should be at least 50 characters long';
          setErrors({ resumeText: errorMsg });
          setScanProgress({ step: 0, progress: 0, isScanning: false });
          showToast({
            icon: '⚠️',
            title: 'Resume Text Too Short',
            message: errorMsg
          });
          return;
        }
        const blob = new Blob([resumeText], { type: 'text/plain' });
        scanFile = new File([blob], 'resume-text.txt', { type: 'text/plain' });
      }

      if (!scanFile) return;

      // Use the new file upload endpoint instead of old scanResume
      const result = await handleFileUpload(scanFile, jobDescription.trim() || 'General position analysis.');
      
      // Ensure progress reaches 100% before redirecting
      setTimeout(() => {
        setScanProgress({ step: 0, progress: 0, isScanning: false });
        router.push(`/ats-scan-report/${result.scanId}`);
      }, 5500); // Total animation time
      
    } catch (error) {
      console.error('Scan failed:', error);
      setScanProgress({ step: 0, progress: 0, isScanning: false });
      
      let errorMessage = 'Failed to scan resume';
      if (error instanceof Error) {
        if (error.message.includes('not supported')) {
          errorMessage = 'File format not supported. Please use DOC or DOCX format.';
        } else if (error.message.includes('too large')) {
          errorMessage = 'File too large. Please use a file under 10MB.';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Please log in to continue scanning.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ scan: errorMessage });
      showToast({
        icon: '❌',
        title: 'Scan Failed',
        message: errorMessage
      });
    }
  };

  // New file upload function using the multipart endpoint
  const handleFileUpload = async (file: File, jdText: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jdText', jdText);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/ats/scan-file`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${await user?.getIdToken()}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Upload failed');
    }
    
    return data;
  };

  const handleViewSample = () => {
    // This would show a sample scan report
    showToast({
      icon: 'ℹ️',
      title: 'Sample Scan',
      message: 'Sample scan feature coming soon!'
    });
  };

  const handlePowerEdit = () => {
    // This would open an AI-powered resume editor
    showToast({
      icon: '⚡',
      title: 'Power Edit',
      message: 'AI-powered resume editor coming soon!'
    });
  };

  const handleUpgrade = () => {
    // This would open upgrade modal
    showToast({
      icon: '⭐',
      title: 'Upgrade',
      message: 'Upgrade options coming soon!'
    });
  };

  const canScan = (file || resumeText.trim()) && !isScanning && !scanProgress.isScanning;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Scan</h1>
          <button 
            onClick={handleViewSample}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            View a Sample Scan
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Resume Column */}
          <ResumeInputSection 
            resumeText={resumeText}
            setResumeText={setResumeText}
            file={file}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            errors={errors}
            onShowSavedResumes={() => setShowSavedResumes(true)}
            isProcessingFile={isProcessingFile}
          />
          
          {/* Job Description Column */}
          <JobDescriptionSection 
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            errors={errors}
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Available scans: <span className="font-medium">{availableScans}</span>
            </span>
            <button 
              onClick={handleUpgrade}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Upgrade
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handlePowerEdit}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors flex items-center font-medium"
            >
              <Zap className="w-4 h-4 mr-2" />
              Power Edit
            </button>
            <button 
              onClick={handleScan}
              disabled={!canScan}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[100px]"
            >
              {scanProgress.isScanning ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Scanning...
                </div>
              ) : (
                'Scan'
              )}
            </button>
          </div>
        </div>

        {/* Real-time Preview */}
        {(resumeText.trim().length > 50 || jobDescription.trim().length > 50) && (
          <div className="mt-8">
            <RealTimePreview 
              resumeText={resumeText}
              jobDescription={jobDescription}
            />
          </div>
        )}

        {/* Error Display */}
        {(errors.input || errors.scan) && (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                  {errors.input ? 'Input Required' : 'Scan Error'}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errors.input || errors.scan}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                For best results:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Upload your resume in PDF, DOC, or DOCX format</li>
                <li>• Include the complete job description you&apos;re applying for</li>
                <li>• Ensure your resume includes contact information and skills</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scanning Progress Modal */}
        <ScanningProgress 
          currentStep={scanProgress.step}
          progress={scanProgress.progress}
          isVisible={scanProgress.isScanning}
          onCancel={() => setScanProgress({ step: 0, progress: 0, isScanning: false })}
        />

        {/* Saved Resumes Modal */}
        <SavedResumes 
          isOpen={showSavedResumes}
          onClose={() => setShowSavedResumes(false)}
          onSelectResume={(content) => {
            setResumeText(content);
            setFile(null); // Clear file when using saved resume
            setErrors({}); // Clear any errors
          }}
          currentResumeText={resumeText}
        />
      </div>
    </div>
  );
}