'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationToast from './NotificationToast';

interface ToastNotification {
  id: string;
  type: string;
  title: string;
  message: string;
}

export default function NotificationToastManager() {
  const { notifications, markAsRead } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<ToastNotification[]>([]);
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set());

  // Detect new notifications and show toasts
  useEffect(() => {
    if (notifications.length > 0) {
      const currentIds = new Set(notifications.map(n => n.id));
      
      // Find new unread notifications
      const newUnreadNotifications = notifications.filter(
        n => !previousNotificationIds.has(n.id) && !n.isRead && !n.archived
      );

      // Add new notifications to active toasts
      if (newUnreadNotifications.length > 0) {
        const newToasts = newUnreadNotifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
        }));

        setActiveToasts(prev => [...prev, ...newToasts]);
      }

      // Update previous notification IDs
      setPreviousNotificationIds(currentIds);
    }
  }, [notifications, previousNotificationIds]);

  const handleCloseToast = (toastId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    handleCloseToast(notificationId);
  };

  // Don't render anything if no active toasts
  if (activeToasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {activeToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 20}px)`,
            zIndex: 1000 - index,
          }}
        >
          <NotificationToast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={handleCloseToast}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>
      ))}
    </div>
  );
}
