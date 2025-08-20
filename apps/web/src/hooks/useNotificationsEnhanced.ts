import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  archived: boolean;
}

export type NotificationTab = 'unread' | 'all' | 'archived';

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

interface UseNotificationsEnhancedProps {
  tab?: NotificationTab;
  onNewNotification?: (notification: Notification) => void;
}

export function useNotificationsEnhanced({ 
  tab = 'unread', 
  onNewNotification 
}: UseNotificationsEnhancedProps = {}) {
  const { user } = useAuth();
  const previousNotificationsRef = useRef<Notification[]>([]);

  // Create SWR key with tab parameter
  const swrKey = user ? [`/api/notifications?tab=${tab}`, user] : null;

  const { data: notifications, error, isLoading, mutate } = useSWR(
    swrKey,
    async ([url, userObj]: [string, User]) => {
      const token = await userObj.getIdToken();
      return fetcher(url, token);
    },
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Check for new notifications and trigger toast
  useEffect(() => {
    if (!notifications || !onNewNotification) return;

    const previousNotifications = previousNotificationsRef.current;
    const previousNotificationIds = new Set(previousNotifications.map(n => n.id));

    // Find new notifications
    const newNotifications = notifications.filter(notification => 
      !previousNotificationIds.has(notification.id) && 
      !notification.isRead
    );

    // Only show toasts for notifications received during current session
    if (previousNotifications.length > 0 && newNotifications.length > 0) {
      newNotifications.forEach(notification => {
        onNewNotification(notification);
      });
    }

    previousNotificationsRef.current = notifications;
  }, [notifications, onNewNotification]);

  const markAsRead = useCallback(async (notificationId: string) => {
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
        // Optimistic update
        mutate(current => 
          current?.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          ), false
        );
        // Revalidate
        mutate();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user, mutate]);

  const markAllAsRead = useCallback(async () => {
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
        // Optimistic update
        mutate(current => 
          current?.map(n => ({ ...n, isRead: true })), false
        );
        // Revalidate
        mutate();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user, mutate]);

  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      
      // Optimistic update - remove from current view
      mutate(current => 
        current?.filter(n => n.id !== notificationId), false
      );

      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        mutate();
        throw new Error('Failed to archive notification');
      }

      // Revalidate to ensure consistency
      mutate();
    } catch (error) {
      console.error('Error archiving notification:', error);
      // Revert optimistic update
      mutate();
      throw error;
    }
  }, [user, mutate]);

  const restoreNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      
      // Optimistic update - remove from archived view
      mutate(current => 
        current?.filter(n => n.id !== notificationId), false
      );

      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        mutate();
        throw new Error('Failed to restore notification');
      }

      // Revalidate to ensure consistency
      mutate();
    } catch (error) {
      console.error('Error restoring notification:', error);
      // Revert optimistic update
      mutate();
      throw error;
    }
  }, [user, mutate]);

  const unreadCount = notifications?.filter(n => !n.isRead && !n.archived).length || 0;

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
  };
}

// Legacy hook for backward compatibility
export function useNotifications() {
  return useNotificationsEnhanced();
}
