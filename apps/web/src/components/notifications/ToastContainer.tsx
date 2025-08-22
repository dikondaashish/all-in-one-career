'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from './Toast';

interface ToastData {
  id: string;
  icon?: string;
  title: string;
  message: string;
  ctaText?: string;
  duration?: number;
  onView?: () => void;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toastData, id };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      
      {/* Toast Container - Responsive positioning for different screen sizes */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm sm:max-w-md md:max-w-sm">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              top: `${index * 80}px`,
              position: 'relative'
            }}
          >
            <Toast
              id={toast.id}
              icon={toast.icon}
              title={toast.title}
              message={toast.message}
              ctaText={toast.ctaText}
              duration={toast.duration}
              onView={toast.onView}
              onDismiss={dismissToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
