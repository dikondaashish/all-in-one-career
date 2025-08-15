import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import { z } from 'zod';
import { incrementMetric } from '../utils/metrics';

export default function referralsRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  r.get('/suggest', async (req: any, res) => {
    const { company = '', role = '' } = req.query as any;
    
    // Track usage metrics
    if (req.user?.email) {
      await incrementMetric(prisma, req.user.email, 'referrals');
    }
    
    const mock = [
      { id: '1', name: 'A. Patel', email: `apatel@${company || 'example'}.com`, title: `Senior ${role || 'Engineer'}`, company: company || 'Tech Corp', linkedin: 'https://linkedin.com/in/apatel', notes: 'Great team player with 5+ years experience', matchScore: 85 },
      { id: '2', name: 'J. Kim',   email: `jkim@${company || 'example'}.com`,   title: `Staff ${role || 'Engineer'}`, company: company || 'Tech Corp', linkedin: 'https://linkedin.com/in/jkim', notes: 'Technical leader with strong architecture skills', matchScore: 92 },
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

  r.post('/request', async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'auth required' });
    const { toEmployee, company, role, notes } = ReqBody.parse(req.body);
    const rr = await prisma.referralRequest.create({
      data: {
        fromUserId: req.user.uid as string,
        toEmployee, company, role, status: 'PENDING', notes: notes || null,
      },
    });
    res.json({ ok: true, referral: rr });
  });

  return r;
}
