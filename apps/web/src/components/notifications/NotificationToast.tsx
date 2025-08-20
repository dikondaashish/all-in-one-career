'use client';

import { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationToastProps {
  id: string;
  type: string;
  title: string;
  message: string;
  onClose: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationToast({ 
  id, 
  type, 
  title, 
  message, 
  onClose, 
  onMarkAsRead 
}: NotificationToastProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for fade out animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const handleView = () => {
    onMarkAsRead(id);
    // For now, just close the toast
    // In the future, you can navigate to specific URLs based on notification type
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
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
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'SYSTEM':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
      case 'TASK':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'PROMOTION':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`
      fixed bottom-4 right-4 w-80 max-w-sm bg-white dark:bg-gray-800 
      border-l-4 shadow-lg rounded-lg z-50 transition-all duration-300 ease-in-out
      ${getTypeColor(type)}
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(type)}</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            type === 'FEATURE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            type === 'SYSTEM' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
            type === 'TASK' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            type === 'PROMOTION' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {type}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleView}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}
