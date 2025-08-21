'use client';

import React from 'react';
import { TrendingUp, Zap, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';

interface RealTimePreviewProps {
  resumeText: string;
  jobDescription: string;
  className?: string;
}

const RealTimePreview: React.FC<RealTimePreviewProps> = ({ 
  resumeText, 
  jobDescription, 
  className = '' 
}) => {
  const analysis = useRealTimeAnalysis(resumeText, jobDescription);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (score >= 40) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Improvement';
  };

  const shouldShowPreview = resumeText.trim().length > 50 && jobDescription.trim().length > 50;

  if (!shouldShowPreview) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4" />
          <span className="text-sm">Real-time analysis will appear here</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Add resume content and job description to see instant matching score
        </p>
      </div>
    );
  }

  if (analysis.error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Analysis Error</span>
        </div>
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{analysis.error}</p>
      </div>
    );
  }

  return (
    <div className={`${getScoreBackground(analysis.matchScore)} rounded-lg border p-4 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Real-time Match
          </span>
          {analysis.isAnalyzing && (
            <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {getScoreIcon(analysis.matchScore)}
          <span className={`text-lg font-bold ${getScoreColor(analysis.matchScore)}`}>
            {analysis.matchScore}%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`text-xs font-medium ${getScoreColor(analysis.matchScore)}`}>
            {getScoreLabel(analysis.matchScore)}
          </span>
        </div>

        {analysis.keywordCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">Keywords:</span>
            <span className="text-xs text-gray-900 dark:text-white">
              {analysis.keywordCount}/{analysis.totalPossibleKeywords} matched
            </span>
          </div>
        )}

        {analysis.skillsFound.length > 0 && (
          <div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Skills found:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.skillsFound.slice(0, 3).map((skill, index) => (
                <span 
                  key={index}
                  className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
              {analysis.skillsFound.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{analysis.skillsFound.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {analysis.missingSkills.length > 0 && (
          <div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Missing skills:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.missingSkills.slice(0, 3).map((skill, index) => (
                <span 
                  key={index}
                  className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
              {analysis.missingSkills.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{analysis.missingSkills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {analysis.isAnalyzing ? 'Analyzing...' : 'Updated in real-time'}
        </p>
      </div>
    </div>
  );
};

export default RealTimePreview;
