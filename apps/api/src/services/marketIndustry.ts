// Market & Industry Intelligence Service

import { generateJsonWithFallback } from '../lib/gemini';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface IndustryIntel {
  primary: string;
  secondary: string[];
  confidence: number;
  careerPaths: string[][];
}

export interface MarketIntel {
  hot: string[];
  declining: string[];
  benchmarks: {
    salaryRange: [number, number];
    competition: number;
  };
  demandScores: Record<string, 'hot' | 'stable' | 'declining'>;
}

/**
 * Detect industry from resume and job description using Gemini
 */
export async function detectIndustry(
  resumeText: string,
  jobDescription: string
): Promise<IndustryIntel> {
  console.log('🏭 Detecting industry intelligence');

  const prompt = `You are an industry classifier. Return JSON ONLY.

INPUT:
RESUME:
${resumeText.substring(0, 1000)}
JOB:
${jobDescription.substring(0, 1000)}

TASK:
Detect primary industry and 1–3 secondary specializations and confidence (0–1). Provide typical career paths for this industry (2–3 arrays from junior→senior).

JSON:
{
  "primary": "Growth Marketing",
  "secondary": ["SaaS", "B2C"],
  "confidence": 0.87,
  "careerPaths": [
    ["Marketing Associate","Growth Marketer","Growth Manager","Head of Growth"],
    ["Performance Marketer","Growth Manager","Growth Lead"]
  ]
}`;

  try {
    const result = await generateJsonWithFallback<IndustryIntel>(prompt);
    console.log('✅ Industry detection successful:', result.primary);
    return result;
  } catch (error) {
    console.error('❌ Industry detection failed:', error);
    // Fallback to basic detection
    return {
      primary: 'Technology',
      secondary: ['Software'],
      confidence: 0.5,
      careerPaths: [
        ['Junior Developer', 'Senior Developer', 'Tech Lead', 'Engineering Manager'],
        ['Analyst', 'Senior Analyst', 'Manager', 'Director']
      ]
    };
  }
}

/**
 * Get market intelligence for an industry (with caching)
 */
