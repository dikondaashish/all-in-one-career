'use client';

import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download,
  Eye,
  BarChart3,
  Lightbulb,
  FileText,
  Award,
  Clock,
  Users
} from 'lucide-react';
import { ExportReportGenerator } from './ExportReportGenerator';

interface ATSAnalysis {
  overall_score: number;
  keyword_match: KeywordAnalysis;
  section_analysis: SectionAnalysis;
  formatting_score: FormattingAnalysis;
  recommendations: Recommendation[];
  missing_keywords: string[];
  strength_areas: string[];
  improvement_areas: string[];
  ats_compatibility: number;
  estimated_pass_rate: number;
}

interface KeywordAnalysis {
  total_keywords: number;
  matched_keywords: number;
  match_percentage: number;
  critical_missing: string[];
  matched_list: MatchedKeyword[];
  keyword_density: number;
  semantic_matches: number;
}

interface MatchedKeyword {
  keyword: string;
  resume_frequency: number;
  job_frequency: number;
  importance_weight: number;
  match_type: 'exact' | 'partial' | 'synonym' | 'semantic';
  context: string;
}

interface SectionAnalysis {
  personal_info_score: number;
  experience_score: number;
  education_score: number;
  skills_score: number;
  formatting_score: number;
  completeness_score: number;
}

interface FormattingAnalysis {
  readability_score: number;
  structure_score: number;
  length_score: number;
  bullet_usage: number;
  action_verbs: number;
  quantifiable_results: number;
}

interface Recommendation {
  type: 'critical' | 'important' | 'suggestion';
  category: 'keywords' | 'formatting' | 'content' | 'structure';
  title: string;
  description: string;
  before?: string;
  after?: string;
  impact_score: number;
}

interface ResumeData {
  content: string;
  wordCount: number;
  characterCount: number;
  sections: any[];
  source: 'manual' | 'file' | 'url';
  filename?: string;
  extractedAt: Date;
}

interface JobDescription {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  content: string;
  source: 'manual' | 'file' | 'url';
  url?: string;
  extractedAt: Date;
}

interface AnalysisResultsPanelProps {
  results: ATSAnalysis;
  resumeData: ResumeData | null;
  jobData: JobDescription | null;
  onReanalyze: () => void;
}

export const AnalysisResultsPanel: React.FC<AnalysisResultsPanelProps> = ({
  results,
  resumeData,
  jobData,
  onReanalyze
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'sections' | 'recommendations' | 'detailed'>('overview');
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set());

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Get score ring color
  const getScoreRingColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Toggle recommendation expansion
  const toggleRecommendation = (index: number) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRecommendations(newExpanded);
  };

  // Export results
  const exportResults = async () => {
    const exportData = {
      analysis: results,
      resume: resumeData,
      job: jobData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Score Ring Component
  const ScoreRing: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
    const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
    const svgSize = (radius + strokeWidth) * 2;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ${getScoreRingColor(score)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-xl'}`}>
            {score}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-results-panel bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ATS Analysis Results
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive analysis of your resume against the job requirements
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Overall Score */}
            <div className="text-center">
              <ScoreRing score={results.overall_score} size="lg" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">
                Overall Score
              </p>
            </div>
            <button
              onClick={exportResults}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {results.keyword_match.match_percentage}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Keyword Match
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {results.ats_compatibility}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ATS Compatible
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {results.estimated_pass_rate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pass Rate
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {results.recommendations.filter(r => r.type === 'critical').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Critical Issues
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'keywords', label: 'Keywords', icon: Target },
          { id: 'sections', label: 'Sections', icon: BarChart3 },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'detailed', label: 'Detailed', icon: FileText }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Score Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Score Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Keyword Matching
                    </span>
                    <ScoreRing score={results.keyword_match.match_percentage} size="sm" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {results.keyword_match.matched_keywords} / {results.keyword_match.total_keywords} keywords matched
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Experience Section
                    </span>
                    <ScoreRing score={results.section_analysis.experience_score} size="sm" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Professional experience quality
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skills Section
                    </span>
                    <ScoreRing score={results.section_analysis.skills_score} size="sm" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Technical skills coverage
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {results.strength_areas.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-800 dark:text-green-200">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {results.improvement_areas.map((improvement, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="text-sm text-orange-800 dark:text-orange-200">{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-6">
            {/* Keyword Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{results.keyword_match.matched_keywords}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Matched Keywords</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{results.keyword_match.critical_missing.length}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Critical Missing</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{results.keyword_match.semantic_matches}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Semantic Matches</div>
              </div>
            </div>

            {/* Critical Missing Keywords */}
            {results.keyword_match.critical_missing.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Critical Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.keyword_match.critical_missing.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  These keywords appear frequently in the job description but are missing from your resume.
                </p>
              </div>
            )}

            {/* Matched Keywords */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Matched Keywords ({results.keyword_match.matched_list.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.keyword_match.matched_list.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{match.keyword}</span>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Resume: {match.resume_frequency}x | Job: {match.job_frequency}x | 
                        Type: {match.match_type} | Weight: {(match.importance_weight * 100).toFixed(0)}%
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      match.match_type === 'exact' ? 'bg-green-100 text-green-800' :
                      match.match_type === 'semantic' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {match.match_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Personal Information', score: results.section_analysis.personal_info_score, icon: Users },
                { name: 'Professional Experience', score: results.section_analysis.experience_score, icon: Clock },
                { name: 'Education', score: results.section_analysis.education_score, icon: Award },
                { name: 'Skills', score: results.section_analysis.skills_score, icon: Target },
                { name: 'Formatting', score: results.section_analysis.formatting_score, icon: FileText },
                { name: 'Completeness', score: results.section_analysis.completeness_score, icon: CheckCircle }
              ].map(({ name, score, icon: Icon }) => (
                <div key={name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                    </div>
                    <ScoreRing score={score} size="sm" />
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' :
                        score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formatting Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Formatting Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {results.formatting_score.action_verbs}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Action Verbs</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {results.formatting_score.quantifiable_results}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Quantifiable Results</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(results.formatting_score.bullet_usage)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Bullet Usage Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {results.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  rec.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                  rec.type === 'important' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {rec.type === 'critical' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : rec.type === 'important' ? (
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                      )}
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        rec.type === 'critical' ? 'bg-red-100 text-red-800' :
                        rec.type === 'important' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">Impact: {rec.impact_score}/100</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {rec.description}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRecommendation(index)}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {expandedRecommendations.has(index) && (rec.before || rec.after) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {rec.before && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-red-600">Before:</span>
                        <div className="mt-1 p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs font-mono">
                          {rec.before}
                        </div>
                      </div>
                    )}
                    {rec.after && (
                      <div>
                        <span className="text-xs font-medium text-green-600">Suggested:</span>
                        <div className="mt-1 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs font-mono">
                          {rec.after}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Detailed Tab */}
        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* Export Report Generator */}
            <ExportReportGenerator
              analysis={results}
              resumeData={resumeData}
              jobData={jobData}
            />
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Raw Analysis Data
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <button
            onClick={onReanalyze}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Re-analyze Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultsPanel;
