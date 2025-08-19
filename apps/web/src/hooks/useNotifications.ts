import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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
  metadata?: {
    action?: string;
    url?: string;
    [key: string]: unknown;
  };
}

export type NotificationFilter = 'unread' | 'all' | 'archived';

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
  const [filter, setFilter] = useState<NotificationFilter>('unread');

  const { data: notifications, error, isLoading, mutate } = useSWR(
    user ? [`/api/notifications?filter=${filter}`, user] : null,
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
      const response = await fetch(`${API_BASE_URL}/api/notifications/archive/${notificationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const unarchiveNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/unarchive/${notificationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error unarchiving notification:', error);
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead && !n.archived).length || 0;

  return {
    notifications: notifications || [],
    unreadCount,
    filter,
    setFilter,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    unarchiveNotification,
    mutate,
  };
}
