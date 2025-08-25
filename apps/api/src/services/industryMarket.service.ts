/**
 * Industry Market Service - AI-powered industry detection and market analysis
 */

import { askGeminiJSON } from '../lib/gemini';

interface IndustryMarketInput {
  resumeText: string;
  jobDescription: string;
  hardSkillsFound: string[];
  matchRate: number;
}

interface IndustryMarketResult {
  detected: {
    primary: string;
    secondary: string[];
    confidence: number;
  };
  trendingSkills: string[];
  decliningSkills: string[];
  careerPaths: string[][];
  marketPercentile: number;
  skillDemandHeatmap: Array<{
    skill: string;
    status: "hot" | "stable" | "declining";
  }>;
}

// Market percentile calculation weights
const PERCENTILE_WEIGHTS = {
  matchRate: 0.4,
  hardSkillCoverage: 0.3,
  industryAlignment: 0.2,
  modernSkills: 0.1
};

export async function analyzeIndustryMarket({ resumeText, jobDescription, hardSkillsFound, matchRate }: IndustryMarketInput): Promise<IndustryMarketResult> {
  const prompt = `You are an industry expert and career analyst. Analyze the resume and job description to detect industry and provide market insights. Return JSON ONLY.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

HARD SKILLS FOUND:
${hardSkillsFound.join(', ')}

Analyze and provide:
1. Industry detection with confidence
2. Trending vs declining skills in this industry
3. Typical career progression paths
4. Current skill demand status

Return this exact JSON structure:
{
  "detected": {
    "primary": "Technology|Marketing|Finance|Healthcare|Education|Manufacturing|Retail|Consulting|Non-Profit|Government",
    "secondary": ["SaaS", "E-commerce", "B2B", "B2C", "Startup", "Enterprise"],
    "confidence": 0.0-1.0
  },
  "trendingSkills": ["AI/ML", "Cloud Computing", "Data Analysis", "Digital Marketing", "Automation"],
  "decliningSkills": ["Legacy Systems", "Outdated Technologies", "Manual Processes"],
  "careerPaths": [
    ["Junior Developer", "Senior Developer", "Tech Lead", "Engineering Manager"],
    ["Marketing Coordinator", "Marketing Manager", "Senior Marketing Manager", "Director of Marketing"]
  ],
  "skillDemandHeatmap": [
    { "skill": "React", "status": "hot" },
    { "skill": "jQuery", "status": "declining" },
    { "skill": "Project Management", "status": "stable" }
  ]
}

Focus on:
- Current industry trends and demands
- Skills that are gaining vs losing importance
- Realistic career progression paths
- Market demand for specific skills`;

  try {
    const result = await askGeminiJSON(prompt, "flash");
    
    if (result.fallback) {
      return getFallbackIndustryAnalysis(resumeText, jobDescription, hardSkillsFound, matchRate);
    }
    
    // Calculate market percentile using our algorithm
    const marketPercentile = calculateMarketPercentile({
      matchRate,
      hardSkillsFound,
      industryAlignment: result.detected?.confidence || 0.5,
      modernSkills: calculateModernSkillsScore(hardSkillsFound, result.trendingSkills || [])
    });
    
    return {
      detected: {
        primary: result.detected?.primary || "Technology",
        secondary: Array.isArray(result.detected?.secondary) ? result.detected.secondary : [],
        confidence: Math.max(0, Math.min(1, result.detected?.confidence || 0.5))
      },
      trendingSkills: Array.isArray(result.trendingSkills) ? result.trendingSkills : [],
      decliningSkills: Array.isArray(result.decliningSkills) ? result.decliningSkills : [],
      careerPaths: Array.isArray(result.careerPaths) ? result.careerPaths : [],
      marketPercentile,
      skillDemandHeatmap: Array.isArray(result.skillDemandHeatmap) ? result.skillDemandHeatmap : []
    };
  } catch (error) {
    console.error('Industry market analysis failed:', error);
    return getFallbackIndustryAnalysis(resumeText, jobDescription, hardSkillsFound, matchRate);
  }
}

