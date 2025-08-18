import { Router } from 'express';
import { z } from 'zod';
import { incrementMetric } from '../utils/metrics';
export default function referralsRouter(prisma, logger) {
    const r = Router();
    r.get('/suggest', async (req, res) => {
        const { company = '', role = '' } = req.query;
        // Track usage metrics
        if (req.user?.email) {
            await incrementMetric(prisma, req.user.email, 'referrals');
        }
        const mock = [
            { id: '1', name: 'A. Patel', email: `apatel@${company || 'example'}.com`, title: `Senior ${role || 'Engineer'}`, company: company || 'Tech Corp', linkedin: 'https://linkedin.com/in/apatel', notes: 'Great team player with 5+ years experience', matchScore: 85 },
            { id: '2', name: 'J. Kim', email: `jkim@${company || 'example'}.com`, title: `Staff ${role || 'Engineer'}`, company: company || 'Tech Corp', linkedin: 'https://linkedin.com/in/jkim', notes: 'Technical leader with strong architecture skills', matchScore: 92 },
            { id: '3', name: 'M. Singh', email: `msingh@${company || 'example'}.com`, title: `Manager, ${role || 'Team'}`, company: company || 'Tech Corp', linkedin: 'https://linkedin.com/in/msingh', notes: 'Experienced manager with excellent communication', matchScore: 78 },
        ];
        res.json({ suggestions: mock });
    });
    const ReqBody = z.object({
        toEmployee: z.string().email(),
        company: z.string(),
        role: z.string(),
        notes: z.string().optional(),
    });
    r.post('/request', async (req, res) => {
        if (!req.user)
            return res.status(401).json({ error: 'auth required' });
        const { toEmployee, company, role, notes } = ReqBody.parse(req.body);
        const rr = await prisma.referralRequest.create({
            data: {
                fromUserId: req.user.uid,
                toEmployee, company, role, status: 'PENDING', notes: notes || null,
            },
        });
        res.json({ ok: true, referral: rr });
    });
    return r;
}
//# sourceMappingURL=referrals.js.map