'use client';

import { useToast } from '@/components/notifications/ToastContainer';

export default function ToastTest() {
  const { showToast } = useToast();

  const testToasts = [
    {
      title: 'Settings Updated',
      message: 'Your notification preferences have been saved successfully.',
      icon: '⚙️'
    },
    {
      title: 'Profile Updated',
      message: 'Your first name has been updated successfully.',
      icon: '👤'
    },
    {
      title: 'Profile Updated',
      message: 'Your last name has been updated successfully.',
      icon: '👤'
    },
    {
      title: 'Success',
      message: 'This is a test toast notification to verify positioning is working correctly at the top-right of the screen.',
      icon: '✅'
    }
  ];

  const handleTestToast = (index: number) => {
    showToast(testToasts[index]);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 Toast Positioning Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click these buttons to test toast notifications. They should appear at the top-right of your screen.
      </p>
      <div className="space-y-2">
        {testToasts.map((toast, index) => (
          <button
            key={index}
            onClick={() => handleTestToast(index)}
            className="block w-full text-left p-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg mr-2">{toast.icon}</span>
            <span className="font-medium">{toast.title}</span>
            <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
