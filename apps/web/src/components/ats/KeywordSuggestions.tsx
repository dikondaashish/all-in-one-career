'use client';

import React, { useState } from 'react';
import { TrendingUp, Plus, Copy, Check, Lightbulb, Star, Zap } from 'lucide-react';

interface KeywordSuggestion {
  category: string;
  description: string;
  keywords: string[];
  impact: 'high' | 'medium' | 'low';
  priority: number;
}

interface KeywordSuggestionsProps {
  analysis?: {
    missingHighImpactKeywords?: string[];
    missingTechnicalSkills?: string[];
    missingSoftSkills?: string[];
    suggestedKeywords?: string[];
    matchScore?: number;
  };
  missingSkills?: string[];
  jobDescription?: string;
}

const KeywordSuggestions: React.FC<KeywordSuggestionsProps> = ({ 
  analysis, 
  missingSkills = [],
  jobDescription = ''
}) => {
  const [copiedKeywords, setCopiedKeywords] = useState(new Set<string>());

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeywords(prev => new Set([...prev, keyword]));
    setTimeout(() => {
      setCopiedKeywords(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyword);
        return newSet;
      });
    }, 2000);
  };

  // Generate suggestions based on analysis or mock data
  const generateSuggestions = (): KeywordSuggestion[] => {
    const suggestions: KeywordSuggestion[] = [];

    // High Impact Keywords (from missing skills or analysis)
    const highImpactKeywords = analysis?.missingHighImpactKeywords || 
      missingSkills.filter(skill => skill.length > 3).slice(0, 5) ||
      ['project management', 'data analysis', 'strategic planning'];

    if (highImpactKeywords.length > 0) {
      suggestions.push({
        category: 'High Impact Keywords',
        description: 'These keywords appear frequently in the job description but are missing from your resume',
        keywords: highImpactKeywords,
        impact: 'high',
        priority: 1
      });
    }

    // Technical Skills
    const technicalSkills = analysis?.missingTechnicalSkills || 
      (jobDescription.toLowerCase().includes('technical') ? 
        ['Python', 'SQL', 'JavaScript', 'AWS', 'Docker'] :
        ['Microsoft Office', 'Excel', 'PowerPoint', 'CRM', 'Analytics']);

    suggestions.push({
      category: 'Technical Skills',
      description: 'Technical skills mentioned in the job posting that could strengthen your profile',
      keywords: technicalSkills.slice(0, 6),
      impact: 'medium',
      priority: 2
    });

    // Soft Skills
    const softSkills = analysis?.missingSoftSkills || [
      'leadership', 'communication', 'problem-solving', 'teamwork', 'adaptability', 'critical thinking'
    ];

    suggestions.push({
      category: 'Soft Skills',
      description: 'Soft skills that could enhance your application and ATS ranking',
      keywords: softSkills.slice(0, 6),
      impact: 'low',
      priority: 3
    });

    // Industry Keywords (based on job description analysis)
    const industryKeywords = jobDescription.toLowerCase().includes('marketing') ?
      ['digital marketing', 'SEO', 'content strategy', 'brand management'] :
      jobDescription.toLowerCase().includes('sales') ?
      ['sales strategy', 'customer acquisition', 'revenue growth', 'client relationships'] :
      ['project delivery', 'stakeholder management', 'process improvement', 'quality assurance'];

    suggestions.push({
      category: 'Industry Keywords',
      description: 'Industry-specific terms that align with the job requirements',
      keywords: industryKeywords.slice(0, 5),
      impact: 'medium',
      priority: 4
    });

    return suggestions.filter(s => s.keywords.length > 0);
  };

  const prioritySuggestions = generateSuggestions();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <Zap className="w-3 h-3" />;
      case 'medium': return <Star className="w-3 h-3" />;
      case 'low': return <Plus className="w-3 h-3" />;
      default: return <Lightbulb className="w-3 h-3" />;
    }
  };

  const totalKeywords = prioritySuggestions.reduce((sum, section) => sum + section.keywords.length, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyword Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalKeywords} suggestions to improve your ATS ranking
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {copiedKeywords.size} copied
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Click to copy
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-2">
          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How to use these keywords:</p>
            <ul className="text-xs space-y-1 list-disc list-inside ml-2">
              <li>Integrate naturally into your experience descriptions</li>
              <li>Include in your skills section when relevant</li>
              <li>Use exact phrases from high-impact keywords</li>
              <li>Don&apos;t keyword stuff - maintain readability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Keyword Suggestions */}
      <div className="space-y-6">
        {prioritySuggestions.map((section, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{section.category}</h4>
                <span className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full border ${getImpactColor(section.impact)}`}>
                  {getImpactIcon(section.impact)}
                  <span className="capitalize">{section.impact} impact</span>
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {section.keywords.length} keywords
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{section.description}</p>
            
            {section.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.keywords.map((keyword, keyIndex) => (
                  <button
                    key={keyIndex}
                    onClick={() => copyKeyword(keyword)}
                    className="group flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    title={`Click to copy &quot;${keyword}&quot;`}
                  >
                    <span className="text-gray-900 dark:text-white">{keyword}</span>
                    {copiedKeywords.has(keyword) ? (
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                No missing keywords in this category - you&apos;re well covered!
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">
              Optimization Potential: {totalKeywords} keywords to improve match rate
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Focus on high-impact keywords first
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordSuggestions;
