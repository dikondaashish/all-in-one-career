import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';

export default function profileRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  // GET /api/profile - Get current user profile
  r.get('/', async (req: any, res) => {
    try {
      let userId = req.user?.uid;
      let isGuestMode = false;
      
      // Check for guest mode header
      if (req.headers['x-guest-mode'] === 'true') {
        isGuestMode = true;
        // For guest mode, we'll use a default user ID or handle differently
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

  // POST /api/profile/update - Update user profile
  r.post('/update', async (req: any, res) => {
    let userId: string | undefined;
    let isGuestMode = false;
    
    try {
      userId = req.user?.uid;
      
      // Check for guest mode header
      if (req.headers['x-guest-mode'] === 'true') {
        isGuestMode = true;
        // For guest mode, we'll use a default user ID or handle differently
        userId = 'guest-user';
      }
      
      if (!userId && !isGuestMode) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }

      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required' });
      }

      if (isGuestMode) {
        // For guest mode, just return the updated data without saving to DB
        const guestProfile = {
          firstName,
          lastName,
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
        
        console.log('Guest profile updated (not saved to DB)');
        return res.json(guestProfile);
      }

      // First find the user to get the correct database ID
      const existingUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: userId || '' }, // Try direct ID match first
            { email: req.user?.email } // Fallback to email match
          ]
        },
        select: { id: true }
      });

      if (!existingUser) {
        console.log(`User not found for update - Firebase UID: ${userId}, email: ${req.user?.email}`);
        return res.status(404).json({ error: 'User not found in database' });
      }

      // Update user name in database using the found ID
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
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
      console.error('Error details:', {
        userId,
        isGuestMode,
        userEmail: req.user?.email,
        requestBody: req.body,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      res.status(500).json({ 
        error: 'Failed to update profile', 
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          userId,
          isGuestMode,
          userEmail: req.user?.email
        }
      });
    }
  });

  return r;
}
