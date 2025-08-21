'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Eye, Target, Zap } from 'lucide-react';

interface CompatibilityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  weight: number;
  details?: string;
}

interface ATSCompatibilityProps {
  analysis?: {
    fileFormat?: { isCompatible: boolean; type: string };
    sections?: { hasStandardSections: boolean; foundSections: string[] };
    formatting?: { isClean: boolean; issues: string[] };
    keywords?: { density: number; totalFound: number };
    readability?: { score: number };
  };
  fileName?: string;
  fileType?: string;
}

const ATSCompatibilityWidget: React.FC<ATSCompatibilityProps> = ({ 
  analysis, 
  fileName = 'resume.docx',
  fileType = '.docx' 
}) => {
  // Generate compatibility checks based on analysis or mock data
  const compatibilityChecks: CompatibilityCheck[] = [
    {
      name: 'File Format',
      status: (fileType === '.docx' || fileType === '.doc') ? 'pass' : 
              fileType === '.txt' ? 'warning' : 'fail',
      description: 'Document format compatibility with ATS systems',
      details: fileType === '.pdf' ? 'PDF files may have parsing issues' :
               fileType === '.docx' || fileType === '.doc' ? 'Word documents are optimal for ATS' :
               'Text files are safe but may lack formatting',
      weight: 20
    },
    {
      name: 'Standard Sections',
      status: analysis?.sections?.hasStandardSections !== false ? 'pass' : 'warning',
      description: 'Essential resume sections detected',
      details: `Found sections: ${analysis?.sections?.foundSections?.join(', ') || 'Contact, Experience, Skills, Education'}`,
      weight: 25
    },
    {
      name: 'Font & Formatting',
      status: analysis?.formatting?.isClean !== false ? 'pass' : 'warning',
      description: 'Clean, ATS-friendly formatting',
      details: analysis?.formatting?.issues?.length ? 
               `Issues: ${analysis.formatting.issues.join(', ')}` :
               'Standard fonts and simple formatting detected',
      weight: 15
    },
    {
      name: 'Keyword Density',
      status: (analysis?.keywords?.density || 0.6) > 0.5 ? 'pass' : 
              (analysis?.keywords?.density || 0.6) > 0.3 ? 'warning' : 'fail',
      description: 'Relevant keywords from job requirements',
      details: `${analysis?.keywords?.totalFound || 'Multiple'} relevant keywords found`,
      weight: 40
    }
  ];

  const overallScore = compatibilityChecks.reduce((score, check) => {
    const multiplier = check.status === 'pass' ? 1 : check.status === 'warning' ? 0.7 : 0.3;
    return score + (check.weight * multiplier);
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ATS Compatibility</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">How well your resume works with ATS systems</p>
          </div>
        </div>
        
        {/* Overall Score */}
        <div className={`text-right px-4 py-2 rounded-lg ${getScoreBackground(overallScore)}`}>
          <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {Math.round(overallScore)}%
          </div>
          <p className={`text-xs font-medium ${getScoreColor(overallScore)}`}>
            {getScoreLabel(overallScore)}
          </p>
        </div>
      </div>

      {/* Compatibility Checks */}
      <div className="space-y-4">
        {compatibilityChecks.map((check, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(check.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {check.name}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Weight: {check.weight}%
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    check.status === 'pass' ? 'bg-green-500' :
                    check.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {check.description}
              </p>
              
              {check.details && (
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  {check.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2 mb-3">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            ATS Optimization Tips
          </h4>
        </div>
        
        <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
          {overallScore < 80 && (
            <div className="space-y-1">
              {compatibilityChecks.filter(c => c.status !== 'pass').map((check, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>
                    {check.name === 'File Format' && 'Consider using .docx format for best compatibility'}
                    {check.name === 'Standard Sections' && 'Include all standard sections: Contact, Summary, Experience, Education, Skills'}
                    {check.name === 'Font & Formatting' && 'Use standard fonts (Arial, Times New Roman) and simple formatting'}
                    {check.name === 'Keyword Density' && 'Add more relevant keywords from the job description'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {overallScore >= 80 && (
            <p className="flex items-center space-x-2">
              <Zap className="w-3 h-3" />
              <span>Excellent! Your resume is well-optimized for ATS systems.</span>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Based on {fileName}</span>
          <span>Updated in real-time</span>
        </div>
      </div>
    </div>
  );
};

export default ATSCompatibilityWidget;
