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
 * Extract text from PDF using Gemini Vision AI
 * This handles complex PDFs that traditional parsers can't read
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
      model: "gemini-1.5-flash", // Use flash model for better performance
      systemInstruction: `Extract ALL text from this PDF. Return only the text content, no analysis.`
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
      "Extract all text from this document."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 100) + "...",
      hasContent: extractedText.length > 20
    });

    // Basic validation - return empty if response is too short or looks like an error
    if (extractedText.length < 20 || 
        extractedText.toLowerCase().includes('cannot') ||
        extractedText.toLowerCase().includes('unable') ||
        extractedText.toLowerCase().includes('error')) {
      console.warn("diag:gemini:insufficient_response");
      return '';
    }

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    // Don't throw error, just return empty to allow other fallbacks
    return '';
  }
}

/**
 * Advanced OCR extraction for scanned/image-based PDFs using Gemini Vision AI
 * This is specifically optimized for non-selectable PDFs (scanned documents)
 */
export async function extractPdfTextWithOCR(buffer: Buffer): Promise<string> {
  try {
    console.info("diag:gemini:ocr:start", { bufferSize: buffer.length });
    
    // Check if API key is available
    if (!apiKey || apiKey.length < 20) {
      console.warn("diag:gemini:ocr:no_api_key");
      throw new Error("Gemini API key not available");
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // Use Pro model for better OCR accuracy
      systemInstruction: `You are a professional OCR (Optical Character Recognition) system. Your task is to extract ALL text from this scanned PDF document with maximum accuracy.

INSTRUCTIONS:
1. Read ALL visible text in the document, including headers, body text, lists, and any annotations
2. Maintain the original structure and formatting as much as possible
3. Include names, contact information, dates, addresses, and all professional details
4. For resumes: Extract all sections like Summary, Experience, Education, Skills, Certifications
5. For job descriptions: Extract requirements, responsibilities, qualifications, and company details
6. Do NOT add any commentary, analysis, or explanations
7. Do NOT summarize or paraphrase - extract the exact text as it appears
8. If text is unclear, make your best reasonable interpretation
9. Return ONLY the extracted text content

QUALITY STANDARDS:
- Accuracy: Ensure spelling and formatting are preserved
- Completeness: Don't skip any visible text sections
- Structure: Maintain logical text flow and organization`
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
      "Perform high-accuracy OCR on this scanned PDF document. Extract all visible text with maximum precision."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:ocr:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 150) + "...",
      hasContent: extractedText.length > 50,
      wordsEstimate: extractedText.split(/\s+/).length
    });

    // More lenient validation for OCR - accept shorter text as scanned docs might have less content
    if (extractedText.length < 30) {
      console.warn("diag:gemini:ocr:insufficient_text");
      return '';
    }

    // Check for common OCR error indicators
    if (extractedText.toLowerCase().includes('cannot read') ||
        extractedText.toLowerCase().includes('unable to process') ||
        extractedText.toLowerCase().includes('no text found')) {
      console.warn("diag:gemini:ocr:error_response");
      return '';
    }

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:ocr:error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    // Don't throw error, just return empty
    return '';
  }
}
