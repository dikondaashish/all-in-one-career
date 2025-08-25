'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Printer, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Target,
  Brain,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';

// Print-specific styles
const printStyles = `
  @media print {
    body { 
      margin: 0; 
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
      color: #000 !important;
      background: white !important;
    }
    
    .no-print { 
      display: none !important; 
    }
    
    .print-break { 
      page-break-before: always; 
    }
    
    .print-avoid-break { 
      page-break-inside: avoid; 
    }
    
    .print-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #f8f9fa;
      border-bottom: 2px solid #e9ecef;
      padding: 15px 20px;
      z-index: 1000;
    }
    
    .print-content {
      margin-top: 80px;
      padding: 20px;
    }
    
    .score-circle {
      width: 80px !important;
      height: 80px !important;
      border: 4px solid #007bff !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 24px !important;
      font-weight: bold !important;
      color: #007bff !important;
      background: white !important;
    }
    
    .metrics-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 15px !important;
      margin: 20px 0 !important;
    }
    
    .metric-card {
      border: 1px solid #dee2e6 !important;
      border-radius: 8px !important;
      padding: 15px !important;
      text-align: center !important;
      background: #f8f9fa !important;
    }
    
    .section-title {
      font-size: 18px !important;
      font-weight: bold !important;
      color: #212529 !important;
      margin: 25px 0 15px 0 !important;
      border-bottom: 2px solid #007bff !important;
      padding-bottom: 5px !important;
    }
    
    .skills-table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 15px 0 !important;
    }
    
    .skills-table th,
    .skills-table td {
      border: 1px solid #dee2e6 !important;
      padding: 8px 12px !important;
      text-align: left !important;
    }
    
    .skills-table th {
      background: #e9ecef !important;
      font-weight: bold !important;
    }
    
    .status-good { color: #28a745 !important; }
    .status-warning { color: #ffc107 !important; }
    .status-danger { color: #dc3545 !important; }
    
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

export default function AtsReportPrint() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scanId');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (scanId && user) {
      fetchScanData();
    }
  }, [scanId, user]);

  const fetchScanData = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          setData(null);
          return;
        }
      } else {
        console.error('No user authentication available');
        setData(null);
        return;
      }

      // Determine API base URL
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://all-in-one-career-api.onrender.com' 
        : 'http://localhost:3001';
      
      // Try V2 first, then fallback to V1
      let response = await fetch(`${API_BASE_URL}/api/ats/advanced-scan/v2/results/${scanId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const v2Data = await response.json();
        setData(v2Data);
      } else {
        // Fallback to V1
        response = await fetch(`${API_BASE_URL}/api/ats/advanced-results/${scanId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        if (response.ok) {
          const v1Data = await response.json();
          setData(v1Data.results || v1Data);
        } else {
          // Last fallback to regular scan results
          response = await fetch(`${API_BASE_URL}/api/ats/scan-results/${scanId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
          
          if (response.ok) {
            const regularData = await response.json();
            setData(regularData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching scan data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Show loading state if waiting for auth or data
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!user ? 'Authenticating...' : 'Loading report data...'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600">Unable to load the ATS analysis report.</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
      <div className="min-h-screen bg-white">
        {/* Print Header */}
        <div className="print-header no-print bg-white shadow-lg border-b">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ATS Match Report</h1>
              <p className="text-sm text-gray-600">Ready to print • Scan ID: {scanId}</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="print-content max-w-7xl mx-auto p-8">
          {/* Report Header */}
          <div className="text-center mb-8 print-avoid-break">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ATS Match Report</h1>
            <p className="text-lg text-gray-600 mb-4">Comprehensive Resume Analysis</p>
            <div className="text-sm text-gray-500">
              <p>Generated on: {new Date().toLocaleDateString()}</p>
              <p>Scan ID: {scanId}</p>
            </div>
          </div>

          {/* Overview Metrics */}
          <div className="print-avoid-break mb-8">
            <div className="metrics-grid">
              <div className="metric-card text-center">
                <div className={`score-circle mx-auto mb-3 ${getScoreColor(data.overallScoreV2?.overall || 0)}`}>
                  {data.overallScoreV2?.overall || 0}
                </div>
                <h3 className="font-semibold text-gray-900">Overall Score</h3>
                <p className="text-xs text-gray-600">ATS Compatibility</p>
              </div>
              
              <div className="metric-card">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {data.skills?.hard?.found?.length || 0}
                </div>
                <h3 className="font-semibold text-gray-900">Hard Skills</h3>
                <p className="text-xs text-gray-600">Skills Found</p>
              </div>
              
              <div className="metric-card">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {data.skills?.soft?.found?.length || 0}
                </div>
                <h3 className="font-semibold text-gray-900">Soft Skills</h3>
                <p className="text-xs text-gray-600">Skills Identified</p>
              </div>
              
              <div className="metric-card">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {data.recruiterPsychology?.redFlags?.length || 0}
                </div>
                <h3 className="font-semibold text-gray-900">Red Flags</h3>
                <p className="text-xs text-gray-600">Issues Found</p>
              </div>
            </div>
          </div>

          {/* Searchability Section */}
          <div className="print-avoid-break mb-8">
            <h2 className="section-title">🔍 Searchability</h2>
            
            <div className="space-y-4">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.contact?.email)}
                    <span className="text-sm">Email Address</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.contact?.phone)}
                    <span className="text-sm">Phone Number</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.contact?.location)}
                    <span className="text-sm">Location</span>
                  </div>
                </div>
              </div>

              {/* Section Headings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Section Headings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.sections?.experience)}
                    <span className="text-sm">Work Experience Section</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.sections?.education)}
                    <span className="text-sm">Education Section</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.sections?.skills)}
                    <span className="text-sm">Skills Section</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.sections?.summary)}
                    <span className="text-sm">Summary Section</span>
                  </div>
                </div>
              </div>

              {/* File Type & Formatting */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">File Quality</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.fileTypeOk)}
                    <span className="text-sm">ATS-Compatible Format</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.fileNameOk)}
                    <span className="text-sm">Professional File Name</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.atsChecks?.wordCountStatus === 'optimal')}
                    <span className="text-sm">Word Count ({data.atsChecks?.wordCount || 'N/A'} words)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hard Skills Section */}
          <div className="print-break print-avoid-break mb-8">
            <h2 className="section-title">💻 Hard Skills</h2>
            
            <table className="skills-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Resume</th>
                  <th>Job Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.skills?.hard?.found?.map((skill: string, index: number) => (
                  <tr key={`found-${index}`}>
                    <td>{skill}</td>
                    <td className="status-good">✓</td>
                    <td className="status-good">Required</td>
                    <td className="status-good">Match Found</td>
                  </tr>
                ))}
                {data.skills?.hard?.missing?.map((skill: string, index: number) => (
                  <tr key={`missing-${index}`}>
                    <td>{skill}</td>
                    <td className="status-danger">✗</td>
                    <td className="status-warning">Required</td>
                    <td className="status-danger">Missing</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Soft Skills Section */}
          <div className="print-avoid-break mb-8">
            <h2 className="section-title">🤝 Soft Skills</h2>
            
            <table className="skills-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Resume</th>
                  <th>Job Description</th>
                  <th>Importance</th>
                </tr>
              </thead>
              <tbody>
                {data.skills?.soft?.found?.map((skill: string, index: number) => (
                  <tr key={`soft-${index}`}>
                    <td>{skill}</td>
                    <td className="status-good">Found</td>
                    <td className="status-good">Valued</td>
                    <td>High</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recruiter Psychology */}
          <div className="print-avoid-break mb-8">
            <h2 className="section-title">🧠 Recruiter Psychology</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">First Impression</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {data.recruiterPsychology?.sixSecondImpression || 'N/A'}/100
                  </div>
                  <p className="text-sm text-gray-600">6-Second Scan Score</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Career Narrative</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {data.recruiterPsychology?.narrativeCoherence || 'N/A'}/100
                  </div>
                  <p className="text-sm text-gray-600">Story Coherence</p>
                </div>
              </div>
            </div>
            
            {/* Strong Action Words */}
            {data.recruiterPsychology?.authorityLanguage?.strong?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">✅ Strong Action Words Found</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm">{data.recruiterPsychology.authorityLanguage.strong.join(', ')}</p>
                </div>
              </div>
            )}
            
            {/* Weak Language */}
            {data.recruiterPsychology?.authorityLanguage?.weak?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">⚠️ Weak Language to Replace</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm">{data.recruiterPsychology.authorityLanguage.weak.join(', ')}</p>
                </div>
              </div>
            )}
            
            {/* Red Flags */}
            {data.recruiterPsychology?.redFlags?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">🚨 Red Flags Detected</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <ul className="text-sm space-y-1">
                    {data.recruiterPsychology.redFlags.map((flag: string, index: number) => (
                      <li key={index}>• {flag.replace(/_/g, ' ').toUpperCase()}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Market Intelligence */}
          {data.industry && (
            <div className="print-break print-avoid-break mb-8">
              <h2 className="section-title">📊 Market Intelligence</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Industry Analysis</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium">Primary: {data.industry.detected?.primary || 'Not detected'}</p>
                    {data.industry.detected?.secondary?.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Secondary: {data.industry.detected.secondary.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Market Position</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {data.industry.marketPercentile || 'N/A'}th
                    </div>
                    <p className="text-sm text-gray-600">Percentile</p>
                  </div>
                </div>
              </div>
              
              {/* Trending Skills */}
              {data.industry.trendingSkills?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">🔥 Trending Skills</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm">{data.industry.trendingSkills.join(', ')}</p>
                  </div>
                </div>
              )}
              
              {/* Declining Skills */}
              {data.industry.decliningSkills?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">📉 Declining Skills</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm">{data.industry.decliningSkills.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="print-avoid-break mb-8">
            <h2 className="section-title">💡 Recommendations</h2>
            
            <div className="space-y-4">
              {!data.atsChecks?.contact?.email && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <h3 className="font-semibold text-red-800">High Priority</h3>
                  <p className="text-red-700">Add a professional email address to your contact information.</p>
                </div>
              )}
              
              {!data.atsChecks?.contact?.phone && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <h3 className="font-semibold text-red-800">High Priority</h3>
                  <p className="text-red-700">Include your phone number for recruiter contact.</p>
                </div>
              )}
              
              {data.skills?.hard?.missing?.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h3 className="font-semibold text-yellow-800">Medium Priority</h3>
                  <p className="text-yellow-700">
                    Consider adding these missing skills: {data.skills.hard.missing.slice(0, 3).join(', ')}
                  </p>
                </div>
              )}
              
              {data.recruiterPsychology?.sixSecondImpression < 70 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h3 className="font-semibold text-blue-800">Improvement Opportunity</h3>
                  <p className="text-blue-700">Enhance visual hierarchy and formatting for better first impressions.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t pt-6 mt-8 text-sm text-gray-500">
            <p>Generated by All-in-One Career ATS Scanner</p>
            <p>Report ID: {scanId} • Generated on: {new Date().toLocaleDateString()}</p>
            <p className="mt-2">Visit: https://all-in-one-career.vercel.app</p>
          </div>
        </div>
      </div>
    </>
  );
}
