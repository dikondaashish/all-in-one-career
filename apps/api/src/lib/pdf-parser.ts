import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';

// Configure PDF.js to work in Node.js environment
const { getDocument } = pdfjsLib;

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Read the PDF file
    const data = new Uint8Array(fs.readFileSync(filePath));
    
    // Load the PDF document
    const pdf = await getDocument({ data }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}
