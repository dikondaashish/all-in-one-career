// Company Fit Analysis Service

import { generateJsonWithFallback } from '../lib/gemini';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CompanyFit {
  cultureMatch: number;
  techStackMatch: number;
  backgroundFit: number;
  rewriteSuggestions: string[];
  keywordsToAdd: string[];
  keywordsToAvoid: string[];
}

export interface CompanySignals {
  companyName: string;
  industry: string;
  size: string;
  values: string[];
  techStack: string[];
  tone: 'formal' | 'casual' | 'technical' | 'creative';
  benefits: string[];
}

/**
 * Analyze company fit if job URL or company name is provided
 */
export async function analyzeCompanyFit(
  resumeText: string,
  jobDescription: string,
  jobUrl?: string,
  companyName?: string
): Promise<CompanyFit | null> {
  if (!jobUrl && !companyName) {
    console.log('⏭️ Skipping company fit analysis - no company info provided');
    return null;
  }

  console.log('🏢 Starting company fit analysis');

  try {
    // Extract company signals
    const companySignals = await extractCompanySignals(jobDescription, jobUrl, companyName);
    
    if (!companySignals) {
      console.log('⚠️ Could not extract company signals');
      return null;
    }

    // Analyze fit using Gemini
    const companyFit = await analyzeCompanyFitWithAI(resumeText, jobDescription, companySignals);
    
    console.log('✅ Company fit analysis completed');
    return companyFit;
  } catch (error) {
    console.error('❌ Company fit analysis failed:', error);
    return null;
  }
}

/**
 * Extract company signals from job description and optional URL scraping
 */
async function extractCompanySignals(
  jobDescription: string,
  jobUrl?: string,
  companyName?: string
): Promise<CompanySignals | null> {
  let scrapedData: any = null;

  // Try to scrape additional data if URL provided
  if (jobUrl) {
    scrapedData = await scrapeJobPage(jobUrl);
  }

  // Extract company name from JD if not provided
  if (!companyName) {
    companyName = extractCompanyNameFromJD(jobDescription) || undefined;
  }

  if (!companyName) {
    return null;
  }

  // Analyze job description for company signals
  const signals = await extractSignalsFromText(jobDescription, scrapedData, companyName);
  
  return signals;
}

/**
 * Lightweight job page scraper
 */
async function scrapeJobPage(url: string): Promise<any> {
  try {
    console.log('🌐 Scraping job page for additional context');
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    
    // Extract relevant content
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    return {
      text: text.substring(0, 2000), // Limit size
      title,
      metaDescription,
    };
  } catch (error) {
    console.warn('⚠️ Job page scraping failed:', error);
    return null;
  }
}

/**
 * Extract company name from job description
 */
