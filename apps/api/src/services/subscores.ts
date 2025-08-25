/**
 * Sub-Score Calculators for ATS Overall Score (v2)
 * 
 * Each function returns a score 0-100 (except redFlagPenalty which returns 0-5)
 * All functions are pure and handle missing/invalid inputs gracefully
 */

// Utility function to clamp values to 0-100 range
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export const subs = {
  // ========== A. Foundational ATS & Searchability ==========

  /**
   * A1: Parsing & Format Quality (15% weight)
   * DOCX/text-PDF best; image-PDF or complex layouts penalized
   */
  A1: ({ mime, ocr, multiColumn, tables }: any) => {
    let score = 100;
    
    // File format scoring
    if (/word|officedocument/i.test(mime || '')) {
      score = 100; // DOCX is optimal
    } else if (/pdf/i.test(mime || '')) {
      if (!ocr) {
        score = 90; // Text-based PDF
      } else {
        score = 60; // Image-based PDF requiring OCR
      }
    } else if (/text/i.test(mime || '')) {
      score = 85; // Plain text
    } else {
      score = 50; // Other formats
    }
    
    // Layout complexity penalties
    if (multiColumn) score -= 10;
    if (tables) score -= 10;
    
    return clamp(score);
  },

  /**
   * A2: Essential Sections Presence (5% weight)
   * Experience, Education, Skills, Summary/Objective
   */
  A2: ({ hasExp, hasEdu, hasSkills, hasSummary }: any) => {
    const sections = [hasExp, hasEdu, hasSkills, hasSummary];
    const presentCount = sections.filter(Boolean).length;
    return clamp((presentCount / 4) * 100);
  },

  /**
   * A3: Contact Information Completeness (3% weight)
   * Email (40%), Phone (40%), Location (20%)
   */
  A3: ({ email, phone, location }: any) => {
    let score = 0;
    if (email) score += 40;
    if (phone) score += 40;
    if (location) score += 20;
    return clamp(score);
  },

  /**
   * A4: Date Formatting Validity (2% weight)
   * Consistent, parseable date formats
   */
  A4: ({ datesValid }: any) => {
    return clamp(datesValid ? 100 : 40);
  },

  /**
   * A5: Filename Optimization (1% weight)
   * Clean, professional filename without special characters
   */
  A5: ({ filename }: any) => {
    if (!filename) return 60;
    
    // Remove file extension for analysis
    const nameWithoutExt = filename.replace(/\.(pdf|docx|doc|txt)$/i, '');
    
    // Check for clean filename (alphanumeric, dots, dashes, underscores only)
    if (/^[a-z0-9._-]+$/i.test(nameWithoutExt)) {
      return 100;
    }
    
    return 60; // Non-optimal filename
  },

  /**
   * A6: Job Title Matching (6% weight)
   * Exact match best, similarity-based scoring otherwise
   */
  A6: ({ exact, similarity }: any) => {
    if (exact) return 100;
    return clamp(Math.round((similarity ?? 0) * 100));
  },

  /**
   * A7: Word Count Optimization (3% weight)
   * Optimal range: 400-1200 words
   */
  A7: ({ words }: any) => {
    const wordCount = words || 0;
    
    if (wordCount >= 400 && wordCount <= 1200) {
      return 100; // Optimal range
    } else if ((wordCount >= 300 && wordCount < 400) || (wordCount > 1200 && wordCount <= 1500)) {
      return 70; // Acceptable range
    } else {
      return 30; // Too short or too long
    }
  },

  /**
   * A8: Web Presence Links (2% weight)
   * LinkedIn (60%), Portfolio/Website (40%)
   */
  A8: ({ linkedin, portfolio }: any) => {
    let score = 0;
    if (linkedin) score += 60;
    if (portfolio) score += 40;
    return clamp(score);
  },

  /**
   * A9: Formatting Pitfalls Avoidance (3% weight)
   * Penalize text boxes, excessive headers/footers, high graphics density
   */
  A9: ({ hasTextBoxes, headersFooters, graphicsDensity }: any) => {
    let score = 100;
    
    if (hasTextBoxes) score -= 20;
    if (headersFooters) score -= 10;
    if ((graphicsDensity || 0) > 0.1) score -= 20;
    
    return clamp(score);
  },

  // ========== B. Relevancy & Skills ==========

  /**
   * B1: Hard Skills from Job Description (18% weight)
   * Weighted by criticality: critical=3, required=2, preferred=1
   * Bonus for recent usage, penalty for stale skills
   */
  B1: ({ jdSkills }: any) => {
    if (!jdSkills || !Array.isArray(jdSkills)) return 50;
    
    const weights = { critical: 3, required: 2, preferred: 1 } as const;
    
    const totalWeight = jdSkills.reduce((sum: number, skill: any) => {
      return sum + (weights[skill.criticality as keyof typeof weights] || 1);
    }, 0) || 1;
    
    let earnedWeight = 0;
    
    jdSkills.forEach((skill: any) => {
      if (skill.found) {
        let baseWeight = weights[skill.criticality as keyof typeof weights] || 1;
        
        // Adjust for recency if available
        if (typeof skill.lastUsedMonths === 'number') {
          if (skill.lastUsedMonths <= 18) {
            baseWeight *= 1.1; // 10% bonus for recent usage
          } else if (skill.lastUsedMonths > 60) {
            baseWeight *= 0.9; // 10% penalty for stale skills
          }
        }
        
        earnedWeight += baseWeight;
      }
    });
    
    return clamp((earnedWeight / totalWeight) * 100);
  },

  /**
   * B2: Soft Skills Coverage (4% weight)
   * Expected vs found soft skills ratio
   */
  B2: ({ softExpected, softFound }: any) => {
    const expected = Math.min(8, softExpected || 0) || 1;
    const found = Math.min(softFound || 0, expected);
    
    // Cap at 90% to encourage but not over-reward soft skills
    return clamp(Math.min(90, (found / expected) * 100));
  },

  /**
   * B3: Transferable Skills Value (3% weight)
   * Credit based on skill transferability and importance weight
   */
  B3: ({ transferable }: any) => {
    if (!transferable || !Array.isArray(transferable)) return 50;
    
    const totalWeight = transferable.reduce((sum: number, skill: any) => {
      return sum + (skill.weight || 1);
    }, 0) || 1;
    
    const earnedValue = transferable.reduce((sum: number, skill: any) => {
      const credit = skill.credit || 0.5; // Default 50% credit
      const weight = skill.weight || 1;
      return sum + (credit * weight);
    }, 0);
    
    return clamp((earnedValue / totalWeight) * 100);
  },

  /**
   * B4: Keyword Density Optimization (5% weight)
   * Optimal range: 8-20 keywords per 1000 words
   */
  B4: ({ densityPerK }: any) => {
    const density = densityPerK || 0;
    
    if (density >= 8 && density <= 20) {
      return 100; // Optimal density
    } else if (density < 8) {
      // Too sparse - scale from 40% at 0 to 100% at 8
      return clamp(40 + (density / 8) * 60);
    } else if (density > 30) {
      return 50; // Severely over-stuffed
    } else {
      // 20-30: gentle decay from 100 to 70
      return clamp(100 - ((density - 20) * 3));
    }
  },

  /**
   * B5: Experience Level Fit (5% weight)
   * Sigmoid curve around required experience years
   */
  B5: ({ yearsCandidate, yearsRequired }: any) => {
    const candidateYears = yearsCandidate || 0;
    const requiredYears = yearsRequired || 0;
    
    // Calculate difference normalized by 2-year intervals
    const x = (candidateYears - requiredYears) / 2;
    
    // Sigmoid function: s(x) = 1 / (1 + e^(-x))
    const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
    
    const base = sigmoid(x); // 0..1
    
    // Map to 40..100 range (40% minimum for some experience)
    return clamp(Math.round(40 + base * 60));
  },

  // ========== C. Recruiter Psychology ==========

  /**
   * C1: 6-Second Readability Impression (3% weight)
   * Overall visual appeal and scannability
   */
  C1: ({ readabilityScore }: any) => {
    return clamp(readabilityScore ?? 70);
  },

  /**
   * C2: Authority Language Strength (3% weight)
   * Strong action verbs vs weak passive language
   */
  C2: ({ strongVerbPct, weakVerbPct }: any) => {
    const strongPct = strongVerbPct || 0;
    const weakPct = weakVerbPct || 0;
    const delta = strongPct - weakPct; // -100..+100
    
    // Scoring curve:
    // -20% or lower -> 0 points
    // 0% delta -> 60 points (neutral)
    // +30% or higher -> 100 points
    
    if (delta <= -20) return 0;
    if (delta >= 30) return 100;
    
    if (delta <= 0) {
      // Scale from 0 to 60 as delta goes from -20 to 0
      return clamp(60 + (delta / 20) * 60);
    } else {
      // Scale from 60 to 100 as delta goes from 0 to 30
      return clamp(60 + (delta / 30) * 40);
    }
  },

  /**
   * C3: Narrative Coherence (2% weight)
   * Logical flow and story consistency
   */
  C3: ({ coherence }: any) => {
    return clamp(coherence ?? 65);
  },

  /**
   * Red Flag Penalty (0-5 points global penalty)
   * Job hopping, gaps, skill inflation, severe mismatches
   */
  redPenalty: ({ jobHopping, longGap, inflation, severeTitleMismatch }: any) => {
    let penalty = 0;
    
    if (jobHopping) penalty += 2;
    if (longGap) penalty += 1;
    if (inflation) penalty += 2;
    if (severeTitleMismatch) penalty += 1;
    
    return Math.min(5, penalty);
  },

  // ========== D. Market & Company Context ==========

  /**
   * D1: Market Percentile Positioning (4% weight)
   * Candidate's position relative to market (0-100)
   */
  D1: ({ marketPercentile }: any) => {
    return clamp(marketPercentile ?? 50);
  },

  /**
   * D2: Company DNA Alignment (3% weight)
   * Culture, tech stack, and background fit average
   */
  D2: ({ culture, stack, background }: any) => {
    const scores = [culture, stack, background].filter(score => typeof score === 'number');
    
    if (scores.length === 0) return 50; // Default if no data
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return clamp(Math.round(average));
  },

  /**
   * D3: Market Competitiveness (3% weight)
   * Job market competition level
   */
  D3: ({ competitiveness }: any) => {
    if (typeof competitiveness === 'number') {
      return clamp(competitiveness);
    }
    
    // String mapping
    const competitivenessMap: Record<string, number> = {
      hot: 100,
      normal: 80,
      crowded: 60
    };
    
    return clamp(competitivenessMap[competitiveness] ?? 80);
  },

  // ========== E. Predictive Enhancements ==========

  /**
   * E1: X-Factor Uniqueness (maps 0-100 to contribution)
   * Unique value proposition and differentiators
   */
  E1: ({ xFactor }: any) => {
    return clamp(xFactor ?? 0);
  },

  /**
   * E2: Future-Proofing Score (maps 0-100 to contribution)
   * Combines automation resistance and future leverage potential
   */
  E2: ({ automationRisk, futureLeverage }: any) => {
    // Automation risk is 0-1 (lower is better)
    // Future leverage is 0-1 (higher is better)
    
    const riskScore = Math.max(0, Math.min(1, 1 - (automationRisk ?? 0.3))); // Invert risk
    const leverageScore = Math.max(0, Math.min(1, futureLeverage ?? 0.5));
    
    // Weight: 60% risk resistance, 40% future leverage
    const combinedScore = (riskScore * 0.6) + (leverageScore * 0.4);
    
    return clamp(Math.round(combinedScore * 100));
  }
};

