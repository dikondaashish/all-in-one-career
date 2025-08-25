// Aggregation & Overall Scoring Service

import { ATSCompatibility, JobTitleMatch, WordStats } from './atsChecks';
import { SkillIntel } from './skills';
import { RecruiterPsych } from './recruiterPsych';
import { MarketIntel, IndustryIntel } from './marketIndustry';
import { CompanyFit } from './companyFit';
import { Predictions } from './predictions';

export interface OverallAnalysis {
  overallScore: number;
  percentile: number;
  breakdownScores: {
    atsCompatibility: number;
    skillMatch: number;
    recruiterPsychology: number;
    marketAlignment: number;
    predictions: number;
  };
  topStrengths: string[];
  topWeaknesses: string[];
  priorityFixes: string[];
}

/**
 * Scoring weights based on recruiter priorities
 */
const SCORING_WEIGHTS = {
  atsCompatibility: 0.15,    // 15% - Basic ATS requirements
  skillMatch: 0.30,          // 30% - Most important factor
  recruiterPsychology: 0.15, // 15% - First impression matters
  marketAlignment: 0.15,     // 15% - Industry fit
  predictions: 0.25,         // 25% - Hire potential
};

/**
 * Calculate overall score and analysis
 */
export function calculateOverallScore(
  atsCompatibility: ATSCompatibility,
  jobTitleMatch: JobTitleMatch,
  skillIntel: SkillIntel,
  recruiterPsych: RecruiterPsych,
  marketIntel: MarketIntel,
  industryIntel: IndustryIntel,
  predictions: Predictions,
  wordStats: WordStats,
  companyFit?: CompanyFit
): OverallAnalysis {
  console.log('📊 Calculating overall score and analysis');

  // Calculate individual component scores
  const scores = {
    atsCompatibility: calculateATSScore(atsCompatibility, jobTitleMatch, wordStats),
    skillMatch: calculateSkillScore(skillIntel),
    recruiterPsychology: calculateRecruiterScore(recruiterPsych),
    marketAlignment: calculateMarketScore(marketIntel, industryIntel),
    predictions: calculatePredictionsScore(predictions),
  };

  // Calculate weighted overall score
  const overallScore = Math.round(
    scores.atsCompatibility * SCORING_WEIGHTS.atsCompatibility +
    scores.skillMatch * SCORING_WEIGHTS.skillMatch +
    scores.recruiterPsychology * SCORING_WEIGHTS.recruiterPsychology +
    scores.marketAlignment * SCORING_WEIGHTS.marketAlignment +
    scores.predictions * SCORING_WEIGHTS.predictions
  );

  // Calculate market percentile
  const percentile = calculateMarketPercentile(overallScore, marketIntel);

  // Identify strengths and weaknesses
  const analysis = analyzeStrengthsWeaknesses(scores, skillIntel, recruiterPsych, predictions);

  // Generate priority fixes
  const priorityFixes = generatePriorityFixes(scores, atsCompatibility, skillIntel, recruiterPsych);

  console.log(`✅ Overall score calculated: ${overallScore}/100 (${percentile}th percentile)`);

  return {
    overallScore,
    percentile,
    breakdownScores: scores,
    topStrengths: analysis.strengths,
    topWeaknesses: analysis.weaknesses,
    priorityFixes,
  };
}

/**
 * Calculate ATS compatibility score
 */
function calculateATSScore(
  atsCompatibility: ATSCompatibility,
  jobTitleMatch: JobTitleMatch,
  wordStats: WordStats
): number {
  let score = 0;
  const maxScore = 100;

  // File type (20 points)
  if (atsCompatibility.fileType === 'pdf' || atsCompatibility.fileType === 'docx') {
    score += 20;
  } else if (atsCompatibility.fileType === 'txt') {
    score += 15;
  }

  // File name (10 points)
  if (atsCompatibility.fileNameOk) {
    score += 10;
  }

  // Contact information (30 points total)
  if (atsCompatibility.hasEmail) score += 10;
  if (atsCompatibility.hasPhone) score += 10;
  if (atsCompatibility.hasLocation) score += 10;

  // Headings (20 points total)
  const headingScore = Object.values(atsCompatibility.headings).filter(Boolean).length * 5;
  score += headingScore;

  // Date validity (10 points)
  if (atsCompatibility.datesValid) {
    score += 10;
  }

  // Job title match (10 points)
  if (jobTitleMatch.exactFound) {
    score += 10;
  } else if (jobTitleMatch.normalizedMatch > 50) {
    score += Math.round(jobTitleMatch.normalizedMatch / 10);
  }

  // Word count appropriateness (10 points)
  const [minWords, maxWords] = wordStats.recommendedRange;
  if (wordStats.wordCount >= minWords && wordStats.wordCount <= maxWords) {
    score += 10;
  } else if (wordStats.wordCount >= minWords * 0.8 && wordStats.wordCount <= maxWords * 1.2) {
    score += 5;
  }

  return Math.min(maxScore, score);
}

