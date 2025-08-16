import { Router } from 'express';
import { z } from 'zod';
import { geminiGenerate } from '../lib/gemini';
import { incrementMetric } from '../utils/metrics';
const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
export default function emailsRouter(prisma, logger) {
    const r = Router();
    const Body = z.object({
        company: z.string(),
        role: z.string(),
        referrer: z.string().optional(),
        tone: z.enum(['formal', 'friendly', 'concise']).default('friendly'),
        resumeSummary: z.string().min(30).optional(),
        jdHighlights: z.string().min(10).optional(),
    });
    r.post('/generate', async (req, res) => {
        try {
            const { company, role, referrer, tone, resumeSummary, jdHighlights } = Body.parse(req.body);
            const system = `You write concise, high-converting application emails. You must return ONLY valid JSON in this exact format: {"subject":"email subject here","body":"email body here"}. Maximum 180 words total. No markdown, no backticks, just pure JSON.`;
            const user = `Company: ${company}
Role: ${role}
Referrer: ${referrer || 'none'}
Tone: ${tone}
Resume summary: ${resumeSummary || ''}
JD highlights: ${jdHighlights || ''}

Return ONLY valid JSON, no other text.`;
            const out = await geminiGenerate(model, system, user);
            // Clean the response to extract JSON
            const jsonMatch = out.match(/\{.*\}/s);
            if (!jsonMatch) {
                return res.status(500).json({ error: 'Invalid response format from AI service' });
            }
            const parsed = JSON.parse(jsonMatch[0]);
            // Track usage metrics
            if (req.user?.email) {
                await incrementMetric(prisma, req.user.email, 'emails');
            }
            res.json(parsed);
        }
        catch (error) {
            console.error('Email generation error:', error);
            res.status(500).json({ error: 'Failed to generate email' });
        }
    });
    return r;
}
//# sourceMappingURL=emails.js.map