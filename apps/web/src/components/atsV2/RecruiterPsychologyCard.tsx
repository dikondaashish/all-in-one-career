/**
 * Recruiter Psychology Card - Psychology insights and first impression analysis
 */

import React from 'react';
import { 
  Eye, 
  Brain, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Flag
} from 'lucide-react';

interface RecruiterPsychologyData {
  sixSecondImpression: number;
  authorityLanguage: {
    strong: string[];
    weak: string[];
  };
  narrativeCoherence: number;
  redFlags: string[];
  badges: Array<{
    type: string;
    severity: "info" | "warn" | "error";
    message: string;
  }>;
}

interface RecruiterPsychologyCardProps {
  data: RecruiterPsychologyData;
}

export const RecruiterPsychologyCard: React.FC<RecruiterPsychologyCardProps> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeIcon = (type: string, severity: string) => {
    if (severity === 'error') return <XCircle className="w-4 h-4" />;
    if (severity === 'warn') return <AlertTriangle className="w-4 h-4" />;
    if (type === 'achievement') return <Star className="w-4 h-4" />;
    return <Flag className="w-4 h-4" />;
  };

  const getRedFlagDisplay = (flag: string) => {
    const flagDisplays = {
      'job_hopping': { icon: '🏃', label: 'Job Hopping', description: 'Frequent job changes' },
      'employment_gap': { icon: '📅', label: 'Employment Gap', description: 'Gap in employment history' },
      'skill_inflation': { icon: '📈', label: 'Skill Inflation', description: 'Skills may appear inflated' },
      'unclear_progression': { icon: '🎯', label: 'Unclear Progression', description: 'Career progression unclear' },
      'formatting_issues': { icon: '📝', label: 'Formatting Issues', description: 'Resume formatting problems' },
      'typos': { icon: '✏️', label: 'Typos/Errors', description: 'Spelling or grammar errors' },
      'overqualified': { icon: '🎓', label: 'Overqualified', description: 'May be overqualified for role' },
      'underqualified': { icon: '📚', label: 'Underqualified', description: 'May lack required qualifications' },
      'missing_contact': { icon: '📞', label: 'Missing Contact', description: 'Contact information incomplete' },
      'too_lengthy': { icon: '📄', label: 'Too Lengthy', description: 'Resume is too long' }
    };

    return flagDisplays[flag as keyof typeof flagDisplays] || { icon: '⚠️', label: flag.replace('_', ' '), description: 'Potential concern' };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recruiter Psychology Insights</h3>
            <p className="text-sm text-gray-600">How recruiters perceive your resume at first glance</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">

        {/* Main Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 6-Second Impression */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBackground(data.sixSecondImpression)} ${data.sixSecondImpression >= 80 ? 'border-green-200' : data.sixSecondImpression >= 60 ? 'border-yellow-200' : 'border-red-200'}`}>
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-6 h-6 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">6-Second Impression</h4>
            </div>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(data.sixSecondImpression)}`}>
              {data.sixSecondImpression}%
            </div>
            <div className="text-sm text-gray-600">
              {data.sixSecondImpression >= 80 && "Excellent first impression - recruiter likely to continue reading"}
              {data.sixSecondImpression >= 60 && data.sixSecondImpression < 80 && "Good first impression with room for improvement"}
              {data.sixSecondImpression < 60 && "Needs improvement to capture recruiter attention quickly"}
            </div>
          </div>

          {/* Narrative Coherence */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBackground(data.narrativeCoherence)} ${data.narrativeCoherence >= 80 ? 'border-green-200' : data.narrativeCoherence >= 60 ? 'border-yellow-200' : 'border-red-200'}`}>
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-6 h-6 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">Story Coherence</h4>
            </div>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(data.narrativeCoherence)}`}>
              {data.narrativeCoherence}%
            </div>
            <div className="text-sm text-gray-600">
              {data.narrativeCoherence >= 80 && "Clear, compelling career narrative"}
              {data.narrativeCoherence >= 60 && data.narrativeCoherence < 80 && "Career story flows well with minor gaps"}
              {data.narrativeCoherence < 60 && "Career progression could be clearer"}
            </div>
          </div>
        </div>

        {/* Authority Language Analysis */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Authority Language
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strong Language */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <h5 className="font-semibold text-green-700">Strong Words ({data.authorityLanguage.strong.length})</h5>
              </div>
              <div className="space-y-2">
                {data.authorityLanguage.strong.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.authorityLanguage.strong.map((word, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-sm">No strong authority words detected</div>
                )}
              </div>
            </div>

            {/* Weak Language */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <h5 className="font-semibold text-red-700">Weak Words ({data.authorityLanguage.weak.length})</h5>
              </div>
              <div className="space-y-2">
                {data.authorityLanguage.weak.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.authorityLanguage.weak.map((word, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-green-600 italic text-sm font-medium">✓ No weak language detected</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Language Tips */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h6 className="font-semibold text-blue-900 mb-2">💡 Language Enhancement Tips:</h6>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• Replace "helped" with "led" or "drove"</div>
              <div>• Use "achieved" instead of "was responsible for"</div>
              <div>• Choose "built" over "worked on"</div>
              <div>• Prefer "optimized" to "improved"</div>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {data.redFlags.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Areas of Concern ({data.redFlags.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.redFlags.map((flag, index) => {
                const flagInfo = getRedFlagDisplay(flag);
                return (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <span className="text-lg">{flagInfo.icon}</span>
                    <div>
                      <div className="font-semibold text-red-900 text-sm">{flagInfo.label}</div>
                      <div className="text-red-700 text-xs">{flagInfo.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {data.badges.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Notable Observations ({data.badges.length})
            </h4>
            <div className="space-y-3">
              {data.badges.map((badge, index) => (
                <div 
                  key={index}
                  className={`flex items-start space-x-3 p-4 border rounded-lg ${getBadgeStyle(badge.severity)}`}
                >
                  {getBadgeIcon(badge.type, badge.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold capitalize">{badge.type.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getBadgeStyle(badge.severity)}`}>
                        {badge.severity}
                      </span>
                    </div>
                    <div className="text-sm">{badge.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary & Recommendations */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Recruiter's Eye View Summary
          </h4>
          <div className="space-y-3 text-sm text-purple-800">
            {data.sixSecondImpression >= 80 ? (
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Strong first impression likely to lead to detailed review</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>Focus on improving visual hierarchy and key information placement</span>
              </div>
            )}
            
            {data.authorityLanguage.strong.length > data.authorityLanguage.weak.length ? (
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Language demonstrates strong ownership and leadership</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>Consider using more authoritative action words</span>
              </div>
            )}
            
            {data.narrativeCoherence >= 75 ? (
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Career story flows logically and demonstrates clear progression</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>Consider clarifying career transitions and growth trajectory</span>
              </div>
            )}
            
            {data.redFlags.length === 0 ? (
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>No major red flags detected - resume appears recruiter-friendly</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>Address red flags to improve recruiter confidence</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
