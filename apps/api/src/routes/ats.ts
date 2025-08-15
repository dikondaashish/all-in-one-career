import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import fetch from 'node-fetch';
import { z } from 'zod';
import { geminiGenerate } from '../lib/gemini';
import { extractTextFromPDF } from '../lib/pdf-parser';
import { incrementMetric } from '../utils/metrics';

const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export default function atsRouter(prisma: PrismaClient, _logger: pino.Logger): Router {
  const r = Router();

  const ScanBody = z.object({
    resumeUrl: z.string().url().optional(),
    resumeText: z.string().optional(),
    jdText: z.string().min(20),
  });

  r.post('/scan', async (req: any, res) => {
    const body = ScanBody.parse(req.body);

    // get resume text
    let resumeText = body.resumeText || '';
    if (!resumeText && body.resumeUrl) {
      try {
        const buf = await (await fetch(body.resumeUrl)).arrayBuffer();
        resumeText = await extractTextFromPDF(Buffer.from(buf));
      } catch (error) {
        return res.status(400).json({ error: 'Failed to parse PDF from URL' });
      }
    }
    if (!resumeText) return res.status(400).json({ error: 'No resumeText or resumeUrl' });

    // simple keyword match for MVP
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/).filter(w => w.length > 2);
    const jdWords = norm(body.jdText);
    const resumeSet = new Set(norm(resumeText));
    const freq: Record<string, number> = {};
    jdWords.forEach(w => (freq[w] = (freq[w] || 0) + 1));
    const topJD = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,60).map(([w])=>w);

    const present = topJD.filter(w => resumeSet.has(w));
    const missing = topJD.filter(w => !resumeSet.has(w));
    const score = Math.round((present.length / (present.length + missing.length)) * 100);

    const jd = await prisma.jobDescription.create({
      data: { title: 'JD', company: '', content: body.jdText },
    });

    // Track usage metrics
    if (req.user?.email) {
      await incrementMetric(prisma, req.user.email, 'atsScans');
    }

    res.json({ score, present, missing, jdId: jd.id });
  });

  const TailorBody = z.object({
    resumeText: z.string().min(50),
    jdText: z.string().min(50),
  });

  r.post('/tailor', async (req: any, res) => {
    const { resumeText, jdText } = TailorBody.parse(req.body);

    const system = `You are an expert resume tailor.
- Rewrite content to align with the job description.
- Keep only truthful claims; don't invent employers or degrees.
- Make it ATS-friendly: clear headings, bullet points, hard skills keywords.
- Quantify impact if plausible from the text (avoid fabrications).
- Output Markdown with sections: Summary, Experience, Skills, Education.`;

    const user = `JOB DESCRIPTION:\n${jdText}\n\nCURRENT RESUME TEXT:\n${resumeText}\n\nReturn only the tailored resume in Markdown.`;

    const md = await geminiGenerate(model, system, user);

    // quick re-score
    const jdTerms = jdText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const mdSet = new Set(md.toLowerCase().split(/\W+/));
    const uniq = Array.from(new Set(jdTerms));
    const present = uniq.filter(k => mdSet.has(k));
    const score = Math.round((present.length / Math.max(1, uniq.length)) * 100);

    // Track usage metrics
    if (req.user?.email) {
      await incrementMetric(prisma, req.user.email, 'atsScans');
    }

    res.json({ contentMarkdown: md, score });
  });

  return r;
}
