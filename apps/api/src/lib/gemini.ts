import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable or fallback to hardcoded key
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBJvkuDo6TC2GXfulO12R7uhfoJG-p73d8";
if (!apiKey) throw new Error('GEMINI_API_KEY missing');

export const genAI = new GoogleGenerativeAI(apiKey);

export async function geminiGenerate(
  modelName: string,
  systemInstruction: string,
  userPrompt: string
) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });
  const res = await model.generateContent(userPrompt);
  const text = res.response?.text() ?? '';
  return text.trim();
}

/**
 * Extract text from PDF using Gemini Vision AI with OCR capabilities
 * This handles complex PDFs and performs OCR on scanned/image-based PDFs
 */
export async function extractPdfTextWithGemini(buffer: Buffer): Promise<string> {
  try {
    console.info("diag:gemini:ocr:start", { bufferSize: buffer.length });
    
    // Check if API key is available
    if (!apiKey || apiKey.length < 20) {
      console.warn("diag:gemini:no_api_key");
      throw new Error("Gemini API key not available");
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // Use Pro model for better OCR accuracy
      systemInstruction: `You are a professional OCR system. Extract ALL text from this PDF document with high accuracy.

IMPORTANT INSTRUCTIONS:
1. Extract ALL visible text exactly as it appears, including headers, body text, and contact information
2. Maintain original formatting and structure where possible
3. Include names, addresses, phone numbers, emails, dates, and all content
4. For resumes: include Summary, Experience, Education, Skills, Contact Info, etc.
5. For scanned or image-based PDFs: perform OCR to read the text from images
6. Return ONLY the extracted text content - no commentary or analysis
7. If you cannot extract any readable text, return exactly: "NO_READABLE_TEXT_FOUND"
8. Preserve line breaks and paragraph structure
9. Include ALL numerical data, dates, and special characters`
    });

    // Convert buffer to base64 for Gemini
    const base64Data = buffer.toString('base64');
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      },
      "Perform high-accuracy OCR and extract all text from this PDF document. Include all content even if it appears to be scanned or image-based."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:ocr:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 150) + "...",
      hasContent: extractedText.length > 50,
      looksLikeOcr: extractedText.length > 200 // Likely successful OCR
    });

    // Enhanced validation for OCR results
    if (extractedText === "NO_READABLE_TEXT_FOUND" || 
        extractedText.length < 50 ||
        extractedText.toLowerCase().includes('cannot extract') ||
        extractedText.toLowerCase().includes('unable to read') ||
        extractedText.toLowerCase().includes('no text found')) {
      console.warn("diag:gemini:ocr:insufficient_response", { text: extractedText.substring(0, 100) });
      return '';
    }

    console.info("diag:gemini:ocr:success", { 
      textLength: extractedText.length,
      wordsCount: extractedText.split(/\s+/).length 
    });

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:ocr:error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    // Don't throw error, just return empty to allow graceful handling
    return '';
  }
}
