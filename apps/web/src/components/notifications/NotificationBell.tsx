'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Archive, RotateCcw } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'unread' | 'all' | 'archived';

export default function NotificationBell() {
  const [currentFilter, setCurrentFilter] = useState<FilterType>('unread');
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification,
    unarchiveNotification,
    isLoading 
  } = useNotifications(currentFilter);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    if (currentFilter === 'unread') {
      await markAsRead(notificationId);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleArchive = async (notificationId: string) => {
    await archiveNotification(notificationId);
  };

  const handleUnarchive = async (notificationId: string) => {
    await unarchiveNotification(notificationId);
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

  const getFilterButtonClass = (filter: FilterType) => {
    return `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      currentFilter === filter
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    }`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentFilter('unread')}
              className={getFilterButtonClass('unread')}
            >
              Unread
            </button>
            <button
              onClick={() => setCurrentFilter('all')}
              className={getFilterButtonClass('all')}
            >
              All
            </button>
            <button
              onClick={() => setCurrentFilter('archived')}
              className={getFilterButtonClass('archived')}
            >
              Archived
            </button>
          </div>

          {/* Mark All Read Button */}
          {currentFilter === 'unread' && unreadCount > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleMarkAllRead}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No {currentFilter} notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.isRead && !notification.archived ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className="text-lg">{getTypeIcon(notification.type)}</div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        {!notification.isRead && !notification.archived && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <h4 className={`text-sm font-medium mb-1 ${
                        !notification.isRead && !notification.archived
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {!notification.isRead && currentFilter === 'unread' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification.id);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          {!notification.archived ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(notification.id);
                              }}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnarchive(notification.id);
                              }}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Unarchive"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
