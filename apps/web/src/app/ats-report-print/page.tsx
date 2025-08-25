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
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Report Header */}
          <div className="print-header print-section">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ATS Match Report</h1>
              <p className="text-lg text-gray-600">Comprehensive Resume Analysis</p>
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Generated: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                {scanId && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>Report ID: {scanId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall Score Section */}
          {printData.overallScoreV2 && (
            <div className="print-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-600" />
                Overall ATS Score
              </h2>
              
              <div className="bg-gray-50 rounded-xl p-8 mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="score-circle w-32 h-32 rounded-full flex items-center justify-center bg-white shadow-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">
                        {printData.overallScoreV2.overall}
                      </div>
                      <div className="text-sm font-medium text-gray-600">out of 100</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Score Analysis
                  </h3>
                  <p className="text-gray-600">
                    Confidence: {printData.overallScoreV2.confidence}% (±{printData.overallScoreV2.band} points)
                  </p>
                </div>

                {/* Score Breakdown */}
                {printData.overallScoreV2.breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'ATS Foundation', score: printData.overallScoreV2.breakdown.A, weight: '40%' },
                      { label: 'Skills Relevancy', score: printData.overallScoreV2.breakdown.B, weight: '35%' },
                      { label: 'Recruiter Appeal', score: printData.overallScoreV2.breakdown.C, weight: '10%' },
                      { label: 'Market Context', score: printData.overallScoreV2.breakdown.D, weight: '10%' },
                      { label: 'Future Ready', score: printData.overallScoreV2.breakdown.E, weight: '5%' }
                    ].map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 text-center border">
                        <div className="text-2xl font-bold text-gray-900">
                          {Math.round(item.score || 0)}
                        </div>
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          Weight: {item.weight}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ATS Foundation Analysis */}
          {printData.atsChecks && (
            <div className="print-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                ATS Foundation Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* File Quality */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">File Quality</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">File Type</span>
                      <div className="flex items-center">
                        {printData.atsChecks.fileTypeOk ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <span className="font-medium">
                          {printData.atsChecks.fileTypeOk ? 'Compatible' : 'Issues Found'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">File Name</span>
                      <div className="flex items-center">
                        {printData.atsChecks.fileNameOk ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <span className="font-medium">
                          {printData.atsChecks.fileNameOk ? 'Optimized' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Word Count</span>
                      <span className="font-medium">
                        {printData.atsChecks.wordCount || 'Unknown'} words
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {printData.atsChecks.contact && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-700">Email</span>
                        </div>
                        <div className="flex items-center">
                          {printData.atsChecks.contact.email ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          )}
                          <span className="font-medium">
                            {printData.atsChecks.contact.email ? 'Present' : 'Missing'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-700">Phone</span>
                        </div>
                        <div className="flex items-center">
                          {printData.atsChecks.contact.phone ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          )}
                          <span className="font-medium">
                            {printData.atsChecks.contact.phone ? 'Present' : 'Missing'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-700">Location</span>
                        </div>
                        <div className="flex items-center">
                          {printData.atsChecks.contact.location ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          )}
                          <span className="font-medium">
                            {printData.atsChecks.contact.location ? 'Present' : 'Missing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Analysis */}
          {printData.skills && (
            <div className="print-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Award className="w-6 h-6 mr-3 text-purple-600" />
                Skills Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Hard Skills */}
                {printData.skills.hard && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Hard Skills</h3>
                    
                    {printData.skills.hard.found?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-green-600 mb-2">
                          ✓ Skills Found ({printData.skills.hard.found.length})
                        </h4>
                        <div className="text-sm text-gray-700">
                          {printData.skills.hard.found.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {printData.skills.hard.missing?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-red-600 mb-2">
                          ✗ Skills Missing ({printData.skills.hard.missing.length})
                        </h4>
                        <div className="text-sm text-gray-700">
                          {printData.skills.hard.missing.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Soft Skills */}
                {printData.skills.soft && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Soft Skills</h3>
                    
                    {printData.skills.soft.found?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-blue-600 mb-2">
                          ✓ Skills Identified ({printData.skills.soft.found.length})
                        </h4>
                        <div className="text-sm text-gray-700">
                          {printData.skills.soft.found.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {printData.skills.soft.missing?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-orange-600 mb-2">
                          📋 Recommended Skills ({printData.skills.soft.missing.length})
                        </h4>
                        <div className="text-sm text-gray-700">
                          {printData.skills.soft.missing.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recruiter Psychology */}
          {printData.recruiterPsychology && (
            <div className="print-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-3 text-orange-600" />
                Recruiter Psychology Insights
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 6-Second Impression */}
                {typeof printData.recruiterPsychology.sixSecondImpression === 'number' && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">First Impression</h3>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {printData.recruiterPsychology.sixSecondImpression}
                    </div>
                    <div className="text-sm text-gray-600">6-Second Scan Score</div>
                  </div>
                )}

                {/* Narrative Coherence */}
                {typeof printData.recruiterPsychology.narrativeCoherence === 'number' && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Career Story</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {printData.recruiterPsychology.narrativeCoherence}
                    </div>
                    <div className="text-sm text-gray-600">Narrative Coherence</div>
                  </div>
                )}

                {/* Red Flags */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Red Flags</h3>
                  <div className="text-3xl font-bold mb-2">
                    {printData.recruiterPsychology.redFlags?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Issues Detected</div>
                </div>
              </div>

              {/* Language Analysis */}
              {printData.recruiterPsychology.authorityLanguage && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Language Analysis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {printData.recruiterPsychology.authorityLanguage.strong?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-green-600 mb-2">
                          ✓ Strong Action Words ({printData.recruiterPsychology.authorityLanguage.strong.length})
                        </h4>
                        <div className="text-sm text-gray-700">
                          {printData.recruiterPsychology.authorityLanguage.strong.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {printData.recruiterPsychology.authorityLanguage.weak?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-red-600 mb-2">
                          ⚠ Weak Language to Replace ({printData.recruiterPsychology.authorityLanguage.weak.length})
                        </h4>
                        <div className="text-sm text-gray-700">
                          {printData.recruiterPsychology.authorityLanguage.weak.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Market Intelligence */}
          {printData.industry && (
            <div className="print-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                Market Intelligence
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Industry Analysis */}
                {printData.industry.detected && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Industry Analysis</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-700">Primary Industry:</span>
                        <span className="font-medium ml-2">{printData.industry.detected.primary}</span>
                      </div>
                      {printData.industry.detected.secondary?.length > 0 && (
                        <div>
                          <span className="text-gray-700">Secondary:</span>
                          <span className="font-medium ml-2">{printData.industry.detected.secondary.join(', ')}</span>
                        </div>
                      )}
                      {printData.industry.detected.confidence && (
                        <div>
                          <span className="text-gray-700">Confidence:</span>
                          <span className="font-medium ml-2">{Math.round(printData.industry.detected.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Market Position */}
                {typeof printData.industry.marketPercentile === 'number' && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Market Position</h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {printData.industry.marketPercentile}th
                      </div>
                      <div className="text-sm text-gray-600">Percentile Ranking</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {printData.industry.trendingSkills?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Trending Skills</h3>
                    <div className="text-sm text-gray-700">
                      {printData.industry.trendingSkills.join(', ')}
                    </div>
                  </div>
                )}
                
                {printData.industry.decliningSkills?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📉 Declining Skills</h3>
                    <div className="text-sm text-gray-700">
                      {printData.industry.decliningSkills.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Predictive Analysis */}
          {printData.predictive && (
            <div className="print-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-purple-600" />
                Predictive Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hire Probability */}
                {printData.predictive.hireProbability && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Hire Probability</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {printData.predictive.hireProbability.point || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                )}

                {/* Future-Proof Score */}
                {typeof printData.predictive.automationRisk === 'number' && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Future-Proof</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round((1 - printData.predictive.automationRisk) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">AI Resistance</div>
                  </div>
                )}

                {/* Salary Intelligence */}
                {printData.predictive.salary?.market && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Market Rate</h3>
                    <div className="text-xl font-bold text-green-600 mb-2">
                      ${printData.predictive.salary.market.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Annual Salary</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="print-section border-t border-gray-200 pt-6 mt-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                Generated by All-in-One Career ATS Scanner
              </p>
              <p className="text-xs mt-1">
                Advanced AI-powered resume analysis with market intelligence
              </p>
              <p className="text-xs mt-1">
                Visit: https://all-in-one-career.vercel.app
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
