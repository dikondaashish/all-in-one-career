/**
 * PDF Utilities - Production-safe PDF parsing
 * 
 * This module provides a robust PDF parsing solution that works reliably
 * in production environments by avoiding static imports that can cause
 * deployment issues.
 */

let pdfParseModule: any = null;

/**
 * Lazy load pdf-parse module to avoid import issues in production
 */
async function loadPdfParse() {
  if (!pdfParseModule) {
    try {
      // Use dynamic require to avoid static import issues
      pdfParseModule = require('pdf-parse');
    } catch (error) {
      console.error('Failed to load pdf-parse module:', error);
      throw new Error('PDF parsing is currently unavailable. Please upload your document in DOCX format.');
    }
  }
  return pdfParseModule;
}

/**
 * Extract text from PDF buffer with enhanced error handling
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await loadPdfParse();
    
    // Configuration for stable parsing
    const options = {
      max: 0, // Parse all pages (0 = no limit)
      normalizeWhitespace: true,
      disableCombineTextItems: false
    };
    
    console.log('Starting PDF parsing...');
    const startTime = Date.now();
    
    const data = await pdfParse(buffer, options);
    
    const parseTime = Date.now() - startTime;
    console.log(`PDF parsing completed in ${parseTime}ms`);
    
    if (!data || !data.text) {
      throw new Error('No text content found in PDF');
    }
    
    const rawText = data.text;
    const cleanedText = cleanPdfText(rawText);
    
    // Validate extracted content
    validatePdfContent(cleanedText, data);
    
    console.log(`Successfully extracted ${cleanedText.length} characters from ${data.numpages} pages`);
    
    return cleanedText;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    if (error instanceof Error) {
      // Re-throw custom errors as-is
      if (error.message.includes('scanned images') || 
          error.message.includes('OCR') || 
          error.message.includes('unavailable')) {
        throw error;
      }
      
      // Handle specific pdf-parse errors
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid or corrupted PDF file. Please try a different file or use DOCX format.');
      }
      
      if (error.message.includes('Password') || error.message.includes('encrypted')) {
        throw new Error('Password-protected PDFs are not supported. Please upload an unlocked PDF or use DOCX format.');
      }
      
      if (error.message.includes('file size') || error.message.includes('too large')) {
        throw new Error('PDF file is too large or complex. Please try a smaller file or use DOCX format.');
      }
    }
    
    // Generic fallback error
    throw new Error('Unable to extract text from PDF. Please try uploading in DOCX format for best results.');
  }
}

/**
 * Clean and normalize PDF text content
 */
function cleanPdfText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }
  
  return rawText
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    // Normalize multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Validate that the extracted PDF content is meaningful
 */
function validatePdfContent(text: string, pdfData: any): void {
  // Check minimum length
  if (text.length < 30) {
    throw new Error('This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.');
  }
  
  // Check for actual letter content (not just numbers/symbols)
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 20) {
    throw new Error('This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.');
  }
  
  // Check text to page ratio (very low ratio indicates scanned images)
  const avgTextPerPage = text.length / (pdfData.numpages || 1);
  if (avgTextPerPage < 50) {
    throw new Error('This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.');
  }
  
  // Check for common resume keywords to ensure it's meaningful content
  const resumeWords = ['experience', 'education', 'skills', 'work', 'job', 'career', 'professional', 'contact'];
  const hasResumeContent = resumeWords.some(word => 
    text.toLowerCase().includes(word.toLowerCase())
  );
  
  if (!hasResumeContent && text.length < 200) {
    console.warn('PDF may not contain typical resume content');
  }
}

/**
 * Check if PDF parsing is available
 */
export async function isPdfParsingAvailable(): Promise<boolean> {
  try {
    await loadPdfParse();
    return true;
  } catch {
    return false;
  }
}
