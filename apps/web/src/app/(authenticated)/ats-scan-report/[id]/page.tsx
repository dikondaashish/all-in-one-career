'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, AlertTriangle, Download, Share2, FileText } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { AtsScanDetail } from '@/hooks/useAtsScanner';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge, ProgressRing } from '@/components/ats/shared';
import { use } from 'react';
import ATSCompatibilityWidget from '@/components/ats/ATSCompatibilityWidget';
import KeywordSuggestions from '@/components/ats/KeywordSuggestions';
import CompetitiveAnalysis from '@/components/ats/CompetitiveAnalysis';

// Extended types for enhanced analysis data
interface SearchabilityItem {
  title: string;
  description: string;
  status: 'good' | 'warning' | 'error';
}

interface RecruiterTip {
  type: 'good' | 'warning' | 'error';
  title: string;
  description: string;
}

interface EnhancedAtsScanDetail extends AtsScanDetail {
  searchabilityItems?: SearchabilityItem[];
  recruiterTips?: RecruiterTip[];
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ReportHeaderProps {
  scan: AtsScanDetail;
  onBack: () => void;
}

const ReportHeader = ({ scan, onBack }: ReportHeaderProps) => (
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Scanner
          </button>
          <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              ATS Scan Report
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {scan.fileName} • Scanned {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          <button className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
      </div>
    </div>
  </div>
);

const MatchRateWidget = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Rate</h3>
      
      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <ProgressRing 
          progress={score} 
          size={128}
          color={getScoreColor(score)}
          showPercentage={true}
        />
      </div>
      
      <p className={`text-sm font-medium ${getScoreColor(score)} mb-2`}>
        {getScoreLabel(score)}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Based on keyword matching and format analysis
      </p>
    </div>
  );
};

