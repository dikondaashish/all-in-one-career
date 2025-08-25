// Advanced Predictions Service - Hire Probability, Interview Readiness, Salary, X-Factor, Automation Risk

import { generateJsonWithFallback } from '../lib/gemini';
import { SkillIntel } from './skills';
import { RecruiterPsych } from './recruiterPsych';
import { MarketIntel, IndustryIntel } from './marketIndustry';
import { ATSCompatibility } from './atsChecks';

export interface Predictions {
  hireProbability: {
    prob: number;
    confidenceInterval: [number, number];
    reasoning: string[];
  };
  interviewReadiness: {
    technical: number;
    behavioral: number;
    cultural: number;
    suggestions: string[];
  };
  salaryPlaybook: {
    conservative: number;
    market: number;
    aggressive: number;
    leveragePoints: string[];
    strategy: string[];
  };
  xFactor: string[];
  automationRisk: number;
}

/**
 * Generate comprehensive predictions using all analysis data
 */
export async function generatePredictions(
  skillIntel: SkillIntel,
  recruiterPsych: RecruiterPsych,
  marketIntel: MarketIntel,
  industryIntel: IndustryIntel,
  atsCompatibility: ATSCompatibility,
  resumeText: string,
  jobDescription: string
): Promise<Predictions> {
  console.log('🔮 Starting comprehensive predictions analysis');

  try {
    const predictions = await generatePredictionsWithAI(
      skillIntel,
      recruiterPsych,
      marketIntel,
      industryIntel,
      atsCompatibility,
      resumeText,
      jobDescription
    );

    console.log('✅ Predictions analysis completed');
    return predictions;
  } catch (error) {
    console.error('❌ Predictions analysis failed:', error);
    return generateFallbackPredictions(skillIntel, marketIntel, industryIntel);
  }
}

/**
 * Generate predictions using AI with all context
 */
async function generatePredictionsWithAI(
  skillIntel: SkillIntel,
  recruiterPsych: RecruiterPsych,
  marketIntel: MarketIntel,
  industryIntel: IndustryIntel,
  atsCompatibility: ATSCompatibility,
  resumeText: string,
  jobDescription: string
): Promise<Predictions> {
  const prompt = `You are a hiring outcomes predictor. Return JSON ONLY.

INPUT:
SKILLS: ${JSON.stringify({
  hardFound: skillIntel.hardFound.slice(0, 10),
  hardMissing: skillIntel.hardMissing.slice(0, 5),
  softFound: skillIntel.softFound.slice(0, 5),
  impactWeights: Object.fromEntries(Object.entries(skillIntel.impactWeights).slice(0, 10))
})}
RECRUITER: ${JSON.stringify({
  first6s: recruiterPsych.first6s,
  authority: recruiterPsych.authority,
  narrative: recruiterPsych.narrative,
  redFlags: recruiterPsych.redFlags.slice(0, 3)
})}
MARKET: ${JSON.stringify({
  hot: marketIntel.hot.slice(0, 5),
  declining: marketIntel.declining.slice(0, 3),
  benchmarks: marketIntel.benchmarks
})}
INDUSTRY: ${JSON.stringify({
  primary: industryIntel.primary,
  confidence: industryIntel.confidence
})}
ATS: ${JSON.stringify({
  fileType: atsCompatibility.fileType,
  hasEmail: atsCompatibility.hasEmail,
  hasPhone: atsCompatibility.hasPhone,
  headings: atsCompatibility.headings
})}

TASK:
Compute hireProbability with confidenceInterval, interviewReadiness (technical, behavioral, cultural), salary playbook, xFactor notes, automationRisk (0–100).

JSON:
{
  "hireProbability": { "prob": 44, "confidenceInterval": [36, 52], "reasoning": ["Low hard-skill overlap","Good narrative"] },
  "interviewReadiness": { "technical": 35, "behavioral": 65, "cultural": 60, "suggestions": ["Study GA4","Prepare STAR stories on growth loops"] },
  "salaryPlaybook": { "conservative": 70000, "market": 85000, "aggressive": 95000, "leveragePoints": ["Cross-functional collaboration"], "strategy": ["Negotiate after verbal offer"] },
  "xFactor": ["AI analytics exposure"],
  "automationRisk": 22
}`;

  return await generateJsonWithFallback<Predictions>(prompt);
}

/**
 * Generate fallback predictions when AI fails
 */
function generateFallbackPredictions(
  skillIntel: SkillIntel,
  marketIntel: MarketIntel,
  industryIntel: IndustryIntel
): Predictions {
  // Calculate basic hire probability
  const skillMatch = skillIntel.hardFound.length / Math.max(1, skillIntel.hardFound.length + skillIntel.hardMissing.length);
  const baseProb = Math.round(Math.min(85, Math.max(15, skillMatch * 100)));
  const confidence = Math.max(10, industryIntel.confidence * 20);

  // Calculate salary estimates based on market benchmarks
  const [minSalary, maxSalary] = marketIntel.benchmarks.salaryRange;
  const midSalary = Math.round((minSalary + maxSalary) / 2);

  return {
    hireProbability: {
      prob: baseProb,
      confidenceInterval: [
        Math.max(5, baseProb - confidence),
        Math.min(95, baseProb + confidence)
      ] as [number, number],
      reasoning: [
        `${skillIntel.hardFound.length} of ${skillIntel.hardFound.length + skillIntel.hardMissing.length} required skills matched`,
        skillIntel.hardMissing.length > 3 ? 'Multiple critical skills missing' : 'Good skill alignment',
        industryIntel.confidence > 0.8 ? 'Strong industry fit' : 'Moderate industry alignment'
      ]
    },
    interviewReadiness: {
      technical: Math.round(skillMatch * 100),
      behavioral: 70, // Default assumption
      cultural: Math.round(industryIntel.confidence * 80),
      suggestions: [
        `Study ${skillIntel.hardMissing.slice(0, 2).join(' and ')}`,
        'Prepare STAR method examples for behavioral questions',
        `Research ${industryIntel.primary} industry trends`
      ]
    },
    salaryPlaybook: {
      conservative: Math.round(midSalary * 0.85),
      market: midSalary,
      aggressive: Math.round(midSalary * 1.15),
      leveragePoints: [
        skillIntel.hardFound.length > 5 ? 'Strong technical skill set' : 'Growing skill portfolio',
        'Industry experience',
        'Professional growth trajectory'
      ],
      strategy: [
        'Research company salary ranges on Glassdoor',
        'Negotiate after receiving offer',
        'Consider total compensation package'
      ]
    },
    xFactor: [
      skillIntel.transferableNotes.length > 0 ? 'Strong transferable skills' : 'Industry adaptability',
      marketIntel.hot.some(skill => skillIntel.hardFound.includes(skill)) ? 'In-demand skills' : 'Growth potential'
    ],
    automationRisk: calculateAutomationRisk(skillIntel, industryIntel)
  };
}

