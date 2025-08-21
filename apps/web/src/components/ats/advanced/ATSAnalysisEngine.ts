// ATS Analysis Engine - Core analysis logic for resume-job matching

interface ResumeData {
  content: string;
  wordCount: number;
  characterCount: number;
  sections: ResumeSection[];
  source: 'manual' | 'file' | 'url';
  filename?: string;
  extractedAt: Date;
}

interface ResumeSection {
  type: 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'summary';
  content: string;
  keywords: string[];
  startIndex: number;
  endIndex: number;
}

interface JobDescription {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  content: string;
  source: 'manual' | 'file' | 'url';
  url?: string;
  extractedAt: Date;
}

interface KeywordAnalysis {
  total_keywords: number;
  matched_keywords: number;
  match_percentage: number;
  critical_missing: string[];
  matched_list: MatchedKeyword[];
  keyword_density: number;
  semantic_matches: number;
}

interface MatchedKeyword {
  keyword: string;
  resume_frequency: number;
  job_frequency: number;
  importance_weight: number;
  match_type: 'exact' | 'partial' | 'synonym' | 'semantic';
  context: string;
}

interface SectionAnalysis {
  personal_info_score: number;
  experience_score: number;
  education_score: number;
  skills_score: number;
  formatting_score: number;
  completeness_score: number;
}

interface FormattingAnalysis {
  readability_score: number;
  structure_score: number;
  length_score: number;
  bullet_usage: number;
  action_verbs: number;
  quantifiable_results: number;
}

interface Recommendation {
  type: 'critical' | 'important' | 'suggestion';
  category: 'keywords' | 'formatting' | 'content' | 'structure';
  title: string;
  description: string;
  before?: string;
  after?: string;
  impact_score: number;
}

