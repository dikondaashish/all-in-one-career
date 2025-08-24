import { GoogleGenerativeAI } from '@google/generative-ai';
import { RevolutionaryScoring } from '../gemini/advanced-analyzer';
import { IndustryIntelligence } from '../intelligence/industry-analyzer';

interface CompanyProfile {
  companyName: string;
  domain?: string;
  industry: string;
  size: string;
  cultureKeywords: string[];
  techStack: string[];
}

interface InterviewReadinessResult {
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Interview readiness prediction failed:', error);
      return this.fallbackReadinessAssessment(resumeAnalysis);
    }
  }

  private fallbackReadinessAssessment(resumeAnalysis: RevolutionaryScoring): InterviewReadinessResult {
    const technicalScore = resumeAnalysis.skillRelevancy.score;
    const behavioralScore = resumeAnalysis.recruiterAppeal.storytellingQuality;
    const culturalScore = resumeAnalysis.recruiterAppeal.cultureAlignmentSignals;
    const overallReadiness = Math.round((technicalScore + behavioralScore + culturalScore) / 3);

    return {
      overallReadiness,
      interviewTypePrediction: {
        technical: {
          score: technicalScore,
          strongAreas: ["Technical problem solving", "Relevant experience"],
          weakAreas: ["Areas requiring deeper preparation"],
          suggestedPrep: [
            "Review fundamental concepts in your field",
            "Practice coding problems or case studies",
            "Prepare to explain your past projects in detail"
          ]
        },
        behavioral: {
          score: behavioralScore,
          storyQuality: behavioralScore,
          leadershipExamples: ["Leadership experience from resume"],
          suggestedScenarios: [
            "Describe a challenging project you completed",
            "Tell me about a time you had to learn something new quickly",
            "Share an example of working with a difficult team member"
          ]
        },
        cultural: {
          score: culturalScore,
          fitIndicators: ["Professional communication", "Team collaboration"],
          riskAreas: ["Cultural fit assessment needed"],
          companyResearchAreas: [
            "Company mission and values",
            "Recent news and developments",
            "Team structure and work environment"
          ]
        }
      },
      interviewSuccess: {
        probabilityOfOffer: overallReadiness,
        salaryNegotiationPower: overallReadiness > 80 ? 'strong' : overallReadiness > 60 ? 'moderate' : 'weak',
        timelineExpectation: "2-4 weeks typical hiring process"
      }
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const geminiResult = await model.generateContent(prompt);
    return geminiResult.response.text();
  }
}

export type { InterviewReadinessResult };
