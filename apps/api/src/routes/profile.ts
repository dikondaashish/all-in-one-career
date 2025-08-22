import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import multer from 'multer';
import { profileImageS3Service } from '../services/s3Service';


export default function profileRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  // 🔐 SECURE MULTER CONFIGURATION FOR S3 UPLOADS
  const upload = multer({
    storage: multer.memoryStorage(), // Store in memory for S3 upload
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1 // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
      // 🛡️ Security: Validate file types
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.') as any, false);
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

  // 📤 POST /api/profile/upload-avatar - Secure S3 Profile Image Upload
  r.post('/upload-avatar', upload.single('file'), async (req: any, res) => {
    try {
      // 🛡️ Security: Verify user authentication
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }

      // 🛡️ Security: Verify file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // 🔍 Check if S3 service is available
      if (!profileImageS3Service.isAvailable()) {
        logger.warn('S3 service not available for profile image upload');
        return res.status(503).json({ 
          error: 'Profile image upload service temporarily unavailable',
          details: 'S3 service not configured'
        });
      }

      logger.info({ 
        userId, 
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype 
      }, '📤 Starting profile image upload');

      // 📤 Upload to S3 with security validation
      const uploadResult = await profileImageS3Service.uploadProfileImage(
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (!uploadResult.success) {
        logger.error({ userId, error: uploadResult.error }, '❌ Profile image upload failed');
        return res.status(400).json({ 
          error: 'Upload failed',
          details: uploadResult.error 
        });
      }

      // 💾 Update user profile in database with new image URL
      try {
        // First find the user
        const existingUser = await prisma.user.findFirst({
          where: { 
            OR: [
              { id: userId },
              { email: req.user?.email }
            ]
          },
          select: { id: true }
        });

        if (!existingUser) {
          throw new Error('User not found');
        }

        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { profileImage: uploadResult.data!.url },
          select: { id: true, profileImage: true }
        });

        logger.info({ 
          userId, 
          s3Key: uploadResult.data!.s3Key,
          imageUrl: uploadResult.data!.url 
        }, '✅ Profile image uploaded and database updated');

        res.json({
          success: true,
          avatarUrl: uploadResult.data!.url,
          metadata: {
            size: uploadResult.data!.size,
            contentType: uploadResult.data!.contentType,
            uploadedAt: uploadResult.data!.uploadedAt
          }
        });

      } catch (dbError) {
        // 🗑️ Cleanup: Delete uploaded S3 file if database update fails
        await profileImageS3Service.deleteProfileImage(uploadResult.data!.s3Key, userId);
        
        logger.error({ userId, dbError }, '❌ Database update failed - S3 file cleaned up');
        res.status(500).json({ 
          error: 'Failed to update profile in database',
          details: 'Upload was successful but profile update failed'
        });
      }

    } catch (error) {
      logger.error({ error, userId: req.user?.uid }, '❌ Profile image upload error');
      res.status(500).json({ 
        error: 'Internal server error during upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🗑️ DELETE /api/profile/delete-avatar - Secure S3 Profile Image Deletion
  r.delete('/delete-avatar', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }

      // 🔍 Get current user's profile image S3 key
      const currentUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: userId },
            { email: req.user?.email }
          ]
        },
        select: { id: true, profileImage: true }
      });

      if (!currentUser?.profileImage) {
        return res.status(404).json({ error: 'No profile image to delete' });
      }

      // 🛡️ Extract S3 key from URL (basic implementation)
      const s3Key = currentUser.profileImage.split('/').pop();
      if (!s3Key) {
        return res.status(400).json({ error: 'Invalid profile image URL' });
      }

      // 🗑️ Delete from S3
      if (profileImageS3Service.isAvailable()) {
        const deleteSuccess = await profileImageS3Service.deleteProfileImage(s3Key, userId);
        if (!deleteSuccess) {
          logger.warn({ userId, s3Key }, '⚠️ S3 deletion failed but continuing with database update');
        }
      }

      // 💾 Update database to remove profile image
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { profileImage: null }
      });

      logger.info({ userId }, '✅ Profile image deleted successfully');
      res.json({ success: true, message: 'Profile image deleted successfully' });

    } catch (error) {
      logger.error({ error, userId: req.user?.uid }, '❌ Profile image deletion error');
      res.status(500).json({ 
        error: 'Failed to delete profile image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return r;
}
