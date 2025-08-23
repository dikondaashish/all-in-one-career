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
 * This handles both regular PDFs and scanned/image-based PDFs
 */
export async function extractPdfTextWithGemini(buffer: Buffer): Promise<string> {
  try {
    console.info("diag:gemini:start", { bufferSize: buffer.length });
    
    // Check if API key is available
    if (!apiKey || apiKey.length < 20) {
      console.warn("diag:gemini:no_api_key");
      throw new Error("Gemini API key not available");
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // Use Pro model for better OCR accuracy
      systemInstruction: `You are an expert OCR (Optical Character Recognition) system. Your task is to extract ALL text from this PDF document with maximum accuracy.

INSTRUCTIONS:
1. Extract ALL visible text exactly as it appears
2. Maintain original formatting, spacing, and line breaks where possible
3. Include ALL content: names, addresses, phone numbers, emails, dates, skills, experience, education
4. If the document is scanned or image-based, use OCR to read ALL text
5. Preserve the structure of sections, bullet points, and paragraphs
6. Do NOT add any commentary, analysis, or interpretation
7. Do NOT summarize or paraphrase - extract verbatim
8. If you cannot read specific text clearly, skip it rather than guess
9. Return ONLY the extracted text content

Focus on accuracy and completeness for resume/job description parsing.`
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
      "Extract all text from this document using OCR if needed. Be thorough and accurate."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 150) + "...",
      hasContent: extractedText.length > 50,
      isOcrResult: true
    });

    // Enhanced validation for OCR results
    if (extractedText.length < 30) {
      console.warn("diag:gemini:insufficient_ocr_response", { length: extractedText.length });
      return '';
    }

    // Check for common OCR error patterns
    const errorPatterns = [
      'cannot read', 'unable to process', 'error occurred', 
      'no text found', 'illegible', 'unreadable'
    ];
    
    const hasErrors = errorPatterns.some(pattern => 
      extractedText.toLowerCase().includes(pattern)
    );

    if (hasErrors) {
      console.warn("diag:gemini:ocr_error_detected");
      return '';
    }

    console.info("diag:gemini:ocr_success", { 
      extractedLength: extractedText.length,
      wordCount: extractedText.split(/\s+/).length
    });

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:ocr_error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    // Don't throw error, just return empty to allow other fallbacks
    return '';
  }
}
