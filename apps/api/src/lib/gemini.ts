import { GoogleGenerativeAI } from '@google/generative-ai';

// Directly use the key (not recommended for production — better to use process.env)
const apiKey = "AIzaSyBJvkuDo6TC2GXfulO12R7uhfoJG-p73d8";
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
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: `You are a professional document parser. Extract ALL text content from the provided PDF document.

IMPORTANT RULES:
1. Extract ALL visible text exactly as it appears
2. Maintain original formatting and structure 
3. Include names, addresses, phone numbers, emails
4. Include all sections: Summary, Experience, Education, Skills, etc.
5. Do NOT add commentary or analysis
6. Do NOT summarize or paraphrase
7. Return ONLY the extracted text content
8. If the document contains no readable text, return exactly: "NO_EXTRACTABLE_TEXT"`
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
      "Extract all text content from this PDF document."
    ]);

    const extractedText = result.response?.text()?.trim() || '';
    
    console.info("diag:gemini:result", { 
      textLength: extractedText.length,
      preview: extractedText.substring(0, 100) + "...",
      isNoText: extractedText === "NO_EXTRACTABLE_TEXT"
    });

    // Return empty string if Gemini indicates no extractable text
    if (extractedText === "NO_EXTRACTABLE_TEXT") {
      return '';
    }

    return extractedText;
  } catch (error: any) {
    console.error("diag:gemini:error", { 
      err: error?.message, 
      stack: error?.stack 
    });
    throw error;
  }
}
