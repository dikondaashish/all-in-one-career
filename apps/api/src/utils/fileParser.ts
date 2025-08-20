import mammoth from 'mammoth';
import fs from 'fs';

/**
 * Extract text from PDF file
 * Note: PDF parsing is currently not available due to deployment stability issues.
 * Please use DOCX files for best results.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // For MVP, we'll focus on DOCX support as it's more reliable
  // PDF parsing requires complex dependencies that may not work in all environments
  throw new Error('PDF parsing is currently not supported. Please upload a DOCX file instead for best results.');
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
 * Extract text from file based on type
 */
export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  
  switch (fileType.toLowerCase()) {
    case '.pdf':
      throw new Error('PDF files are currently not supported. Please upload a DOCX file instead.');
    case '.docx':
    case '.doc':
      return extractTextFromDocx(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}. Please upload a DOC or DOCX file.`);
  }
}

/**
 * Extract text from buffer based on file type
 */
export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType.toLowerCase()) {
    case '.pdf':
      throw new Error('PDF files are currently not supported. Please upload a DOCX file instead.');
    case '.docx':
    case '.doc':
      return extractTextFromDocx(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}. Please upload a DOC or DOCX file.`);
  }
}