/**
 * Calculate skill match score
 */
function calculateSkillScore(skillIntel: SkillIntel): number {
  const totalRequired = skillIntel.hardFound.length + skillIntel.hardMissing.length;
  const totalSoft = skillIntel.softFound.length + skillIntel.softMissing.length;
  
  if (totalRequired === 0) return 50; // No requirements to match against

  // Hard skills (70% weight)
  const hardScore = totalRequired > 0 ? (skillIntel.hardFound.length / totalRequired) * 100 : 0;
  
  // Soft skills (30% weight)
  const softScore = totalSoft > 0 ? (skillIntel.softFound.length / totalSoft) * 100 : 70;

  // Impact weight bonus
  const weightedSkills = skillIntel.hardFound.filter(skill => 
    (skillIntel.impactWeights[skill] || 0) >= 3 // Critical skills
  );
  const impactBonus = Math.min(15, weightedSkills.length * 3);

  const finalScore = Math.round((hardScore * 0.7) + (softScore * 0.3) + impactBonus);
  return Math.min(100, finalScore);
}

/**
 * Calculate recruiter psychology score
 */
function calculateRecruiterScore(recruiterPsych: RecruiterPsych): number {
  // Weighted average of psychology factors
  const score = Math.round(
    (recruiterPsych.first6s * 0.4) +      // 40% - First impression is critical
    (recruiterPsych.authority * 0.35) +   // 35% - Authority language matters
    (recruiterPsych.narrative * 0.25)     // 25% - Story coherence
  );

  // Penalty for red flags
  const redFlagPenalty = Math.min(25, recruiterPsych.redFlags.length * 8);
  
  return Math.max(0, score - redFlagPenalty);
}

/**
 * Calculate market alignment score
 */
