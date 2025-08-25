/**
 * Overall Score V2 - Deterministic, Explainable, Weighted Scoring Display
 */

import React from 'react';
import { 
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Brain,
  Users,
  BarChart3,
  Zap
} from 'lucide-react';

interface OverallScoreV2Props {
  data: {
    overallScoreV2?: {
      overall: number;
      band: number;
      confidence: number;
      breakdown: {
        A: number; // Foundational (40%)
        B: number; // Relevancy (35%)
        C: number; // Psychology (10%)
        D: number; // Market (10%)
        E: number; // Predictive (5%)
        redPenalty: number;
      };
      meta: {
        signalsUsed: number;
        signalsTotal: number;
        marketDataAvailable: boolean;
        reallocationApplied: boolean;
      };
    };
    subscoresV2?: any; // SubScores object
  };
}

export const OverallScoreV2: React.FC<OverallScoreV2Props> = ({ data }) => {
  const scoreData = data.overallScoreV2;
  
  if (!scoreData) {
    return null; // Graceful fallback - no v2 score available
  }

  const { overall, band, confidence, breakdown, meta } = scoreData;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 80) return 'from-blue-500 to-indigo-600';
    if (score >= 70) return 'from-yellow-500 to-orange-600';
    if (score >= 60) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-600';
    if (conf >= 80) return 'text-blue-600';
    if (conf >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const componentData = [
    {
      key: 'A',
      title: 'ATS Foundation',
      description: 'Format, sections, contact, job title match',
      icon: CheckCircle,
      score: breakdown.A,
      weight: '40%',
      color: 'blue'
    },
    {
      key: 'B', 
      title: 'Skills Relevancy',
      description: 'Hard/soft skills, experience fit, keyword density',
      icon: Target,
      score: breakdown.B,
      weight: '35%',
      color: 'purple'
    },
    {
      key: 'C',
      title: 'Recruiter Appeal',
      description: '6-second impression, authority language',
      icon: Users,
      score: breakdown.C,
      weight: '10%',
      color: 'green'
    },
    {
      key: 'D',
      title: 'Market Context',
      description: 'Industry position, company alignment',
      icon: BarChart3,
      score: breakdown.D,
      weight: meta.marketDataAvailable ? '10%' : 'N/A',
      color: 'orange'
    },
    {
      key: 'E',
      title: 'Future-Ready',
      description: 'X-factor, automation resistance',
      icon: Zap,
      score: breakdown.E,
      weight: '5%',
      color: 'pink'
    }
  ];

  // Calculate top improvement opportunities
  const getTopFixes = () => {
    const fixes = [];
    
    if (breakdown.A < 30) {
      fixes.push({ 
        component: 'ATS Foundation', 
        issue: 'Missing contact info or poor file format',
        impact: 'High'
      });
    }
    
    if (breakdown.B < 25) {
      fixes.push({ 
        component: 'Skills Relevancy', 
        issue: 'Missing critical skills from job description',
        impact: 'High'
      });
    }
    
    if (breakdown.C < 7 && breakdown.redPenalty > 2) {
      fixes.push({ 
        component: 'Red Flags', 
        issue: 'Employment gaps or weak language detected',
        impact: 'Medium'
      });
    }
    
    return fixes.slice(0, 3);
  };

  const topFixes = getTopFixes();

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Award className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Overall ATS Score <span className="text-sm font-normal text-gray-500">(v2)</span>
              </h3>
              <p className="text-sm text-gray-600">Deterministic, weighted analysis across 26 signals</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className={`font-semibold ${getConfidenceColor(confidence)}`}>
                {confidence}%
              </div>
              <div className="text-gray-500">Confidence</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">±{band}</div>
              <div className="text-gray-500">Range</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Score Display */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <div className={`flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${getScoreGradient(overall)} shadow-lg`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{overall}</div>
                <div className="text-white text-sm">/ 100</div>
              </div>
            </div>
            
            <div>
              <div className={`text-3xl font-bold mb-2 ${getScoreColor(overall)}`}>
                {getScoreLabel(overall)}
              </div>
              <p className="text-gray-600 max-w-md">
                {overall >= 90 && "Outstanding ATS optimization with exceptional recruiter appeal."}
                {overall >= 80 && overall < 90 && "Strong ATS performance with good market positioning."}
                {overall >= 70 && overall < 80 && "Solid foundation with targeted improvement opportunities."}
                {overall >= 60 && overall < 70 && "Basic ATS compatibility with significant enhancement potential."}
                {overall < 60 && "Substantial optimization needed for ATS and recruiter success."}
              </p>
              
              {meta.reallocationApplied && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-amber-600">
                  <Info className="w-4 h-4" />
                  <span>Score calculated without company-specific data</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-right space-y-2">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-700">{meta.signalsUsed}</div>
              <div className="text-sm text-slate-600">of {meta.signalsTotal} signals</div>
            </div>
            {breakdown.redPenalty > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-lg font-bold text-red-600">-{breakdown.redPenalty.toFixed(1)}</div>
                <div className="text-sm text-red-600">Red flag penalty</div>
              </div>
            )}
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {componentData.map((component) => {
              const Icon = component.icon;
              const isUnavailable = component.key === 'D' && !meta.marketDataAvailable;
              
              return (
                <div
                  key={component.key}
                  className={`text-center p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    isUnavailable 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-3">
                    <div className={`p-2 rounded-lg ${
                      isUnavailable ? 'bg-gray-100' : 
                      component.color === 'blue' ? 'bg-blue-100' :
                      component.color === 'purple' ? 'bg-purple-100' :
                      component.color === 'green' ? 'bg-green-100' :
                      component.color === 'orange' ? 'bg-orange-100' :
                      'bg-pink-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isUnavailable ? 'text-gray-400' :
                        component.color === 'blue' ? 'text-blue-600' :
                        component.color === 'purple' ? 'text-purple-600' :
                        component.color === 'green' ? 'text-green-600' :
                        component.color === 'orange' ? 'text-orange-600' :
                        'text-pink-600'
                      }`} />
                    </div>
                  </div>
                  
                  <div className={`text-2xl font-bold mb-1 ${
                    isUnavailable ? 'text-gray-400' : getScoreColor(component.score * 2.5)
                  }`}>
                    {isUnavailable ? 'N/A' : component.score.toFixed(1)}
                  </div>
                  
                  <div className="font-medium text-gray-900 text-sm mb-1">
                    {component.title}
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    {component.description}
                  </div>
                  
                  <div className={`text-xs font-medium ${
                    isUnavailable ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Weight: {component.weight}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Improvement Opportunities */}
        {topFixes.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-amber-900">Top 3 Improvement Opportunities</h4>
            </div>
            <div className="space-y-3">
              {topFixes.map((fix, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    fix.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fix.impact}
                  </div>
                  <div>
                    <div className="font-medium text-amber-900">{fix.component}</div>
                    <div className="text-sm text-amber-800">{fix.issue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
