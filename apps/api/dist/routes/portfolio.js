import { Router } from 'express';
import { z } from 'zod';
import { geminiGenerate } from '../lib/gemini';
import { incrementMetric } from '../utils/metrics';
const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
export default function portfolioRouter(prisma, _logger) {
    const r = Router();
    const Body = z.object({
        theme: z.string().default('modern'),
        resumeText: z.string().min(50),
    });
    r.post('/generate', async (req, res) => {
        if (!req.user)
            return res.status(401).json({ error: 'auth required' });
        const { theme, resumeText } = Body.parse(req.body);
        const system = `You turn a resume into a JSON portfolio for a Next.js site.
Schema: {"hero":{"title":"","subtitle":""},"about":"","experience":[{"company":"","role":"","period":"","bullets":[]}],"projects":[{"name":"","desc":"","links":[]}],"skills":[]}`;
        const user = `Resume:\n${resumeText}\n\nReturn ONLY valid minified JSON matching the schema.`;
        const json = await geminiGenerate(model, system, user);
        const slug = ('u' + Math.random().toString(36).slice(2, 8)).toLowerCase();
        const site = await prisma.portfolioSite.create({
            data: { userId: req.user.uid, slug, theme, data: JSON.parse(json), url: `/u/${slug}` },
        });
        // Track usage metrics
        if (req.user?.email) {
            await incrementMetric(prisma, req.user.email, 'portfolios');
        }
        res.json({ url: site.url, slug });
    });
    return r;
}
//# sourceMappingURL=portfolio.js.map