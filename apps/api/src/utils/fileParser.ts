import mammoth from 'mammoth';
import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Extract text from PDF file
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text || '';
    
    // Check if PDF has extractable text
    if (text.trim().length < 30) {
      throw new Error('PDF_SCANNED');
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    if (error instanceof Error && error.message === 'PDF_SCANNED') {
      throw new Error('This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.');
    }
    throw new Error('Failed to extract text from PDF file. Please ensure the file is not corrupted.');
  }
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