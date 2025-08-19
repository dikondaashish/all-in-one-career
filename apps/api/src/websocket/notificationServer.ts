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
    
    console.log('🔌 Creating WebSocket server with options:', {
      server: !!server,
      prisma: !!prisma
    });
    
    this.wss = new WebSocketServer({ 
      server,
      // Add WebSocket server options for better connection handling
      perMessageDeflate: false,
      maxPayload: 1024 * 1024, // 1MB max payload
      skipUTF8Validation: false
    });
    
    // Add error handling for the WebSocket server itself
    this.wss.on('error', (error) => {
      console.error('🔌 WebSocket server error:', error);
    });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Log when the server is ready
    this.wss.on('listening', () => {
      console.log('🔌 WebSocket server is listening for connections');
    });
    
    console.log('🔌 WebSocket Notification Server started');
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    try {
      console.log('🔌 New WebSocket connection attempt from:', request.headers.origin);
      
      // Extract Firebase ID token from query params or headers
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || 
                   request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('🔌 No token provided in WebSocket connection');
        ws.close(1008, 'Authentication required');
        return;
      }

      console.log('🔌 Token received, length:', token.length);

      // Verify Firebase ID token
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
        ws.on('close', (code, reason) => {
          if (ws.userId) {
            this.clients.delete(ws.userId);
            console.log(`🔌 WebSocket disconnected: ${ws.userId}, code: ${code}, reason: ${reason}`);
          }
        });

        // Handle client errors
        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${ws.userId}:`, error);
          if (ws.userId) {
            this.clients.delete(ws.userId);
          }
        });

        // Handle pong messages for keep-alive
        ws.on('pong', () => {
          console.log(`🔌 Pong received from user ${ws.userId}`);
        });

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.ping();
              console.log(`🔌 Ping sent to user ${ws.userId}`);
            } catch (error) {
              console.error(`Failed to ping user ${ws.userId}:`, error);
              clearInterval(pingInterval);
            }
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);

        // Clean up ping interval on close
        ws.on('close', () => {
          clearInterval(pingInterval);
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
      // Ensure user has default notification preferences
      await this.ensureDefaultPreferences(userId);
      
      // Check user preferences before sending
      const userPrefs = await this.prisma.notificationPreference.findMany({
        where: { userId },
        select: { type: true, enabled: true }
      });

      console.log(`🔍 User ${userId} preferences:`, userPrefs);

      // If user has no preferences set, allow all notifications (default behavior)
      if (userPrefs.length === 0) {
        console.log(`User ${userId} has no preferences set, allowing notification`);
      } else {
        // Check if user has explicitly disabled this notification type
        const notificationType = this.mapNotificationTypeToPreference(notification.type);
        console.log(`🔍 Notification type ${notification.type} maps to preference type: ${notificationType}`);
        
        const disabledType = userPrefs.find(p => p.type === notificationType && !p.enabled);
        
        if (disabledType) {
          console.log(`User ${userId} has disabled ${notificationType} notifications`);
          return false;
        }
      }

      const message: NotificationMessage = {
        type: 'notification',
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          archived: notification.archived || false,
          metadata: notification.metadata,
          createdAt: notification.createdAt.toISOString()
        }
      };

      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        console.log(`📨 Pushed notification ${notification.id} to user ${userId}`);
        return true;
      } else {
        console.log(`WebSocket for user ${userId} is not open (state: ${client.readyState})`);
        // Remove disconnected client
        this.clients.delete(userId);
        return false;
      }
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
      connected: !!client && client.isAuthenticated && client.readyState === WebSocket.OPEN,
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

  // Ensure user has default notification preferences
  private async ensureDefaultPreferences(userId: string) {
    try {
      const existingPrefs = await this.prisma.notificationPreference.findMany({
        where: { userId }
      });

      if (existingPrefs.length === 0) {
        console.log(`🔧 Creating default preferences for user ${userId}`);
        
        const defaultPreferences = [
          { type: 'system', enabled: true },
          { type: 'task', enabled: true },
          { type: 'promotion', enabled: true },
          { type: 'activity', enabled: true }
        ];

        await this.prisma.notificationPreference.createMany({
          data: defaultPreferences.map(pref => ({
            userId,
            type: pref.type,
            enabled: pref.enabled
          }))
        });

        console.log(`✅ Default preferences created for user ${userId}`);
      }
    } catch (error) {
      console.error(`Failed to create default preferences for user ${userId}:`, error);
    }
  }

  // Close all connections
  public close() {
    this.wss.close();
    console.log('🔌 WebSocket Notification Server stopped');
  }
}
