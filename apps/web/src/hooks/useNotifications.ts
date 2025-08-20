import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '@/contexts/AuthContext';

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
  // Optional deep-link support if backend provides it
  url?: string;
  metadata?: {
    url?: string;
    [key: string]: unknown;
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

export type NotificationTab = 'unread' | 'all' | 'archived';

export function useNotifications(tab: NotificationTab = 'unread') {
  const { user } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();

  const { data: notifications, error, isLoading, mutate } = useSWR(
    user ? [`/api/notifications?tab=${tab}`, user] : null,
    async ([url, user]) => {
      const token = await user.getIdToken();
      return fetcher(url, token);
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Separate fetch for unread count to keep badge accurate regardless of current tab
  const { data: unreadList } = useSWR(
    user ? ['/api/notifications?tab=unread', user] : null,
    async ([url, user]) => {
      const token = await user.getIdToken();
      return fetcher(url, token);
    },
    { refreshInterval: 30000 }
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
        globalMutate(['/api/notifications?tab=unread', user]);
        globalMutate(['/api/notifications?tab=all', user]);
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
        // Also refresh unread list
        globalMutate(['/api/notifications?tab=unread', user]);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const archiveNotification = async (notification: Notification) => {
    if (!user) return;
    const id = notification.id;

    // Optimistic update: remove from current list
    const previous = notifications || [];
    mutate(prev => (prev || []).filter(n => n.id !== id), { revalidate: false });

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Archive failed');
      }

      // Revalidate current tab and preload archived tab
      mutate();
      globalMutate([`/api/notifications?tab=archived`, user]);
      globalMutate([`/api/notifications?tab=all`, user]);
      globalMutate([`/api/notifications?tab=unread`, user]);
    } catch (error) {
      console.error('Error archiving notification:', error);
      // Rollback on failure
      mutate(previous, { revalidate: false });
    }
  };

  const restoreNotification = async (notification: Notification) => {
    if (!user) return;
    const id = notification.id;

    // Optimistic update: remove from archived list
    const previous = notifications || [];
    mutate(prev => (prev || []).filter(n => n.id !== id), { revalidate: false });

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Restore failed');
      }

      // Revalidate affected tabs
      mutate();
      globalMutate([`/api/notifications?tab=archived`, user]);
      globalMutate([`/api/notifications?tab=all`, user]);
      globalMutate([`/api/notifications?tab=unread`, user]);
    } catch (error) {
      console.error('Error restoring notification:', error);
      // Rollback on failure
      mutate(previous, { revalidate: false });
    }
  };

  const unreadCount = (unreadList || []).length;

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    restoreNotification,
    unreadNotifications: unreadList || [],
    mutate,
  };
}