function calculateMarketScore(marketIntel: MarketIntel, industryIntel: IndustryIntel): number {
  let score = 50; // Base score

  // Industry confidence bonus
  score += industryIntel.confidence * 30;

  // Market competition adjustment
  const competitionAdjustment = (100 - marketIntel.benchmarks.competition) * 0.2;
  score += competitionAdjustment;

  // Hot skills bonus (if any found)
  // This would need to be calculated with skill intel context
  score += 10; // Placeholder

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculate predictions score
 */
function calculatePredictionsScore(predictions: Predictions): number {
  // Weighted average of prediction factors
  const score = Math.round(
    (predictions.hireProbability.prob * 0.5) +           // 50% - Main prediction
    (predictions.interviewReadiness.technical * 0.2) +   // 20% - Technical readiness
    (predictions.interviewReadiness.behavioral * 0.15) + // 15% - Behavioral readiness
    (predictions.interviewReadiness.cultural * 0.15)     // 15% - Cultural fit
  );

  // Automation risk penalty
  const automationPenalty = predictions.automationRisk > 70 ? 10 : 0;

  return Math.max(0, score - automationPenalty);
}

/**
 * Calculate market percentile
 */
function calculateMarketPercentile(overallScore: number, marketIntel: MarketIntel): number {
  // Normalize score to percentile using market competition
  const basePercentile = overallScore * 0.8; // Max 80% from raw score
  
  // Adjust based on market competition
  const competitionFactor = (100 - marketIntel.benchmarks.competition) / 100;
  const adjustment = competitionFactor * 20; // Up to 20% boost in less competitive markets
  
  const percentile = Math.min(95, Math.max(5, basePercentile + adjustment));
  
  return Math.round(percentile);
}

/**
 * Analyze strengths and weaknesses
 */
function analyzeStrengthsWeaknesses(
  scores: Record<string, number>,
  skillIntel: SkillIntel,
  recruiterPsych: RecruiterPsych,
  predictions: Predictions
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Analyze each component
  Object.entries(scores).forEach(([component, score]) => {
    if (score >= 80) {
      strengths.push(getStrengthMessage(component, score));
    } else if (score < 60) {
      weaknesses.push(getWeaknessMessage(component, score));
    }
  });

  // Add specific insights
  if (skillIntel.hardFound.length > 8) {
    strengths.push('Comprehensive technical skill set');
  }
  
  if (predictions.hireProbability.prob > 70) {
    strengths.push('High hire probability prediction');
  }

  if (recruiterPsych.redFlags.length > 3) {
    weaknesses.push('Multiple resume red flags identified');
  }

  if (skillIntel.hardMissing.length > 5) {
    weaknesses.push('Significant technical skill gaps');
  }

  return {
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
  };
}

/**
 * Generate priority fixes based on scoring analysis
 */
function generatePriorityFixes(
  scores: Record<string, number>,
  atsCompatibility: ATSCompatibility,
  skillIntel: SkillIntel,
  recruiterPsych: RecruiterPsych
): string[] {
  const fixes: Array<{ fix: string; priority: number }> = [];

  // ATS fixes (high priority)
  if ((scores.atsCompatibility || 0) < 70) {
    if (!atsCompatibility.hasEmail) {
      fixes.push({ fix: 'Add email address to contact information', priority: 10 });
    }
    if (!atsCompatibility.hasPhone) {
      fixes.push({ fix: 'Include phone number in header', priority: 10 });
    }
    if (!atsCompatibility.headings.experience) {
      fixes.push({ fix: 'Add clear "Experience" or "Work History" section', priority: 9 });
    }
  }

  // Skill fixes (high priority)
  if ((scores.skillMatch || 0) < 70 && skillIntel.hardMissing.length > 0) {
    fixes.push({ 
      fix: `Develop skills in ${skillIntel.hardMissing.slice(0, 2).join(' and ')}`, 
      priority: 9 
    });
    fixes.push({ 
      fix: `Highlight transferable experience related to ${skillIntel.hardMissing[0]}`, 
      priority: 8 
    });
  }

  // Recruiter psychology fixes
  if ((scores.recruiterPsychology || 0) < 70) {
    if (recruiterPsych.first6s < 60) {
      fixes.push({ fix: 'Improve resume header and professional summary', priority: 8 });
    }
    if (recruiterPsych.authority < 60) {
      fixes.push({ fix: 'Replace weak action verbs with strong leadership language', priority: 7 });
    }
    if (recruiterPsych.redFlags.length > 0) {
      fixes.push({ fix: `Address red flag: ${recruiterPsych.redFlags[0]}`, priority: 8 });
    }
  }

  // Market alignment fixes
  if ((scores.marketAlignment || 0) < 70) {
    fixes.push({ fix: 'Research and incorporate industry-specific keywords', priority: 6 });
  }

  // Sort by priority and return top fixes
  return fixes
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(item => item.fix);
}

function getStrengthMessage(component: string, score: number): string {
  const messages: Record<string, string> = {
    atsCompatibility: 'Excellent ATS optimization',
    skillMatch: 'Strong skill alignment with job requirements',
    recruiterPsychology: 'Professional presentation and strong narrative',
    marketAlignment: 'Great fit for current market conditions',
    predictions: 'High potential for interview success',
  };
  
  return messages[component] || `Strong ${component} performance`;
}

function getWeaknessMessage(component: string, score: number): string {
  const messages: Record<string, string> = {
    atsCompatibility: 'ATS compatibility needs improvement',
    skillMatch: 'Skill gaps affecting job match',
    recruiterPsychology: 'Resume presentation could be stronger',
    marketAlignment: 'Market positioning needs enhancement',
    predictions: 'Interview readiness requires development',
  };
  
  return messages[component] || `${component} needs attention`;
}