function extractCompanyNameFromJD(jobDescription: string): string | null {
  // Look for common patterns
  const patterns = [
    /(?:at|join|with)\s+([A-Z][a-zA-Z\s&.,-]{2,30})(?:\s+is|,|\.|!)/gi,
    /([A-Z][a-zA-Z\s&.,-]{2,30})\s+is\s+(?:looking|seeking|hiring)/gi,
    /company:\s*([A-Z][a-zA-Z\s&.,-]{2,30})/gi,
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Filter out common false positives
      if (!['The Company', 'Our Company', 'This Company', 'Your Company'].includes(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Extract company signals from text using AI
 */
async function extractSignalsFromText(
  jobDescription: string,
  scrapedData: any,
  companyName: string
): Promise<CompanySignals> {
  const fullText = scrapedData 
    ? `${jobDescription}\n\nADDITIONAL CONTEXT:\n${scrapedData.text}`
    : jobDescription;

  const prompt = `You are a company culture analyzer. Return JSON ONLY.

INPUT:
COMPANY: ${companyName}
JOB DESCRIPTION:
${fullText.substring(0, 1500)}

TASK:
Extract company signals including industry, size, values, tech stack, communication tone, and benefits.

JSON:
{
  "companyName": "${companyName}",
  "industry": "Technology",
  "size": "Startup|SMB|Enterprise|Unknown",
  "values": ["Innovation", "Collaboration", "Customer-first"],
  "techStack": ["React", "Node.js", "AWS"],
  "tone": "formal|casual|technical|creative",
  "benefits": ["Remote work", "Health insurance", "Equity"]
}`;

  try {
    const result = await generateJsonWithFallback<CompanySignals>(prompt);
    return result;
  } catch (error) {
    console.warn('⚠️ Failed to extract company signals:', error);
    
    // Fallback signals
    return {
      companyName,
      industry: 'Technology',
      size: 'Unknown',
      values: ['Growth', 'Innovation'],
      techStack: [],
      tone: 'professional' as any,
      benefits: [],
    };
  }
}

/**
 * Analyze company fit using AI
 */
async function analyzeCompanyFitWithAI(
  resumeText: string,
  jobDescription: string,
  companySignals: CompanySignals
): Promise<CompanyFit> {
  const prompt = `You are a company-fit optimizer. Return JSON ONLY.

INPUT:
COMPANY CONTEXT:
${JSON.stringify(companySignals)}
RESUME:
${resumeText.substring(0, 1000)}
JOB:
${jobDescription.substring(0, 1000)}

TASK:
Score cultureMatch, techStackMatch, backgroundFit (0–100). Propose 5–10 resume rewrite suggestions, keywords to add/avoid.

JSON:
{
  "cultureMatch": 78,
  "techStackMatch": 64,
  "backgroundFit": 71,
  "rewriteSuggestions": [
    "Mention GA4 explicitly in Skills",
    "Add 'managed $250k monthly budget'",
    "Use 'experiment velocity' once"
  ],
  "keywordsToAdd": ["GA4","Paid Social","CAC","LTV"],
  "keywordsToAvoid": ["general marketing","assisted","helped"]
}`;

  try {
    const result = await generateJsonWithFallback<CompanyFit>(prompt);
    console.log('✅ Company fit analysis successful');
    return result;
  } catch (error) {
    console.error('❌ Company fit AI analysis failed:', error);
    
    // Fallback analysis
    return {
      cultureMatch: 70,
      techStackMatch: 60,
      backgroundFit: 65,
      rewriteSuggestions: [
        'Align language with company tone',
        'Highlight relevant industry experience',
        'Emphasize cultural value alignment'
      ],
      keywordsToAdd: companySignals.techStack.slice(0, 3),
      keywordsToAvoid: ['generic terms', 'passive language'],
    };
  }
}

/**
 * Generate company-specific resume optimization tips
 */
export async function generateCompanyOptimizationTips(
  companyFit: CompanyFit,
  companySignals: CompanySignals
): Promise<string[]> {
  const tips: string[] = [];

  // Culture match tips
  if (companyFit.cultureMatch < 70) {
    tips.push(`Research ${companySignals.companyName}'s company values and reflect them in your summary`);
    tips.push('Use language that matches the company\'s communication style');
  }

  // Tech stack tips
  if (companyFit.techStackMatch < 70 && companySignals.techStack.length > 0) {
    tips.push(`Highlight experience with ${companySignals.techStack.slice(0, 2).join(' and ')}`);
    tips.push('Consider taking courses in missing technical skills');
  }

  // Background fit tips
  if (companyFit.backgroundFit < 70) {
    tips.push(`Emphasize ${companySignals.industry} industry knowledge`);
    tips.push('Connect your experience to similar company challenges');
  }

  // General optimization tips
  tips.push(...companyFit.rewriteSuggestions.slice(0, 3));

  return tips.slice(0, 7); // Limit to 7 tips
}

/**
 * Check if company analysis is worth performing
 */
export function shouldAnalyzeCompany(jobUrl?: string, companyName?: string): boolean {
  if (!jobUrl && !companyName) {
    return false;
  }

  // Skip if URL is too generic or likely to fail
  if (jobUrl) {
    const skipDomains = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com'];
    const urlLower = jobUrl.toLowerCase();
    
    if (skipDomains.some(domain => urlLower.includes(domain))) {
      return false;
    }
  }

  return true;
}
