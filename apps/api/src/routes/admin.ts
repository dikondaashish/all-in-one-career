import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';

export default function adminRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  // GET /logs - Get system logs (admin only)
  r.get('/logs', async (req: any, res) => {
    try {
      if (!req.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is admin (you can customize this logic)
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['ashishdikonda@gmail.com'];
      if (!adminEmails.includes(req.user.email)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const logs = await prisma.log.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            }
          }
        }
      });

      res.json({ logs });
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  return r;
}
