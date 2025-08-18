import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { seedTestNotifications, cleanupTestNotifications } from '../utils/seedNotifications';

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export function notificationsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /api/notifications - Get latest 20 notifications for user
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log(`Fetching notifications for user: ${userId}`);

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        }
      });

      console.log(`Found ${notifications.length} notifications for user ${userId}`);

      res.json({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // POST /api/notifications/mark-all-read - Mark all user notifications as read
  router.post('/mark-all-read', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log(`Marking all notifications as read for user: ${userId}`);

      const result = await prisma.notification.updateMany({
        where: { 
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      console.log(`Marked ${result.count} notifications as read for user ${userId}`);

      res.json({ 
        success: true, 
        markedCount: result.count 
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  });

  // POST /api/notifications/mark-read/:id - Mark single notification as read
  router.post('/mark-read/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      console.log(`Marking notification ${notificationId} as read for user: ${userId}`);

      const notification = await prisma.notification.updateMany({
        where: { 
          id: notificationId,
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      if (notification.count === 0) {
        return res.status(404).json({ error: 'Notification not found or already read' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // POST /api/notifications/create - Create a new notification (for testing/admin)
  router.post('/create', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, type, title, message } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, type, title, message' 
        });
      }

      console.log(`Creating notification for user: ${userId}`);

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
        },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        }
      });

      console.log(`Created notification ${notification.id} for user ${userId}`);

      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  });

  // POST /api/notifications/seed-test - Create test notifications (for development)
  router.post('/seed-test', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log(`Seeding test notifications for user: ${userId}`);

      const result = await seedTestNotifications(userId);

      res.json({ 
        success: true, 
        message: `Created ${result.created} test notifications (${result.unread} unread)`,
        ...result
      });
    } catch (error) {
      console.error('Error seeding test notifications:', error);
      res.status(500).json({ error: 'Failed to seed test notifications' });
    }
  });

  // DELETE /api/notifications/cleanup-test - Clean up test notifications (for development)
  router.delete('/cleanup-test', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log(`Cleaning up test notifications for user: ${userId}`);

      const deletedCount = await cleanupTestNotifications(userId);

      res.json({ 
        success: true, 
        message: `Cleaned up ${deletedCount} notifications`,
        deletedCount
      });
    } catch (error) {
      console.error('Error cleaning up test notifications:', error);
      res.status(500).json({ error: 'Failed to cleanup test notifications' });
    }
  });

  return router;
}
