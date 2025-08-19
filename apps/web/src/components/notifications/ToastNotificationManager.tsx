'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import ToastNotification from './ToastNotification';

export default function ToastNotificationManager() {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<Array<{ id: string; notification: Notification }>>([]);
  const previousNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Get current notification IDs
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    
    // Find new unread notifications that weren't there before
    const newNotifications = notifications.filter(notification => {
      const isNew = !previousNotificationsRef.current.has(notification.id);
      const isUnread = !notification.isRead && !notification.archived;
      return isNew && isUnread;
    });

    // Add new toast notifications
    newNotifications.forEach(notification => {
      setActiveToasts(prev => [...prev, { 
        id: notification.id, 
        notification 
      }]);
    });

    // Update previous notifications reference
    previousNotificationsRef.current = currentNotificationIds;
  }, [notifications]);

  const removeToast = (toastId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  // Limit to 3 active toasts at a time
  const visibleToasts = activeToasts.slice(0, 3);

  return (
    <>
      {visibleToasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast.notification}
          onClose={() => removeToast(toast.id)}
          duration={5000}
        />
      ))}
    </>
  );
}
