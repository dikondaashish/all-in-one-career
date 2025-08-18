import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { seedTestNotifications, cleanupTestNotifications } from '../utils/seedNotifications';

// WebSocket server reference (will be set by main index.ts)
let wsNotificationServer: any = null;
export function setWebSocketServer(wsServer: any) {
  wsNotificationServer = wsServer;
}

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
  isAdmin?: boolean;
}

export function notificationsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Helper function to check admin authentication
  function checkAdminAuth(req: AuthenticatedRequest): boolean {
    const adminSecret = req.headers['x-admin-secret'] as string;
    const expectedSecret = process.env.ADMIN_SECRET;
    
    if (!expectedSecret) {
      console.error('ADMIN_SECRET environment variable not set');
      return false;
    }
    
    if (!adminSecret || adminSecret !== expectedSecret) {
      return false;
    }
    
    return true;
  }

  // Map preference string types to NotificationType enum
  const preferenceToEnum: Record<string, 'SYSTEM' | 'TASK' | 'FEATURE' | 'MESSAGE'> = {
    system: 'SYSTEM',
    task: 'TASK',
    promotion: 'FEATURE',
    activity: 'MESSAGE',
  };

  const enumToPreference: Record<'SYSTEM' | 'TASK' | 'FEATURE' | 'MESSAGE', string> = {
    SYSTEM: 'system',
    TASK: 'task',
    FEATURE: 'promotion',
    MESSAGE: 'activity',
  };

  async function getDisabledEnumTypes(userId: string): Promise<Array<'SYSTEM' | 'TASK' | 'FEATURE' | 'MESSAGE'>> {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId },
      select: { type: true, enabled: true }
    });
    // Default behavior: if no preference saved for a type, it's enabled
    return prefs
      .filter(p => !p.enabled)
      .map(p => preferenceToEnum[p.type]!)
      .filter(Boolean);
  }

  // GET /api/notifications - Get latest 20 notifications for user
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const showParam = (req.query.show as string | undefined)?.toLowerCase();
      const showArchived = showParam === 'archived';

      console.log(`Fetching notifications for user: ${userId}, show=${showArchived ? 'archived' : 'active'}`);

      const disabledTypes = await getDisabledEnumTypes(userId);

      const whereClause: any = { userId, archived: showArchived };
      if (disabledTypes.length > 0) {
        whereClause.type = { notIn: disabledTypes };
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          archived: true,
          metadata: true,
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

  // GET /api/notifications/preferences - Get user's notification preferences
  router.get('/preferences', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const prefs = await prisma.notificationPreference.findMany({
        where: { userId },
        select: { type: true, enabled: true }
      });

      // Ensure all categories are represented with defaults (enabled)
      const categories = ['system', 'task', 'promotion', 'activity'] as const;
      const map: Record<(typeof categories)[number], boolean> = {
        system: true,
        task: true,
        promotion: true,
        activity: true,
      };
      prefs.forEach(p => {
        const key = p.type as keyof typeof map;
        if (map[key] !== undefined) map[key] = p.enabled;
      });

      res.json({
        preferences: categories.map((c) => ({ type: c, enabled: map[c] }))
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // POST /api/notifications/preferences/update - Upsert a preference
  router.post('/preferences/update', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { type, enabled } = req.body as { type?: string; enabled?: boolean };
      if (!type || typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Missing or invalid fields: type, enabled' });
      }

      const normalizedType = String(type).toLowerCase();
      if (!['system','task','promotion','activity'].includes(normalizedType)) {
        return res.status(400).json({ error: 'Invalid preference type' });
      }

      const pref = await prisma.notificationPreference.upsert({
        where: { userId_type: { userId, type: normalizedType } },
        update: { enabled },
        create: { userId, type: normalizedType, enabled },
        select: { type: true, enabled: true }
      });

      res.json({ success: true, preference: pref });
    } catch (error) {
      console.error('Error updating notification preference:', error);
      res.status(500).json({ error: 'Failed to update preference' });
    }
  });

  // POST /api/notifications/archive - archive single notification
  router.post('/archive', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { id } = req.body as { id?: string };
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const result = await prisma.notification.updateMany({
        where: { id, userId, archived: false },
        data: { archived: true }
      });
      if (result.count === 0) return res.status(404).json({ error: 'Notification not found or already archived' });
      res.json({ success: true });
    } catch (error) {
      console.error('Error archiving notification:', error);
      res.status(500).json({ error: 'Failed to archive notification' });
    }
  });

  // POST /api/notifications/restore - unarchive single notification
  router.post('/restore', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { id } = req.body as { id?: string };
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const result = await prisma.notification.updateMany({
        where: { id, userId, archived: true },
        data: { archived: false }
      });
      if (result.count === 0) return res.status(404).json({ error: 'Notification not found or not archived' });
      res.json({ success: true });
    } catch (error) {
      console.error('Error restoring notification:', error);
      res.status(500).json({ error: 'Failed to restore notification' });
    }
  });

  // POST /api/notifications/archive-all - archive by age or all
  router.post('/archive-all', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { olderThanDays } = req.body as { olderThanDays?: number };
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const where: any = { userId, archived: false };
      if (olderThanDays && olderThanDays > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        where.createdAt = { lt: cutoff };
      }

      const result = await prisma.notification.updateMany({ where, data: { archived: true } });
      res.json({ success: true, archivedCount: result.count });
    } catch (error) {
      console.error('Error archiving notifications:', error);
      res.status(500).json({ error: 'Failed to archive notifications' });
    }
  });

  // POST /api/notifications/action - mock direct action handler
  router.post('/action', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { id, action } = req.body as { id?: string; action?: 'accept' | 'reply' | 'open' };
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });
      if (!id || !action) return res.status(400).json({ error: 'Missing id or action' });

      const exists = await prisma.notification.findFirst({ where: { id, userId } });
      if (!exists) return res.status(404).json({ error: 'Notification not found' });

      console.log(`[notification action] user=${userId} id=${id} action=${action}`);
      // Optionally set read when action taken
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error performing notification action:', error);
      res.status(500).json({ error: 'Failed to perform action' });
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
      const { userId, type, title, message, sendToAll } = req.body;

      // Check if this is an admin request
      const isAdmin = checkAdminAuth(req);
      
      if (!isAdmin && !req.user?.uid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!type || !title || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: type, title, message' 
        });
      }

      // If admin and sendToAll is true, send to all users
      if (isAdmin && sendToAll) {
        console.log(`Admin creating global notification: ${title}`);
        
        // Get all users
        const users = await prisma.user.findMany({
          select: { id: true }
        });

        const notifications = [];
        for (const user of users) {
          const notification = await prisma.notification.create({
            data: {
              userId: user.id,
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
          
          notifications.push(notification);
          
          // Push real-time notification if WebSocket is available
          if (wsNotificationServer) {
            try {
              await wsNotificationServer.pushNotificationToUser(user.id, notification);
            } catch (wsError) {
              console.log(`WebSocket push failed for user ${user.id}:`, wsError);
            }
          }
        }

        console.log(`Created ${notifications.length} global notifications`);
        res.json({ 
          success: true, 
          message: `Sent to ${notifications.length} users`,
          notifications 
        });
        return;
      }

      // Single user notification (existing behavior)
      if (!userId) {
        return res.status(400).json({ 
          error: 'Missing required field: userId (or use sendToAll: true for admin)' 
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
      
      // Push real-time notification if WebSocket is available
      if (wsNotificationServer && req.user?.uid) {
        try {
          await wsNotificationServer.pushNotificationToUser(req.user.uid, notification);
        } catch (wsError) {
          console.log('WebSocket push failed (fallback to polling):', wsError);
        }
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  });

  // POST /api/notifications/announce - Admin endpoint for global announcements
  router.post('/announce', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check admin authentication
      if (!checkAdminAuth(req)) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      const { type, title, message } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: type, title, message' 
        });
      }

      console.log(`Admin creating global announcement: ${title}`);

      // Get all users
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      if (users.length === 0) {
        return res.status(400).json({ error: 'No users found in database' });
      }

      const notifications = [];
      for (const user of users) {
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
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
        
        notifications.push(notification);
        
        // Push real-time notification if WebSocket is available
        if (wsNotificationServer) {
          try {
            await wsNotificationServer.pushNotificationToUser(user.id, notification);
          } catch (wsError) {
            console.log(`WebSocket push failed for user ${user.id}:`, wsError);
          }
        }
      }

      console.log(`Created ${notifications.length} global announcements`);
      res.json({ 
        success: true, 
        message: `Announcement sent to ${notifications.length} users`,
        sentTo: notifications.length,
        announcement: { type, title, message }
      });

    } catch (error) {
      console.error('Error creating global announcement:', error);
      res.status(500).json({ error: 'Failed to create global announcement' });
    }
  });

  // POST /api/notifications/seed-test - Create test notifications (for development)
  router.post('/seed-test', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { type } = req.query as { type?: string };
      const mapped = type ? preferenceToEnum[String(type).toLowerCase()] : undefined;

      console.log(`Seeding test notifications for user: ${userId}${mapped ? ` of type ${mapped}` : ''}`);

      const result = await seedTestNotifications(userId, mapped);

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
