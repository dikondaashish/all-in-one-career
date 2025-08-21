import mammoth from 'mammoth';
import fs from 'fs';

/**
 * Extract text from PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Temporarily disable PDF support to prevent deployment issues
  // TODO: Implement stable PDF parsing solution
  throw new Error('PDF support is temporarily disabled due to deployment issues. Please upload your resume in DOCX format for now. We\'re working on restoring PDF support soon.');
  
  /* 
  // This code will be re-enabled once we have a stable PDF parsing solution
  try {
    // Dynamic import to ensure proper loading
    const pdfjsLib = await import('pdfjs-dist');
    
    // Load PDF from buffer
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      verbosity: 0 // Reduce console output
    }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    // Clean up the text
    const cleanText = fullText.trim().replace(/\s+/g, ' ');
    
    // Check if PDF has extractable text
    if (cleanText.length < 30) {
      throw new Error('PDF_SCANNED');
    }
    
    return cleanText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    if (error instanceof Error && error.message === 'PDF_SCANNED') {
      throw new Error('This PDF appears to be scanned images. OCR isn\'t enabled yet. Please upload a text-based PDF or DOCX.');
    }
    throw new Error('Failed to extract text from PDF file. Please ensure the file is not corrupted or try a different PDF.');
  }
  */
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