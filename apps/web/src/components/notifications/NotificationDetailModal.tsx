'use client';

import { useState } from 'react';
import { X, ExternalLink, Paperclip, Calendar, Check } from 'lucide-react';
import { Notification } from '@/hooks/useNotificationsEnhanced';
import { formatDistanceToNow, format } from 'date-fns';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead
}: NotificationDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !notification) return null;

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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'SYSTEM':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'TASK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PROMOTION':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleMarkAsRead = async () => {
    if (notification.isRead || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionClick = () => {
    if (notification.metadata?.url) {
      window.open(notification.metadata.url, '_blank');
      // Mark as read when user takes action
      if (!notification.isRead) {
        handleMarkAsRead();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-lg">
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">
              {getTypeIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {notification.title}
              </h2>
              
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                  {notification.type}
                </span>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(notification.createdAt), 'PPp')}
                  </span>
                </div>
                
                <span>
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                {!notification.isRead && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Unread
                  </span>
                )}
                
                {notification.archived && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    Archived
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Message
            </h4>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {notification.message}
            </p>
          </div>
          
          {/* Additional Details */}
          {notification.metadata?.details && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Additional Details
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {typeof notification.metadata.details === 'object' 
                  ? Object.entries(notification.metadata.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-blue-100 dark:border-blue-800 last:border-b-0">
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-right">
                          {String(value)}
                        </span>
                      </div>
                    ))
                  : <p className="text-gray-700 dark:text-gray-300">{notification.metadata.details}</p>
                }
              </div>
            </div>
          )}
          
          {/* Attachments */}
          {notification.metadata?.attachments && notification.metadata.attachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Attachments
              </h4>
              <div className="space-y-2">
                {notification.metadata.attachments.map((attachment, index) => (
                  <a 
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {attachment.name}
                      </p>
                      {attachment.type && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {attachment.type}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-lg">
          <div className="flex gap-3 justify-end">
            {/* Primary action button */}
            {notification.metadata?.url && (
              <button
                onClick={handleActionClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {notification.metadata.actionText || 'View Details'}
              </button>
            )}
            
            {/* Mark as read */}
            <button 
              onClick={handleMarkAsRead}
              disabled={notification.isRead || isProcessing}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                notification.isRead || isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              {notification.isRead ? 'Already Read' : isProcessing ? 'Marking...' : 'Mark as Read'}
            </button>
            
            {/* Close */}
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
