/**
 * File processing utilities for ATS Scanner
 * Handles PDF, Word, and text file content extraction
 */

// Currently only support DOCX files as configured in the backend
export const processFile = async (file: File): Promise<string> => {
  if (file.type === 'text/plain') {
    return await file.text();
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             file.type === 'application/msword') {
    try {
      // Try API first
      return await processWordViaAPI(file);
    } catch (error: unknown) {
      // Fallback to client-side processing if API fails
      if (error instanceof Error && error.message?.includes('Unable to connect to document processing service')) {
        console.warn('API unavailable, falling back to client-side processing');
        return await processWordClientSide(file);
      }
      throw error;
    }
  } else if (file.type === 'application/pdf') {
    throw new Error('PDF files are currently not supported. Please upload a DOC or DOCX file instead.');
  } else {
    throw new Error('Unsupported file type. Please upload DOC, DOCX, or TXT files.');
  }
};

const processWordViaAPI = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/upload/extract-text`, {
      method: 'POST',
      body: formData,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to extract text from document (${response.status})`);
    }
    
    const result = await response.json();
    return result.text || '';
  } catch (error: unknown) {
    // Handle specific connection errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Document processing timed out. Please try again with a smaller file.');
    }
    if (error instanceof Error && (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED'))) {
      throw new Error('Unable to connect to document processing service. Please check your internet connection and try again.');
    }
    throw error;
  }
};

/**
 * Fallback client-side Word document processing using mammoth
 */
const processWordClientSide = async (file: File): Promise<string> => {
  try {
    // Dynamic import to reduce bundle size
    const mammoth = await import('mammoth');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.value.trim().length === 0) {
      throw new Error('No text could be extracted from the document. Please ensure it contains readable text.');
    }
    
    return result.value;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('No text could be extracted')) {
      throw error;
    }
    throw new Error('Failed to process Word document. Please try uploading a different file or convert to TXT format.');
  }
};

/**
 * Validate file before processing
 */
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only DOC, DOCX, and TXT files are supported. PDF support coming soon.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be under 10MB'
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
    'text/plain': 'Text File',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
    'application/msword': 'Word Document (DOC)',
    'application/pdf': 'PDF Document'
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
