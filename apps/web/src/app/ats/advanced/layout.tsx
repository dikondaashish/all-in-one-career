import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advanced ATS Scanner - All-in-One Career Platform',
  description: 'Comprehensive ATS analysis with dual-panel interface, file upload, URL extraction, keyword matching, and AI-powered recommendations.',
  keywords: 'ATS scanner, resume analysis, job matching, keyword optimization, career tools',
  openGraph: {
    title: 'Advanced ATS Scanner',
    description: 'Analyze your resume against job descriptions with our comprehensive ATS scanning tool',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advanced ATS Scanner',
    description: 'Comprehensive resume analysis and job matching tool',
  }
};

export default function ATSAdvancedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
