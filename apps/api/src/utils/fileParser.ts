import mammoth from 'mammoth';
import fs from 'fs';
import { extractPdfText, isPdfParsingAvailable } from './pdfUtils';

/**
 * Extract text from PDF file using production-safe implementation
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Check if PDF parsing is available first
  const isAvailable = await isPdfParsingAvailable();
  if (!isAvailable) {
    throw new Error('PDF parsing is currently unavailable. Please upload your resume in DOCX format for now.');
  }
  
  return await extractPdfText(buffer);
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file. Please ensure the file is not corrupted.');
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString('utf8');
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT file. Please ensure the file is not corrupted.');
  }
}

/**
 * Extract text from file based on type
 */
export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  
  switch (fileType.toLowerCase()) {
    case '.pdf':
      return extractTextFromPdf(buffer);
    case '.docx':
    case '.doc':
      return extractTextFromDocx(buffer);
    case '.txt':
      return extractTextFromTxt(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF, DOC, DOCX, or TXT file.`);
  }
}

/**
 * Extract text from buffer based on file type
 */
export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType.toLowerCase()) {
    case '.pdf':
      return extractTextFromPdf(buffer);
    case '.docx':
    case '.doc':
      return extractTextFromDocx(buffer);
    case '.txt':
      return extractTextFromTxt(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF, DOC, DOCX, or TXT file.`);
  }
}