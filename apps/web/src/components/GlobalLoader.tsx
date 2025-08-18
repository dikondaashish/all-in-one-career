'use client';

interface GlobalLoaderProps {
  message?: string;
}

export default function GlobalLoader({ message = 'Loading...' }: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006B53] mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