export async function getMarketIntel(
  industry: string,
  resumeSkills: string[],
  jobSkills: string[]
): Promise<MarketIntel> {
  console.log(`📊 Getting market intelligence for: ${industry}`);

  // Check cache first (data older than 24 hours is refreshed)
  const cacheKey = industry.toLowerCase().replace(/\s+/g, '_');
  const cached = await prisma.marketCache.findFirst({
    where: { industry: cacheKey },
  });

  const isStale = !cached || 
    (new Date().getTime() - new Date(cached.updatedAt).getTime()) > 24 * 60 * 60 * 1000;

  if (cached && !isStale) {
    console.log('📋 Using cached market data');
    return cached.payload as unknown as MarketIntel;
  }

  // Generate fresh market intelligence
  const marketData = await generateMarketIntel(industry, resumeSkills, jobSkills);

  // Update cache
  try {
    // Try to update existing cache first
    const existingCache = await prisma.marketCache.findFirst({
      where: { industry: cacheKey },
    });

    if (existingCache) {
      await prisma.marketCache.update({
        where: { id: existingCache.id },
        data: {
          payload: marketData as any,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.marketCache.create({
        data: {
          industry: cacheKey,
          payload: marketData as any,
        },
      });
    }
    console.log('💾 Market data cached');
  } catch (error) {
    console.warn('⚠️ Failed to cache market data:', error);
  }

  return marketData;
}

/**
 * Generate fresh market intelligence using Gemini
 */
async function generateMarketIntel(
  industry: string,
  resumeSkills: string[],
  jobSkills: string[]
): Promise<MarketIntel> {
  const allSkills = [...new Set([...resumeSkills, ...jobSkills])];

  const prompt = `You are a market analyst. Return JSON ONLY.

INPUT:
INDUSTRY: ${industry}
RESUME SKILLS: ${resumeSkills.slice(0, 20).join(', ')}
JOB SKILLS: ${jobSkills.slice(0, 20).join(', ')}

TASK:
Provide hot vs declining skills, demand scores for top 20 skills, salary benchmarks, competition level (0–100).

JSON:
{
  "hot": ["Paid Social","GA4","Lifecycle"],
  "declining": ["Print Media"],
  "benchmarks": { "salaryRange":[90000,130000], "competition": 72 },
  "demandScores": { "Paid Social":"hot","GA4":"hot","Print Media":"declining" }
}`;

  try {
    const result = await generateJsonWithFallback<MarketIntel>(prompt);
    console.log('✅ Market intelligence generated');
    return result;
  } catch (error) {
    console.error('❌ Market intelligence generation failed:', error);
    
    // Fallback market data
    const demandScores: Record<string, 'hot' | 'stable' | 'declining'> = {};
    allSkills.slice(0, 10).forEach(skill => {
      demandScores[skill] = 'stable';
    });

    return {
      hot: allSkills.slice(0, 3),
      declining: [],
      benchmarks: {
        salaryRange: [60000, 100000],
        competition: 65,
      },
      demandScores,
    };
  }
}

/**
 * Calculate market percentile based on overall score and industry benchmarks
 */
export function calculateMarketPercentile(
  overallScore: number,
  industryBenchmarks: MarketIntel['benchmarks']
): number {
  // Normalize score to percentile (simplified heuristic)
  const basePercentile = Math.round(overallScore * 0.8); // 80% max from score
  
  // Adjust based on competition level
  const competitionAdjustment = (100 - industryBenchmarks.competition) * 0.2;
  
  const percentile = Math.min(95, Math.max(5, basePercentile + competitionAdjustment));
  
  console.log(`📈 Calculated market percentile: ${percentile}%`);
  return Math.round(percentile);
}

/**
 * Get industry-specific scoring multipliers
 */
export function getIndustryMultipliers(industry: string): {
  technicalWeight: number;
  experienceWeight: number;
  educationWeight: number;
} {
  const industryMultipliers: Record<string, any> = {
    'technology': { technicalWeight: 1.3, experienceWeight: 1.1, educationWeight: 0.9 },
    'finance': { technicalWeight: 1.1, experienceWeight: 1.2, educationWeight: 1.2 },
    'healthcare': { technicalWeight: 1.0, experienceWeight: 1.3, educationWeight: 1.3 },
    'marketing': { technicalWeight: 1.2, experienceWeight: 1.1, educationWeight: 0.8 },
    'sales': { technicalWeight: 0.8, experienceWeight: 1.4, educationWeight: 0.7 },
    'design': { technicalWeight: 1.3, experienceWeight: 1.0, educationWeight: 0.8 },
    'education': { technicalWeight: 0.7, experienceWeight: 1.1, educationWeight: 1.4 },
  };

  const industryKey = industry.toLowerCase();
  return industryMultipliers[industryKey] || { technicalWeight: 1.0, experienceWeight: 1.0, educationWeight: 1.0 };
}

/**
 * Generate industry-specific recommendations
 */
export async function generateIndustryRecommendations(
  industry: string,
  missingSkills: string[],
  marketIntel: MarketIntel
): Promise<string[]> {
  if (missingSkills.length === 0) {
    return [];
  }

  const prompt = `You are an industry career advisor. Return JSON ONLY.

INPUT:
INDUSTRY: ${industry}
MISSING SKILLS: ${missingSkills.slice(0, 10).join(', ')}
HOT SKILLS: ${marketIntel.hot.join(', ')}

TASK:
Provide 5-7 specific recommendations for skill development prioritized by industry demand.

JSON:
{
  "recommendations": [
    "Focus on GA4 certification - high demand in ${industry}",
    "Learn Paid Social advertising platforms",
    "Develop data analysis skills with SQL"
  ]
}`;

  try {
    const result = await generateJsonWithFallback<{ recommendations: string[] }>(prompt);
    return result.recommendations || [];
  } catch (error) {
    console.warn('⚠️ Failed to generate industry recommendations:', error);
    return [
      `Focus on developing ${missingSkills[0]} skills`,
      `Consider learning ${marketIntel.hot[0]} technology`,
      `Strengthen experience in ${industry} domain knowledge`
    ];
  }
}
