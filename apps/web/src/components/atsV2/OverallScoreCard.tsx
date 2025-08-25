/**
 * Overall Score Card - Comprehensive scoring based on all V2 metrics
 */

import React from 'react';
import { 
  Award,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Target,
  Star,
  Zap,
  Users,
  BarChart3
} from 'lucide-react';

interface V2Data {
  atsChecks?: any;
  skills?: any;
  recruiterPsychology?: any;
  industry?: any;
  predictive?: any;
  companyOptimization?: any;
}

interface OverallScoreCardProps {
  data: V2Data;
}

export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ data }) => {
  
  // Calculate overall score from all metrics
  const calculateOverallScore = (): { score: number; breakdown: any } => {
    let totalScore = 0;
    let maxScore = 0;
    const breakdown = {
      atsFoundation: 0,
      skillsAlignment: 0,
      recruiterAppeal: 0,
      marketPosition: 0,
      futureReadiness: 0
    };

    // ATS Foundation Score (25% weight)
    if (data.atsChecks) {
      let atsScore = 0;
      let atsMax = 0;
      
      // File checks
      if (data.atsChecks.fileTypeOk) atsScore += 15;
      if (data.atsChecks.fileNameOk) atsScore += 10;
      atsMax += 25;
      
      // Contact checks
      if (data.atsChecks.contact?.email) atsScore += 20;
      if (data.atsChecks.contact?.phone) atsScore += 15;
      if (data.atsChecks.contact?.location) atsScore += 10;
      atsMax += 45;
      
      // Section checks
      if (data.atsChecks.sections?.experience) atsScore += 15;
      if (data.atsChecks.sections?.skills) atsScore += 15;
      if (data.atsChecks.sections?.education) atsScore += 10;
      if (data.atsChecks.sections?.summary) atsScore += 5;
      atsMax += 45;
      
      // Word count and job title
      if (data.atsChecks.wordCountStatus === 'optimal') atsScore += 10;
      else if (data.atsChecks.wordCountStatus === 'under') atsScore += 5;
      if (data.atsChecks.jobTitleMatch?.exact) atsScore += 15;
      else if (data.atsChecks.jobTitleMatch?.normalizedSimilarity > 0.7) atsScore += 10;
      atsMax += 25;
      
      breakdown.atsFoundation = Math.round((atsScore / atsMax) * 100);
      totalScore += breakdown.atsFoundation * 0.25;
      maxScore += 25;
    }

    // Skills Alignment Score (25% weight)
    if (data.skills) {
      let skillsScore = 50; // Base score
      
      // Hard skills bonus
      const hardSkillsFound = data.skills.hard?.found?.length || 0;
      const hardSkillsMissing = data.skills.hard?.missing?.length || 0;
      const skillsRatio = hardSkillsFound / Math.max(1, hardSkillsFound + hardSkillsMissing);
      skillsScore += skillsRatio * 30;
      
      // Soft skills bonus
      const softSkillsFound = data.skills.soft?.found?.length || 0;
      skillsScore += Math.min(15, softSkillsFound * 2);
      
      // Transferable skills bonus
      const transferableSkills = data.skills.transferable?.length || 0;
      skillsScore += Math.min(10, transferableSkills * 5);
      
      // Impact weights penalty
      const impactWeights = data.skills.hard?.impactWeights || {};
      const totalPenalty = Object.values(impactWeights).reduce((sum: number, weight: any) => sum + Math.abs(weight), 0);
      skillsScore -= Math.min(20, totalPenalty * 0.5);
      
      breakdown.skillsAlignment = Math.max(0, Math.min(100, Math.round(skillsScore)));
      totalScore += breakdown.skillsAlignment * 0.25;
      maxScore += 25;
    }

    // Recruiter Appeal Score (20% weight)
    if (data.recruiterPsychology) {
      const sixSecond = data.recruiterPsychology.sixSecondImpression || 0;
      const narrative = data.recruiterPsychology.narrativeCoherence || 0;
      const redFlagsCount = data.recruiterPsychology.redFlags?.length || 0;
      const authorityRatio = (data.recruiterPsychology.authorityLanguage?.strong?.length || 0) / 
                            Math.max(1, (data.recruiterPsychology.authorityLanguage?.strong?.length || 0) + 
                                       (data.recruiterPsychology.authorityLanguage?.weak?.length || 0));
      
      let appealScore = (sixSecond + narrative) / 2;
      appealScore += authorityRatio * 20;
      appealScore -= redFlagsCount * 5;
      
      breakdown.recruiterAppeal = Math.max(0, Math.min(100, Math.round(appealScore)));
      totalScore += breakdown.recruiterAppeal * 0.20;
      maxScore += 20;
    }

    // Market Position Score (15% weight)
    if (data.industry) {
      const marketPercentile = data.industry.marketPercentile || 50;
      const trendingSkillsCount = data.industry.trendingSkills?.length || 0;
      const decliningSkillsCount = data.industry.decliningSkills?.length || 0;
      
      let marketScore = marketPercentile;
      marketScore += Math.min(15, trendingSkillsCount * 3);
      marketScore -= Math.min(10, decliningSkillsCount * 2);
      
      breakdown.marketPosition = Math.max(0, Math.min(100, Math.round(marketScore)));
      totalScore += breakdown.marketPosition * 0.15;
      maxScore += 15;
    }

    // Future Readiness Score (15% weight)
    if (data.predictive) {
      const hireProbability = data.predictive.hireProbability?.point || 50;
      const automationRisk = data.predictive.automationRisk || 0.3;
      const futureProofScore = (1 - automationRisk) * 100;
      const xFactor = data.predictive.hireProbability?.xFactor || 0;
      
      let readinessScore = (hireProbability + futureProofScore) / 2;
      readinessScore += Math.min(15, xFactor);
      
      breakdown.futureReadiness = Math.max(0, Math.min(100, Math.round(readinessScore)));
      totalScore += breakdown.futureReadiness * 0.15;
      maxScore += 15;
    }

    const finalScore = Math.round(totalScore);
    return { score: finalScore, breakdown };
  };

  const { score, breakdown } = calculateOverallScore();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-indigo-600';
    if (score >= 55) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Exceptional';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Good';
    return 'Needs Improvement';
  };

  const metricCards = [
    {
      key: 'atsFoundation',
      title: 'ATS Foundation',
      icon: CheckCircle,
      score: breakdown.atsFoundation,
      description: 'File format, contact info, structure'
    },
    {
      key: 'skillsAlignment',
      title: 'Skills Alignment', 
      icon: Target,
      score: breakdown.skillsAlignment,
      description: 'Hard/soft skills match and relevance'
    },
    {
      key: 'recruiterAppeal',
      title: 'Recruiter Appeal',
      icon: Users,
      score: breakdown.recruiterAppeal,
      description: 'First impression and psychology'
    },
    {
      key: 'marketPosition',
      title: 'Market Position',
      icon: BarChart3,
      score: breakdown.marketPosition,
      description: 'Industry trends and competitiveness'
    },
    {
      key: 'futureReadiness',
      title: 'Future Readiness',
      icon: TrendingUp,
      score: breakdown.futureReadiness,
      description: 'Automation-proof and growth potential'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall ATS Score</h3>
            <p className="text-sm text-gray-600">Comprehensive analysis across all dimensions</p>
          </div>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="p-6">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${getScoreGradient(score)} shadow-lg mb-4`}>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{score}</div>
              <div className="text-white text-sm font-medium">/ 100</div>
            </div>
          </div>
          <div className={`text-2xl font-bold mb-2 ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </div>
          <p className="text-gray-600">
            {score >= 85 && "Outstanding resume that will impress recruiters and pass ATS systems with flying colors."}
            {score >= 70 && score < 85 && "Strong resume with excellent ATS compatibility and recruiter appeal."}
            {score >= 55 && score < 70 && "Good foundation with room for strategic improvements to boost performance."}
            {score < 55 && "Significant opportunities for improvement to enhance ATS compatibility and appeal."}
          </p>
        </div>

        {/* Metric Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.key} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center justify-center mb-3">
                  <div className={`p-2 rounded-lg ${getScoreColor(metric.score) === 'text-green-600' ? 'bg-green-100' : 
                                                    getScoreColor(metric.score) === 'text-blue-600' ? 'bg-blue-100' :
                                                    getScoreColor(metric.score) === 'text-yellow-600' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                    <Icon className={`w-5 h-5 ${getScoreColor(metric.score)}`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold mb-1 ${getScoreColor(metric.score)}`}>
                  {metric.score}
                </div>
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {metric.title}
                </div>
                <div className="text-xs text-gray-600">
                  {metric.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Wins Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Quick Wins to Boost Your Score</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {breakdown.atsFoundation < 80 && (
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">Improve ATS foundation: Add missing contact info and optimize formatting</span>
              </div>
            )}
            {breakdown.skillsAlignment < 80 && (
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">Enhance skills alignment: Add trending skills and reduce gaps</span>
              </div>
            )}
            {breakdown.recruiterAppeal < 80 && (
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">Boost recruiter appeal: Use stronger action words and improve narrative flow</span>
              </div>
            )}
            {breakdown.marketPosition < 80 && (
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">Strengthen market position: Add trending industry skills and certifications</span>
              </div>
            )}
            {breakdown.futureReadiness < 80 && (
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">Improve future readiness: Highlight modern technologies and leadership experience</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
