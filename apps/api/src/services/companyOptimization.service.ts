/**
 * Company Optimization Service - AI-powered company-specific optimization
 */

import { askGeminiJSON } from '../lib/gemini';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface CompanyOptimizationInput {
  resumeText: string;
  jobDescription: string;
  jobUrl?: string;
  companyHint?: string;
}

interface CompanyOptimizationResult {
  enabled: boolean;
  companyName?: string;
  cultureAlignment: number;
  techStackMatch: number;
  backgroundFit: number;
  resumeAdjustments: string[];
  coverLetter: string[];
  interviewPrep: string[];
  companyInsights?: {
    mission?: string;
    values?: string[];
    techStack?: string[];
    culture?: string[];
    recentNews?: string[];
  };
}

export async function optimizeForCompany({ resumeText, jobDescription, jobUrl, companyHint }: CompanyOptimizationInput): Promise<CompanyOptimizationResult> {
  // If no job URL or company hint, return disabled
  if (!jobUrl && !companyHint) {
    return {
      enabled: false,
      cultureAlignment: 0,
      techStackMatch: 0,
      backgroundFit: 0,
      resumeAdjustments: [],
      coverLetter: [],
      interviewPrep: []
    };
  }
  
  let companyData: any = {};
  let companyName = companyHint || '';
  
  // Try to scrape company information if URL is provided
  if (jobUrl) {
    try {
      companyData = await scrapeCompanyInfo(jobUrl);
      companyName = companyData.companyName || companyHint || '';
    } catch (error) {
      console.warn('Company scraping failed:', error);
    }
  }
  
  // Use AI to analyze company fit and generate optimization recommendations
  const optimizationResult = await analyzeCompanyFit({
    resumeText,
    jobDescription,
    companyName,
    companyData
  });
  
  return {
    enabled: true,
    companyName,
    ...optimizationResult
  };
}

/**
 * Scrape basic company information from job URL
 */
async function scrapeCompanyInfo(jobUrl: string): Promise<any> {
  try {
    console.log('Scraping company info from:', jobUrl);
    
    const response = await axios.get(jobUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract company name (try multiple selectors)
    const companySelectors = [
      '.company-name',
      '.employer-name', 
      '[data-testid="company-name"]',
      '.company',
      'h1 + div',
      'h2 + div'
    ];
    
    let companyName = '';
    for (const selector of companySelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        companyName = element.text().trim();
        break;
      }
    }
    
    // Extract job title
    const jobTitle = $('h1').first().text().trim() || 
                    $('.job-title').first().text().trim() ||
                    $('[data-testid="job-title"]').first().text().trim();
    
    // Extract company description/about section
    const description = $('.company-description').text().trim() ||
                       $('.about-company').text().trim() ||
                       $('.company-info').text().trim();
    
    // Extract benefits/perks
    const benefits = $('.benefits').text().trim() ||
                    $('.perks').text().trim() ||
                    $('.company-benefits').text().trim();
    
    return {
      companyName,
      jobTitle,
      description,
      benefits,
      url: jobUrl
    };
  } catch (error) {
    console.error('Failed to scrape company info:', error);
    return {};
  }
}

/**
 * Use AI to analyze company fit and generate recommendations
 */
async function analyzeCompanyFit({ resumeText, jobDescription, companyName, companyData }: {
  resumeText: string;
  jobDescription: string;
  companyName: string;
  companyData: any;
}): Promise<Omit<CompanyOptimizationResult, 'enabled' | 'companyName'>> {
  const prompt = `You are a career optimization expert. Analyze the resume against this specific company and role to provide tailored optimization advice. Return JSON ONLY.

COMPANY: ${companyName}

COMPANY DATA:
${JSON.stringify(companyData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Analyze and provide:
1. Culture alignment score (0-100)
2. Tech stack match score (0-100)  
3. Background fit score (0-100)
4. Specific resume adjustments for this company
5. Cover letter talking points
6. Interview preparation advice

Return this exact JSON structure:
{
  "cultureAlignment": 0-100,
  "techStackMatch": 0-100,
  "backgroundFit": 0-100,
  "resumeAdjustments": [
    "Emphasize experience with [specific technology]",
    "Highlight [specific achievement] that aligns with company values",
    "Add metrics around [specific area company cares about]"
  ],
  "coverLetter": [
    "Reference company's mission to [specific mission]",
    "Connect your [experience] to their [specific need]",
    "Mention specific company projects/news you researched"
  ],
  "interviewPrep": [
    "Research their recent [specific initiative]",
    "Prepare examples of [specific skill] in action", 
    "Ask about [specific company challenge/opportunity]"
  ],
  "companyInsights": {
    "mission": "Company mission statement",
    "values": ["Innovation", "Customer Focus", "Collaboration"],
    "techStack": ["React", "Node.js", "AWS"],
    "culture": ["Remote-first", "Fast-paced", "Data-driven"],
    "recentNews": ["Recent funding", "New product launch", "Expansion"]
  }
}

Focus on specific, actionable advice tailored to this exact company and role.`;

  try {
    const result = await askGeminiJSON(prompt, "pro");
    
    if (result.fallback) {
      return getFallbackCompanyOptimization(resumeText, jobDescription, companyName);
    }
    
    return {
      cultureAlignment: Math.max(0, Math.min(100, result.cultureAlignment || 50)),
      techStackMatch: Math.max(0, Math.min(100, result.techStackMatch || 50)),
      backgroundFit: Math.max(0, Math.min(100, result.backgroundFit || 50)),
      resumeAdjustments: Array.isArray(result.resumeAdjustments) ? result.resumeAdjustments : [],
      coverLetter: Array.isArray(result.coverLetter) ? result.coverLetter : [],
      interviewPrep: Array.isArray(result.interviewPrep) ? result.interviewPrep : [],
      companyInsights: result.companyInsights || {}
    };
  } catch (error) {
    console.error('Company optimization analysis failed:', error);
    return getFallbackCompanyOptimization(resumeText, jobDescription, companyName);
  }
}

