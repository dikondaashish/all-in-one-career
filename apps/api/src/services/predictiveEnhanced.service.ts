/**
 * Predictive Enhanced Service - Enhanced predictions with bands, X-factor, automation risk
 */

interface PredictiveEnhancedInput {
  resumeText: string;
  jobDescription: string;
  baseProbability: number;
  industryDetected: string;
  hardSkillsFound: string[];
  authorityLanguage: { strong: string[]; weak: string[] };
}

interface PredictiveEnhancedResult {
  hireProbability: {
    point: number;
    band: [number, number];
    xFactor: number;
    drivers: string[];
  };
  interviewReadiness: {
    technical: number;
    behavioral: number;
    cultural: number;
  };
  salary: {
    conservative: number;
    market: number;
    aggressive: number;
  };
  automationRisk: number;
  industryGrowth: "declining" | "stable" | "growing" | "booming";
}

// Industry automation risk data (static lookup)
const AUTOMATION_RISK_BY_INDUSTRY = {
  "Technology": 0.15,
  "Marketing": 0.25,
  "Finance": 0.35,
  "Healthcare": 0.20,
  "Education": 0.30,
  "Sales": 0.40,
  "Operations": 0.45,
  "Manufacturing": 0.55,
  "Retail": 0.50,
  "Consulting": 0.25,
  "Government": 0.30,
  "Non-Profit": 0.25
};

// Industry growth outlook
const INDUSTRY_GROWTH = {
  "Technology": "booming",
  "Healthcare": "growing",
  "Finance": "stable",
  "Marketing": "growing",
  "Education": "stable",
  "Sales": "stable",
  "Operations": "stable",
  "Manufacturing": "declining",
  "Retail": "declining",
  "Consulting": "growing",
  "Government": "stable",
  "Non-Profit": "stable"
} as const;

export function enhancePredictions({ 
  resumeText, 
  jobDescription, 
  baseProbability, 
  industryDetected, 
  hardSkillsFound,
  authorityLanguage
}: PredictiveEnhancedInput): PredictiveEnhancedResult {
  
  // Calculate hire probability band with confidence interval
  const hireProbability = calculateHireProbabilityBand(baseProbability, resumeText, hardSkillsFound);
  
  // Calculate X-Factor (leadership/impact indicators)
  const xFactor = calculateXFactor(resumeText, authorityLanguage);
  
  // Enhanced interview readiness scoring
  const interviewReadiness = calculateInterviewReadiness(resumeText, jobDescription, hardSkillsFound);
  
  // Salary estimation with bands
  const salary = calculateSalaryBands(jobDescription, industryDetected, hardSkillsFound.length);
  
  // Automation risk assessment
  const automationRisk = calculateAutomationRisk(industryDetected, hardSkillsFound);
  
  // Industry growth outlook
  const industryGrowth = INDUSTRY_GROWTH[industryDetected as keyof typeof INDUSTRY_GROWTH] || "stable";
  
  return {
    hireProbability,
    interviewReadiness,
    salary,
    automationRisk,
    industryGrowth
  };
}

/**
 * Calculate hire probability with confidence band
 */
function calculateHireProbabilityBand(baseProbability: number, resumeText: string, hardSkillsFound: string[]): {
  point: number;
  band: [number, number];
  xFactor: number;
  drivers: string[];
} {
  const drivers: string[] = [];
  let adjustedProbability = baseProbability;
  
  // Skill diversity bonus
  if (hardSkillsFound.length >= 8) {
    adjustedProbability += 5;
    drivers.push("+skills");
  } else if (hardSkillsFound.length <= 3) {
    adjustedProbability -= 8;
    drivers.push("-skills");
  }
  
  // Experience indicators
  const hasLeadership = /led|managed|directed|supervised|mentored/i.test(resumeText);
  if (hasLeadership) {
    adjustedProbability += 8;
    drivers.push("+leadership");
  }
  
  // Quantified achievements
  const hasMetrics = /\d+%|\$\d+|increased|decreased|improved|reduced.*\d+/i.test(resumeText);
  if (hasMetrics) {
    adjustedProbability += 6;
    drivers.push("+metrics");
  }
  
  // Career trajectory (no gaps, progression)
  const years = resumeText.match(/\b20\d{2}\b/g) || [];
  const hasGaps = checkForEmploymentGaps(years);
  if (hasGaps) {
    adjustedProbability -= 10;
    drivers.push("-gaps");
  } else {
    adjustedProbability += 3;
    drivers.push("+trajectory");
  }
  
  // Ensure probability stays within bounds
  const point = Math.max(5, Math.min(95, adjustedProbability));
  
  // Calculate confidence interval (±15% as standard deviation)
  const stdDev = 15;
  const lowerBound = Math.max(1, point - stdDev);
  const upperBound = Math.min(99, point + stdDev);
  
  const xFactor = calculateXFactor(resumeText, { strong: [], weak: [] });
  
  return {
    point,
    band: [lowerBound, upperBound],
    xFactor,
    drivers
  };
}

