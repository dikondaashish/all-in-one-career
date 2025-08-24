import { GoogleGenerativeAI } from '@google/generative-ai';

interface IndustryIntelligence {
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
    },
    'Data Science': {
      required: ['Python', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization'],
      preferred: ['R', 'TensorFlow', 'PyTorch', 'Spark', 'Tableau'],
      emerging: ['MLOps', 'AutoML', 'Federated Learning', 'Explainable AI'],
      deprecated: ['Excel only', 'SPSS', 'SAS'],
      goldKeywords: ['predictive modeling', 'feature engineering', 'A/B testing', 'statistical significance'],
      buzzwords: ['big data', 'revolutionary insights', 'game-changing'],
      careerPaths: [
        ['Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'Principal Data Scientist'],
        ['Research Scientist', 'ML Engineer', 'AI Research Lead']
      ]
    },
    'DevOps': {
      required: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Platforms', 'Infrastructure as Code'],
      preferred: ['Terraform', 'Jenkins', 'Prometheus', 'Grafana', 'Ansible'],
      emerging: ['GitOps', 'Service Mesh', 'Serverless', 'Edge Computing'],
      deprecated: ['Manual deployments', 'Monolithic architecture only'],
      goldKeywords: ['automation', 'reliability', 'scalability', 'monitoring'],
      buzzwords: ['DevOps ninja', 'infrastructure guru', 'cloud wizard'],
      careerPaths: [
        ['System Admin', 'DevOps Engineer', 'Senior DevOps', 'Platform Engineer'],
        ['Cloud Engineer', 'Site Reliability Engineer', 'Principal Engineer']
      ]
    }
    // Add more industries as needed
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

    try {
      const geminiResult = await this.callGemini(prompt);
      const detection = JSON.parse(geminiResult);
      
      return {
        industryDetection: detection,
        industrySpecificScoring: this.getIndustryScoring(detection.primary)
      };
    } catch (error) {
      console.error('Industry detection failed:', error);
      // Fallback to default
      return {
        industryDetection: {
          primary: 'Software Engineering',
          secondary: ['Technology'],
          confidence: 0.7
        },
        industrySpecificScoring: this.getIndustryScoring('Software Engineering')
      };
    }
  }

  private getIndustryScoring(industry: string) {
    const industryData = this.industryDatabase[industry as keyof typeof this.industryDatabase] || this.industryDatabase['Software Engineering'];
    
    return {
      techStack: {
        required: industryData.required,
        preferred: industryData.preferred,
        emerging: industryData.emerging,
        deprecated: industryData.deprecated
      },
      experiencePatterns: {
        idealCareerPath: industryData.careerPaths[0] || [],
        alternativeValidPaths: industryData.careerPaths || [],
        unusualButValuable: []
      },
      industryKeywords: {
        buzzwords: industryData.buzzwords,
        goldKeywords: industryData.goldKeywords,
        contextualPhrases: []
      }
    };
  }

  private async callGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export type { IndustryIntelligence };
