'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Download, 
  Share2, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Users,
  Target,
  FileText,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { useToast } from '../../../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';

interface ScanResult {
  id: string;
  overallScore: number;
  matchRate: number;
  searchability: number;
  atsCompatibility: number;
  detailedAnalysis: {
    contactInformation: { score: number; status: string; feedback: string };
    professionalSummary: { score: number; status: string; feedback: string };
    technicalSkills: { score: number; status: string; feedback: string };
    qualifiedAchievements: { score: number; status: string; feedback: string };
    educationCertifications: { score: number; status: string; feedback: string };
    atsFormat: { score: number; status: string; feedback: string };
  };
  hardSkills: {
    found: string[];
    missing: string[];
    matchPercentage: number;
  };
  recruiterTips: Array<{
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  keywordOptimization: {
    score: number;
    totalKeywords: number;
    foundKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  };
  competitiveAnalysis: {
    score: number;
    comparison: Array<{
      metric: string;
      userScore: number;
      marketAverage: number;
    }>;
  };
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://all-in-one-career.onrender.com';

const ScanResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const id = params?.id as string;
  
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchScanResults();
    }
  }, [id]);

  const fetchScanResults = async () => {
    try {
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('No user authentication available');
      }

      let response = await fetch(`${API_BASE_URL}/api/ats/scan-results/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          response = await fetch(`${API_BASE_URL}/api/ats/scan-results/${id}`, {
            headers: {
              'Authorization': `Bearer ${freshToken}`,
            },
          });
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan results');
      }
      
      const data = await response.json();
      setScanData(data);
    } catch (error) {
      console.error('Failed to fetch scan results:', error);
      showToast({ 
        icon: '❌', 
        title: 'Error', 
        message: 'Failed to load scan results' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'needs_improvement': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleDownload = () => {
    showToast({ 
      icon: '📥', 
      title: 'Coming Soon', 
      message: 'Download feature coming soon!' 
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ATS Scan Results',
        text: `My ATS scan scored ${scanData?.overallScore}% overall!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({ 
        icon: '📋', 
        title: 'Success', 
        message: 'Link copied to clipboard!' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-600" />
          <p className="text-xl text-gray-600 mt-4">Scan results not found</p>
          <button 
            onClick={() => router.push('/ats-scanner')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/ats-scanner')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Scanner</span>
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">ATS Scan Report</h1>
                <p className="text-sm text-gray-500">
                  Generated {new Date(scanData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.matchRate)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.matchRate)}`}>
                {scanData.matchRate}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Match Rate</h3>
            <p className="text-sm text-gray-600">Based on keyword matching and format analysis</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.searchability)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.searchability)}`}>
                {scanData.searchability}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Searchability</h3>
            <p className="text-sm text-gray-600">How easily recruiters can find your profile</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.atsCompatibility)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.atsCompatibility)}`}>
                {scanData.atsCompatibility}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility</h3>
            <p className="text-sm text-gray-600">How well ATS systems can read your resume</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackground(scanData.overallScore)} mb-4`}>
              <span className={`text-2xl font-bold ${getScoreColor(scanData.overallScore)}`}>
                {scanData.overallScore}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
            <p className="text-sm text-gray-600">Combined assessment of all factors</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Sections Analysis */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Resume Analysis</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(scanData.detailedAnalysis).map(([key, analysis]) => (
                  <div key={key} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200">
                    {getStatusIcon(analysis.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreBackground(analysis.score)} ${getScoreColor(analysis.score)}`}>
                          {analysis.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{analysis.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hard Skills Analysis */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Hard Skills</h2>
                <p className="text-sm text-gray-600">
                  Skills match: {scanData.hardSkills.matchPercentage}% ({scanData.hardSkills.found.length} found)
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Found Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scanData.hardSkills.found.length > 0 ? scanData.hardSkills.found.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {skill}
                        </span>
                      )) : (
                        <p className="text-sm text-gray-500">No skills found</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Missing Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scanData.hardSkills.missing.length > 0 ? scanData.hardSkills.missing.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {skill}
                        </span>
                      )) : (
                        <p className="text-sm text-gray-500">No missing skills identified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Analysis */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Competitive Analysis</h2>
                <p className="text-sm text-gray-600">How you compare to other applicants: {scanData.competitiveAnalysis.score}%</p>
              </div>
              <div className="p-6 space-y-4">
                {scanData.competitiveAnalysis.comparison.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{metric.metric}</span>
                      <span className="text-gray-600">{metric.userScore}% vs {metric.marketAverage}% avg</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(metric.userScore / 100) * 100}%` }}
                        ></div>
                      </div>
                      <div 
                        className="absolute top-0 h-2 w-0.5 bg-gray-500"
                        style={{ left: `${metric.marketAverage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tips and Optimization */}
          <div className="space-y-6">
            {/* Recruiter Tips */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Recruiter Tips
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {scanData.recruiterTips.length > 0 ? scanData.recruiterTips.map((tip, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                      tip.priority === 'high' ? 'bg-red-100 text-red-800' :
                      tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tip.priority} priority
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No specific tips available</p>
                )}
              </div>
            </div>

            {/* Keyword Optimization */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Keyword Optimization</h2>
                <p className="text-sm text-gray-600">Score: {scanData.keywordOptimization.score}%</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {scanData.keywordOptimization.missingKeywords.slice(0, 10).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Suggestions</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {scanData.keywordOptimization.suggestions.slice(0, 5).map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Resume Info */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Scan Info</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Scan ID:</span>
                  <span className="font-medium">{scanData.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Keywords Found:</span>
                  <span className="font-medium">{scanData.keywordOptimization.foundKeywords.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Scan Date:</span>
                  <span className="font-medium">{new Date(scanData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultsPage;
