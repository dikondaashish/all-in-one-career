/**
 * Skills Matrix - Enhanced skills analysis with hard/soft/transferable breakdown
 */

import React, { useState } from 'react';
import { 
  Brain, 
  Users, 
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  TrendingDown,
  Star,
  Zap,
  Heart
} from 'lucide-react';

interface SkillsData {
  hard: {
    found: string[];
    missing: string[];
    impactWeights: Record<string, number>;
  };
  soft: {
    found: string[];
    missing: string[];
  };
  transferable: Array<{
    from: string;
    towards: string;
    confidence: number;
  }>;
}

interface SkillsMatrixProps {
  data: SkillsData;
}

export const SkillsMatrix: React.FC<SkillsMatrixProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'hard' | 'soft' | 'transferable'>('hard');

  const getImpactColor = (weight: number) => {
    if (weight <= -25) return 'bg-red-100 text-red-800 border-red-200';
    if (weight <= -15) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const renderHardSkills = () => (
    <div className="space-y-6">
      {/* Found Skills */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h4 className="text-lg font-semibold text-gray-900">
            Skills Found ({data.hard.found.length})
          </h4>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.hard.found.length > 0 ? (
            data.hard.found.map((skill, index) => (
              <div
                key={index}
                className="group relative"
              >
                <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium hover:from-green-200 hover:to-emerald-100 transition-all duration-300 cursor-default transform hover:scale-105 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{skill}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">No hard skills detected</div>
          )}
        </div>
      </div>

      {/* Missing Skills with Impact */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <h4 className="text-lg font-semibold text-gray-900">
            Missing High-Impact Skills ({data.hard.missing.length})
          </h4>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.hard.missing.length > 0 ? (
            data.hard.missing.map((skill, index) => {
              const impact = data.hard.impactWeights[skill] || -10;
              return (
                <div
                  key={index}
                  className="group relative"
                >
                  <div className={`px-4 py-2 border rounded-xl text-sm font-medium transition-all duration-300 cursor-default transform hover:scale-105 hover:-translate-y-1 hover:shadow-md ${getImpactColor(impact)}`}>
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4" />
                      <span>{skill}</span>
                      <span className="text-xs font-bold">
                        ({impact}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-green-600 font-medium">✓ No critical skills missing!</div>
          )}
        </div>
        
        {data.hard.missing.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <h5 className="font-semibold text-red-900 mb-2">Impact Legend:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-200 rounded"></div>
                <span>High Impact (-25%+)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-200 rounded"></div>
                <span>Medium Impact (-15%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                <span>Low Impact (-10%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSoftSkills = () => (
    <div className="space-y-6">
      {/* Found Soft Skills */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="w-5 h-5 text-blue-500" />
          <h4 className="text-lg font-semibold text-gray-900">
            Soft Skills Found ({data.soft.found.length})
          </h4>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.soft.found.length > 0 ? (
            data.soft.found.map((skill, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 text-blue-800 rounded-xl text-sm font-medium hover:from-blue-200 hover:to-indigo-100 transition-all duration-300 cursor-default transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-blue-600" />
                  <span>{skill}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">No soft skills detected</div>
          )}
        </div>
      </div>

      {/* Missing Soft Skills */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-orange-500" />
          <h4 className="text-lg font-semibold text-gray-900">
            Consider Adding ({data.soft.missing.length})
          </h4>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.soft.missing.length > 0 ? (
            data.soft.missing.map((skill, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200 text-orange-800 rounded-xl text-sm font-medium hover:from-orange-200 hover:to-amber-100 transition-all duration-300 cursor-default transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>{skill}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-green-600 font-medium">✓ All key soft skills present!</div>
          )}
        </div>
      </div>

      {/* Soft Skills Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h5 className="font-semibold text-blue-900 mb-2">💡 Soft Skills Tips:</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Demonstrate soft skills through specific examples and achievements</div>
          <div>• Use action words that imply leadership and collaboration</div>
          <div>• Quantify the impact of your interpersonal skills where possible</div>
          <div>• Weave soft skills naturally into your experience descriptions</div>
        </div>
      </div>
    </div>
  );

  const renderTransferableSkills = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowRightLeft className="w-5 h-5 text-purple-500" />
        <h4 className="text-lg font-semibold text-gray-900">
          Transferable Skills ({data.transferable.length})
        </h4>
      </div>

      {data.transferable.length > 0 ? (
        <div className="space-y-4">
          {data.transferable.map((transfer, index) => (
            <div
              key={index}
              className="p-4 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-sm font-medium text-purple-800">
                    {transfer.from}
                  </div>
                  <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                  <div className="px-3 py-1 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-900">
                    {transfer.towards}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getConfidenceColor(transfer.confidence)}`}>
                  {Math.round(transfer.confidence * 100)}% match
                </div>
              </div>
              <div className="mt-2 text-sm text-purple-700">
                Your experience with <strong>{transfer.from}</strong> demonstrates relevant knowledge for <strong>{transfer.towards}</strong>
              </div>
            </div>
          ))}
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h5 className="font-semibold text-purple-900 mb-2">🚀 How to Leverage:</h5>
            <div className="text-sm text-purple-800 space-y-1">
              <div>• Highlight these transferable skills in your cover letter</div>
              <div>• Mention related experience during interviews</div>
              <div>• Consider taking a short course to bridge the gap</div>
              <div>• Emphasize your ability to learn and adapt</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">No transferable skills identified</div>
          <div className="text-sm text-gray-400 mt-2">
            This could mean your skills already align well with the job requirements
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Skills Intelligence Matrix</h3>
            <p className="text-sm text-gray-600">Advanced breakdown of hard, soft, and transferable skills</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('hard')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'hard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Hard Skills</span>
              <span className={`px-2 py-1 rounded-full text-xs ${activeTab === 'hard' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                {data.hard.found.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('soft')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'soft'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Soft Skills</span>
              <span className={`px-2 py-1 rounded-full text-xs ${activeTab === 'soft' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                {data.soft.found.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('transferable')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'transferable'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transferable</span>
              <span className={`px-2 py-1 rounded-full text-xs ${activeTab === 'transferable' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                {data.transferable.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'hard' && renderHardSkills()}
        {activeTab === 'soft' && renderSoftSkills()}
        {activeTab === 'transferable' && renderTransferableSkills()}
      </div>
    </div>
  );
};
