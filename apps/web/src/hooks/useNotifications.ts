import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'MESSAGE' | 'TASK' | 'SYSTEM' | 'FEATURE';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com' 
  : 'http://localhost:4000';

// Fetcher function with authentication
const fetcher = async (url: string, token: string | null): Promise<NotificationsResponse> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Mark all notifications as read
const markAllAsRead = async (token: string | null): Promise<void> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
};

// Mark single notification as read
const markAsRead = async (notificationId: string, token: string | null): Promise<void> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/notifications/mark-read/${notificationId}`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
};

export function useNotifications() {
  const { getAuthToken, isGuest } = useAuth();
  const token = getAuthToken();

  // Only fetch if user is authenticated (not guest)
  const shouldFetch = !isGuest && token;

  const { data, error, mutate, isLoading } = useSWR<NotificationsResponse>(
    shouldFetch ? ['/api/notifications', token] : null,
    ([url, authToken]: [string, string | null]) => fetcher(url, authToken),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAllAsRead = async () => {
    if (!token) return;

    try {
      await markAllAsRead(token);
      // Optimistically update the local state
      mutate({
        notifications: notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }, false);
      // Revalidate to get fresh data from server
      mutate();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await markAsRead(notificationId, token);
      // Optimistically update the local state
      mutate({
        notifications: notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1)
      }, false);
      // Revalidate to get fresh data from server
      mutate();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading: shouldFetch ? isLoading : false,
    error: shouldFetch ? error : null,
    markAllAsRead: handleMarkAllAsRead,
    markAsRead: handleMarkAsRead,
    refresh: mutate,
  };
}