/**
 * Calculate automation risk based on skills and industry
 */
function calculateAutomationRisk(skillIntel: SkillIntel, industryIntel: IndustryIntel): number {
  // Base risk by industry
  const industryRisk: Record<string, number> = {
    'manufacturing': 70,
    'retail': 60,
    'finance': 45,
    'healthcare': 25,
    'technology': 20,
    'education': 15,
    'creative': 10,
    'management': 15,
  };

  const baseRisk = industryRisk[industryIntel.primary.toLowerCase()] || 40;

  // Adjust based on skills
  const creativeSkills = ['design', 'creative', 'innovation', 'strategy', 'leadership', 'communication'];
  const technicalSkills = ['programming', 'ai', 'machine learning', 'data science', 'automation'];
  const routineSkills = ['data entry', 'processing', 'administrative', 'clerk', 'operator'];

  let adjustment = 0;
  
  const allSkills = [...skillIntel.hardFound, ...skillIntel.softFound].map(s => s.toLowerCase());
  
  if (creativeSkills.some(skill => allSkills.some(s => s.includes(skill)))) {
    adjustment -= 15; // Lower risk for creative skills
  }
  
  if (technicalSkills.some(skill => allSkills.some(s => s.includes(skill)))) {
    adjustment -= 10; // Lower risk for high-tech skills
  }
  
  if (routineSkills.some(skill => allSkills.some(s => s.includes(skill)))) {
    adjustment += 20; // Higher risk for routine skills
  }

  return Math.max(5, Math.min(95, baseRisk + adjustment));
}

/**
 * Generate interview preparation recommendations
 */
export function generateInterviewPrep(
  predictions: Predictions,
  skillIntel: SkillIntel,
  industryIntel: IndustryIntel
): {
  technical: string[];
  behavioral: string[];
  cultural: string[];
  questions: string[];
} {
  const prep = {
    technical: [] as string[],
    behavioral: [] as string[],
    cultural: [] as string[],
    questions: [] as string[],
  };

  // Technical prep
  if (predictions.interviewReadiness.technical < 70) {
    prep.technical.push(`Review ${skillIntel.hardMissing.slice(0, 3).join(', ')} concepts`);
    prep.technical.push('Practice coding challenges if applicable');
    prep.technical.push('Prepare technical project walkthroughs');
  }

  prep.technical.push('Research company\'s technology stack');
  prep.technical.push('Prepare questions about technical challenges');

  // Behavioral prep
  prep.behavioral.push('Prepare STAR method examples for common questions');
  prep.behavioral.push('Practice leadership and conflict resolution stories');
  prep.behavioral.push('Prepare examples of overcoming challenges');
  prep.behavioral.push('Practice explaining career progression and goals');

  // Cultural prep
  prep.cultural.push(`Research ${industryIntel.primary} industry culture`);
  prep.cultural.push('Study company values and mission');
  prep.cultural.push('Prepare questions about team dynamics');
  prep.cultural.push('Practice explaining cultural fit and values alignment');

  // Sample questions
  prep.questions = [
    'What are the biggest challenges facing this team?',
    'How do you measure success in this role?',
    'What opportunities exist for professional growth?',
    'Can you describe the team culture and collaboration style?',
    'What would success look like in the first 90 days?'
  ];

  return prep;
}

/**
 * Generate salary negotiation strategy
 */
export function generateNegotiationStrategy(
  predictions: Predictions,
  marketIntel: MarketIntel,
  skillIntel: SkillIntel
): {
  timing: string[];
  tactics: string[];
  alternatives: string[];
  redLines: string[];
} {
  return {
    timing: [
      'Wait for written offer before negotiating',
      'Express enthusiasm first, then discuss compensation',
      'Allow 2-3 days to review and respond',
      'Schedule call rather than email for sensitive discussions'
    ],
    tactics: [
      `Use market rate of $${predictions.salaryPlaybook.market.toLocaleString()} as anchor`,
      'Bundle salary with other benefits (PTO, equity, development)',
      'Highlight unique value propositions from your background',
      'Reference specific achievements and metrics'
    ],
    alternatives: [
      'Flexible work arrangements',
      'Professional development budget',
      'Additional vacation time',
      'Equity or stock options',
      'Earlier performance review cycle'
    ],
    redLines: [
      `Minimum acceptable: $${predictions.salaryPlaybook.conservative.toLocaleString()}`,
      'Non-negotiable benefits that matter to you',
      'Work-life balance requirements',
      'Career growth expectations'
    ]
  };
}
