🚀 COMPLETE DEVELOPER IMPLEMENTATION GUIDE
Building the World's #1 ATS Scanner with Claude Sonnet 4 & Gemini AI

📋 PROJECT OVERVIEW
Goal: Transform your existing ATS scanner into the market-leading solution by implementing advanced AI intelligence, predictive analytics, and unique features that competitors don't have.
Tech Stack Enhancement:

AI Engine: Google Gemini 2 (latest model)
Development Assistant: Claude Sonnet 4
Framework: Next.js 14 + TypeScript
Backend: Node.js + Express + Prisma
Database: MySQL (enhanced schema)


🎯 PHASE 1: ADVANCED AI ENGINE FOUNDATION
Timeline: Month 1-2 | Priority: CRITICAL
WHAT TO IMPLEMENT:
1.1 Enhanced Gemini AI Integration
File: /lib/gemini/advanced-analyzer.ts
typescriptimport { GoogleGenerativeAI } from '@google/generative-ai';

interface AdvancedAnalysisRequest {
  resumeText: string;
  jobDescription: string;
  industryContext?: string;
  companyIntel?: CompanyProfile;
  marketData?: MarketTrends;
}

interface RevolutionaryScoring {
  // Context-Aware Skill Assessment
  skillRelevancy: {
    score: number;
    contextualMatches: Array<{
      skillName: string;
      jobContext: string;           // "5+ years React" vs "React knowledge"
      candidateContext: string;     // "Led React team" vs "Used React"
      relevancyMultiplier: number;  // 1.5x for leadership context
      impactLevel: 'high' | 'medium' | 'low';
    }>;
  };
  
  // Experience Progression Analysis
  careerTrajectory: {
    score: number;
    progression: 'upward' | 'lateral' | 'downward' | 'mixed';
    promotionIndicators: string[];
    responsibilityGrowth: number;
    timelineConsistency: boolean;
  };
  
  // Achievement Impact Calculation
  impactScore: {
    quantificationQuality: number;  // Not just "has numbers" but "meaningful numbers"
    businessImpact: 'high' | 'medium' | 'low';
    achievementCredibility: number; // Realistic vs inflated claims
    leadershipEvidence: number;
  };
  
  // Recruiter Psychology Analysis
  recruiterAppeal: {
    firstImpressionScore: number;     // First 6 seconds scan
    storytellingQuality: number;      // Career narrative coherence
    authorityIndicators: number;      // Leadership, ownership language
    cultureAlignmentSignals: number;  // Team player vs individual contributor
  };
  
  // Red Flag Detection
  redFlags: {
    frequentJobHopping: boolean;
    skillInflation: boolean;         // Claims senior skills with junior experience
    genericContent: boolean;         // Copy-paste resume indicators
    overqualificationRisk: boolean;  // Will they leave quickly?
    inconsistentTimeline: boolean;
    flags: string[];
  };
}

export class AdvancedGeminiAnalyzer {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  
  async performAdvancedAnalysis(request: AdvancedAnalysisRequest): Promise<RevolutionaryScoring> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    
    const prompt = this.buildAdvancedPrompt(request);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      // Parse the structured JSON response
      return JSON.parse(analysisText) as RevolutionaryScoring;
    } catch (error) {
      console.error('Advanced Gemini analysis failed:', error);
      // Fallback to existing system
      return this.fallbackAnalysis(request);
    }
  }
  
  private buildAdvancedPrompt(request: AdvancedAnalysisRequest): string {
    return `
You are the world's most advanced ATS and recruitment AI, combining the expertise of:
- Senior Technical Recruiter (15+ years)
- ATS System Engineer
- Industry Hiring Manager
- Career Psychology Expert

CRITICAL: Return ONLY valid JSON, no markdown formatting.

RESUME CONTENT:
${request.resumeText}

JOB DESCRIPTION:
${request.jobDescription}

INDUSTRY CONTEXT:
${request.industryContext || 'General'}

ANALYSIS REQUIREMENTS:

1. CONTEXTUAL SKILL ANALYSIS:
   - Don't just match keywords - understand CONTEXT
   - "5 years React experience required" vs "React knowledge preferred"
   - "Led React team of 8" is worth MORE than "Used React"
   - Calculate relevancy multipliers based on context depth

2. CAREER TRAJECTORY INTELLIGENCE:
   - Analyze progression pattern (upward/lateral/concerning)
   - Identify promotion indicators and responsibility growth
   - Flag timeline inconsistencies or job hopping patterns

3. ACHIEVEMENT IMPACT SCORING:
   - "Increased sales by 15%" = good quantification
   - "Saved company $2M annually" = high business impact
   - "Managed team of 50" = leadership evidence
   - Flag unrealistic claims (junior role claiming $10M impact)

4. RECRUITER PSYCHOLOGY ANALYSIS:
   - First 6-second impression score
   - Story coherence (does career make sense?)
   - Authority language ("Led", "Built", "Drove" vs "Assisted", "Helped")
   - Culture fit indicators

5. RED FLAG DETECTION:
   - Job hopping (>3 jobs in 2 years)
   - Skill inflation (claiming senior with junior experience)
   - Generic/template content
   - Timeline gaps or inconsistencies

Return analysis in this EXACT JSON structure:

{
  "skillRelevancy": {
    "score": 85,
    "contextualMatches": [
      {
        "skillName": "React",
        "jobContext": "5+ years React experience with team leadership",
        "candidateContext": "Led React team of 8 developers for 3 years",
        "relevancyMultiplier": 2.3,
        "impactLevel": "high"
      }
    ]
  },
  "careerTrajectory": {
    "score": 78,
    "progression": "upward",
    "promotionIndicators": ["Developer -> Senior Developer -> Team Lead"],
    "responsibilityGrowth": 85,
    "timelineConsistency": true
  },
  "impactScore": {
    "quantificationQuality": 90,
    "businessImpact": "high",
    "achievementCredibility": 85,
    "leadershipEvidence": 75
  },
  "recruiterAppeal": {
    "firstImpressionScore": 82,
    "storytellingQuality": 78,
    "authorityIndicators": 85,
    "cultureAlignmentSignals": 80
  },
  "redFlags": {
    "frequentJobHopping": false,
    "skillInflation": false,
    "genericContent": false,
    "overqualificationRisk": false,
    "inconsistentTimeline": false,
    "flags": []
  }
}
    `;
  }
  
  private async fallbackAnalysis(request: AdvancedAnalysisRequest): Promise<RevolutionaryScoring> {
    // Implement sophisticated fallback logic
    return {
      skillRelevancy: { score: 70, contextualMatches: [] },
      careerTrajectory: { score: 65, progression: 'lateral', promotionIndicators: [], responsibilityGrowth: 60, timelineConsistency: true },
      impactScore: { quantificationQuality: 60, businessImpact: 'medium', achievementCredibility: 70, leadershipEvidence: 50 },
      recruiterAppeal: { firstImpressionScore: 65, storytellingQuality: 60, authorityIndicators: 65, cultureAlignmentSignals: 70 },
      redFlags: { frequentJobHopping: false, skillInflation: false, genericContent: false, overqualificationRisk: false, inconsistentTimeline: false, flags: [] }
    };
  }
}
WHERE TO IMPLEMENT: Create new directory /lib/gemini/ and integrate with existing analysis pipeline
WHY IMPLEMENT: This moves you from basic keyword matching to contextual intelligence - the core differentiator that will make you #1

1.2 Industry-Specific Intelligence Engine
File: /lib/intelligence/industry-analyzer.ts
typescriptinterface IndustryIntelligence {
  industryDetection: {
    primary: string;        // "Software Engineering"
    secondary: string[];    // ["FinTech", "SaaS"]
    confidence: number;
  };
  
  industrySpecificScoring: {
    techStack: {
      required: string[];           // Must-have for this industry
      preferred: string[];          // Nice-to-have
      emerging: string[];           // Trending skills (bonus points)
      deprecated: string[];         // Outdated (negative points)
    };
    
    experiencePatterns: {
      idealCareerPath: string[];    // Typical progression in this field
      alternativeValidPaths: string[][];
      unusualButValuable: string[]; // Non-traditional but valuable backgrounds
    };
    
    industryKeywords: {
      buzzwords: string[];          // Overused terms to penalize
      goldKeywords: string[];       // High-value industry terms
      contextualPhrases: string[];  // Industry-specific language patterns
    };
  };
}

