'use client';

import { useState, useContext, createContext, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

interface ConfirmationContextType {
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}

interface ConfirmationProviderProps {
  children: ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default'
  });

  const showConfirmation = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        isOpen: true,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
        resolve
      });
    });
  };

  const handleClose = (confirmed: boolean) => {
    setState(prev => ({ ...prev, isOpen: false }));
    if (state.resolve) {
      state.resolve(confirmed);
    }
  };

  return (
    <ConfirmationContext.Provider value={{ showConfirmation }}>
      {children}
      
      {/* Confirmation Dialog */}
      {state.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => handleClose(false)}
          />
          
          {/* Dialog */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              {state.variant === 'destructive' ? (
                <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {state.title}
                </h3>
                <button
                  onClick={() => handleClose(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                {state.message}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                {state.cancelText}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  state.variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}
