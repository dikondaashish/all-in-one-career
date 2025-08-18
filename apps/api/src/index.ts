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
import storageRouter from './routes/storage';
import profileRouter from './routes/profile';
import adminRouter from './routes/admin';

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
app.use('/storage', storageRouter(prisma, logger));
app.use('/admin', adminRouter(prisma, logger));

// Add profile routes at root level for frontend compatibility
app.use('/api/profile', profileRouter(prisma, logger));

// Simple profile endpoint for frontend compatibility
app.get('/api/profile', async (req: any, res) => {
  try {
    let userId = req.user?.uid;
    let isGuestMode = false;
    
    // Check for guest mode header
    if (req.headers['x-guest-mode'] === 'true') {
      isGuestMode = true;
      userId = 'guest-user';
    }
    
    if (!userId && !isGuestMode) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    if (isGuestMode) {
      // Return guest profile data
      const guestProfile = {
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@climbly.ai',
        profileImage: null,
        stats: {
          atsScans: [],
          portfolios: [],
          emails: [],
          referrals: [],
          trackerEvents: []
        }
      };
      
      console.log('Guest profile returned');
      return res.json(guestProfile);
    }

    // Get user profile from database by Firebase UID
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id: userId || '' }, // Try direct ID match first
          { email: req.user?.email } // Fallback to email match
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        atsScans: true,
        portfolios: true,
        emails: true,
        referrals: true,
        trackerEvents: true
      }
    });

    if (!user) {
      console.log(`User not found for Firebase UID: ${userId}, email: ${req.user?.email}`);
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Parse name into firstName and lastName
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const profile = {
      firstName,
      lastName,
      email: user.email,
      profileImage: null, // TODO: Add profile image support
      stats: {
        atsScans: user.atsScans,
        portfolios: user.portfolios,
        emails: user.emails,
        referrals: user.referrals,
        trackerEvents: user.trackerEvents
      }
    };

    console.log(`Profile fetched for user: ${userId} (DB ID: ${user.id})`);
    res.json(profile);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => logger.info(`API running on port ${PORT}`));
