import { GoogleGenerativeAI } from '@google/generative-ai';
import { RevolutionaryScoring } from '../gemini/advanced-analyzer';
import { IndustryIntelligence } from '../intelligence/industry-analyzer';
import { MarketIntelligenceData } from '../market/intelligence-engine';

interface CareerTrajectoryAnalysis {
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Career trajectory analysis failed:', error);
      return this.fallbackTrajectoryAnalysis(resumeAnalysis, industryIntel);
    }
  }

  private fallbackTrajectoryAnalysis(
    resumeAnalysis: RevolutionaryScoring,
    industryIntel: IndustryIntelligence
  ): CareerTrajectoryAnalysis {
    const skillScore = resumeAnalysis.skillRelevancy.score;
    const careerScore = resumeAnalysis.careerTrajectory.score;
    const percentile = Math.round((skillScore + careerScore) / 2);
    
    return {
      currentLevel: {
        assessment: "Professional with solid technical foundation seeking advancement opportunities",
        percentile,
        strengths: ["Technical competency", "Problem-solving skills", "Industry experience"],
        gaps: ["Leadership development", "Strategic thinking", "Advanced specialization"]
      },
      nextLogicalRoles: [
        {
          title: "Senior Role in Current Field",
          timeframe: "12-18 months",
          probability: 75,
          requirements: ["Advanced technical skills", "Leadership experience", "Domain expertise"],
          salaryRange: [90000, 130000]
        },
        {
          title: "Team Lead / Manager",
          timeframe: "2-3 years",
          probability: 60,
          requirements: ["People management", "Strategic planning", "Cross-functional collaboration"],
          salaryRange: [120000, 160000]
        }
      ],
      skillGapsForPromotion: [
        {
          skill: "Leadership & Management",
          importance: "critical",
          timeToAcquire: "12-18 months",
          learningResources: ["Leadership courses", "Mentoring programs", "Management training"]
        },
        {
          skill: "Strategic Thinking",
          importance: "important",
          timeToAcquire: "6-12 months",
          learningResources: ["Business strategy courses", "Cross-functional projects", "Executive mentoring"]
        },
        {
          skill: "Advanced Technical Specialization",
          importance: "important",
          timeToAcquire: "6-18 months",
          learningResources: ["Certifications", "Advanced courses", "Conference participation"]
        }
      ],
      industryOutlook: {
        growthForecast: "stable",
        automationRisk: 30,
        emergingOpportunities: ["Digital transformation", "AI integration", "Sustainability tech"],
        skillEvolution: ["Hybrid skill sets", "Continuous learning", "Adaptability focus"]
      },
      careerStrategies: {
        shortTerm: [
          "Develop leadership skills through mentoring",
          "Take on larger project responsibilities",
          "Build cross-functional relationships",
          "Pursue relevant certifications"
        ],
        longTerm: [
          "Build strategic business acumen",
          "Develop industry thought leadership",
          "Consider advanced education or specialization",
          "Explore entrepreneurial opportunities"
        ],
        alternativePaths: [
          "Consulting (leveraging expertise)",
          "Product Management (technical + business)",
          "Training & Education (sharing knowledge)",
          "Freelancing/Independent Contracting"
        ]
      }
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}

export type { CareerTrajectoryAnalysis };
