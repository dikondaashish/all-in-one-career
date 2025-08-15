import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import { z } from 'zod';
import { geminiGenerate } from '../lib/gemini';

const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export default function emailsRouter(_prisma: PrismaClient, _logger: pino.Logger): Router {
  const r = Router();

  const Body = z.object({
    company: z.string(),
    role: z.string(),
    referrer: z.string().optional(),
    tone: z.enum(['formal','friendly','concise']).default('friendly'),
    resumeSummary: z.string().min(30).optional(),
    jdHighlights: z.string().min(10).optional(),
  });

  r.post('/generate', async (req, res) => {
    const { company, role, referrer, tone, resumeSummary, jdHighlights } = Body.parse(req.body);
    const system = `You write concise, high-converting application emails. Output JSON only: {"subject":"","body":""}. Max 180 words.`;
    const user = `Company: ${company}
Role: ${role}
Referrer: ${referrer || 'none'}
Tone: ${tone}
Resume summary: ${resumeSummary || ''}
JD highlights: ${jdHighlights || ''}

Return JSON only.`;
    const out = await geminiGenerate(model, system, user);
    res.json(JSON.parse(out));
  });

  return r;
}