/**
 * Helper function to calculate available signals for confidence scoring
 */
export function calculateSignalAvailability(data: any): { available: number; total: number } {
  let available = 0;
  let total = 26; // Total possible signals across all components

  // A signals (9 total)
  if (data.atsChecks) {
    if (data.atsChecks.fileType) available++; // A1
    if (data.atsChecks.sections) available++; // A2
    if (data.atsChecks.contact) available++; // A3
    if (typeof data.atsChecks.datesValid === 'boolean') available++; // A4
    if (data.atsChecks.filename) available++; // A5
    if (data.atsChecks.jobTitleMatch) available++; // A6
    if (typeof data.atsChecks.wordCount === 'number') available++; // A7
    if (data.atsChecks.contact?.links) available++; // A8
    if (data.atsChecks.formatting) available++; // A9
  }

  // B signals (5 total)
  if (data.skills) {
    if (data.skills.jdHardSkills) available++; // B1
    if (typeof data.skills.softFoundCount === 'number') available++; // B2
    if (data.skills.transferable) available++; // B3
    if (typeof data.skills.jdTermDensityPerK === 'number') available++; // B4
    if (typeof data.skills.yearsCandidate === 'number') available++; // B5
  }

  // C signals (4 total including red flags)
  if (data.recruiterPsychology) {
    if (typeof data.recruiterPsychology.sixSecondImpression === 'number') available++; // C1
    if (data.recruiterPsychology.authorityLanguage) available++; // C2
    if (typeof data.recruiterPsychology.narrativeCoherence === 'number') available++; // C3
    if (data.recruiterPsychology.redFlags) available++; // Red flags
  }

  // D signals (3 total - optional)
  if (data.industry?.marketPercentile !== undefined) available++; // D1
  if (data.companyOptimization) available++; // D2
  if (data.industry?.competitivenessScore !== undefined) available++; // D3

  // E signals (2 total)
  if (data.predictive) {
    if (typeof data.predictive.xFactor === 'number') available++; // E1
    if (typeof data.predictive.automationRisk === 'number' || typeof data.predictive.futureLeverage === 'number') available++; // E2
  }

  return { available, total };
}

/**
 * Helper function to extract specific skill recommendations
 */
export function extractSkillRecommendations(skillsData: any): string[] {
  const recommendations: string[] = [];
  
  if (skillsData?.jdHardSkills) {
    // Find critical missing skills
    const criticalMissing = skillsData.jdHardSkills
      .filter((skill: any) => !skill.found && skill.criticality === 'critical')
      .map((skill: any) => skill.name)
      .slice(0, 3); // Top 3
    
    recommendations.push(...criticalMissing);
  }
  
  if (skillsData?.hard?.missing) {
    // Add other high-impact missing skills
    const highImpactMissing = skillsData.hard.missing
      .filter((skill: string) => !recommendations.includes(skill))
      .slice(0, 3 - recommendations.length);
    
    recommendations.push(...highImpactMissing);
  }
  
  return recommendations;
}
