import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import { initFirebase, verifyIdToken } from './lib/firebase';
import atsRouter from './routes/ats';
import referralsRouter from './routes/referrals';
import portfolioRouter from './routes/portfolio';
import emailsRouter from './routes/emails';
import applicationsRouter from './routes/applications';

const app = express();
const logger = pino({ transport: { target: 'pino-pretty' } });
const prisma = new PrismaClient();

initFirebase();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Optional auth attach (public routes still work)
app.use(async (req: any, _res, next) => {
  const auth = req.header('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try { req.user = await verifyIdToken(token); } catch {}
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/ats', atsRouter(prisma, logger));
app.use('/referrals', referralsRouter(prisma, logger));
app.use('/portfolio', portfolioRouter(prisma, logger));
app.use('/emails', emailsRouter(prisma, logger));
app.use('/applications', applicationsRouter(prisma, logger));

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => logger.info(`API running on :${PORT}`));
