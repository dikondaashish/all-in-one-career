/**
 * File processing utilities for ATS Scanner
 * Handles PDF, Word, and text file content extraction
 */

// Support PDF, DOCX, DOC, and TXT files
export const processFile = async (file: File): Promise<string> => {
  if (file.type === 'text/plain') {
    return await file.text();
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             file.type === 'application/msword') {
    return await processWordViaAPI(file);
  } else if (file.type === 'application/pdf') {
    throw new Error('PDF support is temporarily disabled due to deployment issues. Please upload your resume in DOCX format for now. We\'re working on restoring PDF support soon.');
  } else {
    throw new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.');
  }
};

const processWordViaAPI = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const response = await fetch(`${API_BASE_URL}/api/upload/extract-text`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to extract text from document');
  }
  
  const result = await response.json();
  return result.text || '';
};

const processPdfViaAPI = async (file: File): Promise<string> => {
  // For PDF files, we'll extract text through a direct API call
  // since the main ATS scan endpoint now handles PDF processing
  const formData = new FormData();
  formData.append('file', file);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const response = await fetch(`${API_BASE_URL}/api/upload/extract-text`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 422) {
      throw new Error('This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.');
    }
    throw new Error(errorData.error || 'Failed to extract text from PDF');
  }
  
  const result = await response.json();
  return result.text || '';
};

/**
 * Validate file before processing
 */
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    // 'application/pdf', // Temporarily disabled due to deployment issues
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please use DOC, DOCX, or TXT files. PDF support temporarily disabled.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty'
    };
  }

  return { isValid: true };
};

/**
 * Get file type display name
 */
export const getFileTypeDisplay = (file: File): string => {
  const typeMap: { [key: string]: string } = {
    'application/pdf': 'PDF Document',
    'text/plain': 'Text File',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
    'application/msword': 'Word Document (DOC)'
  };

  return typeMap[file.type] || 'Unknown File Type';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
