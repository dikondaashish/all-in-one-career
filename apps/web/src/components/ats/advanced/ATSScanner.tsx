'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ResumePanel } from './ResumePanel';
import { JobDescriptionPanel } from './JobDescriptionPanel';
import { AnalysisResultsPanel } from './AnalysisResultsPanel';
import { RealtimeAnalysisProvider } from './RealtimeAnalysisProvider';
import { ATSAnalysisEngine } from './ATSAnalysisEngine';

// Types
interface ResumeData {
  content: string;
  wordCount: number;
  characterCount: number;
  sections: ResumeSection[];
  source: 'manual' | 'file' | 'url';
  filename?: string;
  extractedAt: Date;
}

interface ResumeSection {
  type: 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'summary';
  content: string;
  keywords: string[];
  startIndex: number;
  endIndex: number;
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

export const ATSScanner: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobData, setJobData] = useState<JobDescription | null>(null);
  const [analysisResults, setAnalysisResults] = useState<ATSAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const { user } = useAuth();

  // Analysis engine instance
  const analysisEngine = new ATSAnalysisEngine();

  // Perform comprehensive ATS analysis
  const performAnalysis = useCallback(async () => {
    if (!resumeData || !jobData) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Step 1: Preprocess data (10%)
      setAnalysisProgress(10);
      const preprocessedResume = await analysisEngine.preprocessResume(resumeData);
      const preprocessedJob = await analysisEngine.preprocessJobDescription(jobData);

      // Step 2: Keyword analysis (30%)
      setAnalysisProgress(30);
      const keywordAnalysis = await analysisEngine.performKeywordAnalysis(
        preprocessedResume,
        preprocessedJob
      );

      // Step 3: Section analysis (50%)
      setAnalysisProgress(50);
      const sectionAnalysis = await analysisEngine.analyzeSections(preprocessedResume);

      // Step 4: Formatting analysis (70%)
      setAnalysisProgress(70);
      const formattingAnalysis = await analysisEngine.analyzeFormatting(preprocessedResume);

      // Step 5: Generate recommendations (90%)
      setAnalysisProgress(90);
      const recommendations = await analysisEngine.generateRecommendations(
        keywordAnalysis,
        sectionAnalysis,
        formattingAnalysis
      );

      // Step 6: Calculate final scores (100%)
      setAnalysisProgress(100);
      const finalAnalysis: ATSAnalysis = {
        overall_score: analysisEngine.calculateOverallScore(
          keywordAnalysis,
          sectionAnalysis,
          formattingAnalysis
        ),
        keyword_match: keywordAnalysis,
        section_analysis: sectionAnalysis,
        formatting_score: formattingAnalysis,
        recommendations,
        missing_keywords: keywordAnalysis.critical_missing,
        strength_areas: analysisEngine.identifyStrengths(sectionAnalysis),
        improvement_areas: analysisEngine.identifyImprovements(recommendations),
        ats_compatibility: analysisEngine.calculateATSCompatibility(formattingAnalysis),
        estimated_pass_rate: analysisEngine.estimatePassRate(keywordAnalysis, sectionAnalysis)
      };

      setAnalysisResults(finalAnalysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Handle error state
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [resumeData, jobData, analysisEngine]);

  // Auto-trigger analysis when both resume and job data are available
  useEffect(() => {
    if (resumeData && jobData && realtimeEnabled) {
      const timer = setTimeout(performAnalysis, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [resumeData, jobData, realtimeEnabled, performAnalysis]);

  return (
    <RealtimeAnalysisProvider value={{ realtimeEnabled, setRealtimeEnabled }}>
      <div className="ats-scanner min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced ATS Scanner
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Upload your resume and job description to get comprehensive ATS analysis, 
              keyword matching, and personalized recommendations
            </p>
          </header>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analyzing Your Resume...
                </h3>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {analysisProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Resume Panel */}
            <ResumePanel 
              onDataChange={setResumeData}
              isAnalyzing={isAnalyzing}
              currentData={resumeData}
            />

            {/* Job Description Panel */}
            <JobDescriptionPanel 
              onDataChange={setJobData}
              isAnalyzing={isAnalyzing}
              currentData={jobData}
            />
          </div>

          {/* Analysis Results */}
          {analysisResults && (
            <AnalysisResultsPanel 
              results={analysisResults}
              resumeData={resumeData}
              jobData={jobData}
              onReanalyze={performAnalysis}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={performAnalysis}
              disabled={!resumeData || !jobData || isAnalyzing}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
            </button>
            
            <button
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                realtimeEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Real-time: {realtimeEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </RealtimeAnalysisProvider>
  );
};

export default ATSScanner;
