'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye, FileText, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';
import { SkillRadarChart } from './charts/RadarChart';
import { SkillHeatmap } from './charts/SkillHeatmap';

interface IntelligencePanelProps {
  data: {
    skills: {
      hardFound: string[];
      hardMissing: string[];
      softFound: string[];
      softMissing: string[];
      impactWeights: Record<string, number>;
    };
    marketIntel: {
      hot: string[];
      declining: string[];
      benchmarks: {
        salaryRange: [number, number];
        competition: number;
      };
      demandScores: Record<string, 'hot' | 'stable' | 'declining'>;
    };
    industryIntel: {
      primary: string;
      secondary: string[];
      confidence: number;
    };
    wordStats: {
      wordCount: number;
      recommendedRange: [number, number];
    };
    webPresence: {
      linkedin?: string;
      portfolio?: string;
      github?: string;
    };
    atsCompatibility: any;
  };
}

export function IntelligencePanel({ data }: IntelligencePanelProps) {
  // Transform skills data for heatmap
  const skillsForHeatmap = [
    ...data.skills.hardFound.map(skill => ({
      skill,
      demand: data.marketIntel.demandScores[skill] || 'stable' as const,
      found: true,
      importance: data.skills.impactWeights[skill] >= 3 ? 'CRITICAL' as const : 
                 data.skills.impactWeights[skill] >= 2 ? 'IMPORTANT' as const : 'NICE' as const,
      impactWeight: data.skills.impactWeights[skill],
    })),
    ...data.skills.hardMissing.map(skill => ({
      skill,
      demand: data.marketIntel.demandScores[skill] || 'stable' as const,
      found: false,
      importance: 'CRITICAL' as const, // Missing skills are typically critical
    })),
  ];

  const getWordCountStatus = () => {
    const [min, max] = data.wordStats.recommendedRange;
    const count = data.wordStats.wordCount;
    
    if (count < min) return { status: 'Too Short', color: 'text-red-600 bg-red-50', icon: '📏' };
    if (count > max) return { status: 'Too Long', color: 'text-yellow-600 bg-yellow-50', icon: '📃' };
    return { status: 'Optimal', color: 'text-green-600 bg-green-50', icon: '✅' };
  };

  const wordCountStatus = getWordCountStatus();

  return (
    <div className="space-y-6">
      {/* Market Intelligence Overview */}
      <motion.div
        className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-4">Market Intelligence Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold mb-1">{data.industryIntel.primary}</div>
            <div className="text-purple-200 text-sm">Primary Industry</div>
            <div className="text-xs text-purple-100 mt-1">
              {Math.round(data.industryIntel.confidence * 100)}% confidence
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">{data.marketIntel.benchmarks.competition}%</div>
            <div className="text-purple-200 text-sm">Market Competition</div>
            <div className="text-xs text-purple-100 mt-1">
              {data.marketIntel.benchmarks.competition > 70 ? 'Highly competitive' : 
               data.marketIntel.benchmarks.competition > 50 ? 'Moderately competitive' : 'Low competition'}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">
              ${(data.marketIntel.benchmarks.salaryRange[0] / 1000).toFixed(0)}k-${(data.marketIntel.benchmarks.salaryRange[1] / 1000).toFixed(0)}k
            </div>
            <div className="text-purple-200 text-sm">Salary Range</div>
            <div className="text-xs text-purple-100 mt-1">Market benchmark</div>
          </div>
        </div>
      </motion.div>

      {/* Skill Portfolio Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <SkillRadarChart
          hardSkills={{
            found: data.skills.hardFound,
            missing: data.skills.hardMissing
          }}
          softSkills={{
            found: data.skills.softFound,
            missing: data.skills.softMissing
          }}
          marketIntel={data.marketIntel}
        />
      </motion.div>

      {/* Skills Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <SkillHeatmap
          skills={skillsForHeatmap}
          title="Skill Demand Heatmap"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Trends */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
          
          <div className="space-y-4">
            {/* Hot Skills */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">High Demand Skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.marketIntel.hot.slice(0, 6).map((skill, index) => (
                  <motion.span
                    key={skill}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                  >
                    🔥 {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Declining Skills */}
            {data.marketIntel.declining.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Declining Demand</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.marketIntel.declining.slice(0, 4).map((skill, index) => (
                    <motion.span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}
                    >
                      📉 {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Industries */}
            {data.industryIntel.secondary.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Related Industries</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.industryIntel.secondary.map((industry, index) => (
                    <span
                      key={industry}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resume Intelligence */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Intelligence</h3>
          
          <div className="space-y-4">
            {/* Word Count Analysis */}
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Word Count</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${wordCountStatus.color}`}>
                  {wordCountStatus.icon} {wordCountStatus.status}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {data.wordStats.wordCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Recommended: {data.wordStats.recommendedRange[0].toLocaleString()} - {data.wordStats.recommendedRange[1].toLocaleString()} words
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (data.wordStats.wordCount / data.wordStats.recommendedRange[1]) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Web Presence */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Web Presence</span>
              </div>
              <div className="space-y-2">
                {data.webPresence.linkedin && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">LinkedIn Profile Found</span>
                    <ExternalLink className="w-3 h-3 text-blue-500 ml-auto" />
                  </div>
                )}
                {data.webPresence.portfolio && (
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700">Portfolio Website</span>
                    <ExternalLink className="w-3 h-3 text-purple-500 ml-auto" />
                  </div>
                )}
                {data.webPresence.github && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Github className="w-4 h-4 text-gray-700" />
                    <span className="text-sm text-gray-700">GitHub Profile</span>
                    <ExternalLink className="w-3 h-3 text-gray-500 ml-auto" />
                  </div>
                )}
                {!data.webPresence.linkedin && !data.webPresence.portfolio && !data.webPresence.github && (
                  <div className="text-sm text-gray-500 italic">
                    No web presence detected. Consider adding professional links.
                  </div>
                )}
              </div>
            </div>

            {/* ATS Compatibility Quick Check */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">ATS Compatibility</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded ${data.atsCompatibility.hasEmail ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {data.atsCompatibility.hasEmail ? '✅' : '❌'} Email
                </div>
                <div className={`p-2 rounded ${data.atsCompatibility.hasPhone ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {data.atsCompatibility.hasPhone ? '✅' : '❌'} Phone
                </div>
                <div className={`p-2 rounded ${data.atsCompatibility.headings.experience ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {data.atsCompatibility.headings.experience ? '✅' : '❌'} Experience
                </div>
                <div className={`p-2 rounded ${data.atsCompatibility.headings.skills ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {data.atsCompatibility.headings.skills ? '✅' : '❌'} Skills
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Industry Insights */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Market Position</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {data.marketIntel.benchmarks.competition > 70 ? 'Competitive' : 
               data.marketIntel.benchmarks.competition > 50 ? 'Balanced' : 'Opportunity'}
            </div>
            <div className="text-sm text-gray-600">
              {data.marketIntel.benchmarks.competition}% competition level
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Skill Coverage</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round((data.skills.hardFound.length / (data.skills.hardFound.length + data.skills.hardMissing.length)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">
              {data.skills.hardFound.length} of {data.skills.hardFound.length + data.skills.hardMissing.length} skills matched
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Hot Skills Owned</div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {data.marketIntel.hot.filter(skill => 
                data.skills.hardFound.includes(skill) || data.skills.softFound.includes(skill)
              ).length}
            </div>
            <div className="text-sm text-gray-600">
              out of {data.marketIntel.hot.length} trending skills
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