export class ATSAnalysisEngine {
  private stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'a', 'an', 'as', 'if', 'then', 'than', 'so', 'such'
  ]);

  private actionVerbs = new Set([
    'achieved', 'administered', 'analyzed', 'built', 'created', 'designed',
    'developed', 'directed', 'established', 'executed', 'implemented',
    'improved', 'increased', 'led', 'managed', 'optimized', 'organized',
    'planned', 'reduced', 'resolved', 'supervised', 'trained', 'collaborated',
    'coordinated', 'facilitated', 'initiated', 'launched', 'maintained',
    'operated', 'performed', 'produced', 'streamlined', 'structured'
  ]);

  private technicalSkills = new Set([
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node.js', 'express', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'jenkins', 'terraform', 'ansible',
    'microservices', 'rest', 'api', 'graphql', 'nosql', 'sql', 'html',
    'css', 'sass', 'bootstrap', 'tailwind', 'webpack', 'babel', 'npm',
    'yarn', 'redux', 'spring', 'django', 'flask', 'rails', 'agile', 'scrum'
  ]);

  async preprocessResume(resume: ResumeData): Promise<ResumeData> {
    // Clean and normalize resume content
    const cleanedContent = this.cleanText(resume.content);
    
    // Re-extract sections with improved processing
    const enhancedSections = resume.sections.map(section => ({
      ...section,
      keywords: this.extractEnhancedKeywords(section.content)
    }));

    return {
      ...resume,
      content: cleanedContent,
      sections: enhancedSections
    };
  }

  async preprocessJobDescription(job: JobDescription): Promise<JobDescription> {
    // Clean and enhance job description
    const cleanedContent = this.cleanText(job.content);
    const enhancedKeywords = this.extractEnhancedKeywords(cleanedContent);

    return {
      ...job,
      content: cleanedContent,
      keywords: enhancedKeywords
    };
  }

  async performKeywordAnalysis(resume: ResumeData, job: JobDescription): Promise<KeywordAnalysis> {
    const resumeText = resume.content.toLowerCase();
    const jobText = job.content.toLowerCase();
    
    // Extract all potential keywords from job description
    const allJobKeywords = this.extractAllKeywords(job.content);
    const resumeKeywords = this.extractAllKeywords(resume.content);
    
    // Calculate matches
    const matchedKeywords: MatchedKeyword[] = [];
    const criticalMissing: string[] = [];
    
    for (const keyword of allJobKeywords) {
      const resumeFreq = this.countKeywordFrequency(resumeText, keyword);
      const jobFreq = this.countKeywordFrequency(jobText, keyword);
      const importance = this.calculateKeywordImportance(keyword, job);
      
      if (resumeFreq > 0) {
        matchedKeywords.push({
          keyword,
          resume_frequency: resumeFreq,
          job_frequency: jobFreq,
          importance_weight: importance,
          match_type: this.determineMatchType(keyword, resumeText),
          context: this.getKeywordContext(keyword, resumeText)
        });
      } else if (importance > 0.7) {
        criticalMissing.push(keyword);
      }
    }

    // Calculate semantic matches
    const semanticMatches = await this.findSemanticMatches(resumeKeywords, allJobKeywords);
    
    const totalKeywords = allJobKeywords.length;
    const matchedCount = matchedKeywords.length + semanticMatches;
    const matchPercentage = (matchedCount / totalKeywords) * 100;
    const keywordDensity = this.calculateKeywordDensity(resumeText, allJobKeywords);

    return {
      total_keywords: totalKeywords,
      matched_keywords: matchedCount,
      match_percentage: Math.round(matchPercentage),
      critical_missing: criticalMissing.slice(0, 10),
      matched_list: matchedKeywords,
      keyword_density: keywordDensity,
      semantic_matches: semanticMatches
    };
  }

  async analyzeSections(resume: ResumeData): Promise<SectionAnalysis> {
    const sections = resume.sections;
    
    return {
      personal_info_score: this.analyzePersonalInfo(sections),
      experience_score: this.analyzeExperience(sections),
      education_score: this.analyzeEducation(sections),
      skills_score: this.analyzeSkills(sections),
      formatting_score: this.analyzeFormatting(resume.content),
      completeness_score: this.analyzeCompleteness(sections)
    };
  }

  async analyzeFormatting(resume: ResumeData): Promise<FormattingAnalysis> {
    const content = resume.content;
    
    return {
      readability_score: this.calculateReadability(content),
      structure_score: this.analyzeStructure(content),
      length_score: this.analyzeLengthOptimal(content),
      bullet_usage: this.analyzeBulletUsage(content),
      action_verbs: this.countActionVerbs(content),
      quantifiable_results: this.countQuantifiableResults(content)
    };
  }

  async generateRecommendations(
    keywordAnalysis: KeywordAnalysis,
    sectionAnalysis: SectionAnalysis,
    formattingAnalysis: FormattingAnalysis
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Critical keyword recommendations
    if (keywordAnalysis.critical_missing.length > 0) {
      recommendations.push({
        type: 'critical',
        category: 'keywords',
        title: 'Add Critical Missing Keywords',
        description: `Your resume is missing ${keywordAnalysis.critical_missing.length} important keywords that appear in the job description.`,
        impact_score: 95
      });
    }

    // Low keyword match rate
    if (keywordAnalysis.match_percentage < 40) {
      recommendations.push({
        type: 'critical',
        category: 'keywords',
        title: 'Improve Keyword Relevance',
        description: `Only ${keywordAnalysis.match_percentage}% of job keywords found in your resume. Aim for 60%+ match rate.`,
        impact_score: 90
      });
    }

    // Experience section improvements
    if (sectionAnalysis.experience_score < 70) {
      recommendations.push({
        type: 'important',
        category: 'content',
        title: 'Enhance Experience Section',
        description: 'Add more detailed descriptions, quantifiable results, and relevant accomplishments.',
        impact_score: 85
      });
    }

    // Skills section improvements
    if (sectionAnalysis.skills_score < 60) {
      recommendations.push({
        type: 'important',
        category: 'content',
        title: 'Strengthen Skills Section',
        description: 'Include more technical skills and certifications relevant to the position.',
        impact_score: 80
      });
    }

    // Action verbs
    if (formattingAnalysis.action_verbs < 10) {
      recommendations.push({
        type: 'suggestion',
        category: 'formatting',
        title: 'Use More Action Verbs',
        description: 'Start bullet points with strong action verbs like "achieved," "developed," "managed."',
        impact_score: 70
      });
    }

    // Quantifiable results
    if (formattingAnalysis.quantifiable_results < 5) {
      recommendations.push({
        type: 'important',
        category: 'content',
        title: 'Add Quantifiable Results',
        description: 'Include specific numbers, percentages, and metrics to demonstrate your impact.',
        impact_score: 85
      });
    }

    // Resume length
    if (formattingAnalysis.length_score < 70) {
      recommendations.push({
        type: 'suggestion',
        category: 'formatting',
        title: 'Optimize Resume Length',
        description: 'Aim for 1-2 pages. Remove outdated or irrelevant information.',
        impact_score: 60
      });
    }

    return recommendations.sort((a, b) => b.impact_score - a.impact_score);
  }

  calculateOverallScore(
    keywordAnalysis: KeywordAnalysis,
    sectionAnalysis: SectionAnalysis,
    formattingAnalysis: FormattingAnalysis
  ): number {
    const weights = {
      keywords: 0.4,
      sections: 0.35,
      formatting: 0.25
    };

    const keywordScore = keywordAnalysis.match_percentage;
    const sectionScore = (
      sectionAnalysis.personal_info_score +
      sectionAnalysis.experience_score +
      sectionAnalysis.education_score +
      sectionAnalysis.skills_score +
      sectionAnalysis.completeness_score
    ) / 5;
    
    const formatScore = (
      formattingAnalysis.readability_score +
      formattingAnalysis.structure_score +
      formattingAnalysis.length_score +
      formattingAnalysis.bullet_usage +
      Math.min(formattingAnalysis.action_verbs * 5, 100) +
      Math.min(formattingAnalysis.quantifiable_results * 10, 100)
    ) / 6;

    const overallScore = (
      keywordScore * weights.keywords +
      sectionScore * weights.sections +
      formatScore * weights.formatting
    );

    return Math.round(Math.max(0, Math.min(100, overallScore)));
  }

  calculateATSCompatibility(formattingAnalysis: FormattingAnalysis): number {
    // ATS compatibility focuses on structure and formatting
    const factors = [
      formattingAnalysis.structure_score,
      formattingAnalysis.readability_score,
      Math.min(formattingAnalysis.bullet_usage, 100),
      formattingAnalysis.length_score > 50 ? 100 : 50 // Penalize too short resumes
    ];

    return Math.round(factors.reduce((sum, factor) => sum + factor, 0) / factors.length);
  }

  estimatePassRate(keywordAnalysis: KeywordAnalysis, sectionAnalysis: SectionAnalysis): number {
    // Estimate the likelihood of passing ATS screening
    const keywordWeight = 0.6;
    const contentWeight = 0.4;

    const keywordScore = keywordAnalysis.match_percentage;
    const contentScore = (sectionAnalysis.experience_score + sectionAnalysis.skills_score) / 2;

    const passRate = (keywordScore * keywordWeight + contentScore * contentWeight);
    
    // Apply bonuses/penalties
    let adjustedRate = passRate;
    
    if (keywordAnalysis.critical_missing.length > 5) {
      adjustedRate -= 15; // Heavy penalty for missing critical keywords
    }
    
    if (keywordAnalysis.semantic_matches > 5) {
      adjustedRate += 10; // Bonus for semantic understanding
    }

    return Math.round(Math.max(0, Math.min(100, adjustedRate)));
  }

  identifyStrengths(sectionAnalysis: SectionAnalysis): string[] {
    const strengths: string[] = [];
    
    if (sectionAnalysis.experience_score >= 80) {
      strengths.push('Strong professional experience documentation');
    }
    
    if (sectionAnalysis.skills_score >= 80) {
      strengths.push('Comprehensive technical skills coverage');
    }
    
    if (sectionAnalysis.education_score >= 80) {
      strengths.push('Well-documented educational background');
    }
    
    if (sectionAnalysis.formatting_score >= 80) {
      strengths.push('Clean and professional formatting');
    }

    if (sectionAnalysis.completeness_score >= 90) {
      strengths.push('Complete resume with all essential sections');
    }

    return strengths;
  }

  identifyImprovements(recommendations: Recommendation[]): string[] {
    return recommendations
      .filter(rec => rec.type === 'critical' || rec.type === 'important')
      .map(rec => rec.category)
      .filter((category, index, arr) => arr.indexOf(category) === index)
      .map(category => {
        switch (category) {
          case 'keywords': return 'Keyword optimization and job relevance';
          case 'content': return 'Content depth and quantifiable achievements';
          case 'formatting': return 'Structure and readability improvements';
          case 'structure': return 'Overall resume organization';
          default: return category;
        }
      });
  }

  // Private helper methods
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-]/g, '')
      .trim();
  }

  private extractEnhancedKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const keywords = new Set<string>();

    // Extract multi-word technical terms
    const multiWordPatterns = [
      /\b(?:machine learning|data science|cloud computing|web development|software engineering)\b/gi,
      /\b(?:project management|quality assurance|user experience|customer service)\b/gi
    ];

    multiWordPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => keywords.add(match.toLowerCase()));
    });

    // Extract single important words
    words
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .filter(word => this.technicalSkills.has(word) || /^[A-Z]+$/.test(word))
      .forEach(word => keywords.add(word));

    return Array.from(keywords).slice(0, 50);
  }

  private extractAllKeywords(text: string): string[] {
    // More comprehensive keyword extraction
    const keywords = new Set<string>();
    
    // Technical terms and acronyms
    const techPattern = /\b[A-Z]{2,}(?:\.[a-z]+)*\b|\b\w+(?:\+\+|#)\b/g;
    const techMatches = text.match(techPattern) || [];
    techMatches.forEach(match => keywords.add(match.toLowerCase()));

    // Common skills from predefined list
    this.technicalSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill)) {
        keywords.add(skill);
      }
    });

    return Array.from(keywords);
  }

  private countKeywordFrequency(text: string, keyword: string): number {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
    return (text.match(regex) || []).length;
  }

  private calculateKeywordImportance(keyword: string, job: JobDescription): number {
    // Higher importance for keywords that appear in requirements vs general content
    let importance = 0.5; // Base importance

    if (job.requirements.some(req => req.toLowerCase().includes(keyword.toLowerCase()))) {
      importance += 0.3;
    }

    if (job.title.toLowerCase().includes(keyword.toLowerCase())) {
      importance += 0.2;
    }

    if (this.technicalSkills.has(keyword.toLowerCase())) {
      importance += 0.2;
    }

    return Math.min(1.0, importance);
  }

  private determineMatchType(keyword: string, resumeText: string): 'exact' | 'partial' | 'synonym' | 'semantic' {
    if (resumeText.includes(keyword.toLowerCase())) {
      return 'exact';
    }
    // For now, return exact - could implement more sophisticated matching
    return 'exact';
  }

  private getKeywordContext(keyword: string, text: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + keyword.length + 30);
    return text.substring(start, end);
  }

  private async findSemanticMatches(resumeKeywords: string[], jobKeywords: string[]): Promise<number> {
    // Simplified semantic matching - could integrate with ML models
    const synonymMap: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'nodejs': ['node', 'node.js'],
      'mongodb': ['mongo'],
      'postgresql': ['postgres', 'psql']
    };

    let matches = 0;
    for (const jobKeyword of jobKeywords) {
      const synonyms = synonymMap[jobKeyword.toLowerCase()] || [];
      if (synonyms.some(syn => resumeKeywords.includes(syn))) {
        matches++;
      }
    }

    return matches;
  }

  private calculateKeywordDensity(text: string, keywords: string[]): number {
    const totalWords = text.split(/\s+/).length;
    const keywordCount = keywords.reduce((count, keyword) => {
      return count + this.countKeywordFrequency(text, keyword);
    }, 0);

    return (keywordCount / totalWords) * 100;
  }

  private analyzePersonalInfo(sections: ResumeSection[]): number {
    const personalSection = sections.find(s => s.type === 'personal');
    if (!personalSection) return 30;

    const content = personalSection.content.toLowerCase();
    let score = 40;

    // Check for essential contact information
    if (content.includes('@') && content.includes('.')) score += 20; // Email
    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(content)) score += 20; // Phone
    if (content.includes('linkedin') || content.includes('github')) score += 20; // Professional profiles

    return Math.min(100, score);
  }

  private analyzeExperience(sections: ResumeSection[]): number {
    const experienceSection = sections.find(s => s.type === 'experience');
    if (!experienceSection) return 20;

    const content = experienceSection.content;
    let score = 40;

    // Check for action verbs
    const actionVerbCount = this.countActionVerbs(content);
    score += Math.min(20, actionVerbCount * 2);

    // Check for quantifiable results
    const quantifiableCount = this.countQuantifiableResults(content);
    score += Math.min(20, quantifiableCount * 4);

    // Check for company names and dates
    if (/\d{4}/.test(content)) score += 10; // Years
    if (content.split('\n').length > 5) score += 10; // Substantial content

    return Math.min(100, score);
  }

  private analyzeEducation(sections: ResumeSection[]): number {
    const educationSection = sections.find(s => s.type === 'education');
    if (!educationSection) return 40; // Not critical for all positions

    const content = educationSection.content.toLowerCase();
    let score = 50;

    if (content.includes('university') || content.includes('college')) score += 20;
    if (content.includes('degree') || content.includes('bachelor') || content.includes('master')) score += 20;
    if (/\d{4}/.test(content)) score += 10; // Graduation year

    return Math.min(100, score);
  }

  private analyzeSkills(sections: ResumeSection[]): number {
    const skillsSection = sections.find(s => s.type === 'skills');
    if (!skillsSection) return 30;

    const keywords = skillsSection.keywords;
    let score = 40;

    // Technical skills bonus
    const techSkillCount = keywords.filter(k => this.technicalSkills.has(k.toLowerCase())).length;
    score += Math.min(40, techSkillCount * 5);

    // Variety bonus
    if (keywords.length > 10) score += 20;

    return Math.min(100, score);
  }

  private analyzeFormatting(content: string): number {
    let score = 50;

    // Bullet points
    const bulletCount = (content.match(/[•·▪▫–-]\s/g) || []).length;
    score += Math.min(20, bulletCount * 2);

    // Consistent structure
    if (content.includes('EXPERIENCE') || content.includes('EDUCATION')) score += 15;
    if (content.includes('SKILLS') || content.includes('TECHNICAL')) score += 15;

    return Math.min(100, score);
  }

  private analyzeCompleteness(sections: ResumeSection[]): number {
    const sectionTypes = sections.map(s => s.type);
    let score = 0;

    const requiredSections = ['personal', 'experience', 'skills'];
    const optionalSections = ['education', 'projects', 'summary'];

    requiredSections.forEach(required => {
      if (sectionTypes.includes(required as any)) score += 30;
    });

    optionalSections.forEach(optional => {
      if (sectionTypes.includes(optional as any)) score += 3;
    });

    return Math.min(100, score);
  }

  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    // Optimal range: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 100;
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 80;
    if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) return 60;
    return 40;
  }

  private analyzeStructure(content: string): number {
    let score = 50;

    // Section headers
    const headers = content.match(/^[A-Z][A-Z\s]+$/gm) || [];
    score += Math.min(30, headers.length * 10);

    // Consistent formatting
    if (content.includes('\n\n')) score += 20; // Proper spacing

    return Math.min(100, score);
  }

  private analyzeLengthOptimal(content: string): number {
    const wordCount = content.split(/\s+/).length;
    
    // Optimal range: 400-800 words
    if (wordCount >= 400 && wordCount <= 800) return 100;
    if (wordCount >= 300 && wordCount <= 1000) return 80;
    if (wordCount >= 200 && wordCount <= 1200) return 60;
    return 40;
  }

  private analyzeBulletUsage(content: string): number {
    const bulletCount = (content.match(/[•·▪▫–-]\s/g) || []).length;
    return Math.min(100, bulletCount * 5);
  }

  private countActionVerbs(content: string): number {
    const words = content.toLowerCase().split(/\W+/);
    return words.filter(word => this.actionVerbs.has(word)).length;
  }

  private countQuantifiableResults(content: string): number {
    const patterns = [
      /\d+%/g, // Percentages
      /\$\d+/g, // Dollar amounts
      /\d+\+/g, // Numbers with plus
      /\d+k\b/gi, // Thousands
      /\d+m\b/gi, // Millions
      /\d+\s*years?\b/gi, // Years of experience
      /increased?\s+by\s+\d+/gi, // Increase by number
      /reduced?\s+by\s+\d+/gi, // Reduced by number
    ];

    return patterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
  }
}
