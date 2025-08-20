'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastMessageProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function ToastMessage({ 
  message, 
  type, 
  onClose, 
  duration = 3000 
}: ToastMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) {
    return null;
  }

  const bgColor = type === 'success' 
    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  
  const textColor = type === 'success' 
    ? 'text-green-800 dark:text-green-200' 
    : 'text-red-800 dark:text-red-200';
  
  const iconColor = type === 'success' 
    ? 'text-green-500 dark:text-green-400' 
    : 'text-red-500 dark:text-red-400';

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 
      border rounded-lg shadow-lg transition-all duration-300 ease-in-out
      ${bgColor}
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="flex items-start p-4">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className={`w-5 h-5 ${iconColor}`} />
          ) : (
            <XCircle className={`w-5 h-5 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
