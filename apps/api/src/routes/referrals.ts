import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import { z } from 'zod';

export default function referralsRouter(prisma: PrismaClient, _logger: pino.Logger): Router {
  const r = Router();

  r.get('/suggest', async (req, res) => {
    const { company = '', role = '' } = req.query as any;
    const mock = [
      { name: 'A. Patel', email: `apatel@${company || 'example'}.com`, title: `Senior ${role || 'Engineer'}` },
      { name: 'J. Kim',   email: `jkim@${company || 'example'}.com`,   title: `Staff ${role || 'Engineer'}` },
      { name: 'M. Singh', email: `msingh@${company || 'example'}.com`, title: `Manager, ${role || 'Team'}` },
    ];
    res.json({ employees: mock });
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
