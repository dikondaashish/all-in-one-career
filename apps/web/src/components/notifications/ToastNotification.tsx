'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/hooks/useNotifications';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({ 
  notification, 
  onClose, 
  duration = 5000 
}: ToastNotificationProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleView = () => {
    if (notification.metadata?.url) {
      router.push(notification.metadata.url);
    }
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FEATURE':
        return '🚀';
      case 'SYSTEM':
        return '⚙️';
      case 'TASK':
        return '📋';
      case 'PROMOTION':
        return '🎉';
      default:
        return '📢';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FEATURE':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'SYSTEM':
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
      case 'TASK':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'PROMOTION':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`
      fixed bottom-4 right-4 w-80 max-w-sm bg-white dark:bg-gray-800 
      border-l-4 shadow-lg rounded-lg z-50 transform transition-all duration-300 ease-in-out
      ${getTypeColor(notification.type)}
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getTypeIcon(notification.type)}</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-4">
        <button
          onClick={handleView}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View
        </button>
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(notification.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
}
