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
  Star,
  Medal,
  Trophy,
  Eye,
  Brain,
  Zap,
  Shield,
  BarChart3,
  ChevronRight,
  Sparkles,
  Award,
  Bookmark,
  Calendar,
  Clock,
  ThumbsUp,
  TrendingDown,
  AlertCircle,
  Info,
  Rocket,
  Crown,
  GraduationCap,
  Briefcase,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '../../../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedResultsDashboard } from '../../../../../components/advanced/AdvancedResultsDashboard';

// Custom CSS animations
const customStyles = `
  @keyframes slideInRight {
    from { transform: translateX(30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes fadeInUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

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

// Helper function to get score color and styling
const getScoreColor = (score: number) => {
  if (score >= 85) return { 
    bg: 'from-emerald-500 to-green-600', 
    text: 'text-emerald-600',
    icon: Trophy,
    badge: 'bg-emerald-100 text-emerald-800',
    ring: 'ring-emerald-500/20',
    glow: 'shadow-emerald-500/25'
  };
  if (score >= 70) return { 
    bg: 'from-blue-500 to-indigo-600', 
    text: 'text-blue-600',
    icon: Medal,
    badge: 'bg-blue-100 text-blue-800',
    ring: 'ring-blue-500/20',
    glow: 'shadow-blue-500/25'
  };
  if (score >= 50) return { 
    bg: 'from-amber-500 to-orange-600', 
    text: 'text-amber-600',
    icon: Star,
    badge: 'bg-amber-100 text-amber-800',
    ring: 'ring-amber-500/20',
    glow: 'shadow-amber-500/25'
  };
  return { 
    bg: 'from-red-500 to-rose-600', 
    text: 'text-red-600',
    icon: AlertTriangle,
    badge: 'bg-red-100 text-red-800',
    ring: 'ring-red-500/20',
    glow: 'shadow-red-500/25'
  };
};

// Helper function to get status styling
const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'excellent':
      return { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        icon: CheckCircle,
        iconColor: 'text-emerald-500'
      };
    case 'good':
      return { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        icon: ThumbsUp,
        iconColor: 'text-blue-500'
      };
    case 'needs_improvement':
      return { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        icon: AlertTriangle,
        iconColor: 'text-amber-500'
      };
    default:
      return { 
        bg: 'bg-gray-50', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        icon: Info,
        iconColor: 'text-gray-500'
      };
  }
};

// Animated progress circle component
const ProgressCircle = ({ score, size = 120, strokeWidth = 8, showIcon = true }: { 
  score: number; 
  size?: number; 
  strokeWidth?: number; 
  showIcon?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const scoreData = getScoreColor(score);
  const IconComponent = scoreData.icon;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-primary" stopColor="currentColor" />
            <stop offset="100%" className={scoreData.text} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showIcon && <IconComponent className={`w-6 h-6 ${scoreData.text} mb-1`} />}
        <span className="text-2xl font-bold text-gray-900">{score}%</span>
      </div>
    </div>
  );
};

const ScanResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const id = params?.id as string;
  
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [advancedData, setAdvancedData] = useState<any | null>(null);
  const [isAdvancedScan, setIsAdvancedScan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isVisible, setIsVisible] = useState(false);

  // Animation trigger after data loads
  useEffect(() => {
    if ((scanData || advancedData) && !loading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [scanData, advancedData, loading]);

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

      // Try advanced results first, then fall back to regular results
      let response = await fetch(`${API_BASE_URL}/api/ats/advanced-results/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      // If advanced results not found, try regular results
      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/api/ats/scan-results/${id}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      }
      
      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          
          // Try advanced results first with fresh token
          response = await fetch(`${API_BASE_URL}/api/ats/advanced-results/${id}`, {
            headers: {
              'Authorization': `Bearer ${freshToken}`,
            },
          });
          
          // If advanced results not found, try regular results
          if (response.status === 404) {
            response = await fetch(`${API_BASE_URL}/api/ats/scan-results/${id}`, {
              headers: {
                'Authorization': `Bearer ${freshToken}`,
              },
            });
          }
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan results');
      }
      
      const data = await response.json();
      
      // Check if this is an advanced scan result
      if (data.results) {
        // This is an advanced scan result - store both advanced and transformed data
        setIsAdvancedScan(true);
        setAdvancedData(data.results);
        
        // Also create transformed data for backward compatibility
        const advancedData = data.results;
        const transformedData: ScanResult = {
          id: advancedData.id,
          overallScore: advancedData.overallScore,
          matchRate: advancedData.matchRate,
          searchability: advancedData.searchability,
          atsCompatibility: advancedData.atsCompatibility,
          detailedAnalysis: advancedData.detailedAnalysis || {
            contactInformation: { score: 90, status: 'excellent', feedback: 'Complete contact information' },
            professionalSummary: { score: advancedData.recruiterAppeal?.storytellingQuality || 75, status: 'good', feedback: 'Strong narrative coherence' },
            technicalSkills: { score: advancedData.skillRelevancy?.score || 80, status: 'excellent', feedback: 'Well-aligned skills' },
            qualifiedAchievements: { score: advancedData.impactScore?.quantificationQuality || 70, status: 'good', feedback: 'Good quantification of achievements' },
            educationCertifications: { score: 80, status: 'good', feedback: 'Relevant background' },
            atsFormat: { score: advancedData.recruiterAppeal?.firstImpressionScore || 85, status: 'excellent', feedback: 'ATS-friendly format' }
          },
          hardSkills: {
            found: advancedData.hardSkillsFound || [],
            missing: advancedData.hardSkillsMissing || [],
            matchPercentage: advancedData.skillRelevancy?.score || 0
          },
          recruiterTips: advancedData.recruiterTips || [],
          keywordOptimization: {
            score: advancedData.keywordAnalysis?.score || 75,
            totalKeywords: advancedData.keywordAnalysis?.totalJobKeywords || 0,
            foundKeywords: advancedData.keywordAnalysis?.foundKeywords || [],
            missingKeywords: advancedData.keywordAnalysis?.missingKeywords || [],
            suggestions: advancedData.improvementSuggestions || []
          },
          competitiveAnalysis: {
            score: advancedData.hireProbability?.probability || 75,
            comparison: [
              {
                metric: 'Hire Probability',
                userScore: advancedData.hireProbability?.probability || 0,
                marketAverage: 65
              },
              {
                metric: 'Technical Skills',
                userScore: advancedData.skillRelevancy?.score || 0,
                marketAverage: 70
              },
              {
                metric: 'Experience Level',
                userScore: advancedData.careerTrajectory?.score || 0,
                marketAverage: 75
              }
            ]
          },
          createdAt: advancedData.createdAt || new Date().toISOString()
        };
        
        setScanData(transformedData);
      } else {
        // This is a regular scan result
        setIsAdvancedScan(false);
        setScanData(data);
      }
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

  const getScoreTextColor = (score: number) => {
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

  if (!scanData && !advancedData) {
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

  // If this is an advanced scan, render the advanced dashboard
  if (isAdvancedScan && advancedData) {
    return (
      <AdvancedResultsDashboard 
        scanId={id} 
        results={{
          overallScore: advancedData.overallScore,
          matchRate: advancedData.matchRate,
          searchability: advancedData.searchability,
          atsCompatibility: advancedData.atsCompatibility,
          skillRelevancy: advancedData.skillRelevancy,
          careerTrajectory: advancedData.careerTrajectory,
          impactScore: advancedData.impactScore,
          recruiterAppeal: advancedData.recruiterAppeal,
          redFlags: advancedData.redFlags,
          hireProbability: advancedData.hireProbability,
          interviewReadiness: advancedData.interviewReadiness,
          salaryNegotiation: advancedData.salaryNegotiation,
          industryIntel: {
            industryDetection: advancedData.industryDetection,
            industrySpecificScoring: advancedData.industryScoring
          },
          marketPosition: advancedData.marketPosition,
          competitiveAnalysis: advancedData.marketPosition,
          companyOptimization: advancedData.companyOptimization
        }}
      />
    );
  }

  // Ensure scanData exists for regular scan
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Animated Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/ats-scanner')}
                className="group flex items-center space-x-3 text-gray-600 hover:text-primary transition-all duration-300 hover:scale-105"
              >
                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Back to Scanner</span>
              </button>
              <div className="border-l border-gray-200 pl-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      ATS Scan Report
                    </h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Generated {new Date(scanData.createdAt).toLocaleDateString()}</span>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{new Date(scanData.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleDownload}
                className="group flex items-center space-x-2 px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <Download className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
                <span className="font-medium text-gray-700 group-hover:text-gray-900">Download PDF</span>
              </button>
              <button 
                onClick={handleShare}
                className="group flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">Share Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Hero Score Section */}
        <div className={`relative overflow-hidden transition-all duration-1000 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-50 to-emerald-50 rounded-3xl animate-pulse"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl p-6 sm:p-8 md:p-12 hover:shadow-2xl transition-shadow duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-primary font-semibold">Your ATS Score</span>
              </div>
              <div className="flex justify-center mb-6">
                <div className="hidden sm:block">
                  <ProgressCircle score={scanData.overallScore} size={180} strokeWidth={12} />
                </div>
                <div className="block sm:hidden">
                  <ProgressCircle score={scanData.overallScore} size={140} strokeWidth={10} />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {scanData.overallScore >= 85 ? 'Excellent Resume!' : 
                 scanData.overallScore >= 70 ? 'Great Progress!' :
                 scanData.overallScore >= 50 ? 'Good Foundation!' : 'Room for Improvement'}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                {scanData.overallScore >= 85 ? 'Your resume is highly optimized for ATS systems and likely to get noticed by recruiters.' : 
                 scanData.overallScore >= 70 ? 'Your resume is well-structured with room for minor improvements.' :
                 scanData.overallScore >= 50 ? 'Your resume has potential - follow our recommendations to boost your score.' : 
                 'Your resume needs significant optimization to perform well in ATS systems.'}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { 
              score: scanData.matchRate, 
              title: 'Match Rate', 
              description: 'Keyword alignment with job requirements',
              icon: Target,
              color: 'blue'
            },
            { 
              score: scanData.searchability, 
              title: 'Searchability', 
              description: 'How easily recruiters can discover you',
              icon: Eye,
              color: 'purple'
            },
            { 
              score: scanData.atsCompatibility, 
              title: 'ATS Compatibility', 
              description: 'System readability and parsing success',
              icon: Shield,
              color: 'green'
            }
          ].map((metric, index) => {
            const scoreData = getScoreColor(metric.score);
            return (
              <div 
                key={index} 
                className={`group relative transition-all duration-700 ease-out transform ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-12 opacity-0'
                }`}
                style={{ transitionDelay: `${(index + 1) * 200}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
                <div className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${scoreData.bg} shadow-lg`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`px-3 py-1 ${scoreData.badge} rounded-full text-sm font-semibold`}>
                      {metric.score}%
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{metric.title}</h3>
                  <p className="text-gray-600 text-sm">{metric.description}</p>
                  <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${scoreData.bg} transition-all duration-1000 ease-out`}
                      style={{ width: `${metric.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Analysis Section */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Resume Sections Analysis */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-800 ease-out transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
            }`}
            style={{ transitionDelay: '800ms' }}
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Resume Section Analysis</h2>
                    <p className="text-gray-600">Detailed breakdown of each section's performance</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                {Object.entries(scanData.detailedAnalysis).map(([key, analysis]) => {
                  const statusStyle = getStatusStyle(analysis.status);
                  const IconComponent = statusStyle.icon;
                  
                  return (
                    <div 
                      key={key} 
                      className={`group relative overflow-hidden rounded-xl border-2 ${statusStyle.border} ${statusStyle.bg} p-6 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1`}
                      style={{ 
                        animationDelay: `${Object.keys(scanData.detailedAnalysis).indexOf(key) * 100}ms`,
                        animation: isVisible ? 'slideInRight 0.6s ease-out forwards' : 'none'
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl ${statusStyle.bg} border ${statusStyle.border} transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                          <IconComponent className={`w-6 h-6 ${statusStyle.iconColor}`} />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <div className={`px-3 py-1 text-sm font-bold rounded-full ${getScoreColor(analysis.score).badge}`}>
                                {analysis.score}%
                              </div>
                              <div className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                {analysis.status.replace('_', ' ').toUpperCase()}
                              </div>
                            </div>
                          </div>
                          
                          <p className={`${statusStyle.text} font-medium`}>
                            {analysis.feedback}
                          </p>
                          
                          <div className="mt-3 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${getScoreColor(analysis.score).bg} transition-all duration-1000 ease-out`}
                              style={{ width: `${analysis.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hard Skills Analysis */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-800 ease-out transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
            }`}
            style={{ transitionDelay: '1000ms' }}
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Brain className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Technical Skills Analysis</h2>
                      <p className="text-gray-600">Skills alignment with job requirements</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">
                      {scanData.hardSkills.matchPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">match rate</div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-emerald-700">Skills Found ({scanData.hardSkills.found.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {scanData.hardSkills.found.length > 0 ? scanData.hardSkills.found.map((skill, index) => (
                        <div 
                          key={index} 
                          className="group relative"
                          style={{ 
                            animationDelay: `${index * 50}ms`,
                            animation: isVisible ? 'bounceIn 0.6s ease-out forwards' : 'none'
                          }}
                        >
                          <div className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium hover:from-emerald-200 hover:to-emerald-100 transition-all duration-300 cursor-default transform hover:scale-105 hover:-translate-y-1 hover:shadow-md">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600 transform transition-transform group-hover:scale-110" />
                              <span>{skill}</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No skills found</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-red-700">Missing Skills ({scanData.hardSkills.missing.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {scanData.hardSkills.missing.length > 0 ? scanData.hardSkills.missing.map((skill, index) => (
                        <div 
                          key={index} 
                          className="group relative"
                          style={{ 
                            animationDelay: `${(scanData.hardSkills.found.length + index) * 50}ms`,
                            animation: isVisible ? 'slideInLeft 0.6s ease-out forwards' : 'none'
                          }}
                        >
                          <div className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium hover:from-red-200 hover:to-red-100 transition-all duration-300 cursor-default transform hover:scale-105 hover:-translate-y-1 hover:shadow-md">
                            <div className="flex items-center space-x-2">
                              <XCircle className="w-4 h-4 text-red-600 transform transition-transform group-hover:scale-110" />
                              <span>{skill}</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No missing skills identified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Competitive Analysis</h2>
                      <p className="text-gray-600">How you compare against market standards</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {scanData.competitiveAnalysis.score}%
                    </div>
                    <div className="text-sm text-gray-600">vs market</div>
                  </div>
                </div>
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
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Stats Card */}
            <div className={`bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-xl transition-all duration-800 ease-out transform ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            } hover:shadow-2xl hover:scale-105`}
            style={{ transitionDelay: '600ms' }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Scan ID</span>
                  <span className="font-mono text-sm bg-white/20 px-2 py-1 rounded">
                    {scanData.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Keywords Found</span>
                  <span className="font-bold text-lg">{scanData.keywordOptimization.foundKeywords.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Scan Date</span>
                  <span className="text-sm">{new Date(scanData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Recruiter Tips */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-800 ease-out transform ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '800ms' }}
            >
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Expert Tips</h2>
                    <p className="text-sm text-gray-600">Recruiter insights for improvement</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {scanData.recruiterTips.length > 0 ? scanData.recruiterTips.map((tip, index) => {
                  const priorityStyles = {
                    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800', icon: AlertTriangle },
                    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', icon: AlertCircle },
                    low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', icon: Info }
                  };
                  const style = priorityStyles[tip.priority as keyof typeof priorityStyles];
                  const IconComponent = style.icon;
                  
                  return (
                    <div key={index} className={`${style.bg} border-2 ${style.border} rounded-xl p-4 transition-all duration-300 hover:shadow-md`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 ${style.badge} rounded-lg`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold ${style.text}`}>{tip.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.badge}`}>
                              {tip.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className={`text-sm ${style.text}/80`}>{tip.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No specific tips available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Optimization */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
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
