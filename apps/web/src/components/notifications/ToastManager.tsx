'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import ToastNotification from './ToastNotification';

interface ToastNotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  metadata?: {
    url?: string;
    action?: string;
  };
}

export default function ToastManager() {
  const { notifications, markAsRead } = useNotifications('unread');
  const [toasts, setToasts] = useState<ToastNotificationData[]>([]);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  // Check for new notifications and show toasts
  useEffect(() => {
    const currentUnreadCount = notifications.filter(n => !n.isRead && !n.archived).length;
    
    if (currentUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
      // New notifications arrived - show toasts for the new ones
      const newNotifications = notifications
        .filter(n => !n.isRead && !n.archived)
        .slice(0, 3); // Show max 3 toasts at once
      
      newNotifications.forEach(notification => {
        // Check if toast already exists
        if (!toasts.find(t => t.id === notification.id)) {
          setToasts(prev => [...prev, {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            metadata: notification.metadata
          }]);
        }
      });
    }
    
    setPreviousUnreadCount(currentUnreadCount);
  }, [notifications, previousUnreadCount, toasts]);

  const handleCloseToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleViewToast = useCallback(async (id: string) => {
    // Mark notification as read when viewed
    await markAsRead(id);
    // Close the toast
    handleCloseToast(id);
  }, [markAsRead, handleCloseToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 20}px)`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            {...toast}
            onClose={handleCloseToast}
            onView={handleViewToast}
          />
        </div>
      ))}
    </div>
  );
}
