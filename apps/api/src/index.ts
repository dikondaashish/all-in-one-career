import express from 'express';
import { initFirebase } from './lib/firebase';
import atsRouter from './routes/ats';
import referralsRouter from './routes/referrals';
import portfolioRouter from './routes/portfolio';
import emailsRouter from './routes/emails';
import applicationsRouter from './routes/applications';

// Initialize Firebase
initFirebase();

const app = express();

// Middleware
app.use(express.json());

// Mock Prisma client for now (you'll need to set this up properly)
const mockPrisma = {} as any;
const mockLogger = {} as any;

// Routes
app.use('/api/ats', atsRouter(mockPrisma, mockLogger));
app.use('/api/referrals', referralsRouter(mockPrisma, mockLogger));
app.use('/api/portfolio', portfolioRouter(mockPrisma, mockLogger));
app.use('/api/emails', emailsRouter(mockPrisma, mockLogger));
app.use('/api/applications', applicationsRouter(mockPrisma, mockLogger));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
