'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, CheckSquare, Settings, Zap, Clock, CheckCheck, MoreVertical, RotateCcw, Archive, Reply, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/contexts/AuthContext';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'MESSAGE':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'TASK':
      return <CheckSquare className="w-4 h-4 text-green-500" />;
    case 'SYSTEM':
      return <Settings className="w-4 h-4 text-gray-500" />;
    case 'FEATURE':
      return <Zap className="w-4 h-4 text-purple-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SYSTEM' | 'TASK' | 'FEATURE' | 'MESSAGE'>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markAllAsRead, markAsRead, showArchived, setShowArchived, refresh } = useNotifications();
  const { connectionStatus } = useRealtimeNotifications();
  const { getAuthToken } = useAuth();
  const token = getAuthToken();
  const API_URL = process.env.NODE_ENV === 'production' ? 'https://all-in-one-career-api.onrender.com' : 'http://localhost:4000';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {connectionStatus === 'connected' && (
            <div className="relative group">
              <Wifi className="w-3 h-3 text-green-500" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Real-time connected
              </div>
            </div>
          )}
          {connectionStatus === 'reconnecting' && (
            <div className="relative group">
              <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Reconnecting...
              </div>
            </div>
          )}
          {connectionStatus === 'polling' && (
            <div className="relative group">
              <WifiOff className="w-3 h-3 text-gray-400" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Using polling fallback
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-gray-100 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              
              {/* Connection Status */}
              <div className="flex items-center gap-1 text-xs">
                {connectionStatus === 'connected' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-3 h-3" />
                    Real-time
                  </span>
                )}
                {connectionStatus === 'reconnecting' && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Reconnecting...
                  </span>
                )}
                {connectionStatus === 'polling' && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <WifiOff className="w-3 h-3" />
                    Polling
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    await fetch(`${API_URL}/api/notifications/archive-all`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ olderThanDays: 0 })
                    });
                    refresh();
                  } catch (err) {
                    console.error('Archive all failed', err);
                  }
                }}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Archive all
              </button>
            </div>
          </div>

          {/* Active / Archived Tabs */}
          <div className="px-3 pt-2 pb-1 border-b border-gray-100 flex items-center gap-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !showArchived ? 'bg-[#0E8F6B] text-white border-[#0E8F6B]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                showArchived ? 'bg-[#0E8F6B] text-white border-[#0E8F6B]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Archived
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="px-3 pt-2 pb-1 border-b border-gray-100 flex flex-wrap gap-2">
            {([
              { key: 'ALL', label: 'All' },
              { key: 'SYSTEM', label: 'System' },
              { key: 'TASK', label: 'Task' },
              { key: 'FEATURE', label: 'Promotion' },
              { key: 'MESSAGE', label: 'Activity' },
            ] as const).map((chip) => (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(chip.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeFilter === chip.key
                    ? 'bg-[#0E8F6B] text-white border-[#0E8F6B]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We&apos;ll notify you when something happens</p>
              </div>
            ) : (
              <div className="py-1">
                {(activeFilter === 'ALL' 
                  ? notifications 
                  : notifications.filter(n => n.type === activeFilter)
                ).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 transition-colors ${
                      notification.isRead 
                        ? 'border-l-transparent' 
                        : 'border-l-blue-500 bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          notification.isRead 
                            ? 'text-gray-900' 
                            : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {/* Inline actions */}
                        {notification.metadata?.actionType === 'reply' && !showArchived && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await fetch(`${API_URL}/api/notifications/action`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                  },
                                  body: JSON.stringify({ id: notification.id, action: 'reply' })
                                });
                              } catch (err) {
                                console.error('Failed to perform action', err);
                              }
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      {/* Item menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === notification.id ? null : notification.id); }}
                          className="p-1 rounded hover:bg-gray-100"
                          aria-label="More"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === notification.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow">
                            {!showArchived ? (
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await fetch(`${API_URL}/api/notifications/archive`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                      },
                                      body: JSON.stringify({ id: notification.id })
                                    });
                                    setOpenMenuId(null);
                                    refresh();
                                  } catch (err) {
                                    console.error('Archive failed', err);
                                  }
                                }}
                              >
                                <Archive className="w-4 h-4 text-gray-500" /> Archive
                              </button>
                            ) : (
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await fetch(`${API_URL}/api/notifications/restore`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                      },
                                      body: JSON.stringify({ id: notification.id })
                                    });
                                    setOpenMenuId(null);
                                    refresh();
                                  } catch (err) {
                                    console.error('Restore failed', err);
                                  }
                                }}
                              >
                                <RotateCcw className="w-4 h-4 text-gray-500" /> Restore
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium w-full text-center">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
