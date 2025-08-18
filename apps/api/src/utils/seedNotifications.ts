import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTestNotifications(userId: string, onlyType?: 'SYSTEM' | 'TASK' | 'FEATURE' | 'MESSAGE') {
  const notifications = [
    {
      userId,
      type: 'SYSTEM' as NotificationType,
      title: 'Welcome to Climbly.ai!',
      message: 'Your account has been successfully created. Start by uploading your resume for ATS scanning.',
      metadata: { actionType: 'open', href: '/dashboard' },
      isRead: false,
    },
    {
      userId,
      type: 'FEATURE' as NotificationType,
      title: 'New AI Search Feature',
      message: 'You can now ask questions like "What was my highest ATS score?" in the search bar.',
      metadata: { actionType: 'open', href: '/help' },
      isRead: false,
    },
    {
      userId,
      type: 'TASK' as NotificationType,
      title: 'Resume Analysis Complete',
      message: 'Your resume has been analyzed for the Software Engineer position at Google. Score: 92%',
      metadata: { actionType: 'open', href: '/ats' },
      isRead: true,
    },
    {
      userId,
      type: 'MESSAGE' as NotificationType,
      title: 'New Referral Request',
      message: 'John from Microsoft has responded to your referral request for the Frontend Developer role.',
      metadata: { actionType: 'reply' },
      isRead: false,
    },
    {
      userId,
      type: 'SYSTEM' as NotificationType,
      title: 'Weekly Summary Ready',
      message: 'Your weekly job application summary is ready. You applied to 5 positions this week.',
      metadata: { actionType: 'open', href: '/dashboard' },
      isRead: true,
    },
  ];

  try {
    console.log(`Creating ${notifications.length} test notifications for user: ${userId}`);
    
    for (const notification of notifications) {
      if (onlyType && notification.type !== onlyType) continue;
      await prisma.notification.create({
        data: notification,
      });
    }

    console.log(`Successfully created ${notifications.length} test notifications`);
    
    // Return count of unread notifications
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return { created: notifications.length, unread: unreadCount };
  } catch (error) {
    console.error('Error seeding notifications:', error);
    throw error;
  }
}

// Utility to clean up test notifications
export async function cleanupTestNotifications(userId: string) {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });
    
    console.log(`Cleaned up ${result.count} notifications for user: ${userId}`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    throw error;
  }
}
