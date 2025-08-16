import { Router } from 'express';
export default function profileRouter(prisma, logger) {
    const r = Router();
    // GET /me - Get current user profile and metrics
    r.get('/me', async (req, res) => {
        try {
            if (!req.user?.email) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const user = await prisma.user.findUnique({
                where: { email: req.user.email },
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
                }
            });
            if (!user) {
                // Create user if doesn't exist
                const newUser = await prisma.user.create({
                    data: {
                        email: req.user.email,
                        name: req.user.name || null,
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
                    }
                });
                return res.json(newUser);
            }
            res.json(user);
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ error: 'Failed to fetch user profile' });
        }
    });
    return r;
}
//# sourceMappingURL=profile.js.map