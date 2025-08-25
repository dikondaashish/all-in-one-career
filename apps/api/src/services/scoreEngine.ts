/**
 * Overall ATS Score Engine (v2) - Deterministic, Explainable, Weighted Scoring
 * 
 * This module computes a comprehensive 0-100 ATS score using realistic weights across:
 * - A: Foundational ATS & Searchability (40%)
 * - B: Relevancy & Skills (35%) 
 * - C: Recruiter Psychology (10%)
 * - D: Market & Company Context (10%) - optional, reallocates if missing
 * - E: Predictive Enhancements (5%)
 */

export type SubScores = {
  // A: Foundational ATS & Searchability (40%)
  A1: number; // Parsing & format quality (15%)
  A2: number; // Essential sections presence (5%)
  A3: number; // Contact information completeness (3%)
  A4: number; // Date formatting validity (2%)
  A5: number; // Filename optimization (1%)
  A6: number; // Job title matching (6%)
  A7: number; // Word count optimization (3%)
  A8: number; // Web presence links (2%)
  A9: number; // Formatting pitfalls avoidance (3%)

  // B: Relevancy & Skills (35%)
  B1: number; // Hard skills from job description (18%)
  B2: number; // Soft skills coverage (4%)
  B3: number; // Transferable skills value (3%)
  B4: number; // Keyword density optimization (5%)
  B5: number; // Experience level fit (5%)

  // C: Recruiter Psychology (10%)
  C1: number; // 6-second readability impression (3%)
  C2: number; // Authority language strength (3%)
  C3: number; // Narrative coherence (2%)
  redFlagPenalty: number; // Global penalty 0-5 points (2%)

  // D: Market & Company Context (10%) - optional
  D1?: number | undefined; // Market percentile positioning (4%)
  D2?: number | undefined; // Company DNA alignment (3%)
  D3?: number | undefined; // Market competitiveness (3%)

  // E: Predictive Enhancements (5%)
  E1: number; // X-Factor uniqueness (2.5%)
  E2: number; // Future-proofing (automation + leverage) (2.5%)

  // Meta information for confidence calculation
  signalsAvailable: number; // Number of signals we successfully computed
  signalsTotal: number; // Total possible signals for this analysis
};

export interface OverallScoreResult {
  overall: number; // Final score 0-100
  band: number; // Confidence band ±points
  confidence: number; // Confidence percentage 0-100
  breakdown: {
    A: number; // Foundational score contribution
    B: number; // Relevancy score contribution  
    C: number; // Psychology score contribution
    D: number; // Market score contribution
    E: number; // Predictive score contribution
    redPenalty: number; // Red flag penalty applied
  };
  meta: {
    signalsUsed: number;
    signalsTotal: number;
    marketDataAvailable: boolean;
    reallocationApplied: boolean;
  };
}

/**
 * Computes the overall ATS score using weighted sub-scores
 */
