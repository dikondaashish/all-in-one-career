import admin from 'firebase-admin';

export const initFirebase = () => {
  if (admin.apps.length) return;
  
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set, Firebase not initialized');
      return;
    }
    
    const parsed = JSON.parse(serviceAccountJson);
    
    // Convert escaped \n into real newlines for the private key
    if (parsed?.private_key?.includes('\\n')) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(parsed as admin.ServiceAccount),
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Don't throw error, just log it
  }
};

export const verifyIdToken = (idToken: string): Promise<admin.auth.DecodedIdToken> =>
  admin.auth().verifyIdToken(idToken);
