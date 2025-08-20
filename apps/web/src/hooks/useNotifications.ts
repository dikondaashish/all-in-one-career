import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useEffect } from 'react';

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
  metadata?: {
    url?: string;
  };
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

export function useNotifications() {
  const { user } = useAuth();
  const previousNotificationsRef = useRef<Notification[]>([]);
  const onNewNotification = useRef<((notification: Notification) => void) | null>(null);

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

  // Detect new notifications and trigger callback
  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) return;

    const previousNotifications = previousNotificationsRef.current;
    
    if (previousNotifications.length > 0) {
      // Find new unread notifications
      const newNotifications = notifications.filter(notification => 
        !notification.isRead && 
        !notification.archived &&
        !previousNotifications.some(prev => prev.id === notification.id)
      );

      // Trigger callback for each new notification
      newNotifications.forEach(notification => {
        if (onNewNotification.current) {
          onNewNotification.current(notification);
        }
      });
    }

    // Update the previous notifications reference
    previousNotificationsRef.current = notifications;
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead && !n.archived).length || 0;

  const setOnNewNotification = (callback: ((notification: Notification) => void) | null) => {
    onNewNotification.current = callback;
  };

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    mutate,
    setOnNewNotification,
  };
}
