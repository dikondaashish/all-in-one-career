/**
 * Market Industry Card - Industry detection and market intelligence
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Building,
  Target,
  BarChart3,
  Award,
  Zap,
  Clock,
  Users,
  Star,
  ArrowRight
} from 'lucide-react';

interface MarketIndustryData {
  detected: {
    primary: string;
    secondary: string[];
    confidence: number;
  };
  trendingSkills: string[];
  decliningSkills: string[];
  careerPaths: string[][];
  marketPercentile: number;
  skillDemandHeatmap: Array<{
    skill: string;
    status: "hot" | "stable" | "declining";
  }>;
}

interface MarketIndustryCardProps {
  data: MarketIndustryData;
}

export const MarketIndustryCard: React.FC<MarketIndustryCardProps> = ({ data }) => {
  const getSkillStatusColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'stable':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'declining':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSkillStatusIcon = (status: string) => {
    switch (status) {
      case 'hot':
        return <Zap className="w-3 h-3" />;
      case 'stable':
        return <BarChart3 className="w-3 h-3" />;
      case 'declining':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <BarChart3 className="w-3 h-3" />;
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600';
    if (percentile >= 60) return 'text-blue-600';
    if (percentile >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentileBackground = (percentile: number) => {
    if (percentile >= 80) return 'bg-green-100';
    if (percentile >= 60) return 'bg-blue-100';
    if (percentile >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Building className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Market & Industry Intelligence</h3>
            <p className="text-sm text-gray-600">Industry positioning and market trends analysis</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">

        {/* Industry Detection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Primary Industry */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-500" />
              Industry Detection
            </h4>
            
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-indigo-900">Primary Industry</span>
                <span className={`text-sm font-medium ${getConfidenceColor(data.detected.confidence)}`}>
                  {Math.round(data.detected.confidence * 100)}% confidence
                </span>
              </div>
              <div className="text-xl font-bold text-indigo-800 mb-2">{data.detected.primary}</div>
              
              {data.detected.secondary.length > 0 && (
                <div>
                  <div className="text-sm text-indigo-700 mb-2">Specializations:</div>
                  <div className="flex flex-wrap gap-2">
                    {data.detected.secondary.map((spec, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Market Position */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Market Position
            </h4>
            
            <div className={`p-4 rounded-lg border-2 ${getPercentileBackground(data.marketPercentile)} ${data.marketPercentile >= 80 ? 'border-green-200' : data.marketPercentile >= 60 ? 'border-blue-200' : data.marketPercentile >= 40 ? 'border-yellow-200' : 'border-red-200'}`}>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getPercentileColor(data.marketPercentile)}`}>
                  {data.marketPercentile}th
                </div>
                <div className="text-sm font-medium text-gray-700">Market Percentile</div>
                <div className="text-xs text-gray-600 mt-1">
                  {data.marketPercentile >= 80 && "Top performer in your market"}
                  {data.marketPercentile >= 60 && data.marketPercentile < 80 && "Above average market position"}
                  {data.marketPercentile >= 40 && data.marketPercentile < 60 && "Average market position"}
                  {data.marketPercentile < 40 && "Below average - room for improvement"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Market Demand */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
            Skills Market Demand
          </h4>
          
          {data.skillDemandHeatmap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.skillDemandHeatmap.map((skill, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-3 border rounded-lg ${getSkillStatusColor(skill.status)}`}
                >
                  {getSkillStatusIcon(skill.status)}
                  <span className="font-medium">{skill.skill}</span>
                  <span className="text-xs font-bold uppercase ml-auto">
                    {skill.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No skill demand data available</div>
          )}
        </div>

        {/* Trending vs Declining Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Trending Skills */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Trending Skills ({data.trendingSkills.length})
            </h4>
            
            {data.trendingSkills.length > 0 ? (
              <div className="space-y-2">
                {data.trendingSkills.map((skill, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200"
                  >
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">{skill}</span>
                    <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                      HOT
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 italic">No trending skills identified</div>
            )}
          </div>

          {/* Declining Skills */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
              Declining Skills ({data.decliningSkills.length})
            </h4>
            
            {data.decliningSkills.length > 0 ? (
              <div className="space-y-2">
                {data.decliningSkills.map((skill, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">{skill}</span>
                    <span className="ml-auto text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-bold">
                      DECLINING
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-green-600 font-medium">✓ No declining skills in your profile</div>
            )}
          </div>
        </div>

        {/* Career Paths */}
        {data.careerPaths.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Common Career Paths in {data.detected.primary}
            </h4>
            
            <div className="space-y-4">
              {data.careerPaths.map((path, pathIndex) => (
                <div 
                  key={pathIndex}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2 flex-wrap">
                    {path.map((role, roleIndex) => (
                      <React.Fragment key={roleIndex}>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {role}
                        </span>
                        {roleIndex < path.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Intelligence Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Market Intelligence Summary
          </h4>
          <div className="space-y-3 text-sm text-indigo-800">
            <div className="flex items-start space-x-2">
              <Building className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>
                Positioned in <strong>{data.detected.primary}</strong> industry 
                {data.detected.secondary.length > 0 && (
                  <span> with specialization in {data.detected.secondary.join(', ')}</span>
                )}
              </span>
            </div>
            
            <div className="flex items-start space-x-2">
              <Award className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>
                Ranking in the <strong>{data.marketPercentile}th percentile</strong> of candidates in your market
              </span>
            </div>
            
            {data.trendingSkills.length > 0 && (
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{data.trendingSkills.length}</strong> trending skills align with market demand
                </span>
              </div>
            )}
            
            {data.decliningSkills.length > 0 && (
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>
                  Consider updating <strong>{data.decliningSkills.length}</strong> skills that are declining in demand
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
