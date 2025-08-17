import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';

export default function profileRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  // GET /api/profile - Get current user profile
  r.get('/', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }

      // Get user profile from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
        return res.status(404).json({ error: 'User not found' });
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

      console.log(`Profile fetched for user: ${userId}`);
      res.json(profile);

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // POST /api/profile/update - Update user profile
  r.post('/update', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }

      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required' });
      }

      // Update user name in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: `${firstName} ${lastName}`.trim()
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

      // Parse updated name
      const nameParts = updatedUser.name ? updatedUser.name.split(' ') : ['', ''];
      const updatedFirstName = nameParts[0] || '';
      const updatedLastName = nameParts.slice(1).join(' ') || '';

      const updatedProfile = {
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email: updatedUser.email,
        profileImage: null, // TODO: Add profile image support
        stats: {
          atsScans: updatedUser.atsScans,
          portfolios: updatedUser.portfolios,
          emails: updatedUser.emails,
          referrals: updatedUser.referrals,
          trackerEvents: updatedUser.trackerEvents
        }
      };

      console.log(`Profile updated for user: ${userId} - Name: ${updatedUser.name}`);
      res.json(updatedProfile);

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return r;
}
