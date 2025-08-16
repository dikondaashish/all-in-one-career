import { GoogleGenerativeAI } from '@google/generative-ai';
// Directly use the key (not recommended for production — better to use process.env)
const apiKey = "AIzaSyBJvkuDo6TC2GXfulO12R7uhfoJG-p73d8";
if (!apiKey)
    throw new Error('GEMINI_API_KEY missing');
export const genAI = new GoogleGenerativeAI(apiKey);
export async function geminiGenerate(modelName, systemInstruction, userPrompt) {
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
    });
    const res = await model.generateContent(userPrompt);
    const text = res.response?.text() ?? '';
    return text.trim();
}
//# sourceMappingURL=gemini.js.map