export class IndustryIntelligenceEngine {
  private industryDatabase = {
    'Software Engineering': {
      required: ['JavaScript', 'Python', 'Git', 'API', 'Database'],
      preferred: ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
      emerging: ['AI/ML', 'Blockchain', 'Edge Computing', 'WebAssembly'],
      deprecated: ['Flash', 'Silverlight', 'Internet Explorer'],
      goldKeywords: ['scalable', 'performance', 'architecture', 'microservices'],
      buzzwords: ['rockstar', 'ninja', 'guru', 'cutting-edge'],
      careerPaths: [
        ['Junior Developer', 'Software Developer', 'Senior Developer', 'Tech Lead'],
        ['Frontend Developer', 'Full-stack Developer', 'Engineering Manager']
      ]
    },
    'Product Management': {
      required: ['Product Strategy', 'User Research', 'Analytics', 'Roadmap'],
      preferred: ['A/B Testing', 'SQL', 'Figma', 'Jira', 'Agile'],
      emerging: ['AI Product Strategy', 'Voice UI', 'IoT Products'],
      deprecated: ['Waterfall', 'Traditional Marketing'],
      goldKeywords: ['user-centric', 'data-driven', 'growth', 'retention'],
      buzzwords: ['synergy', 'disruptive', 'paradigm shift'],
      careerPaths: [
        ['Associate PM', 'Product Manager', 'Senior PM', 'Director of Product'],
        ['Business Analyst', 'Product Manager', 'VP Product']
      ]
    }
    // Add 150+ industries
  };

  async detectIndustry(resumeText: string, jobDescription: string): Promise<IndustryIntelligence> {
    const prompt = `
    Analyze this resume and job description to determine the primary industry and specialization:

    RESUME: ${resumeText.substring(0, 2000)}
    JOB: ${jobDescription.substring(0, 1000)}

    Return ONLY JSON:
    {
      "primary": "Software Engineering",
      "secondary": ["FinTech", "SaaS"],
      "confidence": 0.95
    }
    `;

    const geminiResult = await this.callGemini(prompt);
    const detection = JSON.parse(geminiResult);
    
    return {
      industryDetection: detection,
      industrySpecificScoring: this.getIndustryScoring(detection.primary)
    };
  }

  private getIndustryScoring(industry: string) {
    return this.industryDatabase[industry] || this.industryDatabase['Software Engineering'];
  }