/**
 * Calculate X-Factor (unique differentiators)
 */
function calculateXFactor(resumeText: string, authorityLanguage: { strong: string[]; weak: string[] }): number {
  let xFactor = 0;
  
  // Leadership indicators
  const leadershipWords = ['founded', 'launched', 'built', 'created', 'established', 'pioneered'];
  const hasFoundershipLanguage = leadershipWords.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(resumeText)
  );
  if (hasFoundershipLanguage) xFactor += 15;
  
  // Innovation indicators
  const innovationWords = ['patent', 'published', 'research', 'innovative', 'breakthrough', 'award'];
  const hasInnovation = innovationWords.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(resumeText)
  );
  if (hasInnovation) xFactor += 10;
  
  // Scale indicators
  const scaleWords = ['million', 'billion', 'thousand', 'enterprise', 'global', 'international'];
  const hasScale = scaleWords.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(resumeText)
  );
  if (hasScale) xFactor += 8;
  
  // Authority language strength
  const strongLanguageRatio = authorityLanguage.strong.length / 
    Math.max(1, authorityLanguage.strong.length + authorityLanguage.weak.length);
  if (strongLanguageRatio > 0.7) xFactor += 7;
  
  // Education prestige (simple heuristic)
  const prestigeSchools = ['harvard', 'stanford', 'mit', 'berkeley', 'yale', 'princeton'];
  const hasPrestigeEducation = prestigeSchools.some(school => 
    new RegExp(`\\b${school}\\b`, 'i').test(resumeText)
  );
  if (hasPrestigeEducation) xFactor += 5;
  
  return Math.min(30, xFactor); // Cap at 30
}

/**
 * Calculate enhanced interview readiness scores
 */
function calculateInterviewReadiness(resumeText: string, jobDescription: string, hardSkillsFound: string[]): {
  technical: number;
  behavioral: number;
  cultural: number;
} {
  // Technical readiness based on skill alignment
  const jobSkillsCount = countTechnicalSkills(jobDescription);
  const technical = jobSkillsCount > 0 ? 
    Math.round((hardSkillsFound.length / jobSkillsCount) * 100) : 50;
  
  // Behavioral readiness based on examples and achievements
  let behavioral = 50;
  const hasStarExamples = /achieved|accomplished|resulted in|led to/i.test(resumeText);
  if (hasStarExamples) behavioral += 20;
  
  const hasQuantifiedResults = /\d+%|\$\d+|increased.*\d+|decreased.*\d+/i.test(resumeText);
  if (hasQuantifiedResults) behavioral += 15;
  
  const hasLeadershipExamples = /led team|managed team|mentored|coached/i.test(resumeText);
  if (hasLeadershipExamples) behavioral += 10;
  
  // Cultural readiness based on value alignment indicators
  let cultural = 55;
  const hasCollaboration = /collaborated|teamwork|cross-functional|partnership/i.test(resumeText);
  if (hasCollaboration) cultural += 15;
  
  const hasAdaptability = /adapted|flexible|change|agile|pivot/i.test(resumeText);
  if (hasAdaptability) cultural += 10;
  
  const hasGrowthMindset = /learned|growth|development|improvement|optimization/i.test(resumeText);
  if (hasGrowthMindset) cultural += 10;
  
  return {
    technical: Math.max(0, Math.min(100, technical)),
    behavioral: Math.max(0, Math.min(100, behavioral)),
    cultural: Math.max(0, Math.min(100, cultural))
  };
}

