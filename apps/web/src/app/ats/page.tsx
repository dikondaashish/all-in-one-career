'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ScanResult {
  score: number;
  feedback: string[];
}

interface TailorResult {
  tailoredResume: string;
}

export default function ATSPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleScan = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError('Please enter both resume and job description text');
      return;
    }

    setIsScanning(true);
    setError('');
    setScanResult(null);
    setTailorResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ats/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ resumeText, jdText }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan resume');
      }

      const result = await response.json();
      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTailor = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError('Please enter both resume and job description text');
      return;
    }

    setIsTailoring(true);
    setError('');
    setTailorResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ats/tailor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ resumeText, jdText }),
      });

      if (!response.ok) {
        throw new Error('Failed to tailor resume');
      }

      const result = await response.json();
      setTailorResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              ATS Scanner & Tailor
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                  Resume Text
                </label>
                <textarea
                  id="resume"
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="jd" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  id="jd"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste the job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {isScanning ? 'Scanning...' : 'Scan Resume'}
                </button>
                <button
                  onClick={handleTailor}
                  disabled={isTailoring}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {isTailoring ? 'Tailoring...' : 'Tailor Resume'}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {/* Scan Results */}
              {scanResult && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Results</h3>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Match Score:</span>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${scanResult.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 ml-2">{scanResult.score}%</span>
                    </div>
                  </div>
                  {scanResult.feedback && scanResult.feedback.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Feedback:</span>
                      <ul className="mt-2 space-y-1">
                        {scanResult.feedback.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tailor Results */}
              {tailorResult && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tailored Resume</h3>
                  <textarea
                    rows={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={tailorResult.tailoredResume}
                    readOnly
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(tailorResult.tailoredResume)}
                    className="mt-3 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
