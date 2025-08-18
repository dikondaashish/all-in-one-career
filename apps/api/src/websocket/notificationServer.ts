import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { verifyIdToken } from '../lib/firebase';
import { PrismaClient } from '@prisma/client';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
}

interface NotificationMessage {
  type: 'notification';
  data: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    archived: boolean;
    metadata?: any;
    createdAt: string;
  };
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private prisma: PrismaClient;

  constructor(server: any, prisma: PrismaClient) {
    this.prisma = prisma;
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🔌 WebSocket Notification Server started');
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    try {
      // Extract JWT token from query params or headers
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || 
                   request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      try {
        const decoded = await verifyIdToken(token);
        ws.userId = decoded.uid;
        ws.isAuthenticated = true;
        
        // Store authenticated client
        this.clients.set(decoded.uid, ws);
        
        console.log(`🔌 WebSocket connected: ${decoded.uid}`);
        
        // Send connection confirmation
        ws.send(JSON.stringify({ 
          type: 'connection', 
          status: 'connected',
          userId: decoded.uid 
        }));

        // Handle client disconnect
        ws.on('close', () => {
          if (ws.userId) {
            this.clients.delete(ws.userId);
            console.log(`🔌 WebSocket disconnected: ${ws.userId}`);
          }
        });

        // Handle client errors
        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${ws.userId}:`, error);
          if (ws.userId) {
            this.clients.delete(ws.userId);
          }
        });

      } catch (authError) {
        console.error('WebSocket authentication failed:', authError);
        ws.close(1008, 'Authentication failed');
        return;
      }

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  // Push notification to specific user
  public async pushNotificationToUser(userId: string, notification: any) {
    const client = this.clients.get(userId);
    if (!client || !client.isAuthenticated) {
      console.log(`User ${userId} not connected via WebSocket`);
      return false;
    }

    try {
      // Check user preferences before sending
      const userPrefs = await this.prisma.notificationPreference.findMany({
        where: { userId, enabled: true },
        select: { type: true }
      });

      const enabledTypes = userPrefs.map(p => p.type);
      const notificationType = this.mapNotificationTypeToPreference(notification.type);
      
      // Only send if user has enabled this notification type
      if (!enabledTypes.includes(notificationType)) {
        console.log(`User ${userId} has disabled ${notificationType} notifications`);
        return false;
      }

      const message: NotificationMessage = {
        type: 'notification',
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          archived: notification.archived,
          metadata: notification.metadata,
          createdAt: notification.createdAt.toISOString()
        }
      };

      client.send(JSON.stringify(message));
      console.log(`📨 Pushed notification ${notification.id} to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to push notification to user ${userId}:`, error);
      return false;
    }
  }

  // Push notification to all connected users (for system-wide notifications)
  public async pushNotificationToAll(notification: any) {
    const results = await Promise.all(
      Array.from(this.clients.keys()).map(userId => 
        this.pushNotificationToUser(userId, notification)
      )
    );
    return results.filter(Boolean).length;
  }

  // Get connection status
  public getConnectionStatus(userId: string) {
    const client = this.clients.get(userId);
    return {
      connected: !!client && client.isAuthenticated,
      readyState: client?.readyState
    };
  }

  // Get all connected users count
  public getConnectedUsersCount() {
    return this.clients.size;
  }

  // Map notification type to preference type
  private mapNotificationTypeToPreference(notificationType: string): string {
    const mapping: Record<string, string> = {
      'SYSTEM': 'system',
      'TASK': 'task', 
      'FEATURE': 'promotion',
      'MESSAGE': 'activity'
    };
    return mapping[notificationType] || 'activity';
  }

  // Close all connections
  public close() {
    this.wss.close();
    console.log('🔌 WebSocket Notification Server stopped');
  }
}
