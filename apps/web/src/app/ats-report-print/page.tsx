'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Target,
  Award,
  Brain,
  BarChart3
} from 'lucide-react';

export default function ATSReportPrintPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scanId = searchParams?.get('scanId') || '';
  
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!scanId) {
      setError('No scan ID provided');
      setLoading(false);
      return;
    }
    fetchScanData();
  }, [scanId]);

  const fetchScanData = async () => {
    try {
      setLoading(true);
      let response = await fetch(`/api/ats/advanced-scan/v2/results/${scanId}`);
      let isV2 = true;
      
      if (!response.ok) {
        response = await fetch(`/api/ats/advanced-scan/results/${scanId}`);
        isV2 = false;
        if (!response.ok) {
          response = await fetch(`/api/ats/results/${scanId}`);
          isV2 = false;
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan results');
      }
      
      const data = await response.json();
      setScanData({ ...data, isV2 });
    } catch (err) {
      setError('Failed to load scan results');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Report</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Data Found</h1>
          <p className="text-gray-600">The requested scan results could not be found.</p>
        </div>
      </div>
    );
  }

  const overallScore = scanData.isV2 ? (scanData.overallScoreV2?.overall || 0) : (scanData.overallScore || 0);

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; background: white; }
          .print-header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 15px; }
          .print-section { margin-bottom: 25px; page-break-inside: avoid; }
          .print-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9f9f9; }
          .print-score { text-align: center; font-size: 24px; font-weight: bold; color: #333; border: 2px solid #333; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
          h1, h2, h3 { color: #333 !important; margin-bottom: 10px; }
        }
        @page { margin: 1in; size: letter; }
      `}</style>

      <div className="min-h-screen bg-white">
        <div className="no-print bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Results</span>
              </button>
              <div className="text-gray-400">|</div>
              <h1 className="text-lg font-semibold text-gray-900">Print Preview</h1>
            </div>
            
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <Printer className="w-5 h-5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        <div className="print-page max-w-4xl mx-auto px-6 py-8">
          <div className="print-header">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ATS Match Report</h1>
                <p className="text-lg text-gray-600">Comprehensive Resume Analysis</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Generated on</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
                {scanId && <p className="text-xs text-gray-400 mt-1">ID: {scanId}</p>}
              </div>
            </div>
          </div>

          <div className="print-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="print-score">
                  {Math.round(overallScore)}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">
                    {overallScore >= 90 ? 'Exceptional' : 
                     overallScore >= 80 ? 'Strong' : 
                     overallScore >= 70 ? 'Good' : 
                     overallScore >= 60 ? 'Fair' : 'Needs Work'}
                  </p>
                  <p className="text-sm text-gray-600">Overall ATS Score</p>
                </div>
              </div>
            </div>
          </div>

          <div className="print-section">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Analysis Summary
            </h2>
            
            <div className="print-card">
              <p className="text-sm mb-4">
                This comprehensive ATS analysis evaluates your resume against modern recruiting standards 
                and applicant tracking systems. The report includes foundational ATS compatibility, 
                skills matching, and optimization recommendations.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Analysis Date</h3>
                  <p className="text-sm">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Report Type</h3>
                  <p className="text-sm">{scanData.isV2 ? 'Advanced Analysis V2' : 'Standard Analysis'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="print-section">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Key Recommendations
            </h2>
            
            <div className="print-card">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>Optimize Keywords:</strong> Ensure your resume includes relevant industry keywords and skills.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>Format Consistency:</strong> Maintain consistent formatting throughout your resume.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>Contact Information:</strong> Ensure all contact details are complete and professional.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="print-section border-t pt-4 mt-8">
            <div className="text-center text-sm text-gray-500">
              <p>Generated by All-in-One Career ATS Scanner</p>
              <p>Advanced AI-powered resume analysis</p>
              <p className="mt-2">Visit: https://all-in-one-career-web.vercel.app</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
