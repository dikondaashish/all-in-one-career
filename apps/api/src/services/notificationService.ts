import { PrismaClient } from '@prisma/client';

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a notification for a user
   */
  async createNotification(data: {
    userId: string;
    type: 'FEATURE' | 'SYSTEM' | 'TASK' | 'PROMOTION';
    title: string;
    message: string;
    metadata?: any;
  }) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
          archived: false,
          metadata: data.metadata || null
        }
      });

      console.log(`✅ Notification created for user ${data.userId}: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification when user creates a new Application/ATS Record
   */
  async notifyApplicationCreated(userId: string, company: string, role: string) {
    return this.createNotification({
      userId,
      type: 'TASK',
      title: 'New Application Created',
      message: `Your application for ${role} at ${company} has been created successfully.`,
      metadata: {
        action: 'application_created',
        url: '/tracker',
        company,
        role
      }
    });
  }

  /**
   * Create notification when AI Email is generated
   */
  async notifyEmailGenerated(userId: string, emailType: string) {
    return this.createNotification({
      userId,
      type: 'TASK',
      title: 'AI Email Generated',
      message: `Your ${emailType} email has been generated and is ready to use.`,
      metadata: {
        action: 'email_generated',
        url: '/emails',
        emailType
      }
    });
  }

  /**
   * Create notification when user receives a Referral Reply
   */
  async notifyReferralReply(userId: string, company: string, role: string) {
    return this.createNotification({
      userId,
      type: 'TASK',
      title: 'Referral Reply Received',
      message: `You've received a reply for your referral request at ${company} for ${role}.`,
      metadata: {
        action: 'referral_reply',
        url: '/referrals',
        company,
        role
      }
    });
  }

  /**
   * Create notification for system events
   */
  async notifySystemEvent(userId: string, title: string, message: string, metadata?: any) {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      metadata
    });
  }

  /**
   * Create notification for feature updates
   */
  async notifyFeatureUpdate(userId: string, feature: string, description: string) {
    return this.createNotification({
      userId,
      type: 'FEATURE',
      title: 'New Feature Available',
      message: `${feature}: ${description}`,
      metadata: {
        action: 'feature_update',
        feature,
        url: '/help'
      }
    });
  }
}
