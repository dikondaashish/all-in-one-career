import { GoogleGenerativeAI } from '@google/generative-ai';
import { RevolutionaryScoring } from '../gemini/advanced-analyzer';
import { IndustryIntelligence } from '../intelligence/industry-analyzer';

interface HireProbabilityResult {
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Hire probability calculation failed:', error);
      return this.fallbackCalculation(resumeAnalysis, industryIntel);
    }
  }

  private fallbackCalculation(
    resumeAnalysis: RevolutionaryScoring,
    industryIntel: IndustryIntelligence
  ): HireProbabilityResult {
    // Basic calculation based on available data
    const skillsMatch = resumeAnalysis.skillRelevancy.score;
    const experienceLevel = resumeAnalysis.careerTrajectory.score;
    const culturalFit = resumeAnalysis.recruiterAppeal.cultureAlignmentSignals;
    const redFlagsPenalty = resumeAnalysis.redFlags.flags.length * -10;
    
    const probability = Math.min(100, Math.max(0, 
      (skillsMatch * 0.3) + 
      (experienceLevel * 0.25) + 
      (culturalFit * 0.2) + 
      redFlagsPenalty + 
      (resumeAnalysis.impactScore.leadershipEvidence * 0.1)
    ));

    return {
      probability: Math.round(probability),
      confidenceInterval: [Math.round(probability - 5), Math.round(probability + 5)],
      calculation: {
        skillsMatch,
        experienceLevel,
        culturalFit,
        overqualification: 0,
        redFlags: redFlagsPenalty,
        xFactor: resumeAnalysis.impactScore.leadershipEvidence
      },
      reasoning: [
        "Calculated based on skills alignment",
        "Experience level appears appropriate",
        "Cultural fit indicators present",
        resumeAnalysis.redFlags.flags.length > 0 ? "Some areas of concern detected" : "No major red flags"
      ],
      interviewProbability: Math.round(probability * 1.1),
      salaryRange: [80000, 120000]
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}

export type { HireProbabilityResult };
