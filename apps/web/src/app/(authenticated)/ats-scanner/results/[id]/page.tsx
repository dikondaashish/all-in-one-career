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
import { featureAdvancedLayerV2 } from '../../../../../config/featureFlags';
import { AtsChecksCard } from '../../../../../components/atsV2/AtsChecksCard';
import { SkillsMatrix } from '../../../../../components/atsV2/SkillsMatrix';
import { RecruiterPsychologyCard } from '../../../../../components/atsV2/RecruiterPsychologyCard';
import { MarketIndustryCard } from '../../../../../components/atsV2/MarketIndustryCard';
import { OverallScoreCard } from '../../../../../components/atsV2/OverallScoreCard';
import { ImprovementSuggestions } from '../../../../../components/atsV2/ImprovementSuggestions';
import { OverallScoreV2 } from '../../../../../components/atsV2/OverallScoreV2';

import { ShareButton } from '../../../../../components/social/ShareButton';
import { PrintButton } from '../../../../../components/print/PrintButton';

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
  
  const [v2Data, setV2Data] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isVisible, setIsVisible] = useState(false);

  // Animation trigger after data loads
  useEffect(() => {
    if (v2Data && !loading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [v2Data, loading]);

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

      // Only fetch V2 results
      let response = await fetch(`${API_BASE_URL}/api/ats/advanced-scan/v2/results/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          response = await fetch(`${API_BASE_URL}/api/ats/advanced-scan/v2/results/${id}`, {
            headers: {
              'Authorization': `Bearer ${freshToken}`,
            },
          });
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Scan results not found. This scan may have been created with an older version.');
        }
        throw new Error('Failed to fetch scan results');
      }
      
      const data = await response.json();
      
      // Store V2 data
      setV2Data(data);
    } catch (error) {
      console.error('Error fetching scan results:', error);
      showToast({
        icon: '❌',
        title: 'Error',
        message: error.message || 'Failed to load scan results'
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

  if (!v2Data) {
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

  // Render V2 Enhanced AI Scan results
  return (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header with Action Buttons */}
          <div className="relative mb-8">
            {/* Action Buttons - Top Right */}
            <div className="absolute top-0 right-0 flex flex-col sm:flex-row items-end gap-3 z-10">
              <PrintButton scanId={id} />
              <ShareButton 
                scanId={id} 
                score={v2Data.overallScoreV2?.overall || 0}
                title="Check out my ATS Analysis Results!"
              />
            </div>
            
          {/* Header Content */}
          <div className="text-center pr-0 sm:pr-96">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Enhanced ATS Analysis Results</h1>
            <p className="text-lg text-gray-600">
              Comprehensive foundational checks, recruiter psychology, and market intelligence
            </p>
          </div>
        </div>

        {/* Printable Report Area */}
        <div id="print-area" className="print-report-content">
          {/* Overall Score V2 */}
          <OverallScoreV2 data={v2Data} />
          
          {/* Legacy Overall Score (fallback) */}
          {!v2Data.overallScoreV2 && <OverallScoreCard data={v2Data} />}

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['overview', 'intelligence', 'psychology', 'market', 'improvements'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {v2Data.atsChecks && <AtsChecksCard data={v2Data.atsChecks} />}
                  {v2Data.skills && <SkillsMatrix data={v2Data.skills} />}
                </div>
              )}

              {activeTab === 'intelligence' && (
                <div className="space-y-6">
                  {v2Data.industry && <MarketIndustryCard data={v2Data.industry} />}
                  {v2Data.skills && <SkillsMatrix data={v2Data.skills} />}
                </div>
              )}

              {activeTab === 'psychology' && (
                <div className="space-y-6">
                  {v2Data.recruiterPsychology && <RecruiterPsychologyCard data={v2Data.recruiterPsychology} />}
                </div>
              )}

              {activeTab === 'market' && (
                <div className="space-y-6">
                  {v2Data.industry && <MarketIndustryCard data={v2Data.industry} />}
                  {v2Data.predictive && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Intelligence</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {v2Data.predictive.hireProbability?.point || 0}%
                          </div>
                          <div className="text-sm text-gray-600">Hire Probability</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {v2Data.predictive.automationRisk ? Math.round((1 - v2Data.predictive.automationRisk) * 100) : 85}%
                          </div>
                          <div className="text-sm text-gray-600">Future-Proof</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 mb-2">
                            {v2Data.predictive.salary?.market ? `$${Math.round(v2Data.predictive.salary.market/1000)}k` : '$85k'}
                          </div>
                          <div className="text-sm text-gray-600">Market Salary</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'improvements' && (
                <div className="space-y-6">
                  <ImprovementSuggestions data={v2Data} />
                </div>
              )}
            </div>
          </div>

        </div>
        {/* End Printable Report Area */}

        {/* Bottom Action Button - Outside print area */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/ats-scanner')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Run Another Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanResultsPage;
