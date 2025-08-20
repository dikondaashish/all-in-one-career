import { useEffect, useRef } from 'react';
import { useNotifications, Notification } from './useNotifications';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useNotificationToasts() {
  const { allNotifications, markAsRead } = useNotifications('all');
  const previousNotifications = useRef<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Skip on first load
    if (previousNotifications.current.length === 0) {
      previousNotifications.current = allNotifications;
      return;
    }

    // Find new unread notifications
    const newUnreadNotifications = allNotifications.filter(notification => 
      !notification.isRead && 
      !notification.archived && 
      !previousNotifications.current.some(prev => prev.id === notification.id)
    );

    // Show toast for each new notification
    newUnreadNotifications.forEach(notification => {
      const message = `${notification.title}: ${notification.message.length > 100 
        ? `${notification.message.substring(0, 100)}...` 
        : notification.message}`;

      const toastId = toast.success(
        message,
        {
          duration: 8000,
          position: 'bottom-right',
          style: {
            background: '#10B981',
            color: '#fff',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: '400px',
          },
        }
      );

      // Add click handler to navigate to URL if available
      if (notification.metadata?.url) {
        // Store the notification data for later use
        const notificationData = { id: notification.id, url: notification.metadata.url };
        
        // We'll handle the click through a custom event or store it in a way that can be accessed
        // For now, just show the toast and let user click the notification bell to see details
      }
    });

    // Update previous notifications
    previousNotifications.current = allNotifications;
  }, [allNotifications, markAsRead, router]);
}