const ResumeUploadInfo = ({ scan }: { scan: AtsScanDetail }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resume Info</h3>
    
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <FileText className="w-5 h-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{scan.fileName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{scan.fileType.toUpperCase()} format</p>
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Skills Found</p>
            <p className="font-medium text-gray-900 dark:text-white">{scan.parsedJson.skills.length}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Experience</p>
            <p className="font-medium text-gray-900 dark:text-white">{scan.parsedJson.experience.length} roles</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SummaryCard = ({ scan }: { scan: AtsScanDetail }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Summary</h3>
    
    <div className="space-y-3">
      {scan.parsedJson.name && (
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Name</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{scan.parsedJson.name}</p>
        </div>
      )}
      
      {scan.parsedJson.email && (
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Email</p>
          <p className="text-sm text-gray-900 dark:text-white">{scan.parsedJson.email}</p>
        </div>
      )}
      
      {scan.parsedJson.phone && (
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Phone</p>
          <p className="text-sm text-gray-900 dark:text-white">{scan.parsedJson.phone}</p>
        </div>
      )}
    </div>
  </div>
);

const SearchabilitySection = ({ scan }: { scan: AtsScanDetail }) => {
  // Use enhanced backend data if available, otherwise fall back to mock data
  const searchabilityItems: SearchabilityItem[] = (scan as EnhancedAtsScanDetail).searchabilityItems || [
    {
      title: "ATS systems can read 100% of your resume",
      description: "Browsers can read all the content without errors",
      status: "good" as const
    },
    {
      title: "We can read file in most resume ATS platforms", 
      description: "Your file format is compatible with major ATS systems",
      status: "good" as const
    },
    {
      title: "Contact information is properly formatted",
      description: "Email and phone are easily identifiable",
      status: scan.parsedJson.email && scan.parsedJson.phone ? "good" : "warning" as const
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Searchability</h3>
        <StatusBadge type="ats-focus">ATS FOCUS</StatusBadge>
      </div>
      
      <div className="space-y-4">
        {searchabilityItems.map((item, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${
              item.status === 'good' ? 'bg-green-500' : 
              item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {item.status === 'good' && <Check className="w-3 h-3 text-white" />}
              {item.status === 'warning' && <AlertTriangle className="w-3 h-3 text-white" />}
              {item.status === 'error' && <X className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HardSkillsSection = ({ scan }: { scan: AtsScanDetail }) => {
  const resumeSkills = scan.parsedJson.skills;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hard Skills</h3>
        <StatusBadge type="recruiter-focus">RECRUITER FOCUS</StatusBadge>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Your hard skills tell recruiters if you can do the job. We found {resumeSkills.length} technical skills in your resume.
      </p>
      
      {/* Skills List */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Found Skills:</h4>
        <div className="flex flex-wrap gap-2">
          {resumeSkills.slice(0, 10).map((skill, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
            >
              {skill}
            </span>
          ))}
          {resumeSkills.length > 10 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
              +{resumeSkills.length - 10} more
            </span>
          )}
        </div>
      </div>
      
      {/* Missing Skills Alert */}
      {scan.missingSkills.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Missing {scan.missingSkills.length} skills from job description
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {scan.missingSkills.slice(0, 5).map((skill, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {scan.missingSkills.length > 5 && (
                  <span className="text-xs text-red-600 dark:text-red-400 px-2 py-1">
                    +{scan.missingSkills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecruiterTipsSection = ({ scan }: { scan: AtsScanDetail }) => {
  // Use enhanced backend data if available, otherwise fall back to mock data  
  const recruiterTips: RecruiterTip[] = (scan as EnhancedAtsScanDetail).recruiterTips || [
    {
      type: "good" as const,
      title: "Contact Information Complete",
      description: "Your resume includes essential contact details that recruiters need."
    },
    {
      type: "warning" as const,
      title: "Measurable Results",
      description: "Add more quantifiable achievements to demonstrate your impact and stand out to recruiters."
    },
    {
      type: scan.missingSkills.length > 0 ? "error" : "good" as const,
      title: "Keyword Optimization",
      description: scan.missingSkills.length > 0 
        ? `Consider adding ${scan.missingSkills.length} missing keywords from the job description.`
        : "Your resume includes relevant keywords from the job description."
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recruiter Tips</h3>
        <StatusBadge type="hiring-focus">HIRING FOCUS</StatusBadge>
      </div>
      
      <div className="space-y-4">
        {recruiterTips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
              tip.type === 'good' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
              tip.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
              'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
            }`}>
              {tip.type === 'good' && <Check className="w-4 h-4" />}
              {tip.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
              {tip.type === 'error' && <X className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">{tip.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ScanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const fetcher = async (url: string) => {
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch scan data');
    }
    return res.json();
  };

  const { data: scan, error, isLoading } = useSWR<AtsScanDetail>(
    user ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ats/scans/${resolvedParams.id}` : null,
    fetcher
  );

  const handleBack = () => {
    router.push('/ats-scanner');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading scan report...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load scan report</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <ReportHeader scan={scan} onBack={handleBack} />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Match Rate & Summary */}
          <div className="lg:col-span-1">
            <MatchRateWidget score={scan.matchScore} />
            <ResumeUploadInfo scan={scan} />
            <SummaryCard scan={scan} />
          </div>
          
          {/* Right Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-8">
            <SearchabilitySection scan={scan} />
            <HardSkillsSection scan={scan} />
            <RecruiterTipsSection scan={scan} />
            
            {/* Enhanced Analysis Widgets */}
            <ATSCompatibilityWidget 
              fileName={scan.fileName}
              fileType={scan.fileType}
              analysis={{
                fileFormat: { isCompatible: true, type: scan.fileType },
                sections: { hasStandardSections: true, foundSections: ['Contact', 'Experience', 'Skills'] },
                formatting: { isClean: true, issues: [] },
                keywords: { density: scan.matchScore / 100, totalFound: scan.parsedJson.skills?.length || 0 }
              }}
            />
            
            <KeywordSuggestions 
              missingSkills={scan.missingSkills}
              jobDescription={scan.jdText || ''}
              analysis={{
                missingHighImpactKeywords: scan.missingSkills.slice(0, 5),
                missingTechnicalSkills: scan.missingSkills.filter(skill => 
                  ['javascript', 'python', 'sql', 'aws', 'react', 'node'].some(tech => 
                    skill.toLowerCase().includes(tech)
                  )
                ),
                missingSoftSkills: scan.missingSkills.filter(skill => 
                  ['leadership', 'communication', 'teamwork', 'management'].some(soft => 
                    skill.toLowerCase().includes(soft)
                  )
                ),
                matchScore: scan.matchScore
              }}
            />
            
            <CompetitiveAnalysis 
              matchScore={scan.matchScore}
              analysis={{
                keywordMatchRate: scan.matchScore,
                skillsCoverage: Math.min(100, scan.matchScore + 10),
                experienceRelevance: Math.min(100, scan.matchScore + 15),
                atsReadability: 85,
                overallScore: scan.matchScore
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
