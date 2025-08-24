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
  Loader2,
  Trophy,
  Zap,
  Star,
  BarChart3,
  Brain,
  Shield,
  Sparkles,
  ChevronRight,
  Award,
  Eye,
  Bookmark
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-ping"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Your Resume</h2>
          <p className="text-lg text-gray-600 mb-4">AI is processing your data...</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Results Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the scan results you're looking for. It might have been removed or expired.</p>
            <button 
              onClick={() => router.push('/ats-scanner')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Scanner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Modern Header with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/ats-scanner')}
                className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
              >
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Back to Scanner</span>
              </button>
              <div className="border-l border-gray-200 pl-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">ATS Scan Report</h1>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Generated {new Date(scanData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleDownload}
                className="flex items-center space-x-2 px-5 py-3 bg-white/80 border border-gray-200 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 font-medium text-gray-700 hover:text-gray-900"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Overall Score */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              {/* Animated Progress Circle */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    strokeDasharray: '251.2',
                    strokeDashoffset: `${251.2 - (scanData.overallScore / 100) * 251.2}`
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900">{scanData.overallScore}%</span>
                  <div className="text-xs text-gray-500 font-medium">SCORE</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2">
              {scanData.overallScore >= 80 ? (
                <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full p-2 shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              ) : scanData.overallScore >= 60 ? (
                <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full p-2 shadow-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2 shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {scanData.overallScore >= 80 ? 'Excellent Resume!' : 
             scanData.overallScore >= 60 ? 'Good Resume' : 
             'Room for Improvement'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your resume has been analyzed against modern ATS standards and recruitment best practices.
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Match Rate */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{scanData.matchRate}%</div>
                <div className="text-sm text-gray-500 font-medium">Match Rate</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${scanData.matchRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Keyword matching and format analysis</p>
          </div>

          {/* Searchability */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{scanData.searchability}%</div>
                <div className="text-sm text-gray-500 font-medium">Searchability</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${scanData.searchability}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">How easily recruiters can find your profile</p>
          </div>

          {/* ATS Compatibility */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{scanData.atsCompatibility}%</div>
                <div className="text-sm text-gray-500 font-medium">ATS Compatible</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${scanData.atsCompatibility}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">How well ATS systems can read your resume</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resume Sections Analysis */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Resume Analysis</h2>
                </div>
                <p className="text-sm text-gray-600 mt-2">Detailed breakdown of each resume section</p>
              </div>
              <div className="p-8 space-y-6">
                {Object.entries(scanData.detailedAnalysis).map(([key, analysis]) => (
                  <div key={key} className="group relative overflow-hidden">
                    <div className="flex items-start space-x-4 p-6 rounded-xl bg-gradient-to-r from-white/80 to-white/40 border border-gray-100/50 hover:shadow-lg transition-all duration-300">
                      <div className="flex-shrink-0">
                        {getStatusIcon(analysis.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <div className="flex items-center space-x-3">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                  analysis.score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                  analysis.score >= 60 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                  'bg-gradient-to-r from-amber-500 to-orange-500'
                                }`}
                                style={{ width: `${analysis.score}%` }}
                              ></div>
                            </div>
                            <span className={`px-3 py-1 text-sm font-bold rounded-lg ${
                              analysis.score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                              analysis.score >= 60 ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {analysis.score}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{analysis.feedback}</p>
                      </div>
                    </div>
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hard Skills Analysis */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Technical Skills</h2>
                      <p className="text-sm text-gray-600">
                        Match rate: {scanData.hardSkills.matchPercentage}% ({scanData.hardSkills.found.length} found)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{scanData.hardSkills.matchPercentage}%</div>
                    <div className="text-xs text-gray-500 font-medium">SKILLS MATCH</div>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Found Skills */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-emerald-100 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-emerald-700">Found Skills ({scanData.hardSkills.found.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scanData.hardSkills.found.length > 0 ? scanData.hardSkills.found.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 rounded-xl text-sm font-medium border border-emerald-200 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                        >
                          {skill}
                        </span>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No matching skills found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-amber-100 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      <h4 className="font-semibold text-amber-700">Skills to Add ({scanData.hardSkills.missing.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scanData.hardSkills.missing.length > 0 ? scanData.hardSkills.missing.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 rounded-xl text-sm font-medium border border-amber-200 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                        >
                          {skill}
                        </span>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Great! No critical skills missing</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Analysis */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Competitive Analysis</h2>
                      <p className="text-sm text-gray-600">Compare against market standards</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{scanData.competitiveAnalysis.score}%</div>
                    <div className="text-xs text-gray-500 font-medium">VS MARKET</div>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                {scanData.competitiveAnalysis.comparison.map((metric, index) => (
                  <div key={index} className="group p-6 rounded-xl bg-gradient-to-r from-gray-50/80 to-white/60 border border-gray-100/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{metric.metric}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">You: <span className="font-bold">{metric.userScore}%</span></span>
                        <span className="text-xs text-gray-400">vs</span>
                        <span className="text-sm text-gray-600">Market: <span className="font-bold">{metric.marketAverage}%</span></span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                            metric.userScore >= metric.marketAverage 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${metric.userScore}%` }}
                        ></div>
                      </div>
                      {/* Market average indicator */}
                      <div 
                        className="absolute -top-1 w-1 h-5 bg-gray-600 rounded-full shadow-sm"
                        style={{ left: `${metric.marketAverage}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Market Avg
                        </div>
                      </div>
                    </div>
                    {metric.userScore >= metric.marketAverage && (
                      <div className="mt-3 flex items-center text-emerald-600">
                        <Trophy className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Above market average!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tips and Optimization */}
          <div className="space-y-8">
            {/* Recruiter Tips */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="px-6 py-6 border-b border-gray-100/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Expert Tips</h2>
                </div>
                <p className="text-sm text-gray-600 mt-2">Insights from hiring professionals</p>
              </div>
              <div className="p-6 space-y-4">
                {scanData.recruiterTips.length > 0 ? scanData.recruiterTips.map((tip, index) => (
                  <div 
                    key={index} 
                    className="group relative p-4 rounded-xl bg-gradient-to-r from-white/80 to-white/40 border border-gray-100/50 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                      tip.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-pink-500' :
                      tip.priority === 'medium' ? 'bg-gradient-to-b from-amber-500 to-orange-500' :
                      'bg-gradient-to-b from-emerald-500 to-green-500'
                    }`}></div>
                    <div className="ml-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">{tip.title}</h4>
                        <span className={`px-2 py-1 text-xs font-bold rounded-lg flex-shrink-0 ${
                          tip.priority === 'high' ? 'bg-red-100 text-red-700' :
                          tip.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tip.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip.description}</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No specific tips available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Optimization */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="px-6 py-6 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Keyword Optimization</h2>
                      <p className="text-sm text-gray-600">Boost your ATS visibility</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{scanData.keywordOptimization.score}%</div>
                    <div className="text-xs text-gray-500 font-medium">OPTIMIZED</div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-1 bg-amber-100 rounded-full">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="font-semibold text-amber-700">Missing Keywords ({scanData.keywordOptimization.missingKeywords.length})</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scanData.keywordOptimization.missingKeywords.slice(0, 10).map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 rounded-lg text-sm font-medium border border-orange-200 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-blue-700">Optimization Tips</h4>
                  </div>
                  <div className="space-y-3">
                    {scanData.keywordOptimization.suggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100/50">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <p className="text-sm text-gray-700 leading-relaxed">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scan Summary */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="px-6 py-6 border-b border-gray-100/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Scan Summary</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-white/60 border border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bookmark className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Scan ID</span>
                  </div>
                  <span className="font-mono text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                    {scanData.id.slice(0, 8)}...
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-white/60 border border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Target className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Keywords Found</span>
                  </div>
                  <span className="font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg">
                    {scanData.keywordOptimization.foundKeywords.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-white/60 border border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Analysis Date</span>
                  </div>
                  <span className="text-gray-600 font-medium">
                    {new Date(scanData.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Next Steps</span>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Focus on adding the missing keywords naturally throughout your resume, especially in the skills and experience sections.
                  </p>
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