/**
 * Calculate salary bands based on role and market data
 */
function calculateSalaryBands(jobDescription: string, industry: string, skillCount: number): {
  conservative: number;
  market: number;
  aggressive: number;
} {
  // Base salary by industry (rough estimates in USD)
  const baseSalaries = {
    "Technology": 85000,
    "Finance": 75000,
    "Marketing": 65000,
    "Healthcare": 70000,
    "Education": 55000,
    "Sales": 60000,
    "Operations": 65000,
    "Consulting": 80000,
    "Manufacturing": 60000,
    "Retail": 45000,
    "Government": 60000,
    "Non-Profit": 50000
  };
  
  const baseSalary = baseSalaries[industry as keyof typeof baseSalaries] || 65000;
  
  // Adjustments based on role level
  let multiplier = 1.0;
  const jobLower = jobDescription.toLowerCase();
  
  if (jobLower.includes('senior') || jobLower.includes('lead')) {
    multiplier = 1.3;
  } else if (jobLower.includes('principal') || jobLower.includes('staff')) {
    multiplier = 1.6;
  } else if (jobLower.includes('director') || jobLower.includes('manager')) {
    multiplier = 1.8;
  } else if (jobLower.includes('vp') || jobLower.includes('vice president')) {
    multiplier = 2.5;
  } else if (jobLower.includes('junior') || jobLower.includes('entry')) {
    multiplier = 0.8;
  }
  
  // Skill premium (more skills = higher salary)
  const skillMultiplier = 1 + (Math.min(skillCount, 15) * 0.02);
  
  const marketSalary = Math.round(baseSalary * multiplier * skillMultiplier);
  
  return {
    conservative: Math.round(marketSalary * 0.85),
    market: marketSalary,
    aggressive: Math.round(marketSalary * 1.15)
  };
}

/**
 * Calculate automation risk for the role
 */
function calculateAutomationRisk(industry: string, hardSkillsFound: string[]): number {
  const baseRisk = AUTOMATION_RISK_BY_INDUSTRY[industry as keyof typeof AUTOMATION_RISK_BY_INDUSTRY] || 0.30;
  
  // Modern skills reduce automation risk
  const modernSkills = ['ai', 'machine learning', 'cloud', 'automation', 'python', 'data science', 'analytics'];
  const modernSkillCount = hardSkillsFound.filter(skill => 
    modernSkills.some(modern => skill.toLowerCase().includes(modern))
  ).length;
  
  // Each modern skill reduces risk by 5%
  const riskReduction = modernSkillCount * 0.05;
  
  // Leadership skills reduce automation risk
  const hasLeadershipSkills = hardSkillsFound.some(skill => 
    /management|leadership|strategy|team/i.test(skill)
  );
  const leadershipReduction = hasLeadershipSkills ? 0.1 : 0;
  
  const adjustedRisk = Math.max(0.05, baseRisk - riskReduction - leadershipReduction);
  return Math.round(adjustedRisk * 100) / 100;
}

/**
 * Helper functions
 */
function countTechnicalSkills(jobDescription: string): number {
  const techKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 
    'kubernetes', 'git', 'api', 'database', 'cloud', 'agile', 'ci/cd'
  ];
  
  return techKeywords.filter(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(jobDescription)
  ).length;
}

function checkForEmploymentGaps(years: string[]): boolean {
  if (years.length < 2) return false;
  
  const numericYears = years.map(y => parseInt(y)).sort();
  const currentYear = new Date().getFullYear();
  
  // Check for gaps > 1 year
  for (let i = 1; i < numericYears.length; i++) {
    const currentYear = numericYears[i];
    const previousYear = numericYears[i-1];
    if (currentYear && previousYear && currentYear - previousYear > 2) {
      return true;
    }
  }
  
  // Check if currently employed (latest year should be recent)
  const latestYear = Math.max(...numericYears);
  if (currentYear - latestYear > 1) {
    return true;
  }
  
  return false;
}
