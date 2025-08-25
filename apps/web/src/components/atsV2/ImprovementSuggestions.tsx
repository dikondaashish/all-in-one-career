/**
 * Improvement Suggestions - Actionable recommendations for resume enhancement
 */

import React from 'react';
import { 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  FileText,
  Users,
  Star,
  Plus,
  Edit,
  Zap
} from 'lucide-react';

interface V2Data {
  atsChecks?: any;
  skills?: any;
  recruiterPsychology?: any;
  industry?: any;
  predictive?: any;
  companyOptimization?: any;
}

interface ImprovementSuggestionsProps {
  data: V2Data;
}

interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'ats' | 'skills' | 'content' | 'formatting' | 'strategy';
  title: string;
  description: string;
  impact: string;
  actionSteps: string[];
  icon: any;
}

export const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({ data }) => {
  
  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // ATS Foundation Suggestions
    if (data.atsChecks) {
      if (!data.atsChecks.contact?.email) {
        suggestions.push({
          id: 'add-email',
          priority: 'high',
          category: 'ats',
          title: 'Add Email Address',
          description: 'Your resume is missing an email address, which is critical for ATS systems.',
          impact: 'Essential for contact and ATS parsing',
          actionSteps: [
            'Add your professional email address at the top of your resume',
            'Use a format like: john.smith@email.com',
            'Avoid unprofessional email addresses'
          ],
          icon: AlertTriangle
        });
      }

      if (!data.atsChecks.contact?.phone) {
        suggestions.push({
          id: 'add-phone',
          priority: 'high',
          category: 'ats',
          title: 'Add Phone Number',
          description: 'Include a phone number to improve recruiter contact options.',
          impact: 'Increases recruiter confidence and contact options',
          actionSteps: [
            'Add your phone number in standard format: (555) 123-4567',
            'Include country code if applying internationally',
            'Ensure the number is active and professional voicemail is set up'
          ],
          icon: AlertTriangle
        });
      }

      if (data.atsChecks.wordCountStatus === 'under') {
        suggestions.push({
          id: 'expand-content',
          priority: 'medium',
          category: 'content',
          title: 'Expand Resume Content',
          description: `Your resume has ${data.atsChecks.wordCount} words. Consider adding more detail to reach 400-800 words.`,
          impact: 'Better showcases your experience and skills',
          actionSteps: [
            'Add more specific achievements and responsibilities',
            'Include quantified results (increased sales by 25%)',
            'Expand on your most relevant experiences',
            'Add relevant projects or certifications'
          ],
          icon: Edit
        });
      }

      if (data.atsChecks.wordCountStatus === 'over') {
        suggestions.push({
          id: 'condense-content',
          priority: 'medium',
          category: 'formatting',
          title: 'Condense Resume Content',
          description: `Your resume has ${data.atsChecks.wordCount} words. Consider condensing to improve readability.`,
          impact: 'Improves readability and ATS processing speed',
          actionSteps: [
            'Remove redundant information',
            'Focus on most relevant and recent experiences',
            'Use bullet points instead of paragraphs',
            'Eliminate outdated or irrelevant skills'
          ],
          icon: Edit
        });
      }

      if (!data.atsChecks.jobTitleMatch?.exact && data.atsChecks.jobTitleMatch?.normalizedSimilarity < 0.7) {
        suggestions.push({
          id: 'match-job-title',
          priority: 'high',
          category: 'strategy',
          title: 'Include Target Job Title',
          description: 'Your resume doesn\'t closely match the job title you\'re applying for.',
          impact: 'Significantly improves ATS keyword matching',
          actionSteps: [
            'Include the exact job title in your professional summary',
            'Add the target role in your LinkedIn headline',
            'Use similar language and terminology from the job posting',
            'Consider adding the title as a "target role" section'
          ],
          icon: Target
        });
      }

      if (!data.atsChecks.sections?.skills) {
        suggestions.push({
          id: 'add-skills-section',
          priority: 'high',
          category: 'ats',
          title: 'Add Dedicated Skills Section',
          description: 'Your resume is missing a dedicated skills section.',
          impact: 'Critical for ATS parsing and keyword matching',
          actionSteps: [
            'Create a "Skills" or "Core Competencies" section',
            'List relevant hard and soft skills',
            'Use keywords from the job description',
            'Organize skills by category (Technical, Management, etc.)'
          ],
          icon: Plus
        });
      }

      if (!data.atsChecks.sections?.summary) {
        suggestions.push({
          id: 'add-professional-summary',
          priority: 'medium',
          category: 'content',
          title: 'Add Professional Summary',
          description: 'A professional summary helps recruiters quickly understand your value.',
          impact: 'Improves first impression and keyword density',
          actionSteps: [
            'Write a 3-4 line professional summary at the top',
            'Include your years of experience and key skills',
            'Mention your target role and industry',
            'Use strong action words and specific achievements'
          ],
          icon: FileText
        });
      }
    }

    // Skills-based Suggestions
    if (data.skills) {
      const missingHardSkills = data.skills.hard?.missing || [];
      const impactWeights = data.skills.hard?.impactWeights || {};

      // High-impact missing skills
      const criticalMissingSkills = missingHardSkills.filter((skill: string) => 
        impactWeights[skill] && impactWeights[skill] <= -20
      );

      if (criticalMissingSkills.length > 0) {
        suggestions.push({
          id: 'add-critical-skills',
          priority: 'high',
          category: 'skills',
          title: 'Add Critical Missing Skills',
          description: `You're missing ${criticalMissingSkills.length} high-impact skills that are important for this role.`,
          impact: `Could improve your score by ${Math.abs(Object.values(impactWeights).reduce((sum: number, weight: any) => sum + Math.min(0, weight), 0))}%`,
          actionSteps: [
            `Priority skills to add: ${criticalMissingSkills.slice(0, 3).join(', ')}`,
            'Take online courses or certifications in these areas',
            'Add any relevant experience you may have forgotten',
            'Consider projects or volunteer work that demonstrate these skills'
          ],
          icon: TrendingUp
        });
      }

      // Transferable skills opportunities
      const transferableSkills = data.skills.transferable || [];
      if (transferableSkills.length > 0) {
        suggestions.push({
          id: 'leverage-transferable',
          priority: 'medium',
          category: 'strategy',
          title: 'Leverage Transferable Skills',
          description: `You have ${transferableSkills.length} transferable skills that could bridge experience gaps.`,
          impact: 'Demonstrates adaptability and relevant experience',
          actionSteps: [
            'Highlight how your existing skills apply to the target role',
            'Add a note explaining skill transferability in your cover letter',
            'Consider taking a short course to formalize the connection',
            'Use examples that show how you\'ve adapted skills before'
          ],
          icon: Zap
        });
      }

      // Soft skills enhancement
      const softSkillsFound = data.skills.soft?.found?.length || 0;
      if (softSkillsFound < 3) {
        suggestions.push({
          id: 'enhance-soft-skills',
          priority: 'low',
          category: 'skills',
          title: 'Showcase More Soft Skills',
          description: 'Adding more soft skills can improve your overall appeal to recruiters.',
          impact: 'Demonstrates well-rounded professional capabilities',
          actionSteps: [
            'Weave soft skills into your experience descriptions',
            'Use action words that imply leadership and collaboration',
            'Add examples of teamwork, communication, and problem-solving',
            'Include soft skills in your professional summary'
          ],
          icon: Users
        });
      }
    }

    // Recruiter Psychology Suggestions
    if (data.recruiterPsychology) {
      if (data.recruiterPsychology.sixSecondImpression < 70) {
        suggestions.push({
          id: 'improve-first-impression',
          priority: 'high',
          category: 'formatting',
          title: 'Improve 6-Second Impression',
          description: `Your resume's first impression score is ${data.recruiterPsychology.sixSecondImpression}%. Improve visual hierarchy.`,
          impact: 'Critical for getting past initial recruiter screening',
          actionSteps: [
            'Use clear, readable fonts (Arial, Calibri, Times New Roman)',
            'Ensure consistent formatting and spacing',
            'Put most important information at the top',
            'Use bullet points and white space effectively',
            'Make your contact information prominent'
          ],
          icon: Star
        });
      }

      const weakWords = data.recruiterPsychology.authorityLanguage?.weak || [];
      if (weakWords.length > 0) {
        suggestions.push({
          id: 'strengthen-language',
          priority: 'medium',
          category: 'content',
          title: 'Use Stronger Action Words',
          description: `Replace weak words like "${weakWords.slice(0, 2).join('", "')}" with more powerful alternatives.`,
          impact: 'Demonstrates ownership and leadership',
          actionSteps: [
            'Replace "helped" with "led", "drove", or "facilitated"',
            'Use "achieved" instead of "was responsible for"',
            'Change "worked on" to "built", "created", or "developed"',
            'Quantify achievements wherever possible'
          ],
          icon: Edit
        });
      }

      const redFlags = data.recruiterPsychology.redFlags || [];
      if (redFlags.length > 0) {
        suggestions.push({
          id: 'address-red-flags',
          priority: 'high',
          category: 'strategy',
          title: 'Address Resume Red Flags',
          description: `Your resume has ${redFlags.length} potential red flags that may concern recruiters.`,
          impact: 'Prevents automatic rejection by recruiters',
          actionSteps: [
            'Review employment gaps and add explanations if needed',
            'Ensure consistent date formatting throughout',
            'Check for spelling and grammar errors',
            'Address any formatting inconsistencies',
            'Consider adding a brief explanation for career changes'
          ],
          icon: AlertTriangle
        });
      }
    }

    // Industry and Market Suggestions
    if (data.industry) {
      const trendingSkills = data.industry.trendingSkills || [];
      const decliningSkills = data.industry.decliningSkills || [];

      if (trendingSkills.length > 0) {
        suggestions.push({
          id: 'add-trending-skills',
          priority: 'medium',
          category: 'skills',
          title: 'Add Trending Industry Skills',
          description: `Consider adding trending skills like ${trendingSkills.slice(0, 3).join(', ')} to stay competitive.`,
          impact: 'Positions you as current with industry trends',
          actionSteps: [
            'Research and learn trending skills in your industry',
            'Take online courses or get certifications',
            'Add these skills to your LinkedIn profile',
            'Look for projects or assignments to practice these skills'
          ],
          icon: TrendingUp
        });
      }

      if (decliningSkills.length > 0) {
        suggestions.push({
          id: 'update-outdated-skills',
          priority: 'low',
          category: 'skills',
          title: 'Update Outdated Skills',
          description: `Some skills like ${decliningSkills.slice(0, 2).join(', ')} are declining in demand.`,
          impact: 'Keeps your resume modern and relevant',
          actionSteps: [
            'Replace outdated skills with modern alternatives',
            'Update technical skills to current versions',
            'Focus on skills that are growing in demand',
            'Consider removing skills that are no longer relevant'
          ],
          icon: Edit
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const suggestions = generateSuggestions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Excellent Work!</h3>
              <p className="text-sm text-gray-600">Your resume looks great with no major improvement areas identified</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <Star className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Your resume demonstrates strong ATS compatibility and recruiter appeal. 
            Continue to keep it updated with relevant skills and experiences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Improvement Suggestions</h3>
            <p className="text-sm text-gray-600">
              {suggestions.length} recommendations to enhance your resume's performance
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="p-6 space-y-6">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <div
              key={suggestion.id}
              className={`border-2 rounded-lg p-6 ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg bg-white ${getPriorityIcon(suggestion.priority)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(suggestion.priority)}`}>
                      {suggestion.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{suggestion.description}</p>
                  
                  <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Expected Impact:</span>
                    </div>
                    <p className="text-green-800 text-sm">{suggestion.impact}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Action Steps:</h5>
                    <ul className="space-y-1">
                      {suggestion.actionSteps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Implementing these suggestions could significantly improve your resume's ATS score and recruiter appeal.
            Focus on high-priority items first for maximum impact.
          </p>
        </div>
      </div>
    </div>
  );
};
