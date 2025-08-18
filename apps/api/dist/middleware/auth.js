import { auth } from 'firebase-admin';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        // Verify Firebase ID token
        const decodedToken = await auth().verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || ''
        };
        next();
    }
    catch (error) {
        console.error('Firebase token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            // Verify Firebase ID token
            const decodedToken = await auth().verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email || ''
            };
        }
        catch (error) {
            console.error('Firebase token verification failed in optional auth:', error);
            // Continue without user authentication
        }
    }
    next();
};
//# sourceMappingURL=auth.js.map