/**
 * Fallback company optimization using heuristics
 */
function getFallbackCompanyOptimization(resumeText: string, jobDescription: string, companyName: string): Omit<CompanyOptimizationResult, 'enabled' | 'companyName'> {
  // Basic scoring based on keyword matches
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  // Tech stack matching (simple keyword overlap)
  const techKeywords = ['react', 'node.js', 'python', 'java', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb'];
  const resumeTech = techKeywords.filter(tech => resumeLower.includes(tech));
  const jobTech = techKeywords.filter(tech => jobLower.includes(tech));
  const techOverlap = resumeTech.filter(tech => jobTech.includes(tech));
  const techStackMatch = jobTech.length > 0 ? Math.round((techOverlap.length / jobTech.length) * 100) : 50;
  
  // Culture alignment (based on soft skills and company size indicators)
  let cultureAlignment = 60; // Default
  
  // Check for startup vs enterprise indicators
  if (jobLower.includes('startup') || jobLower.includes('fast-paced') || jobLower.includes('agile')) {
    if (resumeLower.includes('startup') || resumeLower.includes('agile') || resumeLower.includes('fast-paced')) {
      cultureAlignment += 20;
    }
  }
  
  if (jobLower.includes('enterprise') || jobLower.includes('corporate') || jobLower.includes('established')) {
    if (resumeLower.includes('enterprise') || resumeLower.includes('corporate') || resumeLower.includes('large')) {
      cultureAlignment += 15;
    }
  }
  
  // Background fit (education and experience level matching)
  let backgroundFit = 65; // Default
  
  // Check for education requirements
  if (jobLower.includes('bachelor') || jobLower.includes('degree')) {
    if (resumeLower.includes('bachelor') || resumeLower.includes('degree') || resumeLower.includes('university')) {
      backgroundFit += 15;
    } else {
      backgroundFit -= 10;
    }
  }
  
  // Check for experience level
  const experienceYears = extractExperienceYears(resumeText);
  if (jobLower.includes('senior') && experienceYears >= 5) {
    backgroundFit += 10;
  } else if (jobLower.includes('junior') && experienceYears <= 3) {
    backgroundFit += 10;
  }
  
  return {
    cultureAlignment: Math.max(0, Math.min(100, cultureAlignment)),
    techStackMatch,
    backgroundFit: Math.max(0, Math.min(100, backgroundFit)),
    resumeAdjustments: [
      "Tailor your resume to emphasize skills mentioned in the job description",
      "Quantify your achievements with specific metrics",
      "Use keywords from the company's job posting"
    ],
    coverLetter: [
      `Research ${companyName}'s recent news and company culture`,
      "Connect your experience to their specific business needs",
      "Show enthusiasm for their mission and values"
    ],
    interviewPrep: [
      `Prepare questions about ${companyName}'s future plans`,
      "Practice explaining how your skills solve their challenges",
      "Research the interviewing team on LinkedIn"
    ],
    companyInsights: {
      mission: `Learn more about ${companyName}'s mission and values`,
      values: ["Research company values on their website"],
      techStack: resumeTech,
      culture: ["Research company culture through employee reviews"],
      recentNews: ["Check recent company news and announcements"]
    }
  };
}

/**
 * Extract years of experience from resume (simple heuristic)
 */
function extractExperienceYears(resumeText: string): number {
  const years = resumeText.match(/\b20\d{2}\b/g);
  if (!years || years.length < 2) return 0;
  
  const numericYears = years.map(y => parseInt(y)).sort();
  const startYear = numericYears[0];
  const endYear = Math.max(...numericYears);
  
  return Math.max(0, endYear - (startYear || 0));
}
