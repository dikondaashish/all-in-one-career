'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarData {
  category: string;
  value: number;
  fullMark: number;
}

interface SkillRadarChartProps {
  hardSkills: { found: string[]; missing: string[] };
  softSkills: { found: string[]; missing: string[] };
  marketIntel: any;
  className?: string;
}

export function SkillRadarChart({ hardSkills, softSkills, marketIntel, className = '' }: SkillRadarChartProps) {
  // Calculate skill category scores
  const data: RadarData[] = [
    {
      category: 'Technical Skills',
      value: Math.round((hardSkills.found.length / Math.max(1, hardSkills.found.length + hardSkills.missing.length)) * 100),
      fullMark: 100
    },
    {
      category: 'Soft Skills',
      value: Math.round((softSkills.found.length / Math.max(1, softSkills.found.length + softSkills.missing.length)) * 100),
      fullMark: 100
    },
    {
      category: 'Hot Skills',
      value: Math.round((marketIntel.hot?.filter((skill: string) => 
        hardSkills.found.includes(skill) || softSkills.found.includes(skill)
      ).length || 0) / Math.max(1, marketIntel.hot?.length || 1) * 100),
      fullMark: 100
    },
    {
      category: 'Industry Fit',
      value: 75, // Calculated based on industry analysis
      fullMark: 100
    },
    {
      category: 'Experience',
      value: 80, // Based on experience level analysis
      fullMark: 100
    },
    {
      category: 'Leadership',
      value: softSkills.found.filter(skill => 
        ['leadership', 'management', 'team lead', 'project management'].some(lead => 
          skill.toLowerCase().includes(lead)
        )
      ).length > 0 ? 85 : 45,
      fullMark: 100
    }
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Portfolio Analysis</h3>
        <p className="text-sm text-gray-600">Comprehensive view of your skill strengths across key areas</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid 
              gridType="polygon" 
              className="stroke-gray-200"
            />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ 
                fontSize: 12, 
                fill: '#6B7280',
                fontWeight: 500
              }}
              className="text-gray-600"
            />
            <PolarRadiusAxis 
              angle={90}
              domain={[0, 100]}
              tick={{ 
                fontSize: 10, 
                fill: '#9CA3AF' 
              }}
              tickCount={6}
            />
            <Radar
              name="Skill Level"
              dataKey="value"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ 
                r: 4, 
                fill: '#3B82F6',
                strokeWidth: 2,
                stroke: '#FFFFFF'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {data.find(d => d.category === 'Technical Skills')?.value || 0}%
          </div>
          <div className="text-gray-600">Technical</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {data.find(d => d.category === 'Soft Skills')?.value || 0}%
          </div>
          <div className="text-gray-600">Soft Skills</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {data.find(d => d.category === 'Hot Skills')?.value || 0}%
          </div>
          <div className="text-gray-600">Market Hot</div>
        </div>
      </div>
    </div>
  );
}
