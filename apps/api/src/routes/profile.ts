import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import multer from 'multer';

export default function profileRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // GET /api/profile - Get current user profile
  r.get('/', async (req: any, res) => {
    try {
      console.log('Profile request received:', {
        headers: req.headers,
        user: req.user,
        url: req.url
      });

      let userId = req.user?.uid;
      let isGuestMode = false;
      
      // Check for guest mode header
      if (req.headers['x-guest-mode'] === 'true') {
        isGuestMode = true;
        console.log('Guest mode detected');
      }
      
      if (!userId && !isGuestMode) {
        console.log('No user ID and not guest mode - returning 401');
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

      console.log(`Looking for user with Firebase UID: ${userId}, email: ${req.user?.email}`);

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
          trackerEvents: true,
          profileImage: true, // Added profileImage to select
          theme: true
        }
      });

      if (!user) {
        console.log(`User not found for Firebase UID: ${userId}, email: ${req.user?.email}`);
        console.log('Available users in database:', await prisma.user.findMany({ select: { id: true, email: true, name: true } }));
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
        profileImage: user.profileImage, // Return actual profile image URL
        theme: user.theme || null,
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

      const { firstName, lastName, profileImage, theme } = req.body;

      // Allow partial updates: at least one of the fields must be provided
      if (
        (firstName === undefined || firstName === null) &&
        (lastName === undefined || lastName === null) &&
        (profileImage === undefined) &&
        (theme === undefined)
      ) {
        return res.status(400).json({ error: 'No updatable fields provided' });
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
      let existingUser = await prisma.user.findFirst({
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
        
        // Auto-create user if they don't exist (for users who signed up before this fix)
        if (userId && req.user?.email) {
          try {
            const newUser = await prisma.user.create({
              data: {
                id: userId,
                email: req.user.email,
                name: `${firstName} ${lastName}`.trim(),
                atsScans: 0,
                portfolios: 0,
                emails: 0,
                referrals: 0,
                trackerEvents: 0
              },
              select: { id: true }
            });
            
            console.log(`User auto-created during profile update: ${req.user.email} (ID: ${newUser.id})`);
            
            // Update the existingUser reference
            existingUser = newUser;
          } catch (createError) {
            console.error('Failed to auto-create user during profile update:', createError);
            return res.status(500).json({ error: 'Failed to create user profile' });
          }
        } else {
          return res.status(404).json({ error: 'User not found in database' });
        }
      }

      // Validate theme if provided
      let themeValue: any = undefined;
      if (typeof theme === 'string') {
        const upper = theme.toUpperCase();
        if (!['LIGHT','DARK','SYSTEM'].includes(upper)) {
          return res.status(400).json({ error: 'Invalid theme value' });
        }
        themeValue = upper as any;
      }

      // Prepare update data
      const updateData: any = {};
      if (profileImage !== undefined) updateData.profileImage = profileImage || null;
      if (themeValue !== undefined) updateData.theme = themeValue;
      if (firstName !== undefined || lastName !== undefined) {
        // If only one part provided, merge with existing value
        const current = await prisma.user.findUnique({ where: { id: existingUser.id }, select: { name: true } });
        const currentParts = (current?.name || '').split(' ');
        const currentFirst = currentParts[0] || '';
        const currentLast = currentParts.slice(1).join(' ');
        const newFirst = firstName !== undefined ? String(firstName) : currentFirst;
        const newLast = lastName !== undefined ? String(lastName) : currentLast;
        updateData.name = `${newFirst} ${newLast}`.trim();
      }

      // Update user in database using the found ID
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          profileImage: true,
          theme: true,
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
        profileImage: updatedUser.profileImage, // Include profile image in response
        theme: updatedUser.theme || null,
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

  // POST /api/profile/upload-avatar - Upload profile avatar
  r.post('/upload-avatar', upload.single('file'), async (req: any, res) => {
    try {
      let userId = req.user?.uid;
      
      // Check for valid authentication
      if (!userId) {
        console.log('Upload avatar - No user ID found:', { 
          headers: req.headers, 
          user: req.user,
          authHeader: req.headers.authorization 
        });
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate file type and size
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be less than 5MB' });
      }

      // First, find the user in the database using the same logic as profile fetch
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
          name: true
        }
      });

      if (!user) {
        console.log(`User not found for avatar upload - Firebase UID: ${userId}, email: ${req.user?.email}`);
        return res.status(404).json({ error: 'User not found in database' });
      }

      // For now, we'll convert the image to a data URL and store it directly
      // In production, you'd want to upload to Firebase Storage, Cloudinary, or similar
      const imageBuffer = req.file.buffer;
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Update user's profile image in database using the actual database ID
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: dataUrl },
        select: {
          id: true,
          email: true,
          name: true,
          profileImage: true
        }
      });

      console.log(`Avatar uploaded for user: ${userId}`);

      res.json({ 
        avatarUrl: updatedUser.profileImage,
        message: 'Avatar uploaded successfully'
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      console.error('Error details:', {
        firebaseUid: req.user?.uid,
        userEmail: req.user?.email,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      res.status(500).json({ 
        error: 'Upload failed. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return r;
}
