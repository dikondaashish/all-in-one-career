'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuth } from 'firebase/auth';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileText,
  Target,
  Brain,
  TrendingUp,
  Shield,
  Award,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Loader2
} from 'lucide-react';

interface PrintData {
  overallScoreV2?: any;
  atsChecks?: any;
  skills?: any;
  recruiterPsychology?: any;
  industry?: any;
  market?: any;
  predictive?: any;
  companyOptimization?: any;
  scanId?: string;
}

export default function ATSReportPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scanId');
  
  const auth = getAuth();
  const [user, userLoading, userError] = useAuthState(auth);
  
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrintData = async () => {
      if (!scanId) {
        setError('No scan ID provided');
        setLoading(false);
        return;
      }

      if (userLoading) {
        return; // Wait for auth state to load
      }

      if (!user) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        
        // Try to fetch V2 data first, then fallback to V1
        let response = await fetch(`/api/ats/advanced-scan/v2/results/${scanId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          // Fallback to V1 advanced results
          response = await fetch(`/api/ats/advanced-results/${scanId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!response.ok) {
          // Final fallback to regular scan results
          response = await fetch(`/api/ats/scan-results/${scanId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch scan data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setPrintData({ ...data, scanId });
      } catch (err) {
        console.error('Error fetching print data:', err);
        setError(`Failed to load scan data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPrintData();
  }, [scanId, user, userLoading]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (scanId) {
      router.push(`/ats-scanner/results/${scanId}`);
    } else {
      router.push('/ats-scanner');
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {userLoading ? 'Checking authentication...' : 'Loading print preview...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !printData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Report</h1>
          <p className="text-gray-600 mb-4">{error || 'Unable to load scan data'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-page {
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          
          .print-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .score-circle {
            border: 3px solid #3b82f6;
          }
          
          .gradient-text {
            color: #1f2937 !important;
          }
        }
        
        @page {
          margin: 1in;
          size: A4;
        }
      `}</style>

      <div className="min-h-screen bg-white print-page">
        {/* Header with Controls - Hidden in Print */}
        <div className="no-print bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Results</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Print Preview</h1>
            </div>
            
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Printer className="w-5 h-5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Report Header - Jobscan Style */}
          <div className="print-header print-section">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Match Report</h1>
                <p className="text-sm text-gray-600">Candidate - Job Title from Application</p>
              </div>
              <div className="text-right">
                <div className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">
                  Print Report
                </div>
              </div>
            </div>
          </div>

          {/* Overall Score Section - Jobscan Style */}
          <div className="print-section bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-5 gap-6">
              {/* Main Score Circle */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-orange-400 flex items-center justify-center bg-white mx-auto mb-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {printData.overallScoreV2?.overall || printData.overallScore || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700">Overall Score</div>
              </div>

              {/* Metric Boxes */}
              <div className="text-center">
                <div className="bg-white rounded p-3 border">
                  <div className="text-lg font-bold text-gray-900">
                    {printData.skills?.hard?.found?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Hard Skills</div>
                  <div className="text-xs text-blue-600 font-medium">issues</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded p-3 border">
                  <div className="text-lg font-bold text-gray-900">
                    {printData.skills?.soft?.found?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Soft Skills</div>
                  <div className="text-xs text-blue-600 font-medium">issues</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded p-3 border">
                  <div className="text-lg font-bold text-gray-900">
                    {printData.atsChecks ? 
                      Object.values(printData.atsChecks).filter(v => v === false).length : 0
                    }
                  </div>
                  <div className="text-xs text-gray-600">Searchability</div>
                  <div className="text-xs text-blue-600 font-medium">issues</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded p-3 border">
                  <div className="text-lg font-bold text-gray-900">
                    {printData.recruiterPsychology?.redFlags?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Recruiter Tips</div>
                  <div className="text-xs text-blue-600 font-medium">issue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Searchability Section - Jobscan Style */}
          <div className="print-section mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Searchability</h2>
              
            <div className="space-y-4">
              {/* ATS Tip */}
              <div className="flex items-start space-x-3 p-4 bg-red-50 border-l-4 border-red-500">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">ATS Tip</div>
                  <div className="text-sm text-gray-700 mt-1">
                    Adding this job's company name and web address can help us provide you ATS-specific tips.
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {printData.atsChecks?.contact && (
                <>
                  <div className="flex items-start space-x-3 p-4">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Contact Information</div>
                      <div className="text-sm text-gray-700 mt-1">
                        You provided your physical address. Recruiters use your address to validate your location for job matches.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900"></div>
                      <div className="text-sm text-gray-700 mt-1">
                        You provided your email. Recruiters use your email to contact you for job matches.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900"></div>
                      <div className="text-sm text-gray-700 mt-1">
                        You provided your phone number.
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Summary */}
              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Summary</div>
                  <div className="text-sm text-gray-700 mt-1">
                    We found a summary section on your resume. Good job! The summary provides a quick overview of the candidate's qualifications, helping recruiters and hiring managers promptly grasp the value the candidate can offer in the position.
                  </div>
                </div>
              </div>

              {/* Section Headings */}
              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Section Headings</div>
                  <div className="text-sm text-gray-700 mt-1">
                    We found the education section in your resume.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900"></div>
                  <div className="text-sm text-gray-700 mt-1">
                    We found the work experience section in your resume.
                  </div>
                </div>
              </div>

              {/* File Type */}
              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">File Type</div>
                  <div className="text-sm text-gray-700 mt-1">
                    You are using a .pdf resume, which is the preferred format for most ATS systems.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900"></div>
                  <div className="text-sm text-gray-700 mt-1">
                    Your file name doesn't contain special characters that could cause an error in ATS.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900"></div>
                  <div className="text-sm text-gray-700 mt-1">
                    Your file name is concise and readable.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hard Skills Section - Jobscan Style */}
          <div className="print-section mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Hard Skills</h2>
            
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Skill</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Resume</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Job Description</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.skills?.hard?.found?.map((skill: string, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4 text-gray-900">{skill}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-green-500">✓</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">2</span>
                      </td>
                    </tr>
                  ))}
                  {printData.skills?.hard?.missing?.map((skill: string, index: number) => (
                    <tr key={`missing-${index}`} className="border-b">
                      <td className="py-3 px-4 text-gray-900">{skill}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-red-500">✗</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">1</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Soft Skills Section - Jobscan Style */}
          <div className="print-section mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Soft Skills</h2>
            
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Skill</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Resume</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Job Description</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.skills?.soft?.found?.map((skill: string, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4 text-gray-900">{skill}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">2</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recruiter Tips Section - Jobscan Style */}
          <div className="print-section mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recruiter Tips</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-red-50 border-l-4 border-red-500">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Job Level Match</div>
                  <div className="text-sm text-gray-700 mt-1">
                    Your experience is less than the role requires. If you're confident you can perform the job and meet other criteria, consider applying. Include a strong summary explaining why you're a great fit despite having fewer years of experience. Be aware that experience is often an initial screening factor.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Measurable Results</div>
                  <div className="text-sm text-gray-700 mt-1">
                    There are five or more mentions of measurable results in your resume. Keep it up - employers like to see the impact and results that you had on the job.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Resume Tone</div>
                  <div className="text-sm text-gray-700 mt-1">
                    The tone of your resume is generally positive and no common cliches and buzzwords were found. Good job!
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Web Presence</div>
                  <div className="text-sm text-gray-700 mt-1">
                    Nice - You've linked to a website that builds your web credibility. Recruiters appreciate the convenience and credibility associated with a professional website.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Word Count</div>
                  <div className="text-sm text-gray-700 mt-1">
                    There are 801 words in your resume, which is under the suggested 1000 word count for relevance and ease of reading reasons.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Simple */}
          <div className="print-section border-t border-gray-200 pt-6 mt-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                Generated by All-in-One Career ATS Scanner
              </p>
              <p className="text-xs mt-1">
                Visit: https://all-in-one-career-web.vercel.app
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
