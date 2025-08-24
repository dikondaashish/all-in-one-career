import { GoogleGenerativeAI } from '@google/generative-ai';
import { RevolutionaryScoring } from '../gemini/advanced-analyzer';
import { MarketIntelligenceData } from '../market/intelligence-engine';

interface CompanyProfile {
  companyName: string;
  domain?: string;
  industry: string;
  size: string;
  cultureKeywords: string[];
  techStack: string[];
}

interface SalaryNegotiationIntel {
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Salary negotiation calculation failed:', error);
      return this.fallbackNegotiationAnalysis(resumeAnalysis);
    }
  }

  private fallbackNegotiationAnalysis(resumeAnalysis: RevolutionaryScoring): SalaryNegotiationIntel {
    const skillScore = resumeAnalysis.skillRelevancy.score;
    const leadershipEvidence = resumeAnalysis.impactScore.leadershipEvidence;
    const redFlags = resumeAnalysis.redFlags.flags.length;

    let strength: 'strong' | 'moderate' | 'weak' = 'moderate';
    if (skillScore > 85 && leadershipEvidence > 75 && redFlags === 0) {
      strength = 'strong';
    } else if (skillScore < 60 || redFlags > 2) {
      strength = 'weak';
    }

    const baseSalary = skillScore > 80 ? 100000 : skillScore > 60 ? 85000 : 70000;
    const range = strength === 'strong' ? 20000 : strength === 'moderate' ? 15000 : 10000;

    return {
      negotiationStrength: strength,
      leveragePoints: [
        "Technical skills align with market demand",
        leadershipEvidence > 60 ? "Demonstrated leadership experience" : "Individual contributor strength",
        resumeAnalysis.impactScore.quantificationQuality > 70 ? "Quantified achievements" : "Relevant experience",
        "Professional background and career progression"
      ],
      marketValue: {
        conservative: baseSalary - range,
        market: baseSalary,
        aggressive: baseSalary + range,
        equity: strength === 'strong' ? "0.15-0.35%" : strength === 'moderate' ? "0.05-0.20%" : "0.01-0.10%"
      },
      negotiationStrategy: {
        timing: "After receiving initial offer",
        approach: strength === 'strong' ? "Confident but collaborative" : "Grateful and research-backed",
        keyPoints: [
          "Market research and comparable roles",
          "Unique value proposition",
          "Long-term commitment and growth potential"
        ],
        counterOfferStrategy: [
          "Focus on total compensation package",
          "Consider non-salary benefits",
          "Propose performance-based increases"
        ]
      },
      riskAssessment: {
        level: strength === 'strong' ? 'low' : strength === 'moderate' ? 'medium' : 'high',
        factors: [
          `Negotiation strength assessed as ${strength}`,
          redFlags > 0 ? "Some potential concerns in background" : "Clean professional history",
          "Market conditions and role demand",
          "Company's hiring urgency and budget flexibility"
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

export type { SalaryNegotiationIntel };
