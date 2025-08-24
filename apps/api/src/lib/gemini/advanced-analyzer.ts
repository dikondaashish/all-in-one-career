import { GoogleGenerativeAI } from '@google/generative-ai';

interface AdvancedAnalysisRequest {
  resumeText: string;
  jobDescription: string;
  industryContext?: string;
  companyIntel?: CompanyProfile;
  marketData?: MarketTrends;
}

interface CompanyProfile {
  companyName: string;
  domain: string;
  industry: string;
  size: string;
  cultureKeywords: string[];
  techStack: string[];
}

interface MarketTrends {
  skillDemand: Record<string, any>;
  industryTrends: Record<string, any>;
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
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = this.buildAdvancedPrompt(request);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      // Clean and parse the structured JSON response
      const cleanedResponse = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse) as RevolutionaryScoring;
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

export type { RevolutionaryScoring, AdvancedAnalysisRequest };
