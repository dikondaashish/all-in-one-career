import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from 'firebase-admin';

export default function authRouter(): Router {
  const r = Router();

  // STEP 2: Login endpoint that returns JWT token
  r.post('/login', async (req: any, res) => {
    try {
      const { firebaseToken, email } = req.body;

      if (!firebaseToken || !email) {
        return res.status(400).json({ error: 'Firebase token and email are required' });
      }

      // Verify Firebase token
      const decodedToken = await auth().verifyIdToken(firebaseToken);
      
      if (decodedToken.email !== email) {
        return res.status(401).json({ error: 'Email mismatch' });
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

      console.log('JWT token generated for user:', email);

      res.json({ 
        token,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  return r;
}
