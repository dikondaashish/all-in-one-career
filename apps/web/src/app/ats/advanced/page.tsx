'use client';

import { Suspense } from 'react';
import ATSScanner from '@/components/ats/advanced/ATSScanner';

// Loading component
const ATSLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Loading Advanced ATS Scanner...
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Preparing the ultimate resume analysis tool
        </p>
      </div>
    </div>
  </div>
);

export default function AdvancedATSPage() {
  return (
    <Suspense fallback={<ATSLoading />}>
      <ATSScanner />
    </Suspense>
  );
}

// SEO Metadata
export const metadata = {
  title: 'Advanced ATS Scanner - All-in-One Career Platform',
  description: 'Comprehensive ATS analysis with dual-panel interface, file upload, URL extraction, keyword matching, and AI-powered recommendations.',
  keywords: 'ATS scanner, resume analysis, job matching, keyword optimization, career tools',
  openGraph: {
    title: 'Advanced ATS Scanner',
    description: 'Analyze your resume against job descriptions with our comprehensive ATS scanning tool',
    type: 'website',
  }
};
