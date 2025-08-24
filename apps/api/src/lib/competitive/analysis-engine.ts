import { GoogleGenerativeAI } from '@google/generative-ai';
import { RevolutionaryScoring } from '../gemini/advanced-analyzer';

interface CompetitiveAnalysis {
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Competitive analysis failed:', error);
      return this.fallbackCompetitiveAnalysis(resumeAnalysis);
    }
  }

  private fallbackCompetitiveAnalysis(resumeAnalysis: RevolutionaryScoring): CompetitiveAnalysis {
    const skillScore = resumeAnalysis.skillRelevancy.score;
    const careerScore = resumeAnalysis.careerTrajectory.score;
    const percentile = Math.round((skillScore + careerScore) / 2);
    
    return {
      marketPosition: {
        percentile,
        compareToHired: {
          similarity: percentile,
          gaps: ["Industry certifications", "Leadership experience"]
        },
        salaryBenchmark: {
          estimatedRange: [80000, 120000],
          factorsInfluencing: ["Technical skills", "Experience level", "Market demand"]
        }
      },
      competitorAnalysis: {
        typicalCandidateProfile: {
          commonSkills: ["JavaScript", "React", "Node.js"],
          averageExperience: 3.5,
          educationPatterns: ["Computer Science", "Self-taught", "Bootcamp"]
        },
        yourAdvantages: ["Strong technical foundation", "Problem-solving abilities"],
        yourWeaknesses: ["Competitive market", "Need more specialization"],
        improvementPriority: [
          {
            skill: "Cloud Platforms",
            impact: "high",
            timeToAcquire: "months",
            marketDemand: 85
          },
          {
            skill: "System Design",
            impact: "high",
            timeToAcquire: "months",
            marketDemand: 80
          }
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

export type { CompetitiveAnalysis };
