import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import { z } from 'zod';

export default function applicationsRouter(prisma: PrismaClient, _logger: pino.Logger): Router {
  const r = Router();

  const Create = z.object({
    company: z.string(),
    role: z.string(),
    status: z.enum(['SAVED','APPLIED','INTERVIEW','OFFER','REJECTED']).default('SAVED'),
    jdId: z.string().optional(),
    notes: z.string().optional(),
  });

  r.post('/', async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'auth required' });
    const data = Create.parse(req.body);
    const app = await prisma.application.create({ 
      data: { 
        ...data, 
        userId: req.user.uid as string,
        jdId: data.jdId || null,
        notes: data.notes || null
      } 
    });
    res.json(app);
  });

  r.get('/', async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'auth required' });
    const list = await prisma.application.findMany({
      where: { userId: req.user.uid },
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  });

  r.patch('/:id', async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'auth required' });
    const { status, notes } = req.body as any;
    const app = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, notes },
    });
    res.json(app);
  });

  return r;
}
