import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        // Verify JWT token
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
        }
        catch (error) {
            console.error('JWT verification failed in optional auth:', error);
            // Continue without user authentication
        }
    }
    next();
};
//# sourceMappingURL=auth.js.map