/**
 * Calculate market percentile using our proprietary algorithm
 */
function calculateMarketPercentile(factors: {
  matchRate: number;
  hardSkillsFound: string[];
  industryAlignment: number;
  modernSkills: number;
}): number {
  const { matchRate, hardSkillsFound, industryAlignment, modernSkills } = factors;
  
  // Convert match rate to 0-1 scale
  const normalizedMatchRate = Math.max(0, Math.min(1, matchRate / 100));
  
  // Calculate hard skill coverage (0-1 scale)
  const hardSkillCoverage = Math.min(1, hardSkillsFound.length / 10); // Assume 10 is good coverage
  
  // Weighted score
  const score = 
    normalizedMatchRate * PERCENTILE_WEIGHTS.matchRate +
    hardSkillCoverage * PERCENTILE_WEIGHTS.hardSkillCoverage +
    industryAlignment * PERCENTILE_WEIGHTS.industryAlignment +
    modernSkills * PERCENTILE_WEIGHTS.modernSkills;
  
  // Convert to percentile (1-99)
  const percentile = Math.round(score * 98) + 1;
  return Math.max(1, Math.min(99, percentile));
}

/**
 * Calculate modern skills score based on trending skills
 */
function calculateModernSkillsScore(hardSkillsFound: string[], trendingSkills: string[]): number {
  if (trendingSkills.length === 0) return 0.5;
  
  const modernSkillsFound = hardSkillsFound.filter(skill =>
    trendingSkills.some(trending =>
      skill.toLowerCase().includes(trending.toLowerCase()) ||
      trending.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  return Math.min(1, modernSkillsFound.length / Math.max(1, trendingSkills.length * 0.5));
}

/**
 * Fallback analysis using industry detection heuristics
 */
function getFallbackIndustryAnalysis(resumeText: string, jobDescription: string, hardSkillsFound: string[], matchRate: number): IndustryMarketResult {
  const combinedText = (resumeText + ' ' + jobDescription).toLowerCase();
  
  // Industry detection based on keywords
  const industryKeywords = {
    "Technology": ["software", "developer", "engineer", "programming", "code", "technical", "IT", "system", "database", "web", "mobile", "app"],
    "Marketing": ["marketing", "advertising", "social media", "content", "brand", "campaign", "digital", "seo", "sem", "analytics"],
    "Finance": ["finance", "accounting", "financial", "investment", "banking", "audit", "tax", "budget", "revenue", "cost"],
    "Healthcare": ["healthcare", "medical", "patient", "clinical", "hospital", "nurse", "doctor", "pharmaceutical", "health"],
    "Education": ["education", "teaching", "instructor", "curriculum", "student", "academic", "university", "school"],
    "Sales": ["sales", "business development", "account management", "customer", "client", "revenue", "quota", "pipeline"],
    "Operations": ["operations", "logistics", "supply chain", "process", "efficiency", "quality", "manufacturing"],
    "Consulting": ["consulting", "advisory", "strategy", "implementation", "transformation", "change management"]
  };
  
  let detectedIndustry = "Technology"; // Default
  let maxMatches = 0;
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const matches = keywords.filter(keyword => combinedText.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIndustry = industry;
    }
  }
  
  // Generate fallback trending/declining skills based on industry
  const trendingSkills = getTrendingSkillsByIndustry(detectedIndustry);
  const decliningSkills = getDecliningSkillsByIndustry(detectedIndustry);
  
  // Generate skill demand heatmap
  const skillDemandHeatmap = hardSkillsFound.map(skill => ({
    skill,
    status: (trendingSkills.includes(skill) ? "hot" : 
             decliningSkills.includes(skill) ? "declining" : "stable") as "hot" | "stable" | "declining"
  }));
  
  const marketPercentile = calculateMarketPercentile({
    matchRate,
    hardSkillsFound,
    industryAlignment: 0.7, // Default confidence
    modernSkills: calculateModernSkillsScore(hardSkillsFound, trendingSkills)
  });
  
  return {
    detected: {
      primary: detectedIndustry,
      secondary: getSecondaryIndustries(detectedIndustry),
      confidence: 0.7
    },
    trendingSkills,
    decliningSkills,
    careerPaths: getCareerPathsByIndustry(detectedIndustry),
    marketPercentile,
    skillDemandHeatmap
  };
}

function getTrendingSkillsByIndustry(industry: string): string[] {
  const trending: Record<string, string[]> = {
    "Technology": ["React", "TypeScript", "Cloud Computing", "Machine Learning", "DevOps", "Microservices"],
    "Marketing": ["GA4", "Marketing Automation", "Data Analytics", "Content Marketing", "Social Media"],
    "Finance": ["Financial Modeling", "Data Analysis", "Python", "Risk Management", "Compliance"],
    "Healthcare": ["Telemedicine", "Electronic Health Records", "Data Analysis", "Quality Improvement"],
    "Education": ["Online Learning", "Educational Technology", "Curriculum Design", "Assessment"],
    "Sales": ["CRM", "Sales Analytics", "Account-Based Marketing", "Customer Success"],
    "Operations": ["Process Automation", "Data Analytics", "Supply Chain Management", "Quality Control"],
    "Consulting": ["Digital Transformation", "Change Management", "Data Analytics", "Strategy"]
  };
  
  return trending[industry] || trending["Technology"] || [];
}

function getDecliningSkillsByIndustry(industry: string): string[] {
  const declining: Record<string, string[]> = {
    "Technology": ["jQuery", "Flash", "Internet Explorer Support", "Waterfall Development"],
    "Marketing": ["Universal Analytics", "Traditional Advertising", "Print Marketing"],
    "Finance": ["Manual Bookkeeping", "Paper-based Processes", "Legacy Systems"],
    "Healthcare": ["Paper Records", "Fax Communications", "Manual Scheduling"],
    "Education": ["Traditional Classroom Only", "Paper-based Assessment"],
    "Sales": ["Cold Calling Only", "Manual Lead Tracking", "Paper Contracts"],
    "Operations": ["Manual Inventory", "Paper-based Reporting", "Legacy Systems"],
    "Consulting": ["Traditional Consulting", "Manual Reporting", "Spreadsheet-only Analysis"]
  };
  
  return declining[industry] || [];
}

function getSecondaryIndustries(primary: string): string[] {
  const secondary: Record<string, string[]> = {
    "Technology": ["SaaS", "E-commerce", "Fintech", "Healthtech"],
    "Marketing": ["Digital", "B2B", "B2C", "E-commerce"],
    "Finance": ["Fintech", "Banking", "Investment", "Insurance"],
    "Healthcare": ["Telemedicine", "Pharmaceuticals", "Medical Devices"],
    "Education": ["EdTech", "Higher Education", "K-12", "Corporate Training"],
    "Sales": ["B2B", "B2C", "SaaS", "Enterprise"],
    "Operations": ["Manufacturing", "Logistics", "Supply Chain"],
    "Consulting": ["Management", "Technology", "Strategy", "Implementation"]
  };
  
  return secondary[primary] || [];
}

function getCareerPathsByIndustry(industry: string): string[][] {
  const paths: Record<string, string[][]> = {
    "Technology": [
      ["Junior Developer", "Senior Developer", "Tech Lead", "Engineering Manager"],
      ["QA Tester", "QA Engineer", "QA Lead", "QA Manager"],
      ["Product Manager", "Senior PM", "Director of Product", "VP of Product"]
    ],
    "Marketing": [
      ["Marketing Coordinator", "Marketing Specialist", "Marketing Manager", "Director of Marketing"],
      ["Content Writer", "Content Manager", "Content Director", "VP of Content"],
      ["Digital Marketer", "Senior Digital Marketer", "Digital Marketing Manager", "CMO"]
    ],
    "Finance": [
      ["Financial Analyst", "Senior Analyst", "Finance Manager", "Finance Director"],
      ["Accountant", "Senior Accountant", "Accounting Manager", "Controller"],
      ["Investment Analyst", "Portfolio Manager", "Investment Director", "CIO"]
    ]
  };
  
  return paths[industry] || paths["Technology"] || [];
}
