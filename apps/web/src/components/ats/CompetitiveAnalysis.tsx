'use client';

import React from 'react';
import { BarChart3, Users, Award, Target, TrendingUp } from 'lucide-react';

interface CompetitiveMetric {
  metric: string;
  yourScore: number;
  averageScore: number;
  topPercentile: number;
  description: string;
  category: 'skills' | 'experience' | 'format' | 'keywords';
}

interface CompetitiveAnalysisProps {
  analysis?: {
    keywordMatchRate?: number;
    skillsCoverage?: number;
    experienceRelevance?: number;
    atsReadability?: number;
    overallScore?: number;
  };
  matchScore?: number;
}

const CompetitiveAnalysis: React.FC<CompetitiveAnalysisProps> = ({ 
  analysis, 
  matchScore = 65 
}) => {
  // Generate competitive metrics based on analysis or calculated values
  const competitiveMetrics: CompetitiveMetric[] = [
    {
      metric: 'Keyword Match Rate',
      yourScore: analysis?.keywordMatchRate || matchScore,
      averageScore: 45,
      topPercentile: 85,
      description: 'Percentage of job keywords found in resume',
      category: 'keywords'
    },
    {
      metric: 'Skills Coverage',
      yourScore: analysis?.skillsCoverage || Math.min(100, matchScore + 5),
      averageScore: 55,
      topPercentile: 90,
      description: 'Percentage of required skills demonstrated',
      category: 'skills'
    },
    {
      metric: 'Experience Relevance',
      yourScore: analysis?.experienceRelevance || Math.min(100, matchScore + 15),
      averageScore: 60,
      topPercentile: 95,
      description: 'How well experience matches job requirements',
      category: 'experience'
    },
    {
      metric: 'ATS Readability',
      yourScore: analysis?.atsReadability || Math.min(100, matchScore + 20),
      averageScore: 65,
      topPercentile: 95,
      description: 'How easily ATS can parse your resume',
      category: 'format'
    }
  ];

  const getPerformanceLevel = (score: number, average: number, top: number) => {
    if (score >= top - 5) return 'excellent';
    if (score >= average + 10) return 'above-average';
    if (score >= average - 10) return 'average';
    return 'below-average';
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500';
      case 'above-average': return 'bg-blue-500';
      case 'average': return 'bg-yellow-500';
      case 'below-average': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceTextColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'above-average': return 'text-blue-600 dark:text-blue-400';
      case 'average': return 'text-yellow-600 dark:text-yellow-400';
      case 'below-average': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPerformanceLabel = (level: string) => {
    switch (level) {
      case 'excellent': return 'Top Performer';
      case 'above-average': return 'Above Average';
      case 'average': return 'Average';
      case 'below-average': return 'Below Average';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'keywords': return <Target className="w-4 h-4" />;
      case 'skills': return <Award className="w-4 h-4" />;
      case 'experience': return <BarChart3 className="w-4 h-4" />;
      case 'format': return <TrendingUp className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  // Calculate overall competitive position
  const excellentCount = competitiveMetrics.filter(m => 
    getPerformanceLevel(m.yourScore, m.averageScore, m.topPercentile) === 'excellent'
  ).length;

  const aboveAverageCount = competitiveMetrics.filter(m => 
    getPerformanceLevel(m.yourScore, m.averageScore, m.topPercentile) === 'above-average'
  ).length;

  const averageScore = competitiveMetrics.reduce((sum, m) => sum + m.yourScore, 0) / competitiveMetrics.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Competitive Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How you compare to other candidates
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(averageScore)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Overall Score
          </div>
        </div>
      </div>

      {/* Competitive Metrics */}
      <div className="space-y-6">
        {competitiveMetrics.map((metric, index) => {
          const performanceLevel = getPerformanceLevel(metric.yourScore, metric.averageScore, metric.topPercentile);
          
          return (
            <div key={index} className="space-y-3">
              {/* Metric Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-600 dark:text-gray-400">
                    {getCategoryIcon(metric.category)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      {metric.metric}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {metric.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {metric.yourScore}%
                  </span>
                  <div className={`text-xs font-medium ${getPerformanceTextColor(performanceLevel)}`}>
                    {getPerformanceLabel(performanceLevel)}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar with Markers */}
              <div className="relative">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full relative overflow-hidden">
                  {/* Average marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-20"
                    style={{ left: `${metric.averageScore}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
                      <div className="bg-gray-600 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap text-center">
                        <div>Avg</div>
                        <div>{metric.averageScore}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top percentile marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-green-600 z-20"
                    style={{ left: `${metric.topPercentile}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
                      <div className="bg-green-600 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap text-center">
                        <div>Top</div>
                        <div>{metric.topPercentile}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Your score bar */}
                  <div 
                    className={`h-full rounded-full ${getPerformanceColor(performanceLevel)} transition-all duration-500 relative z-10`}
                    style={{ width: `${metric.yourScore}%` }}
                  >
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <span className="text-white text-xs font-medium">You</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Position Summary */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center space-x-2 mb-3">
          <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-sm text-purple-900 dark:text-purple-100">
            Your Competitive Position
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
          <div className="flex items-center justify-between">
            <span>Performance categories:</span>
            <div className="flex space-x-3 text-xs">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {excellentCount} Excellent
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {aboveAverageCount} Above Avg
              </span>
            </div>
          </div>
          
          <p className="text-xs">
            {excellentCount + aboveAverageCount >= 3 ? (
              <span className="text-green-700 dark:text-green-300">
                🎉 You&apos;re performing better than most candidates in {excellentCount + aboveAverageCount} out of {competitiveMetrics.length} key areas!
              </span>
            ) : excellentCount + aboveAverageCount >= 2 ? (
              <span className="text-blue-700 dark:text-blue-300">
                👍 You&apos;re competitive with above-average performance in {excellentCount + aboveAverageCount} areas.
              </span>
            ) : (
              <span className="text-yellow-700 dark:text-yellow-300">
                💡 Focus on improving keyword matching and skills coverage to outperform other candidates.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action Items */}
      {excellentCount + aboveAverageCount < 3 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
              Priority Improvements
            </span>
          </div>
          
          <div className="space-y-1 text-xs text-yellow-800 dark:text-yellow-200">
            {competitiveMetrics
              .filter(m => getPerformanceLevel(m.yourScore, m.averageScore, m.topPercentile) === 'below-average')
              .slice(0, 2)
              .map((metric, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <span>
                    Improve {metric.metric.toLowerCase()} to reach the {metric.averageScore}% average
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitiveAnalysis;