export function computeOverallATS(s: SubScores): OverallScoreResult {
  // A: Foundational ATS & Searchability (40% total)
  const A = 0.15 * s.A1 + // Parsing quality (15%)
           0.05 * s.A2 + // Essential sections (5%)
           0.03 * s.A3 + // Contact info (3%)
           0.02 * s.A4 + // Date formatting (2%)
           0.01 * s.A5 + // Filename (1%)
           0.06 * s.A6 + // Job title match (6%)
           0.03 * s.A7 + // Word count (3%)
           0.02 * s.A8 + // Web presence (2%)
           0.03 * s.A9;  // Formatting pitfalls (3%)

  // B: Relevancy & Skills (35% total)
  const B = 0.18 * s.B1 + // Hard skills match (18%)
           0.04 * s.B2 + // Soft skills (4%)
           0.03 * s.B3 + // Transferable skills (3%)
           0.05 * s.B4 + // Keyword density (5%)
           0.05 * s.B5;  // Experience fit (5%)

  // C: Recruiter Psychology (10% total, before red flag penalty)
  const C = 0.03 * s.C1 + // 6-second impression (3%)
           0.03 * s.C2 + // Authority language (3%)
           0.02 * s.C3;  // Narrative coherence (2%)

  // D: Market & Company Context (10% total)
  let D = 0;
  let marketDataAvailable = false;
  let reallocationApplied = false;

  if (s.D1 !== undefined && s.D2 !== undefined && s.D3 !== undefined) {
    // All market data available
    D = 0.04 * s.D1 + // Market percentile (4%)
        0.03 * s.D2 + // Company DNA (3%)
        0.03 * s.D3;  // Competitiveness (3%)
    marketDataAvailable = true;
  } else {
    // Missing market data - reallocate 10% proportionally to A and B
    // A gets 5% boost, B gets 5% boost
    const reallocationBoost = 0.10 * (A + B);
    D = reallocationBoost;
    reallocationApplied = true;
  }

  // E: Predictive Enhancements (5% total)
  // Map 0-100 inputs to 0-5 total contribution
  const E = Math.min(5, (s.E1 + s.E2) / 40); // 100+100 -> 5 max

  // Apply red flag penalty (0-5 points deducted globally)
  const redPenalty = Math.min(5, Math.max(0, s.redFlagPenalty || 0));

  // Calculate raw score before penalty
  let rawScore = A + B + C + D + E;
  
  // Apply penalty and clamp to 0-100
  let finalScore = Math.max(0, Math.min(100, rawScore - redPenalty));

  // Calculate confidence based on signal availability
  const confidence = Math.max(0, Math.min(1, s.signalsAvailable / Math.max(1, s.signalsTotal)));
  
  // Calculate confidence band (±points) - lower confidence = wider band
  const band = Math.max(3, Math.round((1 - confidence) * 10));

  return {
    overall: Math.round(finalScore),
    band,
    confidence: Math.round(confidence * 100),
    breakdown: {
      A: Math.round(A * 10) / 10, // Round to 1 decimal
      B: Math.round(B * 10) / 10,
      C: Math.round(C * 10) / 10,
      D: Math.round(D * 10) / 10,
      E: Math.round(E * 10) / 10,
      redPenalty: Math.round(redPenalty * 10) / 10
    },
    meta: {
      signalsUsed: s.signalsAvailable,
      signalsTotal: s.signalsTotal,
      marketDataAvailable,
      reallocationApplied
    }
  };
}

/**
 * Helper function to identify top improvement opportunities
 */
export function getTopFixes(s: SubScores, weights: Record<string, number>): Array<{
  component: string;
  score: number;
  weight: number;
  impact: number;
  description: string;
}> {
  const issues = [
    { component: 'A1', score: s.A1, weight: weights.A1 || 0.15, description: 'File format and parsing quality' },
    { component: 'A6', score: s.A6, weight: weights.A6 || 0.06, description: 'Job title matching' },
    { component: 'B1', score: s.B1, weight: weights.B1 || 0.18, description: 'Hard skills from job description' },
    { component: 'B4', score: s.B4, weight: weights.B4 || 0.05, description: 'Keyword density optimization' },
    { component: 'B5', score: s.B5, weight: weights.B5 || 0.05, description: 'Experience level alignment' },
    { component: 'C1', score: s.C1, weight: weights.C1 || 0.03, description: '6-second readability impression' },
    { component: 'C2', score: s.C2, weight: weights.C2 || 0.03, description: 'Authority language strength' }
  ];

  return issues
    .map(issue => ({
      ...issue,
      impact: (100 - issue.score) * issue.weight // Potential improvement impact
    }))
    .filter(issue => issue.score < 80) // Only show sub-optimal scores
    .sort((a, b) => b.impact - a.impact) // Sort by highest impact first
    .slice(0, 3); // Top 3 fixes
}

/**
 * Helper function to get score interpretation
 */
export function getScoreInterpretation(score: number): {
  level: string;
  description: string;
  color: string;
} {
  if (score >= 90) {
    return {
      level: 'Exceptional',
      description: 'Outstanding ATS optimization with excellent recruiter appeal',
      color: 'green'
    };
  } else if (score >= 80) {
    return {
      level: 'Strong',
      description: 'Well-optimized resume with good ATS compatibility',
      color: 'blue'
    };
  } else if (score >= 70) {
    return {
      level: 'Good',
      description: 'Solid foundation with some optimization opportunities',
      color: 'yellow'
    };
  } else if (score >= 60) {
    return {
      level: 'Fair',
      description: 'Basic ATS compatibility with significant improvement potential',
      color: 'orange'
    };
  } else {
    return {
      level: 'Needs Work',
      description: 'Major optimization needed for ATS and recruiter success',
      color: 'red'
    };
  }
}
