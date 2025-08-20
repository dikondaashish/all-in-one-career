'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  id: string;
  icon?: string;
  title: string;
  message: string;
  ctaText?: string;
  duration?: number;
  onView?: () => void;
  onDismiss: (id: string) => void;
}

export default function Toast({
  id,
  icon = '📢',
  title,
  message,
  ctaText = 'View',
  duration = 5000,
  onView,
  onDismiss
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(id);
    }, 300);
  }, [id, onDismiss]);

  useEffect(() => {
    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  const handleView = () => {
    if (onView) {
      onView();
    }
    handleDismiss();
  };

  if (!isVisible) return null;

  // Truncate message to 100 characters
  const truncatedMessage = message.length > 100 
    ? message.substring(0, 100) + '...' 
    : message;

  return (
    <div
      className={`fixed right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm w-full z-50 transform transition-all duration-300 ${
        isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: isAnimating ? 'slideOut 0.3s ease-in-out' : 'slideIn 0.3s ease-in-out'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-lg flex-shrink-0 mt-0.5">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {truncatedMessage}
          </p>
          
          {/* Action Button */}
          {onView && (
            <button
              onClick={handleView}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {ctaText}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
