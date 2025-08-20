import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

export function notificationsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /api/notifications - Get user's notifications
  router.get('/', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          archived: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          archived: true
        }
      });

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // POST /api/notifications - Create notification (internal use)
  router.post('/', authenticateToken, async (req: any, res) => {
    try {
      const { userId, type, title, message } = req.body;
      
      if (!userId || !type || !title || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: userId, type, title, message' 
        });
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: type.toUpperCase(),
          title,
          message,
          isRead: false,
          archived: false
        }
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  });

  // POST /api/notifications/mark-read/:id - Mark single notification as read
  router.post('/mark-read/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const notificationId = req.params.id;

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // POST /api/notifications/mark-all-read - Mark all user's notifications as read
  router.post('/mark-all-read', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
          archived: false
        },
        data: {
          isRead: true
        }
      });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  return router;
}
