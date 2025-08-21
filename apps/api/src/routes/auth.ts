import { Router } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import type { PrismaClient } from '@prisma/client';

export default function authRouter(prisma: PrismaClient): Router {
  const r = Router();

  // STEP 1: Signup endpoint that creates user in database
  r.post('/signup', async (req: any, res) => {
    try {
      const { firebaseToken, email, name, profileImage } = req.body;

      if (!firebaseToken || !email) {
        return res.status(400).json({ error: 'Firebase token and email are required' });
      }

      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      
      if (decodedToken.email !== email) {
        return res.status(401).json({ error: 'Email mismatch' });
      }

      // Check if user already exists in database
      let existingUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: decodedToken.uid },
            { email: email }
          ]
        }
      });

      if (!existingUser) {
        // Create new user in database
        existingUser = await prisma.user.create({
          data: {
            id: decodedToken.uid, // Use Firebase UID as database ID
            email: email,
            name: name || email.split('@')[0], // Default name from email if not provided
            profileImage: profileImage || null, // Store profile image if provided
            atsScans: 0,
            portfolios: 0,
            emails: 0,
            referrals: 0,
            trackerEvents: 0
          }
        });
        
        console.log(`New user created in database: ${email} (ID: ${existingUser.id})`);
      } else {
        console.log(`Existing user found: ${email} (ID: ${existingUser.id})`);
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { 
          uid: decodedToken.uid, 
          email: decodedToken.email 
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      console.log(`JWT token generated for user: ${email}`);

      res.json({ 
        token,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: existingUser.name,
          profileImage: existingUser.profileImage,
          theme: (existingUser as any).theme ?? null
        }
      });

    } catch (error) {
      console.error('Signup error:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // STEP 2: Login endpoint that handles existing users
  r.post('/login', async (req: any, res) => {
    try {
      const { firebaseToken, email, photoURL } = req.body;

      if (!firebaseToken || !email) {
        return res.status(400).json({ error: 'Firebase token and email are required' });
      }

      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      
      if (decodedToken.email !== email) {
        return res.status(401).json({ error: 'Email mismatch' });
      }

      // Check if user exists in database
      let existingUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: decodedToken.uid },
            { email: email }
          ]
        }
      });

      if (!existingUser) {
        // Create user if they don't exist (for users who signed up before this fix)
        existingUser = await prisma.user.create({
          data: {
            id: decodedToken.uid,
            email: email,
            name: email.split('@')[0],
            profileImage: photoURL || null, // Store Google profile photo if available
            atsScans: 0,
            portfolios: 0,
            emails: 0,
            referrals: 0,
            trackerEvents: 0
          }
        });
        
        console.log(`User auto-created during login: ${email} (ID: ${existingUser.id})`);
      } else if (photoURL && !existingUser.profileImage) {
        // Update existing user's profile image if they don't have one and Google provides one
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { profileImage: photoURL },
          select: {
            id: true,
            email: true,
            name: true,
            profileImage: true,
            theme: true,
            atsScans: true,
            portfolios: true,
            emails: true,
            referrals: true,
            trackerEvents: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        console.log(`Profile image updated for existing user: ${email}`);
      }

      // Ensure existingUser is not null before proceeding
      if (!existingUser) {
        return res.status(500).json({ error: 'Failed to create or retrieve user' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { 
          uid: decodedToken.uid, 
          email: decodedToken.email 
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      console.log(`JWT token generated for user: ${email}`);

      res.json({ 
        token,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: existingUser.name,
          profileImage: existingUser.profileImage,
          theme: (existingUser as any).theme ?? null
        }
      });

    } catch (error) {
      console.error('Login error:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // STEP 3: JWT token validation endpoint
  r.post('/validate', async (req: any, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as { uid: string; email: string };
      
      // Get user data from database
      const user = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: decoded.uid },
            { email: decoded.email }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          profileImage: true,
          theme: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        uid: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        theme: user.theme
      });

    } catch (error) {
      console.error('Token validation error:', error instanceof Error ? error.message : String(error));
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  return r;
}