  private async callGemini(prompt: string): Promise<string> {
    // Implementation using your existing Gemini setup
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
WHERE TO IMPLEMENT: Create /lib/intelligence/ directory and integrate with main analysis flow
WHY IMPLEMENT: Industry-specific optimization is a major differentiator - no competitor has 150+ industry models

1.3 Hire Probability Prediction Engine
File: /lib/prediction/hire-probability.ts
typescriptinterface HireProbabilityResult {
  probability: number;  // 0-100%
  confidenceInterval: [number, number];
  calculation: {
    skillsMatch: number;      // 30% weight
    experienceLevel: number;  // 25% weight  
    culturalFit: number;      // 20% weight
    overqualification: number; // -15% if too qualified
    redFlags: number;         // -30% for major issues
    xFactor: number;          // 10% unique strengths
  };
  reasoning: string[];
  interviewProbability: number;
  salaryRange: [number, number];
}

export class HireProbabilityEngine {
  async calculateHireChance(
    resumeAnalysis: RevolutionaryScoring,
    jobDescription: string,
    industryIntel: IndustryIntelligence
  ): Promise<HireProbabilityResult> {
    
    const prompt = `
You are a senior hiring manager with 20 years of experience. Based on this data, calculate the probability this candidate will be hired.

RESUME ANALYSIS: ${JSON.stringify(resumeAnalysis, null, 2)}
JOB DESCRIPTION: ${jobDescription}
INDUSTRY: ${industryIntel.industryDetection.primary}

Use this weighted calculation:
- Skills Match: 30% (how well skills align with requirements)
- Experience Level: 25% (appropriate level for role)
- Cultural Fit: 20% (soft skills, communication style)
- Overqualification Risk: -15% (if too senior, might leave quickly)
- Red Flags: -30% (job hopping, inconsistencies)
- X-Factor: 10% (unique strengths, leadership, achievements)

Consider:
- Market demand for this role type
- Competition level in this industry
- Typical hiring standards
- Economic factors affecting hiring

Return ONLY JSON:
{
  "probability": 73,
  "confidenceInterval": [68, 78],
  "calculation": {
    "skillsMatch": 85,
    "experienceLevel": 80,
    "culturalFit": 75,
    "overqualification": -5,
    "redFlags": 0,
    "xFactor": 15
  },
  "reasoning": [
    "Strong technical skills match (85%)",
    "Appropriate experience level for mid-senior role",
    "Good cultural fit indicators in language used",
    "No significant red flags detected",
    "Leadership experience adds value"
  ],
  "interviewProbability": 82,
  "salaryRange": [95000, 125000]
}
    `;

    const result = await this.callGemini(prompt);
    return JSON.parse(result);
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}
WHERE TO IMPLEMENT: Create /lib/prediction/ directory
WHY IMPLEMENT: This is a UNIQUE feature no competitor has - knowing your hire probability before applying is revolutionary

1.4 Enhanced Database Schema
File: /prisma/schema.prisma
prisma// Add these new models to your existing schema

model ATSScanAdvanced {
  id                   String   @id @default(cuid())
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic scores (existing)
  overallScore         Int
  matchRate           Int
  searchability       Int
  atsCompatibility    Int
  
  // NEW: Advanced Intelligence
  skillRelevancy      Json     // RevolutionaryScoring.skillRelevancy
  careerTrajectory    Json     // RevolutionaryScoring.careerTrajectory
  impactScore         Json     // RevolutionaryScoring.impactScore
  recruiterAppeal     Json     // RevolutionaryScoring.recruiterAppeal
  redFlags            Json     // RevolutionaryScoring.redFlags
  
  // NEW: Industry Intelligence
  industryDetection   Json     // IndustryIntelligence.industryDetection
  industryScoring     Json     // IndustryIntelligence.industrySpecificScoring
  
  // NEW: Predictions
  hireProbability     Json     // HireProbabilityResult
  interviewReadiness  Json     // Interview prediction data
  salaryNegotiation   Json     // Salary insights
  
  // NEW: Market Intelligence
  marketPosition      Json     // Competitive analysis
  skillDemand         Json     // Current market demand for skills
  
  // Existing fields
  detailedAnalysis    Json
  hardSkillsFound     Json
  hardSkillsMissing   Json
  recruiterTips       Json
  keywordAnalysis     Json
  improvementSuggestions Json
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@map("ats_scans_advanced")
}

model MarketIntelligence {
  id              String   @id @default(cuid())
  industry        String
  skillDemand     Json     // Current demand levels for skills
  salaryTrends    Json     // Salary trend data
  hiringTrends    Json     // Hiring volume and patterns
  lastUpdated     DateTime @default(now())
  
  @@map("market_intelligence")
}

model CompanyProfiles {
  id              String   @id @default(cuid())
  companyName     String   @unique
  domain          String?
  industry        String
  size            String
  cultureKeywords Json     // Company culture indicators
  techStack       Json     // Preferred technologies
  hiringPatterns  Json     // Historical hiring data
  averageTenure   Float?
  lastUpdated     DateTime @default(now())
  
  @@map("company_profiles")
}
WHERE TO IMPLEMENT: Update your existing Prisma schema and run migration
WHY IMPLEMENT: Enhanced data storage enables advanced analytics and historical tracking

🎯 PHASE 2: MARKET INTELLIGENCE INTEGRATION
Timeline: Month 2-3 | Priority: HIGH
WHAT TO IMPLEMENT:
2.1 Real-Time Market Intelligence Engine
File: /lib/market/intelligence-engine.ts
typescriptinterface MarketIntelligenceData {
  skillDemand: {
    [skill: string]: {
      demand: 'hot' | 'stable' | 'declining';
      growthRate: number;
      averageSalary: number;
      jobOpenings: number;
    };
  };
  industryTrends: {
    [industry: string]: {
      hiringVolume: number;
      salaryTrend: 'increasing' | 'stable' | 'decreasing';
      competitionLevel: number;
      emergingSkills: string[];
    };
  };
  locationFactors: {
    [location: string]: {
      marketSize: number;
      averageSalary: number;
      competitionLevel: number;
    };
  };
}

export class MarketIntelligenceEngine {
  private marketData: MarketIntelligenceData = {};
  
  async getMarketAdjustedScore(
    baseScore: number, 
    skills: string[], 
    industry: string,
    location?: string
  ): Promise<{
    adjustedScore: number;
    marketFactors: any;
    recommendations: string[];
  }> {
    
    await this.updateMarketData();
    
    const prompt = `
Based on current market intelligence, adjust this resume score and provide insights:

BASE SCORE: ${baseScore}
SKILLS: ${skills.join(', ')}
INDUSTRY: ${industry}
LOCATION: ${location || 'General'}

CURRENT MARKET DATA:
${JSON.stringify(this.marketData, null, 2)}

Consider:
1. High-demand skills should boost score
2. Declining skills should reduce score
3. Market saturation affects competitiveness
4. Location-specific factors

Return ONLY JSON:
{
  "adjustedScore": 78,
  "marketFactors": {
    "skillDemandBonus": 12,
    "competitionPenalty": -5,
    "locationBonus": 3,
    "trendingSkillsBonus": 8
  },
  "recommendations": [
    "Add AI/ML skills - 300% demand increase",
    "Consider relocating to Austin - 25% salary premium",
    "Remove outdated skills to avoid negative perception"
  ]
}
    `;

    const result = await this.callGemini(prompt);
    return JSON.parse(result);
  }

  private async updateMarketData(): Promise<void> {
    // In production, this would call real market intelligence APIs
    // For now, simulate with realistic data
    
    this.marketData = {
      skillDemand: {
        'AI/ML': { demand: 'hot', growthRate: 300, averageSalary: 150000, jobOpenings: 50000 },
        'React': { demand: 'hot', growthRate: 25, averageSalary: 95000, jobOpenings: 25000 },
        'Python': { demand: 'hot', growthRate: 40, averageSalary: 105000, jobOpenings: 35000 },
        'jQuery': { demand: 'declining', growthRate: -15, averageSalary: 75000, jobOpenings: 5000 },
        'Flash': { demand: 'declining', growthRate: -90, averageSalary: 60000, jobOpenings: 100 }
      },
      industryTrends: {
        'Software Engineering': {
          hiringVolume: 125000,
          salaryTrend: 'increasing',
          competitionLevel: 75,
          emergingSkills: ['AI/ML', 'Blockchain', 'Edge Computing']
        }
      },
      locationFactors: {
        'San Francisco': { marketSize: 100000, averageSalary: 140000, competitionLevel: 95 },
        'Austin': { marketSize: 25000, averageSalary: 110000, competitionLevel: 65 },
        'Remote': { marketSize: 200000, averageSalary: 100000, competitionLevel: 85 }
      }
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
WHERE TO IMPLEMENT: Create /lib/market/ directory and integrate with main analysis
WHY IMPLEMENT: Real-time market intelligence gives users competitive advantage - no competitor has this

2.2 Competitive Intelligence Dashboard
File: /lib/competitive/analysis-engine.ts
typescriptinterface CompetitiveAnalysis {
  marketPosition: {
    percentile: number;             // "Top 15% of candidates"
    compareToHired: {
      similarity: number;           // How similar to actually hired profiles
      gaps: string[];              // What hired candidates had that user lacks
    };
    salaryBenchmark: {
      estimatedRange: [number, number];
      factorsInfluencing: string[];
    };
  };
  
  competitorAnalysis: {
    typicalCandidateProfile: {
      commonSkills: string[];
      averageExperience: number;
      educationPatterns: string[];
    };
    yourAdvantages: string[];
    yourWeaknesses: string[];
    improvementPriority: Array<{
      skill: string;
      impact: 'high' | 'medium' | 'low';
      timeToAcquire: 'days' | 'weeks' | 'months';
      marketDemand: number;
    }>;
  };
}

export class CompetitiveAnalysisEngine {
  async analyzeMarketPosition(
    resumeAnalysis: RevolutionaryScoring,
    jobDescription: string,
    industry: string
  ): Promise<CompetitiveAnalysis> {
    
    const prompt = `
You are a market research analyst specializing in talent intelligence. Analyze this candidate's competitive position:

CANDIDATE DATA: ${JSON.stringify(resumeAnalysis, null, 2)}
TARGET ROLE: ${jobDescription}
INDUSTRY: ${industry}

Based on market data and hiring patterns, provide competitive analysis:

1. MARKET POSITION:
   - What percentile is this candidate in?
   - How similar are they to typically hired profiles?
   - What salary range should they target?

2. COMPETITIVE LANDSCAPE:
   - What do typical candidates for this role have?
   - What are this candidate's unique advantages?
   - What gaps need to be filled?
   - Priority order for skill development?

Return ONLY JSON:
{
  "marketPosition": {
    "percentile": 78,
    "compareToHired": {
      "similarity": 85,
      "gaps": ["AWS certification", "Team leadership experience"]
    },
    "salaryBenchmark": {
      "estimatedRange": [95000, 125000],
      "factorsInfluencing": ["Strong React skills", "5 years experience", "No leadership experience"]
    }
  },
  "competitorAnalysis": {
    "typicalCandidateProfile": {
      "commonSkills": ["React", "JavaScript", "Node.js", "AWS"],
      "averageExperience": 4.5,
      "educationPatterns": ["Computer Science", "Bootcamp", "Self-taught"]
    },
    "yourAdvantages": ["Strong quantified achievements", "Full-stack expertise"],
    "yourWeaknesses": ["No cloud certifications", "Limited leadership experience"],
    "improvementPriority": [
      {
        "skill": "AWS Certification",
        "impact": "high",
        "timeToAcquire": "months",
        "marketDemand": 90
      },
      {
        "skill": "Team Leadership",
        "impact": "medium",
        "timeToAcquire": "months",
        "marketDemand": 75
      }
    ]
  }
}
    `;

    const result = await this.callGemini(prompt);
    return JSON.parse(result);
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}
WHERE TO IMPLEMENT: Create /lib/competitive/ directory
WHY IMPLEMENT: Knowing exactly where you stand vs competition is invaluable - unique market position

🎯 PHASE 3: COMPANY INTELLIGENCE ENGINE
Timeline: Month 3-4 | Priority: HIGH
WHAT TO IMPLEMENT:
3.1 Company Intelligence Scraper
File: /lib/company/intelligence-scraper.ts
typescriptinterface CompanyProfile {
  companyName: string;
  domain: string;
  industry: string;
  size: string;
  cultureKeywords: string[];
  techStack: string[];
  hiringPatterns: {
    preferredBackgrounds: string[];
    commonCareerPaths: string[];
    averageTenure: number;
    promotionRate: number;
  };
  recentHires: Array<{
    role: string;
    background: string[];
    skills: string[];
  }>;
}

export class CompanyIntelligenceEngine {
  async getCompanyProfile(companyName: string, domain?: string): Promise<CompanyProfile> {
    // First, try to get from database
    const existingProfile = await this.getFromDatabase(companyName);
    if (existingProfile && this.isDataFresh(existingProfile.lastUpdated)) {
      return existingProfile;
    }

    // If not found or stale, scrape new data
    const profile = await this.scrapeCompanyData(companyName, domain);
    await this.saveToDatabase(profile);
    
    return profile;
  }

  private async scrapeCompanyData(companyName: string, domain?: string): Promise<CompanyProfile> {
    const scrapingResults = await Promise.allSettled([
      this.scrapeLinkedIn(companyName),
      this.scrapeGlassdoor(companyName),
      this.scrapeCompanyWebsite(domain),
      this.scrapeJobPostings(companyName)
    ]);

    // Combine all data sources
    const combinedData = this.combineScrapingResults(scrapingResults);
    
    // Use Gemini to analyze and structure the data
    const prompt = `
Analyze this scraped company data and extract key intelligence:

COMPANY: ${companyName}
SCRAPED DATA: ${JSON.stringify(combinedData, null, 2)}

Extract and structure:
1. Company culture keywords and values
2. Technical stack and preferences
3. Hiring patterns and typical backgrounds
4. Recent hiring trends
5. Average tenure and promotion rates

Return ONLY JSON:
{
  "companyName": "${companyName}",
  "domain": "${domain || ''}",
  "industry": "Software/Technology",
  "size": "1000-5000",
  "cultureKeywords": ["innovation", "collaboration", "remote-friendly", "fast-paced"],
  "techStack": ["React", "Node.js", "AWS", "Python", "Kubernetes"],
  "hiringPatterns": {
    "preferredBackgrounds": ["Startup experience", "Big tech", "Computer Science"],
    "commonCareerPaths": ["Developer -> Senior -> Lead", "Bootcamp -> Developer -> Senior"],
    "averageTenure": 2.5,
    "promotionRate": 0.25
  },
  "recentHires": [
    {
      "role": "Senior Software Engineer",
      "background": ["Startup", "5 years experience"],
      "skills": ["React", "TypeScript", "AWS"]
    }
  ]
}
    `;

    const analysis = await this.callGemini(prompt);
    return JSON.parse(analysis);
  }

  async optimizeForCompany(
    resumeAnalysis: RevolutionaryScoring,
    companyProfile: CompanyProfile,
    jobDescription: string
  ): Promise<{
    optimizationScore: number;
    cultureAlignment: number;
    techStackMatch: number;
    backgroundFit:RetryClaude does not have the ability to run the code it generates yet.AContinueEdittypescript async optimizeForCompany(
   resumeAnalysis: RevolutionaryScoring,
   companyProfile: CompanyProfile,
   jobDescription: string
 ): Promise<{
   optimizationScore: number;
   cultureAlignment: number;
   techStackMatch: number;
   backgroundFit: number;
   recommendations: {
     resumeAdjustments: string[];
     coverLetterTopics: string[];
     interviewPrep: string[];
     keywordsToAdd: string[];
     keywordsToAvoid: string[];
   };
 }> {
   
   const prompt = `
You are a company-specific optimization expert. Analyze how well this candidate fits this specific company:

CANDIDATE ANALYSIS: ${JSON.stringify(resumeAnalysis, null, 2)}
COMPANY PROFILE: ${JSON.stringify(companyProfile, null, 2)}
JOB DESCRIPTION: ${jobDescription}

Provide company-specific optimization recommendations:

1. CULTURE ALIGNMENT (0-100):
  - How well do candidate's values align with company culture?
  - Language style match (formal vs casual, innovation vs stability)
  - Work style preferences (remote, collaborative, independent)

2. TECH STACK MATCH (0-100):
  - Overlap with company's preferred technologies
  - Experience with their specific tools and platforms
  - Architectural approach alignment

3. BACKGROUND FIT (0-100):
  - Does candidate's career path match typical hires?
  - Company size transition fit (startup to enterprise, etc.)
  - Industry experience relevance

4. SPECIFIC RECOMMENDATIONS:
  - Resume language adjustments for this company
  - Cover letter topics to emphasize
  - Interview preparation focus areas
  - Keywords to add/avoid based on company preference

Return ONLY JSON:
{
 "optimizationScore": 78,
 "cultureAlignment": 85,
 "techStackMatch": 72,
 "backgroundFit": 75,
 "recommendations": {
   "resumeAdjustments": [
     "Emphasize 'innovation' and 'fast-paced' experience",
     "Highlight remote work success stories",
     "Use more casual, energetic language"
   ],
   "coverLetterTopics": [
     "Passion for company's mission in sustainable tech",
     "Experience scaling products rapidly",
     "Remote collaboration success"
   ],
   "interviewPrep": [
     "Study company's recent product launches",
     "Prepare examples of innovation under pressure",
     "Research team's technical blog posts"
   ],
   "keywordsToAdd": ["scalable", "agile", "customer-centric", "data-driven"],
   "keywordsToAvoid": ["bureaucratic", "traditional", "waterfall", "siloed"]
 }
}
   `;

   const result = await this.callGemini(prompt);
   return JSON.parse(result);
 }

 private async scrapeLinkedIn(companyName: string): Promise<any> {
   // Implement LinkedIn company page scraping
   // Note: Use proper anti-detection methods
   return {
     employees: [],
     recentHires: [],
     cultureKeywords: []
   };
 }

 private async scrapeGlassdoor(companyName: string): Promise<any> {
   // Implement Glassdoor scraping for culture insights
   return {
     reviews: [],
     cultureKeywords: [],
     interviewQuestions: []
   };
 }

 private async scrapeCompanyWebsite(domain?: string): Promise<any> {
   if (!domain) return {};
   
   // Scrape company website for tech stack, values, etc.
   return {
     techStack: [],
     values: [],
     jobPostings: []
   };
 }

 private async scrapeJobPostings(companyName: string): Promise<any> {
   // Scrape multiple job sites for this company's postings
   return {
     commonRequirements: [],
     techStack: [],
     cultureKeywords: []
   };
 }

 private combineScrapingResults(results: PromiseSettledResult<any>[]): any {
   // Combine and deduplicate data from all sources
   const combinedData = {};
   
   results.forEach(result => {
     if (result.status === 'fulfilled') {
       Object.assign(combinedData, result.value);
     }
   });
   
   return combinedData;
 }

 private async callGemini(prompt: string): Promise<string> {
   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
   const result = await model.generateContent(prompt);
   return result.response.text();
 }

 private async getFromDatabase(companyName: string): Promise<any> {
   // Get existing company profile from database
   return null; // Implement with Prisma
 }

 private async saveToDatabase(profile: CompanyProfile): Promise<void> {
   // Save company profile to database
   // Implement with Prisma
 }

 private isDataFresh(lastUpdated: Date): boolean {
   const oneDayAgo = new Date();
   oneDayAgo.setDate(oneDayAgo.getDate() - 1);
   return lastUpdated > oneDayAgo;
 }
}
WHERE TO IMPLEMENT: Create /lib/company/ directory and integrate with analysis pipeline
WHY IMPLEMENT: Company-specific optimization is revolutionary - tailor resume for each company's DNA

🎯 PHASE 4: ADVANCED PREDICTION FEATURES
Timeline: Month 4-5 | Priority: HIGH
WHAT TO IMPLEMENT:
4.1 Interview Readiness Predictor
File: /lib/prediction/interview-readiness.ts
typescriptinterface InterviewReadinessResult {
  overallReadiness: number;  // 0-100
  interviewTypePrediction: {
    technical: {
      score: number;
      strongAreas: string[];
      weakAreas: string[];
      suggestedPrep: string[];
    };
    behavioral: {
      score: number;
      storyQuality: number;
      leadershipExamples: string[];
      suggestedScenarios: string[];
    };
    cultural: {
      score: number;
      fitIndicators: string[];
      riskAreas: string[];
      companyResearchAreas: string[];
    };
  };
  interviewSuccess: {
    probabilityOfOffer: number;
    salaryNegotiationPower: 'strong' | 'moderate' | 'weak';
    timelineExpectation: string;
  };
}

export class InterviewReadinessEngine {
  async predictInterviewSuccess(
    resumeAnalysis: RevolutionaryScoring,
    jobDescription: string,
    companyProfile?: CompanyProfile,
    industryIntel?: IndustryIntelligence
  ): Promise<InterviewReadinessResult> {
    
    const prompt = `
You are a senior interview coach and hiring manager. Predict this candidate's interview readiness:

CANDIDATE DATA: ${JSON.stringify(resumeAnalysis, null, 2)}
JOB DESCRIPTION: ${jobDescription}
COMPANY PROFILE: ${JSON.stringify(companyProfile, null, 2)}
INDUSTRY: ${industryIntel?.industryDetection.primary || 'General'}

Analyze interview readiness across three dimensions:

1. TECHNICAL READINESS:
   - Can they pass technical screening?
   - Depth vs breadth of knowledge
   - Problem-solving ability indicators
   - Communication of technical concepts

2. BEHAVIORAL READINESS:
   - Quality of potential STAR method stories
   - Leadership and collaboration examples
   - Conflict resolution experience
   - Growth mindset indicators

3. CULTURAL READINESS:
   - Alignment with company values
   - Communication style fit
   - Team collaboration indicators
   - Long-term fit potential

4. SUCCESS PREDICTION:
   - Overall probability of receiving offer
   - Salary negotiation position
   - Timeline to decision

Return ONLY JSON:
{
  "overallReadiness": 78,
  "interviewTypePrediction": {
    "technical": {
      "score": 85,
      "strongAreas": ["React architecture", "System design", "Problem solving"],
      "weakAreas": ["Database optimization", "Security best practices"],
      "suggestedPrep": [
        "Review database indexing strategies",
        "Practice system design for scale",
        "Study OAuth and security patterns"
      ]
    },
    "behavioral": {
      "score": 72,
      "storyQuality": 68,
      "leadershipExamples": ["Led team of 5 developers", "Mentored junior developers"],
      "suggestedScenarios": [
        "Describe a time you had to make a difficult technical decision",
        "Tell me about a conflict with a teammate and how you resolved it",
        "Share an example of when you failed and what you learned"
      ]
    },
    "cultural": {
      "score": 80,
      "fitIndicators": ["Collaborative language", "Growth mindset", "Innovation focus"],
      "riskAreas": ["May prefer more structure than startup offers"],
      "companyResearchAreas": [
        "Recent product launches and technical challenges",
        "Engineering blog posts and technical philosophy",
        "Team structure and collaboration tools"
      ]
    }
  },
  "interviewSuccess": {
    "probabilityOfOffer": 73,
    "salaryNegotiationPower": "moderate",
    "timelineExpectation": "2-3 weeks from initial screen to offer"
  }
}
    `;

    const result = await this.callGemini(prompt);
    return JSON.parse(result);
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}
WHERE TO IMPLEMENT: Add to /lib/prediction/ directory
WHY IMPLEMENT: Interview prediction is unique - helps candidates prepare strategically

4.2 Salary Negotiation Intelligence
File: /lib/prediction/salary-negotiation.ts
typescriptinterface SalaryNegotiationIntel {
  negotiationStrength: 'strong' | 'moderate' | 'weak';
  leveragePoints: string[];
  marketValue: {
    conservative: number;
    market: number;
    aggressive: number;
    equity: string;
  };
  negotiationStrategy: {
    timing: string;
    approach: string;
    keyPoints: string[];
    counterOfferStrategy: string[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export class SalaryNegotiationEngine {
  async calculateNegotiationPower(
    resumeAnalysis: RevolutionaryScoring,
    jobDescription: string,
    marketIntel: MarketIntelligenceData,
    companyProfile?: CompanyProfile
  ): Promise<SalaryNegotiationIntel> {
    
    const prompt = `
You are a salary negotiation expert and compensation consultant. Analyze this candidate's negotiation position:

CANDIDATE ANALYSIS: ${JSON.stringify(resumeAnalysis, null, 2)}
JOB DESCRIPTION: ${jobDescription}
MARKET DATA: ${JSON.stringify(marketIntel, null, 2)}
COMPANY PROFILE: ${JSON.stringify(companyProfile, null, 2)}

Provide salary negotiation intelligence:

1. NEGOTIATION STRENGTH:
   - How strong is their position?
   - What gives them leverage?
   - What weakens their position?

2. MARKET VALUE CALCULATION:
   - Conservative estimate (likely floor)
   - Market rate (fair value)
   - Aggressive ask (stretch goal)
   - Equity considerations

3. NEGOTIATION STRATEGY:
   - When to negotiate (timing)
   - How to approach (style/method)
   - Key points to emphasize
   - Counter-offer strategy

4. RISK ASSESSMENT:
   - Risk of pushing too hard
   - Company's likely flexibility
   - Market conditions impact

Consider:
- Current market demand for their skills
- Company size and funding stage
- Role criticality and urgency
- Candidate's unique value proposition
- Geographic and remote factors

Return ONLY JSON:
{
  "negotiationStrength": "moderate",
  "leveragePoints": [
    "Strong React/TypeScript skills in high demand",
    "Full-stack expertise reduces hiring needs",
    "Proven leadership experience",
    "Quantified achievements showing ROI"
  ],
  "marketValue": {
    "conservative": 95000,
    "market": 110000,
    "aggressive": 130000,
    "equity": "0.1-0.25% for mid-level at this stage startup"
  },
  "negotiationStrategy": {
    "timing": "After verbal offer, before written acceptance",
    "approach": "Collaborative problem-solving rather than adversarial",
    "keyPoints": [
      "Market rate research and data",
      "Unique combination of skills",
      "Immediate impact potential",
      "Long-term growth trajectory"
    ],
    "counterOfferStrategy": [
      "If base is low, ask for higher equity or signing bonus",
      "Negotiate flexible work arrangements as additional value",
      "Request accelerated review cycle for early promotion"
    ]
  },
  "riskAssessment": {
    "level": "low",
    "factors": [
      "Strong candidate market currently",
      "Company appears well-funded",
      "Skills are in high demand",
      "Professional approach reduces risk"
    ]
  }
}
    `;

    const result = await this.callGemini(prompt);
    return JSON.parse(result);
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}
WHERE TO IMPLEMENT: Add to /lib/prediction/ directory
WHY IMPLEMENT: Salary negotiation intelligence is incredibly valuable - helps users maximize compensation

4.3 Career Trajectory Optimizer
File: /lib/prediction/career-trajectory.ts
typescriptinterface CareerTrajectoryAnalysis {
  currentLevel: {
    assessment: string;
    percentile: number;
    strengths: string[];
    gaps: string[];
  };
  
  nextLogicalRoles: Array<{
    title: string;
    timeframe: string;
    probability: number;
    requirements: string[];
    salaryRange: [number, number];
  }>;
  
  skillGapsForPromotion: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    timeToAcquire: string;
    learningResources: string[];
  }>;
  
  industryOutlook: {
    growthForecast: 'expanding' | 'stable' | 'contracting';
    automationRisk: number; // 0-100
    emergingOpportunities: string[];
    skillEvolution: string[];
  };
  
  careerStrategies: {
    shortTerm: string[]; // Next 1-2 years
    longTerm: string[];  // 3-5 years
    alternativePaths: string[];
  };
}

export class CareerTrajectoryEngine {
  async analyzeFutureGrowth(
    resumeAnalysis: RevolutionaryScoring,
    industryIntel: IndustryIntelligence,
    marketIntel: MarketIntelligenceData,
    currentRole?: string
  ): Promise<CareerTrajectoryAnalysis> {
    
    const prompt = `
You are a senior career counselor and industry analyst. Analyze this candidate's career trajectory:

CANDIDATE ANALYSIS: ${JSON.stringify(resumeAnalysis, null, 2)}
INDUSTRY INTELLIGENCE: ${JSON.stringify(industryIntel, null, 2)}
MARKET DATA: ${JSON.stringify(marketIntel, null, 2)}
CURRENT ROLE: ${currentRole || 'Unknown'}

Provide comprehensive career trajectory analysis:

1. CURRENT LEVEL ASSESSMENT:
   - Where are they now in career progression?
   - What percentile compared to peers?
   - Key strengths and gaps for advancement

2. NEXT LOGICAL ROLES:
   - What roles are natural next steps?
   - Timeline and probability for each
   - Requirements and salary expectations

3. SKILL GAPS ANALYSIS:
   - What skills needed for promotion?
   - Priority and time investment required
   - Learning resources and strategies

4. INDUSTRY OUTLOOK:
   - Growth forecast for this field
   - Automation/AI replacement risk
   - Emerging opportunities and threats
   - How skills will evolve

5. STRATEGIC RECOMMENDATIONS:
   - Short-term actions (1-2 years)
   - Long-term strategy (3-5 years)
   - Alternative career paths to consider

Consider current market trends, technological changes, and career patterns in this industry.

Return ONLY JSON:
{
  "currentLevel": {
    "assessment": "Mid-level software engineer with strong technical skills but limited leadership experience",
    "percentile": 72,
    "strengths": ["Strong technical skills", "Full-stack expertise", "Good problem-solving"],
    "gaps": ["Leadership experience", "Architecture design", "Stakeholder management"]
  },
  "nextLogicalRoles": [
    {
      "title": "Senior Software Engineer",
      "timeframe": "12-18 months",
      "probability": 85,
      "requirements": ["Advanced system design", "Mentoring experience", "Architecture decisions"],
      "salaryRange": [120000, 150000]
    },
    {
      "title": "Technical Lead",
      "timeframe": "2-3 years",
      "probability": 65,
      "requirements": ["Team leadership", "Technical strategy", "Cross-team collaboration"],
      "salaryRange": [140000, 180000]
    }
  ],
  "skillGapsForPromotion": [
    {
      "skill": "System Architecture",
      "importance": "critical",
      "timeToAcquire": "6-12 months",
      "learningResources": ["System Design courses", "Architecture books", "Senior mentorship"]
    },
    {
      "skill": "Team Leadership",
      "importance": "important",
      "timeToAcquire": "12-24 months",
      "learningResources": ["Leadership training", "Mentoring junior developers", "Project management"]
    }
  ],
  "industryOutlook": {
    "growthForecast": "expanding",
    "automationRisk": 25,
    "emergingOpportunities": ["AI/ML integration", "Edge computing", "Blockchain applications"],
    "skillEvolution": ["More AI integration", "Cloud-native development", "Security-first mindset"]
  },
  "careerStrategies": {
    "shortTerm": [
      "Take on system design responsibilities",
      "Mentor junior developers",
      "Lead a small project or feature"
    ],
    "longTerm": [
      "Develop technical strategy skills",
      "Build stakeholder management experience",
      "Consider specialization in AI/ML or architecture"
    ],
    "alternativePaths": [
      "Product Engineering (technical + business)",
      "DevOps/SRE (infrastructure focus)",
      "Technical Consulting (client-facing)"
    ]
  }
}
    `;

    const result = await this.callGemini(prompt);
    return JSON.parse(result);
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}
WHERE TO IMPLEMENT: Add to /lib/prediction/ directory
WHY IMPLEMENT: Career planning intelligence is unique long-term value - helps users strategize their future

🎯 PHASE 5: ADVANCED UI/UX IMPLEMENTATION
Timeline: Month 5-6 | Priority: HIGH
WHAT TO IMPLEMENT:
5.1 Revolutionary Results Dashboard
File: /components/advanced/AdvancedResultsDashboard.tsx
typescript'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  Award,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Radar
} from 'lucide-react';

interface AdvancedResultsProps {
  scanId: string;
  results: {
    // Basic scores (existing)
    overallScore: number;
    matchRate: number;
    searchability: number;
    atsCompatibility: number;
    
    // NEW: Advanced Analysis
    skillRelevancy: any;
    careerTrajectory: any;
    impactScore: any;
    recruiterAppeal: any;
    redFlags: any;
    
    // NEW: Predictions
    hireProbability: any;
    interviewReadiness: any;
    salaryNegotiation: any;
    
    // NEW: Intelligence
    industryIntel: any;
    marketPosition: any;
    companyOptimization?: any;
  };
}

export const AdvancedResultsDashboard: React.FC<AdvancedResultsProps> = ({ 
  scanId, 
  results 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'intelligence' | 'strategy'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30">
            <Brain className="w-6 h-6 text-blue-400" />
            <span className="text-blue-300 font-medium">Advanced AI Analysis Complete</span>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Your Career Intelligence Report
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            The world's first AI-powered career analysis that predicts your hiring success, 
            optimizes for specific companies, and maps your future growth trajectory.
          </p>
        </motion.div>

        {/* Main Score Circle */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        >
          <div className="relative">
            <svg width="300" height="300" className="transform -rotate-90">
              <circle
                cx="150"
                cy="150"
                r="120"
                stroke="rgba(100, 116, 139, 0.3)"
                strokeWidth="20"
                fill="transparent"
              />
              <motion.circle
                cx="150"
                cy="150"
                r="120"
                stroke="url(#gradient)"
                strokeWidth="20"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - results.overallScore / 100)}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - results.overallScore / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {results.overallScore}
                </div>
                <div className="text-slate-300 text-lg">Overall Score</div>
                <div className="text-sm text-slate-400 mt-2">
                  {results.overallScore >= 80 ? 'Excellent' : 
                   results.overallScore >= 70 ? 'Good' : 
                   results.overallScore >= 60 ? 'Fair' : 'Needs Improvement'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-2 border border-slate-700/50">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'predictions', label: 'Predictions', icon: TrendingUp },
              { id: 'intelligence', label: 'Intelligence', icon: Brain },
              { id: 'strategy', label: 'Strategy', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab results={results} />
          )}
          {activeTab === 'predictions' && (
            <PredictionsTab results={results} />
          )}
          {activeTab === 'intelligence' && (
            <IntelligenceTab results={results} />
          )}
          {activeTab === 'strategy' && (
            <StrategyTab results={results} />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ results: any }> = ({ results }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
  >
    {/* Core Metrics */}
    {[
      { label: 'Match Rate', value: results.matchRate, icon: Target, color: 'blue' },
      { label: 'ATS Compatible', value: results.atsCompatibility, icon: Award, color: 'green' },
      { label: 'Searchability', value: results.searchability, icon: TrendingUp, color: 'purple' },
      { label: 'Hire Probability', value: results.hireProbability?.probability || 0, icon: Users, color: 'pink' }
    ].map((metric, index) => (
      <motion.div
        key={metric.label}
        className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <metric.icon className={`w-8 h-8 text-${metric.color}-400`} />
          <span className={`text-3xl font-bold text-${metric.color}-400`}>
            {metric.value}%
          </span>
        </div>
        <h3 className="text-slate-300 font-medium">{metric.label}</h3>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
          <motion.div
            className={`h-2 bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${metric.value}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
          />
        </div>
      </motion.div>
    ))}

    {/* Skills Analysis */}
    <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Radar className="w-6 h-6 text-blue-400" />
        Skill Relevancy Analysis
      </h3>
      
      {results.skillRelevancy?.contextualMatches?.slice(0, 5).map((skill: any, index: number) => (
        <div key={index} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0">
          <div>
            <span className="text-white font-medium">{skill.skillName}</span>
            <div className="text-sm text-slate-400 mt-1">
              Impact Level: <span className={`capitalize text-${skill.impactLevel === 'high' ? 'green' : skill.impactLevel === 'medium' ? 'yellow' : 'red'}-400`}>
                {skill.impactLevel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bol2 / 2RetryClaude does not have the ability to run the code it generates yet.AContinueEdittypescript           <div className="text-lg font-bold text-blue-400">
             {(skill.relevancyMultiplier * 10).toFixed(0)}%
           </div>
           <div className="text-xs text-slate-500">Relevancy</div>
         </div>
       </div>
     ))}
   </div>

   {/* Red Flags Alert */}
   {results.redFlags?.flags?.length > 0 && (
     <div className="xl:col-span-2 bg-red-900/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
       <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
         <AlertTriangle className="w-6 h-6" />
         Areas for Attention
       </h3>
       {results.redFlags.flags.map((flag: string, index: number) => (
         <div key={index} className="flex items-start gap-3 py-2">
           <AlertTriangle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
           <span className="text-red-200">{flag}</span>
         </div>
       ))}
     </div>
   )}
 </motion.div>
);

// Predictions Tab Component
const PredictionsTab: React.FC<{ results: any }> = ({ results }) => (
 <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   exit={{ opacity: 0, y: -20 }}
   transition={{ duration: 0.5 }}
   className="space-y-6"
 >
   {/* Hire Probability Section */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <TrendingUp className="w-8 h-8 text-green-400" />
       Hire Probability Analysis
     </h3>
     
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
       <div className="text-center">
         <div className="text-4xl font-bold text-green-400 mb-2">
           {results.hireProbability?.probability || 0}%
         </div>
         <div className="text-slate-300">Hire Probability</div>
         <div className="text-sm text-slate-500 mt-1">
           Range: {results.hireProbability?.confidenceInterval?.[0] || 0}% - {results.hireProbability?.confidenceInterval?.[1] || 0}%
         </div>
       </div>
       
       <div className="text-center">
         <div className="text-4xl font-bold text-blue-400 mb-2">
           {results.hireProbability?.interviewProbability || 0}%
         </div>
         <div className="text-slate-300">Interview Likelihood</div>
         <div className="text-sm text-slate-500 mt-1">First round screening</div>
       </div>
       
       <div className="text-center">
         <div className="text-3xl font-bold text-purple-400 mb-2">
           ${results.hireProbability?.salaryRange?.[0]?.toLocaleString() || 0}k - ${results.hireProbability?.salaryRange?.[1]?.toLocaleString() || 0}k
         </div>
         <div className="text-slate-300">Expected Salary</div>
         <div className="text-sm text-slate-500 mt-1">Market rate estimate</div>
       </div>
     </div>

     {/* Reasoning */}
     <div className="bg-slate-700/30 rounded-xl p-4">
       <h4 className="font-semibold text-white mb-3">Why this prediction?</h4>
       <div className="space-y-2">
         {results.hireProbability?.reasoning?.map((reason: string, index: number) => (
           <div key={index} className="flex items-start gap-2">
             <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
             <span className="text-slate-300">{reason}</span>
           </div>
         ))}
       </div>
     </div>
   </div>

   {/* Interview Readiness */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <Calendar className="w-8 h-8 text-blue-400" />
       Interview Readiness Assessment
     </h3>
     
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       {[
         { 
           type: 'Technical', 
           score: results.interviewReadiness?.interviewTypePrediction?.technical?.score || 0,
           color: 'blue',
           icon: Brain
         },
         { 
           type: 'Behavioral', 
           score: results.interviewReadiness?.interviewTypePrediction?.behavioral?.score || 0,
           color: 'purple',
           icon: Users
         },
         { 
           type: 'Cultural', 
           score: results.interviewReadiness?.interviewTypePrediction?.cultural?.score || 0,
           color: 'green',
           icon: Award
         }
       ].map((category) => (
         <div key={category.type} className="text-center">
           <div className="mb-4">
             <category.icon className={`w-12 h-12 text-${category.color}-400 mx-auto mb-2`} />
             <div className={`text-3xl font-bold text-${category.color}-400`}>
               {category.score}%
             </div>
             <div className="text-slate-300 font-medium">{category.type}</div>
           </div>
           
           <div className="w-full bg-slate-700 rounded-full h-3">
             <motion.div
               className={`h-3 bg-gradient-to-r from-${category.color}-500 to-${category.color}-400 rounded-full`}
               initial={{ width: 0 }}
               animate={{ width: `${category.score}%` }}
               transition={{ duration: 1 }}
             />
           </div>
         </div>
       ))}
     </div>

     {/* Interview Prep Suggestions */}
     <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
       {results.interviewReadiness?.interviewTypePrediction?.technical?.suggestedPrep?.slice(0, 3).map((prep: string, index: number) => (
         <div key={index} className="bg-slate-700/50 rounded-lg p-4">
           <div className="text-blue-400 font-medium mb-2">Technical Prep</div>
           <div className="text-sm text-slate-300">{prep}</div>
         </div>
       ))}
     </div>
   </div>

   {/* Salary Negotiation Intelligence */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <DollarSign className="w-8 h-8 text-green-400" />
       Salary Negotiation Intelligence
     </h3>
     
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Your Market Value</h4>
         <div className="space-y-3">
           <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
             <span className="text-slate-300">Conservative</span>
             <span className="font-bold text-red-400">
               ${results.salaryNegotiation?.marketValue?.conservative?.toLocaleString() || 0}
             </span>
           </div>
           <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg border-l-4 border-green-400">
             <span className="text-slate-300">Market Rate</span>
             <span className="font-bold text-green-400">
               ${results.salaryNegotiation?.marketValue?.market?.toLocaleString() || 0}
             </span>
           </div>
           <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
             <span className="text-slate-300">Aggressive</span>
             <span className="font-bold text-blue-400">
               ${results.salaryNegotiation?.marketValue?.aggressive?.toLocaleString() || 0}
             </span>
           </div>
         </div>
       </div>
       
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Negotiation Strategy</h4>
         <div className="space-y-4">
           <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
             results.salaryNegotiation?.negotiationStrength === 'strong' ? 'bg-green-900/30 text-green-400' :
             results.salaryNegotiation?.negotiationStrength === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
             'bg-red-900/30 text-red-400'
           }`}>
             {results.salaryNegotiation?.negotiationStrength?.toUpperCase() || 'MODERATE'} Position
           </div>
           
           <div className="bg-slate-700/30 rounded-lg p-4">
             <div className="font-medium text-white mb-2">Key Leverage Points:</div>
             <ul className="space-y-1">
               {results.salaryNegotiation?.leveragePoints?.slice(0, 3).map((point: string, index: number) => (
                 <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                   <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                   {point}
                 </li>
               ))}
             </ul>
           </div>
         </div>
       </div>
     </div>
   </div>
 </motion.div>
);

// Intelligence Tab Component
const IntelligenceTab: React.FC<{ results: any }> = ({ results }) => (
 <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   exit={{ opacity: 0, y: -20 }}
   transition={{ duration: 0.5 }}
   className="space-y-6"
 >
   {/* Industry Intelligence */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <Brain className="w-8 h-8 text-purple-400" />
       Industry Intelligence Analysis
     </h3>
     
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="text-center">
         <div className="text-xl font-bold text-purple-400 mb-2">
           {results.industryIntel?.industryDetection?.primary || 'Unknown'}
         </div>
         <div className="text-slate-300">Primary Industry</div>
         <div className="text-sm text-slate-500 mt-1">
           {Math.round((results.industryIntel?.industryDetection?.confidence || 0) * 100)}% confidence
         </div>
       </div>
       
       <div className="text-center">
         <div className="text-xl font-bold text-blue-400 mb-2">
           {results.marketPosition?.percentile || 0}th
         </div>
         <div className="text-slate-300">Percentile</div>
         <div className="text-sm text-slate-500 mt-1">Among all candidates</div>
       </div>
       
       <div className="text-center">
         <div className="text-xl font-bold text-green-400 mb-2">
           {results.industryIntel?.industryDetection?.secondary?.length || 0}
         </div>
         <div className="text-slate-300">Specializations</div>
         <div className="text-sm text-slate-500 mt-1">
           {results.industryIntel?.industryDetection?.secondary?.join(', ') || 'None'}
         </div>
       </div>
     </div>
   </div>

   {/* Market Position */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <BarChart3 className="w-8 h-8 text-blue-400" />
       Competitive Market Position
     </h3>
     
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Your Advantages</h4>
         <div className="space-y-3">
           {results.marketPosition?.competitorAnalysis?.yourAdvantages?.map((advantage: string, index: number) => (
             <div key={index} className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
               <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
               <span className="text-green-100">{advantage}</span>
             </div>
           ))}
         </div>
       </div>
       
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Areas to Improve</h4>
         <div className="space-y-3">
           {results.marketPosition?.competitorAnalysis?.yourWeaknesses?.map((weakness: string, index: number) => (
             <div key={index} className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
               <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
               <span className="text-red-100">{weakness}</span>
             </div>
           ))}
         </div>
       </div>
     </div>
   </div>

   {/* Company Optimization (if available) */}
   {results.companyOptimization && (
     <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
       <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
         <Target className="w-8 h-8 text-pink-400" />
         Company-Specific Optimization
       </h3>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         <div className="text-center">
           <div className="text-3xl font-bold text-pink-400 mb-2">
             {results.companyOptimization.cultureAlignment}%
           </div>
           <div className="text-slate-300">Culture Alignment</div>
         </div>
         
         <div className="text-center">
           <div className="text-3xl font-bold text-blue-400 mb-2">
             {results.companyOptimization.techStackMatch}%
           </div>
           <div className="text-slate-300">Tech Stack Match</div>
         </div>
         
         <div className="text-center">
           <div className="text-3xl font-bold text-green-400 mb-2">
             {results.companyOptimization.backgroundFit}%
           </div>
           <div className="text-slate-300">Background Fit</div>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-slate-700/30 rounded-xl p-4">
           <h4 className="font-semibold text-white mb-3">Resume Adjustments</h4>
           <ul className="space-y-2">
             {results.companyOptimization.recommendations?.resumeAdjustments?.slice(0, 3).map((adjustment: string, index: number) => (
               <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                 <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                 {adjustment}
               </li>
             ))}
           </ul>
         </div>
         
         <div className="bg-slate-700/30 rounded-xl p-4">
           <h4 className="font-semibold text-white mb-3">Interview Preparation</h4>
           <ul className="space-y-2">
             {results.companyOptimization.recommendations?.interviewPrep?.slice(0, 3).map((prep: string, index: number) => (
               <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                 <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                 {prep}
               </li>
             ))}
           </ul>
         </div>
       </div>
     </div>
   )}
 </motion.div>
);

// Strategy Tab Component
const StrategyTab: React.FC<{ results: any }> = ({ results }) => (
 <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   exit={{ opacity: 0, y: -20 }}
   transition={{ duration: 0.5 }}
   className="space-y-6"
 >
   {/* Career Trajectory */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <TrendingUp className="w-8 h-8 text-green-400" />
       Career Growth Strategy
     </h3>
     
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Next Logical Roles</h4>
         <div className="space-y-4">
           {/* This would be populated from career trajectory analysis */}
           <div className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-green-400">
             <div className="flex justify-between items-center mb-2">
               <span className="font-medium text-green-400">Senior Software Engineer</span>
               <span className="text-sm text-slate-400">12-18 months</span>
             </div>
             <div className="text-sm text-slate-300 mb-2">85% probability</div>
             <div className="text-xs text-slate-400">$120k - $150k expected range</div>
           </div>
           
           <div className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-blue-400">
             <div className="flex justify-between items-center mb-2">
               <span className="font-medium text-blue-400">Technical Lead</span>
               <span className="text-sm text-slate-400">2-3 years</span>
             </div>
             <div className="text-sm text-slate-300 mb-2">65% probability</div>
             <div className="text-xs text-slate-400">$140k - $180k expected range</div>
           </div>
         </div>
       </div>
       
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Priority Skills to Develop</h4>
         <div className="space-y-3">
           <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
             <div className="flex justify-between items-center mb-1">
               <span className="text-red-100 font-medium">System Architecture</span>
               <span className="text-xs text-red-400 bg-red-900/40 px-2 py-1 rounded">CRITICAL</span>
             </div>
             <div className="text-sm text-red-200">6-12 months to acquire</div>
           </div>
           
           <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
             <div className="flex justify-between items-center mb-1">
               <span className="text-yellow-100 font-medium">Team Leadership</span>
               <span className="text-xs text-yellow-400 bg-yellow-900/40 px-2 py-1 rounded">IMPORTANT</span>
             </div>
             <div className="text-sm text-yellow-200">12-24 months to acquire</div>
           </div>
         </div>
       </div>
     </div>
   </div>

   {/* Action Plan */}
   <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50">
     <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
       <Target className="w-8 h-8 text-purple-400" />
       Strategic Action Plan
     </h3>
     
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Short-term (1-2 years)</h4>
         <div className="space-y-3">
           {[
             "Take on system design responsibilities",
             "Mentor junior developers",
             "Lead a small project or feature",
             "Get AWS certification"
           ].map((action, index) => (
             <div key={index} className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg">
               <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                 {index + 1}
               </div>
               <span className="text-blue-100">{action}</span>
             </div>
           ))}
         </div>
       </div>
       
       <div>
         <h4 className="text-lg font-semibold text-white mb-4">Long-term (3-5 years)</h4>
         <div className="space-y-3">
           {[
             "Develop technical strategy skills",
             "Build stakeholder management experience",
             "Consider specialization in AI/ML",
             "Transition to engineering management"
           ].map((action, index) => (
             <div key={index} className="flex items-start gap-3 p-3 bg-purple-900/20 rounded-lg">
               <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                 {index + 1}
               </div>
               <span className="text-purple-100">{action}</span>
             </div>
           ))}
         </div>
       </div>
     </div>
   </div>

   {/* Export Options */}
   <div className="text-center">
     <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 inline-block">
       <h4 className="text-lg font-semibold text-white mb-4">Export Your Intelligence Report</h4>
       <div className="flex gap-4 justify-center">
         <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:shadow-lg transition-all duration-300">
           Download PDF Report
         </button>
         <button className="px-6 py-3 bg-slate-700 rounded-xl text-white font-medium hover:bg-slate-600 transition-all duration-300">
           Share Results
         </button>
       </div>
     </div>
   </div>
 </motion.div>
);

export default AdvancedResultsDashboard;
WHERE TO IMPLEMENT: Create new component in /components/advanced/
WHY IMPLEMENT: Revolutionary UI showcases all your advanced features in an engaging, professional way that competitors can't match

🎯 PHASE 6: INTEGRATION & API ENDPOINTS
Timeline: Month 6 | Priority: CRITICAL
WHAT TO IMPLEMENT:
6.1 Master Analysis Controller
File: /app/api/ats/advanced-scan/route.ts
typescriptimport { NextRequest, NextResponse } from 'next/server';
import { AdvancedGeminiAnalyzer } from '@/lib/gemini/advanced-analyzer';
import { IndustryIntelligenceEngine } from '@/lib/intelligence/industry-analyzer';
import { HireProbabilityEngine } from '@/lib/prediction/hire-probability';
import { MarketIntelligenceEngine } from '@/lib/market/intelligence-engine';
import { CompanyIntelligenceEngine } from '@/lib/company/intelligence-scraper';
import { InterviewReadinessEngine } from '@/lib/prediction/interview-readiness';
import { SalaryNegotiationEngine } from '@/lib/prediction/salary-negotiation';
import { CareerTrajectoryEngine } from '@/lib/prediction/career-trajectory';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription, companyName } = await request.json();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const decodedToken = await auth.verifyIdToken(token!);
    const userId = decodedToken.uid;

    // Initialize all engines
    const geminiAnalyzer = new AdvancedGeminiAnalyzer();
    const industryEngine = new IndustryIntelligenceEngine();
    const hireProbEngine = new HireProbabilityEngine();
    const marketEngine = new MarketIntelligenceEngine();
    const companyEngine = new CompanyIntelligenceEngine();
    const interviewEngine = new InterviewReadinessEngine();
    const salaryEngine = new SalaryNegotiationEngine();
    const careerEngine = new CareerTrajectoryEngine();

    // Step 1: Advanced Gemini Analysis
    console.log('🧠 Starting Advanced AI Analysis...');
    const revolutionaryScoring = await geminiAnalyzer.performAdvancedAnalysis({
      resumeText,
      jobDescription
    });

    // Step 2: Industry Intelligence Detection
    console.log('🏭 Detecting Industry Intelligence...');
    const industryIntel = await industryEngine.detectIndustry(resumeText, jobDescription);

    // Step 3: Company Intelligence (if provided)
    let companyProfile = null;
    let companyOptimization = null;
    if (companyName) {
      console.log('🏢 Gathering Company Intelligence...');
      companyProfile = await companyEngine.getCompanyProfile(companyName);
      companyOptimization = await companyEngine.optimizeForCompany(
        revolutionaryScoring,
        companyProfile,
        jobDescription
      );
    }

    // Step 4: Market Intelligence Analysis
    console.log('📈 Analyzing Market Position...');
    const skillsList = revolutionaryScoring.skillRelevancy.contextualMatches.map(m => m.skillName);
    const marketAdjustedScore = await marketEngine.getMarketAdjustedScore(
      85, // Base score calculation
      skillsList,
      industryIntel.industryDetection.primary
    );

    // Step 5: Hire Probability Prediction
    console.log('🎯 Calculating Hire Probability...');
    const hireProbability = await hireProbEngine.calculateHireChance(
      revolutionaryScoring,
      jobDescription,
      industryIntel
    );

    // Step 6: Interview Readiness Assessment
    console.log('📝 Assessing Interview Readiness...');
    const interviewReadiness = await interviewEngine.predictInterviewSuccess(
      revolutionaryScoring,
      jobDescription,
      companyProfile,
      industryIntel
    );

    // Step 7: Salary Negotiation Intelligence
    console.log('💰 Calculating Salary Intelligence...');
    const salaryNegotiation = await salaryEngine.calculateNegotiationPower(
      revolutionaryScoring,
      jobDescription,
      {}, // Market data would be passed here
      companyProfile
    );

    // Step 8: Career Trajectory Analysis
    console.log('🚀 Mapping Career Trajectory...');
    const careerTrajectory = await careerEngine.analyzeFutureGrowth(
      revolutionaryScoring,
      industryIntel,
      {} // Market data would be passed here
    );

    // Step 9: Calculate Overall Advanced Score
    const overallScore = calculateAdvancedOverallScore({
      revolutionaryScoring,
      hireProbability,
      marketAdjustedScore,
      industryIntel
    });

    // Step 10: Save to Database
    const scanResult = await prisma.aTSScanAdvanced.create({
      data: {
        userId,
        overallScore,
        matchRate: hireProbability.probability,
        searchability: marketAdjustedScore.adjustedScore,
        atsCompatibility: revolutionaryScoring.recruiterAppeal.firstImpressionScore,
        
        // Advanced Intelligence Data
        skillRelevancy: revolutionaryScoring.skillRelevancy,
        careerTrajectory: revolutionaryScoring.careerTrajectory,
        impactScore: revolutionaryScoring.impactScore,
        recruiterAppeal: revolutionaryScoring.recruiterAppeal,
        redFlags: revolutionaryScoring.redFlags,
        
        industryDetection: industryIntel.industryDetection,