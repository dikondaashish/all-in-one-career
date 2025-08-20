import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useEffect } from 'react';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  archived: boolean;
  metadata?: {
    url?: string;
    [key: string]: any;
  };
}

export type NotificationFilter = 'unread' | 'all' | 'archived';

const fetcher = async (url: string, token: string): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  return response.json();
};

export function useNotifications(filter: NotificationFilter = 'unread') {
  const { user } = useAuth();
  const previousNotifications = useRef<Notification[]>([]);

  const { data: notifications, error, isLoading, mutate } = useSWR(
    user ? ['/api/notifications', user] : null,
    async ([url, user]) => {
      const token = await user.getIdToken();
      return fetcher(url, token);
    },
    { 
      refreshInterval: 30000, 
      revalidateOnFocus: true, 
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        // Track new notifications for toast popups
        if (previousNotifications.current.length > 0 && data) {
          const newUnreadNotifications = data.filter(n => 
            !n.isRead && 
            !n.archived && 
            !previousNotifications.current.some(prev => prev.id === n.id)
          );
          
          // Store current notifications for next comparison
          previousNotifications.current = data;
          
          // Return new notifications for toast handling
          return newUnreadNotifications;
        }
        
        // Store initial notifications
        previousNotifications.current = data || [];
        return [];
      }
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
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Optimistically update the local state
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
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications?.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead && !notification.archived;
      case 'all':
        return true;
      case 'archived':
        return notification.archived;
      default:
        return !notification.isRead && !notification.archived;
    }
  }) || [];

  const unreadCount = notifications?.filter(n => !n.isRead && !n.archived).length || 0;

  return { 
    notifications: filteredNotifications, 
    allNotifications: notifications || [],
    unreadCount, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    mutate,
    filter 
  };
}
