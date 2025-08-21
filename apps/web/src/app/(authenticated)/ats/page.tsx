'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface ScanResult {
  score: number;
  feedback: string[];
}

interface TailorResult {
  tailoredResume: string;
}

export default function ATSPage() {
  // STEP 6: Wrap ATS page with ProtectedRoute to prevent flashing
  return (
    <ProtectedRoute>
      <ATSContent />
    </ProtectedRoute>
  );
}

function ATSContent() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

  const handleScan = async () => {
    if (!resumeText.trim()) return;
    
    setIsScanning(true);
    // Simulate API call
    setTimeout(() => {
      setScanResult({
        score: 85,
        feedback: [
          'Keywords "React" and "TypeScript" found - good match',
          'Consider adding more quantifiable achievements',
          'Action verbs are strong and specific'
        ]
      });
      setIsScanning(false);
    }, 2000);
  };

  const handleTailor = async () => {
    if (!resumeText.trim() || !jdText.trim()) return;
    
    setIsTailoring(true);
    // Simulate API call
    setTimeout(() => {
      setTailorResult({
        tailoredResume: 'Tailored resume content would appear here...'
      });
      setIsTailoring(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ATS Scanner</h1>
            <p className="text-gray-600">Optimize your resume for Applicant Tracking Systems</p>
          </div>
        </div>
        
        {/* Advanced ATS Link */}
        <button
          onClick={() => router.push('/ats/advanced')}
          className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center space-x-2">
            <span>🚀 Try Advanced Scanner</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resume Input */}
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Resume Text</h3>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Job Description Input */}
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleScan}
          disabled={!resumeText.trim() || isScanning}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScanning ? 'Scanning...' : 'Scan Resume'}
        </button>
        
        <button
          onClick={handleTailor}
          disabled={!resumeText.trim() || !jdText.trim() || isTailoring}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTailoring ? 'Tailoring...' : 'Tailor Resume'}
        </button>
      </div>

      {/* Results */}
      {scanResult && (
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Scan Results</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold text-green-600 mb-2">{scanResult.score}%</div>
            <div className="text-gray-600">ATS Compatibility Score</div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Feedback:</h4>
            <ul className="space-y-2">
              {scanResult.feedback.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tailorResult && (
        <div className="backdrop-blur-lg bg-white/30 rounded-[16px] shadow-xl border border-white/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Tailored Resume</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-gray-700">{tailorResult.tailoredResume}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
