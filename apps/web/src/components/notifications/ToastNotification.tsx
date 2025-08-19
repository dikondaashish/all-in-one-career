'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ToastNotificationProps {
  id: string;
  title: string;
  message: string;
  type: string;
  metadata?: {
    url?: string;
    action?: string;
  };
  onClose: (id: string) => void;
  onView: (id: string) => void;
}

export default function ToastNotification({
  id,
  title,
  message,
  type,
  metadata,
  onClose,
  onView
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  // Auto-hide after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for fade out animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const handleView = () => {
    onView(id);
    if (metadata?.url) {
      router.push(metadata.url);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(type)}</span>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
            {title}
          </h4>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleView}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}

function getTypeIcon(type: string) {
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
}
