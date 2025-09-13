'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, Upload, FileText, Eye, Palette, Wand2, Globe, CheckCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface UploadedFile {
  file: File;
  text: string;
  filename: string;
  parsedData?: ParsedResumeData;
}

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
  bioGenerated?: string;
}

interface Template {
  id: string;
  name: string;
  preview: string;
  description: string;
  style: 'modern' | 'classic' | 'creative' | 'minimal';
}

interface GeneratedPortfolio {
  id: string;
  html: string;
  css: string;
  preview: string;
  subdomain?: string;
}

const PORTFOLIO_TEMPLATES: Template[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    preview: '/templates/modern.png',
    description: 'Clean and contemporary design with bold typography and geometric elements',
    style: 'modern'
  },
  {
    id: 'classic',
    name: 'Classic Business',
    preview: '/templates/classic.png', 
    description: 'Traditional and elegant layout perfect for corporate professionals',
    style: 'classic'
  },
  {
    id: 'creative',
    name: 'Creative Showcase',
    preview: '/templates/creative.png',
    description: 'Vibrant and artistic design ideal for designers and creative professionals',
    style: 'creative'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    preview: '/templates/minimal.png',
    description: 'Simple and focused design that lets your content shine',
    style: 'minimal'
  }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://all-in-one-career.onrender.com';

const STEPS = [
  { number: 1, title: 'Upload Resume', description: 'Upload your resume or LinkedIn PDF' },
  { number: 2, title: 'Choose Template', description: 'Select your preferred design' },
  { number: 3, title: 'Generate Portfolio', description: 'AI creates your portfolio' },
  { number: 4, title: 'Live Editor', description: 'Customize and edit content' },
  { number: 5, title: 'Preview & Publish', description: 'Review and go live' }
];

export default function PortfolioPage() {
  return (
    <ProtectedRoute>
      <PortfolioContent />
    </ProtectedRoute>
  );
}

function PortfolioContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<GeneratedPortfolio | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  // File upload handlers
  const handleFileSelect = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      showToast({
        icon: '❌',
        title: 'Invalid File Type',
        message: 'Please upload PDF, DOC, DOCX, or TXT files only'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit as per specification
      showToast({
        icon: '❌',
        title: 'File Too Large',
        message: 'Please upload files smaller than 5MB'
      });
      return;
    }

    if (!user) {
      showToast({
        icon: '❌',
        title: 'Authentication Required',
        message: 'Please log in to upload files'
      });
      return;
    }

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('resume', file);

      const authToken = await user.getIdToken();
      
      console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const response = await fetch(`${API_BASE_URL}/api/portfolio/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Portfolio upload endpoint not available yet. Please try again in a few minutes.');
        }
        
        try {
          const errorData = await response.json();
          console.error('❌ Server error response:', errorData);
          // Use the specific error message from server
          throw new Error(errorData.details || errorData.error || 'Failed to upload file');
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          // If parseError is from the throw above, re-throw it
          if (parseError instanceof Error && parseError.message !== 'Server error occurred. Please try again.') {
            throw parseError;
          }
          throw new Error('Server error occurred. Please try again.');
        }
      }

      const result = await response.json();
      
      setUploadedFile({
        file,
        text: result.data.extractedText,
        filename: result.data.filename,
        parsedData: result.data.parsedData
      });

      // Show success message with extracted name and bio
      const extractedName = result.data.parsedData?.name || 'resume';
      const bioPreview = result.data.parsedData?.bioGenerated 
        ? result.data.parsedData.bioGenerated.substring(0, 60) + '...'
        : '';
      
      showToast({
        icon: '✅',
        title: 'Resume Parsed Successfully',
        message: `${extractedName}'s resume uploaded and parsed with AI bio generated! ${bioPreview}`
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      showToast({
        icon: '❌',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Failed to upload file'
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    showToast({
      icon: '🎨',
      title: 'Template Selected',
      message: `${template.name} template selected`
    });
  };

  // Portfolio generation
  const handleGeneratePortfolio = async () => {
    if (!uploadedFile || !selectedTemplate || !user) return;

    setIsGenerating(true);
    
    try {
      const authToken = await user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/portfolio/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: uploadedFile.text,
          parsedData: uploadedFile.parsedData,
          templateId: selectedTemplate.id,
          templateStyle: selectedTemplate.style
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate portfolio');
      }

      const result = await response.json();
      
      const generatedPortfolio: GeneratedPortfolio = {
        id: result.data.portfolioId,
        html: result.data.htmlContent,
        css: '', // CSS is embedded in HTML
        preview: 'Generated portfolio preview...'
      };

      setGeneratedPortfolio(generatedPortfolio);
      setEditableContent(generatedPortfolio.html);
      
      showToast({
        icon: '🎉',
        title: 'Portfolio Generated',
        message: 'Your portfolio has been created successfully!'
      });
      
      setCurrentStep(4); // Move to editor
    } catch (error) {
      console.error('Error generating portfolio:', error);
      showToast({
        icon: '❌',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate portfolio. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Publishing
  const handlePublishPortfolio = async () => {
    if (!generatedPortfolio || !user) return;

    setIsPublishing(true);
    
    try {
      const authToken = await user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/portfolio/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioId: generatedPortfolio.id,
          htmlContent: editableContent || generatedPortfolio.html,
          subdomain: user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish portfolio');
      }

      const result = await response.json();
      
      setGeneratedPortfolio(prev => prev ? { 
        ...prev, 
        subdomain: result.data.portfolioUrl 
      } : null);
      
      showToast({
        icon: '🚀',
        title: 'Portfolio Published',
        message: `Your portfolio is now live at ${result.data.portfolioUrl}`
      });
      
      setCurrentStep(5); // Move to final step
    } catch (error) {
      console.error('Error publishing portfolio:', error);
      showToast({
        icon: '❌',
        title: 'Publishing Failed',
        message: error instanceof Error ? error.message : 'Failed to publish portfolio. Please try again.'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Navigation
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1: return !!uploadedFile;
      case 2: return !!selectedTemplate;
      case 3: return !!generatedPortfolio;
      case 4: return true; // Can always proceed from editor
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Generator</h1>
            <p className="text-gray-600">Create a professional portfolio in 5 simple steps</p>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep > step.number 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.number}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 max-w-20">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className={`grid grid-cols-1 gap-8 ${(currentStep === 4 || currentStep === 5) ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Left Column - Main Content */}
          <div className="space-y-6">
            {/* Step 1: Upload Resume */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Upload Your Resume</h2>
                </div>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <div className="text-green-600">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                        <h3 className="font-medium">File Uploaded Successfully</h3>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FileText className="w-4 h-4" />
                          <span>{uploadedFile.filename}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {(uploadedFile.file.size / 1024).toFixed(1)} KB • {uploadedFile.file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </div>
                      </div>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Upload a different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          Drop your resume here, or click to browse
                        </h3>
                        <p className="text-sm text-gray-500">
                          PDF, DOC, DOCX, TXT files only (max 5MB)
                        </p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Choose Template */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Palette className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Choose Your Template</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PORTFOLIO_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                        <div className="text-gray-400 text-sm">Preview</div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-500">{template.description}</p>
                      {selectedTemplate?.id === template.id && (
                        <div className="mt-2 flex items-center text-blue-600 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Generate Portfolio */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Wand2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Generate Portfolio</h2>
                </div>
                
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Ready to create your portfolio?</h3>
                    <p className="text-gray-600">
                      Our AI will analyze your resume and create a beautiful portfolio using the {selectedTemplate?.name} template.
                    </p>
                  </div>
                  
                  {isGenerating ? (
                    <div className="space-y-4">
                      <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <div className="space-y-2">
                        <p className="font-medium">Generating your portfolio...</p>
                        <p className="text-sm text-gray-500">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGeneratePortfolio}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Generate My Portfolio
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Live Editor */}
            {currentStep === 4 && generatedPortfolio && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Live Editor</h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Make any final adjustments to your portfolio content below:
                  </p>
                  
                  <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Edit your portfolio content here..."
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditableContent(generatedPortfolio.html)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Reset to Original
                    </button>
                    <button
                      onClick={() => showToast({ icon: '✅', title: 'Saved', message: 'Changes saved successfully' })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Preview & Publish */}
            {currentStep === 5 && generatedPortfolio && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Preview & Publish</h2>
                </div>
                
                <div className="space-y-6">
                  {generatedPortfolio.subdomain ? (
                    <div className="text-center space-y-4">
                      <div className="text-green-600">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">Portfolio Published Successfully!</h3>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-2">Your portfolio is now live at:</p>
                        <a
                          href={generatedPortfolio.subdomain}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium break-all"
                        >
                          {generatedPortfolio.subdomain}
                        </a>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => window.open(generatedPortfolio.subdomain, '_blank')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          View Live Portfolio
                        </button>
                        <button
                          onClick={() => {
                            // Reset to create new portfolio
                            setCurrentStep(1);
                            setUploadedFile(null);
                            setSelectedTemplate(null);
                            setGeneratedPortfolio(null);
                            setEditableContent('');
                          }}
                          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Create Another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-medium">Ready to publish your portfolio?</h3>
                      <p className="text-gray-600">
                        Your portfolio will be published on a custom subdomain and will be accessible to anyone with the link.
                      </p>
                      
                      {isPublishing ? (
                        <div className="space-y-4">
                          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                          <p className="font-medium">Publishing your portfolio...</p>
                        </div>
                      ) : (
                        <button
                          onClick={handlePublishPortfolio}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          Publish Portfolio
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview (Only show for steps 4 & 5) */}
          {(currentStep === 4 || currentStep === 5) && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              
              <div className="border border-gray-200 rounded-lg h-96 bg-gray-50 flex items-center justify-center">
                {generatedPortfolio ? (
                  <div className="w-full h-full p-4 overflow-auto">
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: editableContent || generatedPortfolio.html }}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 mx-auto"></div>
                    <div>
                      <p className="font-medium text-gray-700">Preview</p>
                      <p className="text-sm text-gray-500">Generate your portfolio to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}
          </div>

          <button
            onClick={handleNextStep}
            disabled={currentStep === 5 || !canProceedFromStep(currentStep)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions for mock generation
function generateMockHTML(resumeText: string, template: Template): string {
  const lines = resumeText.split('\n').filter(line => line.trim());
  const name = lines[0] || 'John Doe';
  const title = lines[1] || 'Professional';
  
  const baseHTML = `
    <div class="portfolio-container">
      <header class="hero-section">
        <h1 class="name">${name}</h1>
        <h2 class="title">${title}</h2>
        <div class="contact-info">
          <p>Email: john.doe@email.com | Phone: (555) 123-4567</p>
        </div>
      </header>
      
      <section class="about-section">
        <h3>About Me</h3>
        <p>Passionate professional with extensive experience in technology and innovation.</p>
      </section>
      
      <section class="experience-section">
        <h3>Experience</h3>
        <div class="job">
          <h4>Senior Software Engineer</h4>
          <p class="company">TechCorp (2020-Present)</p>
          <ul>
            <li>Developed full-stack applications using React and Node.js</li>
            <li>Led team of 5 developers on major product releases</li>
            <li>Implemented CI/CD pipelines reducing deployment time by 40%</li>
          </ul>
        </div>
      </section>
      
      <section class="skills-section">
        <h3>Skills</h3>
        <div class="skills-grid">
          <span class="skill">JavaScript</span>
          <span class="skill">React</span>
          <span class="skill">Node.js</span>
          <span class="skill">Python</span>
          <span class="skill">AWS</span>
          <span class="skill">Docker</span>
        </div>
      </section>
    </div>
  `;
  
  return baseHTML;
}

function generateMockCSS(template: Template): string {
  const baseCSS = `
    .portfolio-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .hero-section {
      text-align: center;
      margin-bottom: 3rem;
      padding: 3rem 0;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .name {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }
    
    .title {
      font-size: 1.5rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .contact-info {
      color: #888;
    }
    
    section {
      margin-bottom: 2rem;
    }
    
    h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #1a1a1a;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }
    
    .job {
      margin-bottom: 1.5rem;
    }
    
    .job h4 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .company {
      color: #666;
      font-style: italic;
      margin-bottom: 0.5rem;
    }
    
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .skill {
      background-color: #f0f7ff;
      color: #1d4ed8;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `;
  
  // Add template-specific styling
  switch (template.style) {
    case 'modern':
      return baseCSS + `
        .hero-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .name { color: white; }
        .title { color: rgba(255,255,255,0.9); }
        .contact-info { color: rgba(255,255,255,0.8); }
      `;
    case 'classic':
      return baseCSS + `
        .portfolio-container { font-family: Georgia, serif; }
        .hero-section { border-bottom: 3px solid #333; }
        h3 { color: #333; border-bottom-color: #333; }
      `;
    case 'creative':
      return baseCSS + `
        .hero-section { background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3); }
        .name { background: linear-gradient(45deg, #ff6b6b, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `;
    case 'minimal':
      return baseCSS + `
        .portfolio-container { color: #333; }
        .hero-section { border-bottom: 1px solid #eee; }
        h3 { border-bottom: none; }
      `;
    default:
      return baseCSS;
  }
}