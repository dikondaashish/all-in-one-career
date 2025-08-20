'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, MoreVertical, Archive, ArchiveRestore } from 'lucide-react';
import { useNotificationsEnhanced, type NotificationTab, type Notification } from '@/hooks/useNotificationsEnhanced';
import { useToast } from '@/components/notifications/ToastContainer';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('unread');
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Hook for handling new notifications and toasts
  const handleNewNotification = (notification: Notification) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'FEATURE': return '🚀';
        case 'SYSTEM': return '⚙️';
        case 'TASK': return '📋';
        case 'PROMOTION': return '🎉';
        default: return '📢';
      }
    };

    showToast({
      icon: getTypeIcon(notification.type),
      title: notification.title,
      message: notification.message,
      ctaText: 'View',
      onView: () => {
        setIsOpen(true);
        setActiveTab('unread');
        markAsRead(notification.id);
      }
    });
  };

  // Use enhanced hook with current tab and toast handler
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification, 
    restoreNotification, 
    isLoading 
  } = useNotificationsEnhanced({ 
    tab: activeTab, 
    onNewNotification: handleNewNotification 
  });

  // Get unread count for all notifications (not just current tab)
  const { unreadCount: totalUnreadCount } = useNotificationsEnhanced({ tab: 'unread' });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification(notificationId);
      setActiveMenuId(null);
      showToast({
        icon: '📦',
        title: 'Notification Archived',
        message: 'Notification has been moved to archive.'
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      showToast({
        icon: '❌',
        title: 'Archive Failed',
        message: 'Failed to archive notification. Please try again.'
      });
    }
  };

  const handleRestore = async (notificationId: string) => {
    try {
      await restoreNotification(notificationId);
      setActiveMenuId(null);
      showToast({
        icon: '📬',
        title: 'Notification Restored',
        message: 'Notification has been restored from archive.'
      });
    } catch (error) {
      console.error('Error restoring notification:', error);
      showToast({
        icon: '❌',
        title: 'Restore Failed',
        message: 'Failed to restore notification. Please try again.'
      });
    }
  };

  const toggleMenu = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === notificationId ? null : notificationId);
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
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
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
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'unread' as NotificationTab, label: 'Unread', count: totalUnreadCount },
              { key: 'all' as NotificationTab, label: 'All' },
              { key: 'archived' as NotificationTab, label: 'Archived' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {tab.count > 9 ? '9+' : tab.count}
                    </span>
                  )}
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>

          {/* Mark All Read Button */}
          {activeTab === 'unread' && unreadCount > 0 && (
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
                {activeTab === 'unread' && 'No unread notifications'}
                {activeTab === 'all' && 'No notifications'}
                {activeTab === 'archived' && 'No archived notifications'}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
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
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <h4 className={`text-sm font-medium mb-1 ${
                        !notification.isRead 
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
                        
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification.id);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Three-dot menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => toggleMenu(notification.id, e)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {activeMenuId === notification.id && (
                              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
                                {activeTab === 'archived' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestore(notification.id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <ArchiveRestore className="w-4 h-4" />
                                    Restore
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchive(notification.id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archive
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
