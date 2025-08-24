import { GoogleGenerativeAI } from '@google/generative-ai';

interface MarketIntelligenceData {
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

interface MarketAdjustedResult {
  adjustedScore: number;
  marketFactors: {
    skillDemandBonus: number;
    competitionPenalty: number;
    locationBonus: number;
    trendingSkillsBonus: number;
  };
  recommendations: string[];
}

export class MarketIntelligenceEngine {
  private marketData: MarketIntelligenceData = {
    skillDemand: {},
    industryTrends: {},
    locationFactors: {}
  };
  
  async getMarketAdjustedScore(
    baseScore: number, 
    skills: string[], 
    industry: string,
    location?: string
  ): Promise<MarketAdjustedResult> {
    
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Market adjustment failed:', error);
      return this.fallbackMarketAdjustment(baseScore, skills);
    }
  }

  private async updateMarketData(): Promise<void> {
    // In production, this would call real market intelligence APIs
    // For now, simulate with realistic data
    
    this.marketData = {
      skillDemand: {
        'AI/ML': { demand: 'hot', growthRate: 300, averageSalary: 150000, jobOpenings: 50000 },
        'React': { demand: 'hot', growthRate: 25, averageSalary: 95000, jobOpenings: 25000 },
        'Python': { demand: 'hot', growthRate: 40, averageSalary: 105000, jobOpenings: 35000 },
        'JavaScript': { demand: 'stable', growthRate: 10, averageSalary: 90000, jobOpenings: 45000 },
        'Node.js': { demand: 'hot', growthRate: 30, averageSalary: 100000, jobOpenings: 20000 },
        'AWS': { demand: 'hot', growthRate: 45, averageSalary: 110000, jobOpenings: 30000 },
        'Docker': { demand: 'hot', growthRate: 35, averageSalary: 105000, jobOpenings: 15000 },
        'Kubernetes': { demand: 'hot', growthRate: 50, averageSalary: 120000, jobOpenings: 12000 },
        'TypeScript': { demand: 'hot', growthRate: 60, averageSalary: 105000, jobOpenings: 18000 },
        'Vue.js': { demand: 'stable', growthRate: 15, averageSalary: 85000, jobOpenings: 8000 },
        'Angular': { demand: 'stable', growthRate: 5, averageSalary: 90000, jobOpenings: 12000 },
        'jQuery': { demand: 'declining', growthRate: -15, averageSalary: 75000, jobOpenings: 5000 },
        'Flash': { demand: 'declining', growthRate: -90, averageSalary: 60000, jobOpenings: 100 },
        'PHP': { demand: 'stable', growthRate: -5, averageSalary: 80000, jobOpenings: 15000 }
      },
      industryTrends: {
        'Software Engineering': {
          hiringVolume: 125000,
          salaryTrend: 'increasing',
          competitionLevel: 75,
          emergingSkills: ['AI/ML', 'Blockchain', 'Edge Computing']
        },
        'Product Management': {
          hiringVolume: 45000,
          salaryTrend: 'increasing',
          competitionLevel: 85,
          emergingSkills: ['AI Product Strategy', 'Data Analytics', 'User Psychology']
        },
        'Data Science': {
          hiringVolume: 35000,
          salaryTrend: 'increasing',
          competitionLevel: 90,
          emergingSkills: ['MLOps', 'AutoML', 'Federated Learning']
        }
      },
      locationFactors: {
        'San Francisco': { marketSize: 100000, averageSalary: 140000, competitionLevel: 95 },
        'New York': { marketSize: 80000, averageSalary: 130000, competitionLevel: 90 },
        'Seattle': { marketSize: 60000, averageSalary: 125000, competitionLevel: 85 },
        'Austin': { marketSize: 25000, averageSalary: 110000, competitionLevel: 65 },
        'Denver': { marketSize: 20000, averageSalary: 105000, competitionLevel: 60 },
        'Remote': { marketSize: 200000, averageSalary: 100000, competitionLevel: 85 }
      }
    };
  }

  private fallbackMarketAdjustment(baseScore: number, skills: string[]): MarketAdjustedResult {
    // Basic market adjustment logic
    const hotSkills = ['React', 'Python', 'AWS', 'AI/ML', 'TypeScript', 'Kubernetes'];
    const decliningSkills = ['jQuery', 'Flash', 'Internet Explorer'];
    
    let bonus = 0;
    let penalty = 0;
    const recommendations: string[] = [];
    
    skills.forEach(skill => {
      if (hotSkills.some(hot => skill.toLowerCase().includes(hot.toLowerCase()))) {
        bonus += 5;
      }
      if (decliningSkills.some(declining => skill.toLowerCase().includes(declining.toLowerCase()))) {
        penalty += 10;
        recommendations.push(`Consider updating from ${skill} to more modern alternatives`);
      }
    });

    if (bonus === 0) {
      recommendations.push('Add trending skills like AI/ML, Cloud platforms, or modern frameworks');
    }

    const adjustedScore = Math.min(100, Math.max(0, baseScore + bonus - penalty));

    return {
      adjustedScore,
      marketFactors: {
        skillDemandBonus: bonus,
        competitionPenalty: -penalty,
        locationBonus: 0,
        trendingSkillsBonus: bonus > 10 ? 5 : 0
      },
      recommendations
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export type { MarketIntelligenceData, MarketAdjustedResult };
