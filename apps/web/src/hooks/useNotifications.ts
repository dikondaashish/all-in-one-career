import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  archived: boolean;
}

const fetcher = async (url: string, token: string): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  return response.json();
};

export type NotificationFilter = 'unread' | 'all' | 'archived';

export function useNotifications() {
  const { user } = useAuth();
  const previousNotificationsRef = useRef<Notification[]>([]);

  const { data: notifications, error, isLoading, mutate } = useSWR(
    user ? ['/api/notifications', user] : null,
    async ([url, user]) => {
      const token = await user.getIdToken();
      return fetcher(url, token);
    },
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Detect new notifications for toast popups
  useEffect(() => {
    if (notifications && previousNotificationsRef.current.length > 0) {
      const previousIds = new Set(previousNotificationsRef.current.map(n => n.id));
      const newUnreadNotifications = notifications.filter(
        n => !previousIds.has(n.id) && !n.isRead && !n.archived
      );
      
      // Store current notifications for next comparison
      previousNotificationsRef.current = notifications;
      
      // Note: New unread notifications are detected here
      // The parent component can use this information if needed
    } else if (notifications) {
      // First load - just store the notifications
      previousNotificationsRef.current = notifications;
    }
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read/${notificationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refetch notifications to update the UI
        mutate();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refetch notifications to update the UI
        mutate();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refetch notifications to update the UI
        mutate();
        return { success: true, message: 'Notification archived' };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.error || 'Failed to archive notification' };
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
      return { success: false, message: 'Failed to archive notification' };
    }
  };

  const restoreNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refetch notifications to update the UI
        mutate();
        return { success: true, message: 'Notification restored' };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.error || 'Failed to restore notification' };
      }
    } catch (error) {
      console.error('Error restoring notification:', error);
      return { success: false, message: 'Failed to restore notification' };
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead && !n.archived).length || 0;

  // Filter notifications based on selected filter
  const getFilteredNotifications = (filter: NotificationFilter) => {
    if (!notifications) return [];
    
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead && !n.archived);
      case 'archived':
        return notifications.filter(n => n.archived);
      case 'all':
      default:
        return notifications;
    }
  };

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    restoreNotification,
    mutate,
    getFilteredNotifications,
  };
}
