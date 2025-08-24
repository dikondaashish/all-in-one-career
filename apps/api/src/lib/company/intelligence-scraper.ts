import { GoogleGenerativeAI } from '@google/generative-ai';
import { RevolutionaryScoring } from '../gemini/advanced-analyzer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CompanyProfile {
  companyName: string;
  domain?: string;
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

interface CompanyOptimization {
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
}

export class CompanyIntelligenceEngine {
  async getCompanyProfile(companyName: string, domain?: string): Promise<CompanyProfile> {
    // First, try to get from database
    const existingProfile = await this.getFromDatabase(companyName);
    if (existingProfile && this.isDataFresh(existingProfile.lastUpdated)) {
      return this.transformDbToProfile(existingProfile);
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

    try {
      const analysis = await this.callGemini(prompt);
      const cleanedResponse = analysis.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Company data analysis failed:', error);
      return this.fallbackCompanyProfile(companyName, domain);
    }
  }

  async optimizeForCompany(
    resumeAnalysis: RevolutionaryScoring,
    companyProfile: CompanyProfile,
    jobDescription: string
  ): Promise<CompanyOptimization> {
    
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

    try {
      const result = await this.callGemini(prompt);
      const cleanedResponse = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Company optimization failed:', error);
      return this.fallbackOptimization(resumeAnalysis, companyProfile);
    }
  }

  private async scrapeLinkedIn(companyName: string): Promise<any> {
    // Implement LinkedIn company page scraping
    // Note: Use proper anti-detection methods
    return {
      employees: [],
      recentHires: [],
      cultureKeywords: ["collaborative", "innovative"]
    };
  }

  private async scrapeGlassdoor(companyName: string): Promise<any> {
    // Implement Glassdoor scraping for culture insights
    return {
      reviews: [],
      cultureKeywords: ["fast-paced", "remote-friendly"],
      interviewQuestions: []
    };
  }

  private async scrapeCompanyWebsite(domain?: string): Promise<any> {
    if (!domain) return {};
    
    // Scrape company website for tech stack, values, etc.
    return {
      techStack: ["React", "Node.js", "AWS"],
      values: ["innovation", "collaboration"],
      jobPostings: []
    };
  }

  private async scrapeJobPostings(companyName: string): Promise<any> {
    // Scrape multiple job sites for this company's postings
    return {
      commonRequirements: ["JavaScript", "React", "AWS"],
      techStack: ["React", "Node.js", "Python"],
      cultureKeywords: ["team player", "fast learner"]
    };
  }

  private combineScrapingResults(results: PromiseSettledResult<any>[]): any {
    // Combine and deduplicate data from all sources
    const combinedData: any = {
      techStack: [],
      cultureKeywords: [],
      values: [],
      employees: [],
      recentHires: []
    };
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data.techStack) combinedData.techStack.push(...data.techStack);
        if (data.cultureKeywords) combinedData.cultureKeywords.push(...data.cultureKeywords);
        if (data.values) combinedData.values.push(...data.values);
        if (data.employees) combinedData.employees.push(...data.employees);
        if (data.recentHires) combinedData.recentHires.push(...data.recentHires);
      }
    });
    
    // Deduplicate arrays
    Object.keys(combinedData).forEach(key => {
      if (Array.isArray(combinedData[key])) {
        combinedData[key] = [...new Set(combinedData[key])];
      }
    });
    
    return combinedData;
  }

  private fallbackCompanyProfile(companyName: string, domain?: string): CompanyProfile {
    return {
      companyName,
      domain: domain || '',
      industry: 'Technology',
      size: '1000-5000',
      cultureKeywords: ['innovative', 'collaborative', 'fast-paced'],
      techStack: ['JavaScript', 'React', 'Node.js', 'AWS'],
      hiringPatterns: {
        preferredBackgrounds: ['Computer Science', 'Software Engineering'],
        commonCareerPaths: ['Developer -> Senior Developer -> Lead'],
        averageTenure: 2.5,
        promotionRate: 0.2
      },
      recentHires: [
        {
          role: 'Software Engineer',
          background: ['University graduate', '2-3 years experience'],
          skills: ['React', 'JavaScript', 'Python']
        }
      ]
    };
  }

  private fallbackOptimization(
    resumeAnalysis: RevolutionaryScoring,
    companyProfile: CompanyProfile
  ): CompanyOptimization {
    const skillScore = resumeAnalysis.skillRelevancy.score;
    const cultureScore = resumeAnalysis.recruiterAppeal.cultureAlignmentSignals;
    
    return {
      optimizationScore: Math.round((skillScore + cultureScore) / 2),
      cultureAlignment: cultureScore,
      techStackMatch: skillScore,
      backgroundFit: 75,
      recommendations: {
        resumeAdjustments: [
          "Align language with company culture",
          "Highlight relevant technical experience",
          "Emphasize collaborative achievements"
        ],
        coverLetterTopics: [
          "Passion for company mission",
          "Relevant technical experience",
          "Cultural fit indicators"
        ],
        interviewPrep: [
          "Research company values and mission",
          "Prepare technical examples",
          "Study recent company developments"
        ],
        keywordsToAdd: companyProfile.cultureKeywords.slice(0, 5),
        keywordsToAvoid: ["outdated", "traditional", "slow-paced"]
      }
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async getFromDatabase(companyName: string): Promise<any> {
    try {
      return await prisma.companyProfiles.findUnique({
        where: { companyName }
      });
    } catch (error) {
      console.error('Database fetch failed:', error);
      return null;
    }
  }

  private async saveToDatabase(profile: CompanyProfile): Promise<void> {
    try {
      await prisma.companyProfiles.upsert({
        where: { companyName: profile.companyName },
        update: {
          domain: profile.domain,
          industry: profile.industry,
          size: profile.size,
          cultureKeywords: JSON.parse(JSON.stringify(profile.cultureKeywords)),
          techStack: JSON.parse(JSON.stringify(profile.techStack)),
          hiringPatterns: JSON.parse(JSON.stringify(profile.hiringPatterns)),
          averageTenure: profile.hiringPatterns.averageTenure,
          lastUpdated: new Date()
        },
        create: {
          companyName: profile.companyName,
          domain: profile.domain,
          industry: profile.industry,
          size: profile.size,
          cultureKeywords: JSON.parse(JSON.stringify(profile.cultureKeywords)),
          techStack: JSON.parse(JSON.stringify(profile.techStack)),
          hiringPatterns: JSON.parse(JSON.stringify(profile.hiringPatterns)),
          averageTenure: profile.hiringPatterns.averageTenure
        }
      });
    } catch (error) {
      console.error('Database save failed:', error);
    }
  }

  private transformDbToProfile(dbRecord: any): CompanyProfile {
    return {
      companyName: dbRecord.companyName,
      domain: dbRecord.domain,
      industry: dbRecord.industry,
      size: dbRecord.size,
      cultureKeywords: dbRecord.cultureKeywords,
      techStack: dbRecord.techStack,
      hiringPatterns: dbRecord.hiringPatterns,
      recentHires: []
    };
  }

  private isDataFresh(lastUpdated: Date): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(lastUpdated) > oneDayAgo;
  }
}

export type { CompanyProfile, CompanyOptimization };
