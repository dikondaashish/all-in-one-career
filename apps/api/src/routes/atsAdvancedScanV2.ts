/**
 * ATS Advanced Scan V2 - Enhanced foundational features orchestrator
 * Keeps v1 intact while adding comprehensive ATS checks, recruiter psychology, and market intelligence
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Import all v2 services
import { runAtsChecks } from '../services/atsChecks.service';
import { splitSkills } from '../services/skillsSplit.service';
import { analyzeRecruiterPsychology } from '../services/recruiterPsych.service';
import { analyzeIndustryMarket } from '../services/industryMarket.service';
import { optimizeForCompany } from '../services/companyOptimization.service';
import { enhancePredictions } from '../services/predictiveEnhanced.service';

// Import V2 scoring system
import { computeOverallATS, type SubScores } from '../services/scoreEngine';
import { subs, calculateSignalAvailability } from '../services/subscores';

// Import shared authentication middleware
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();
const prisma = new PrismaClient();

// Initialize Gemini AI for title generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// OPTIONS requests are handled by the main CORS middleware in index.ts

// Helper function to generate AI title for a scan
async function generateAITitleForScan(scanData: any): Promise<string> {
  try {
    const { atsChecks, industryJson, companyOpt } = scanData;
    
    // Extract data for title generation
    let jobTitle = '';
    let companyName = '';
    let detectedIndustry = '';
    let jobDescription = '';

    // Extract from atsChecks
    if (atsChecks) {
      jobTitle = atsChecks.originalJobTitle || atsChecks.jobTitleMatch?.title || '';
      companyName = atsChecks.originalCompanyHint || '';
      jobDescription = atsChecks.originalJobDescription || '';
    }

    // Extract from industryJson
    if (industryJson?.detected?.primary) {
      detectedIndustry = industryJson.detected.primary;
    }

    // Extract from companyOpt if available
    if (companyOpt?.companyName) {
      companyName = companyOpt.companyName;
    }

    console.log('Title generation data:', { jobTitle, companyName, detectedIndustry, hasJobDescription: !!jobDescription });

    // If we have sufficient data, use AI
    if (jobTitle || companyName || (jobDescription && jobDescription.length > 50)) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: 'You are a professional title generator for job applications. Create a concise, professional title based on the job role and company information provided.'
      });

      const prompt = `Generate a concise professional title for this job application:
Job Title: ${jobTitle || 'Not specified'}
Company Name: ${companyName || 'Not specified'}
Industry: ${detectedIndustry || 'Not specified'}
Job Details: ${jobDescription ? jobDescription.slice(0, 500) : 'Not provided'}

Requirements:
- Keep it under 60 characters
- Format: "Job Title at Company" or "Job Title - Company" or just "Job Title" if no company
- Use the actual job title and company name from the data
- Be professional and clear
- If no clear job title, use the industry or a descriptive term

Return only the title, no extra text.`;

      const result = await model.generateContent(prompt);
      const generatedText = result.response.text();
      const cleanTitle = generatedText.replace(/['"]/g, '').trim();
      
      if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length <= 100) {
        return cleanTitle.slice(0, 60); // Ensure max 60 chars
      }
    }

    // Fallback title generation
    if (jobTitle && companyName) {
      return `${jobTitle} at ${companyName}`.slice(0, 60);
    } else if (jobTitle) {
      return jobTitle.slice(0, 60);
    } else if (companyName) {
      return `Application at ${companyName}`.slice(0, 60);
    } else if (detectedIndustry) {
      return `Position - ${detectedIndustry}`.slice(0, 60);
    }
    
    return `Enhanced AI Scan - ${new Date().toLocaleDateString()}`;
  } catch (error) {
    console.error('AI title generation failed:', error);
    return `Enhanced AI Scan - ${new Date().toLocaleDateString()}`;
  }
}

/**
 * POST /api/ats/advanced-scan/v2
 * Master endpoint for enhanced ATS scanning with foundational checks
 */
router.post('/advanced-scan/v2', authenticateToken, async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('🚀 Starting ATS Advanced Scan V2...');
  
  try {
    const { resumeText, resumeFileMeta, jobDescription, jobUrl, companyHint } = req.body;
    const userId = (req as any).user.uid;
    
    // Validate input
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields: resumeText, jobDescription' 
      });
    }
    
    // Extract job title for ATS checks
    const jobTitle = extractJobTitle(jobDescription);
    console.log('📋 Extracted job title:', jobTitle);
    
    // === PHASE 1: FOUNDATIONAL ATS CHECKS ===
    console.log('🔍 Running foundational ATS checks...');
    const atsChecks = runAtsChecks({
      resumeText,
      resumeFileMeta: resumeFileMeta || { filename: 'resume.txt', mime: 'text/plain' },
      jobTitle
    });
    console.log('✅ ATS checks completed:', atsChecks);
    
    // === PHASE 2: ENHANCED SKILLS ANALYSIS ===
    console.log('🎯 Analyzing skills split...');
    const skillsSplit = splitSkills({
      resumeText,
      jobText: jobDescription
    });
    console.log('✅ Skills analysis completed. Hard skills found:', skillsSplit.hard.found.length);
    
    // === PHASE 3: RECRUITER PSYCHOLOGY INSIGHTS ===
    console.log('🧠 Analyzing recruiter psychology...');
    const recruiterPsych = await analyzeRecruiterPsychology({
      resumeText,
      jobDescription
    });
    console.log('✅ Psychology analysis completed. Impression score:', recruiterPsych.sixSecondImpression);
    
    // === PHASE 4: INDUSTRY & MARKET INTELLIGENCE ===
    console.log('📊 Analyzing industry and market...');
    const industryMarket = await analyzeIndustryMarket({
      resumeText,
      jobDescription,
      hardSkillsFound: skillsSplit.hard.found,
      matchRate: atsChecks.jobTitleMatch.exact ? 95 : (atsChecks.jobTitleMatch.normalizedSimilarity * 100)
    });
    console.log('✅ Industry analysis completed. Primary:', industryMarket.detected.primary);
    
    // === PHASE 5: COMPANY OPTIMIZATION (CONDITIONAL) ===
    console.log('🏢 Running company optimization...');
    const companyOptimization = await optimizeForCompany({
      resumeText,
      jobDescription,
      jobUrl,
      companyHint
    });
    console.log('✅ Company optimization completed. Enabled:', companyOptimization.enabled);
    
    // === PHASE 6: ENHANCED PREDICTIONS ===
    console.log('🔮 Enhancing predictions...');
    const predictiveEnhanced = enhancePredictions({
      resumeText,
      jobDescription,
      baseProbability: 65, // Default base probability
      industryDetected: industryMarket.detected.primary,
      hardSkillsFound: skillsSplit.hard.found,
      authorityLanguage: recruiterPsych.authorityLanguage
    });
    console.log('✅ Predictions enhanced. Hire probability:', predictiveEnhanced.hireProbability.point);
    
    // === PHASE 7: SAVE TO DATABASE ===
    console.log('💾 Saving v2 scan results...');
    const scanId = crypto.randomUUID();
    
    // Enhance atsChecks with original input data for title generation
    const enhancedAtsChecks = {
      ...atsChecks,
      originalJobDescription: jobDescription,
      originalJobTitle: jobTitle,
      originalCompanyHint: companyHint
    };

    const v2ScanRecord = await prisma.atsScanV2.create({
      data: {
        id: scanId,
        userId: userId,
        atsChecks: JSON.parse(JSON.stringify(enhancedAtsChecks)),
        skillsSplit: JSON.parse(JSON.stringify(skillsSplit)),
        recruiterPsych: JSON.parse(JSON.stringify(recruiterPsych)),
        industryJson: JSON.parse(JSON.stringify(industryMarket)),
        marketJson: JSON.parse(JSON.stringify({ skillDemandHeatmap: industryMarket.skillDemandHeatmap })),
        companyOpt: companyOptimization.enabled ? JSON.parse(JSON.stringify(companyOptimization)) : null,
        predictiveV2: JSON.parse(JSON.stringify(predictiveEnhanced)),
      }
    });
    console.log('✅ V2 scan saved with ID:', scanId);
    
    // === PHASE 7.5: GENERATE AI TITLE FOR SCAN ===
    console.log('🤖 Generating AI title for scan...');
    try {
      const generatedTitle = await generateAITitleForScan({
        atsChecks: enhancedAtsChecks,
        industryJson: industryMarket,
        companyOpt: companyOptimization
      });
      
      console.log('✅ Generated title:', generatedTitle);
      
      // Update the scan with the generated title
      const updatedAtsChecks = {
        ...enhancedAtsChecks,
        customTitle: generatedTitle,
        jobTitleMatch: {
          ...enhancedAtsChecks.jobTitleMatch,
          title: generatedTitle
        }
      };
      
      await prisma.atsScanV2.update({
        where: { id: scanId },
        data: { atsChecks: JSON.parse(JSON.stringify(updatedAtsChecks)) }
      });
      
      console.log('✅ Title saved to scan record');
    } catch (titleError) {
      console.error('❌ Failed to generate or save title:', titleError);
      // Continue with scan creation even if title generation fails
    }
    
    // === PHASE 8: CALCULATE OVERALL SCORE V2 ===
    const { available, total } = calculateSignalAvailability({
      atsChecks,
      skills: skillsSplit,
      recruiterPsychology: recruiterPsych,
      industry: industryMarket,
      companyOptimization,
      predictive: predictiveEnhanced
    });

    // Helper functions for this scan
    const calculateKeywordDensityForScan = () => calculateKeywordDensity(resumeText, jobDescription);
    const extractExperienceYearsForScan = () => extractExperienceYears(resumeText);
    const extractRequiredYearsForScan = () => extractRequiredYears(jobDescription);

    const subScores = {
      // A: Foundational ATS & Searchability (40%)
      A1: subs.A1({ 
        mime: (req as any).resumeFileMeta?.mime, 
        ocr: false, // OCR data not available in current structure
        multiColumn: false, // Layout data not available
        tables: false // Table data not available
      }),
      A2: subs.A2({ 
        hasExp: atsChecks?.sections?.experience, 
        hasEdu: atsChecks?.sections?.education, 
        hasSkills: atsChecks?.sections?.skills, 
        hasSummary: atsChecks?.sections?.summary 
      }),
      A3: subs.A3({ 
        email: atsChecks?.contact?.email, 
        phone: atsChecks?.contact?.phone, 
        location: atsChecks?.contact?.location 
      }),
      A4: subs.A4({ datesValid: atsChecks?.datesValid }),
      A5: subs.A5({ filename: (req as any).resumeFileMeta?.filename }),
      A6: subs.A6({ 
        exact: atsChecks?.jobTitleMatch?.exact, 
        similarity: atsChecks?.jobTitleMatch?.normalizedSimilarity 
      }),
      A7: subs.A7({ words: atsChecks?.wordCount }),
      A8: subs.A8({ 
        linkedin: atsChecks?.contact?.links?.includes("linkedin"), 
        portfolio: atsChecks?.contact?.links?.some((l: string) => l !== "linkedin") 
      }),
      A9: subs.A9({ 
        hasTextBoxes: false, // Formatting data not available
        headersFooters: false, // Formatting data not available
        graphicsDensity: 0 // Formatting data not available
      }),

      // B: Relevancy & Skills (35%)
      B1: subs.B1({ 
        jdSkills: skillsSplit?.hard ? 
          [...(skillsSplit.hard.found || []).map((skill: string) => ({ name: skill, criticality: 'required', found: true })),
           ...(skillsSplit.hard.missing || []).map((skill: string) => ({ name: skill, criticality: 'required', found: false }))]
          : []
      }),
      B2: subs.B2({ 
        softExpected: Math.max(3, Math.min(8, (skillsSplit?.soft?.found?.length || 0) + (skillsSplit?.soft?.missing?.length || 0))),
        softFound: skillsSplit?.soft?.found?.length || 0
      }),
      B3: subs.B3({ transferable: skillsSplit?.transferable || [] }),
      B4: subs.B4({ 
        densityPerK: calculateKeywordDensityForScan() 
      }),
      B5: subs.B5({ 
        yearsCandidate: extractExperienceYearsForScan(),
        yearsRequired: extractRequiredYearsForScan()
      }),

      // C: Recruiter Psychology (10%)
      C1: subs.C1({ readabilityScore: recruiterPsych?.sixSecondImpression }),
      C2: subs.C2({ 
        strongVerbPct: recruiterPsych?.authorityLanguage?.strong?.length || 0, 
        weakVerbPct: recruiterPsych?.authorityLanguage?.weak?.length || 0
      }),
      C3: subs.C3({ coherence: recruiterPsych?.narrativeCoherence }),
      redFlagPenalty: subs.redPenalty({
        jobHopping: recruiterPsych?.redFlags?.includes("job_hopping"),
        longGap: recruiterPsych?.redFlags?.includes("gap"),
        inflation: recruiterPsych?.redFlags?.includes("skill_inflation"),
        severeTitleMismatch: recruiterPsych?.redFlags?.includes("title_mismatch_severe"),
      }),

      // D: Market & Company Context (10%) - with fallbacks
      D1: industryMarket?.marketPercentile || 50, // Default to market median if no data
      D2: companyOptimization?.enabled ? subs.D2({
        culture: companyOptimization?.cultureAlignment,
        stack: companyOptimization?.techStackMatch,
        background: companyOptimization?.backgroundFit
      }) : 65, // Default company alignment score
      D3: subs.D3({ 
        competitiveness: industryMarket?.detected?.primary === 'tech' ? 'crowded' : 'normal' 
      }), // Market competitiveness based on industry

      // E: Predictive Enhancements (5%)
      E1: subs.E1({ xFactor: predictiveEnhanced?.hireProbability?.xFactor || 0 }),
      E2: subs.E2({ 
        automationRisk: predictiveEnhanced?.automationRisk || 0.3, 
        futureLeverage: 0.5 // Default future leverage
      }),

      // Meta information
      signalsAvailable: available,
      signalsTotal: total,
    };

    const overallScoreV2 = computeOverallATS(subScores as any);
    
    // Update the database record with scoring data
    await prisma.atsScanV2.update({
      where: { id: scanId },
      data: {
        overallScoreV2: JSON.parse(JSON.stringify(overallScoreV2)),
        subscoresV2: JSON.parse(JSON.stringify(subScores)),
      }
    });
    console.log('✅ V2 scoring data persisted');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`🎉 ATS Advanced Scan V2 completed in ${duration}ms`);
    
    // === PHASE 9: RETURN COMPREHENSIVE RESULTS ===
    return res.json({
      scanId: scanId,
      v1: null, // Could include existing v1 data for backward compatibility if needed
      atsChecks,
      skills: skillsSplit,
      recruiterPsychology: recruiterPsych,
      industry: industryMarket,
      market: {
        skillDemandHeatmap: industryMarket.skillDemandHeatmap
      },
      companyOptimization,
      predictive: predictiveEnhanced,
      
      // V2 Enhanced Scoring System
      overallScoreV2: overallScoreV2,
      subscoresV2: subScores,
      
      // Legacy compatibility
      overallScore: overallScoreV2.overall,
      
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ ATS Advanced Scan V2 failed:', error);
    
    // Return partial results if possible, otherwise error
    return res.status(500).json({
      error: 'V2 analysis failed',
      message: error.message,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ats/advanced-scan/v2/results/:id
 * Retrieve v2 scan results
 */
router.get('/advanced-scan/v2/results/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;
    
    const scanResult = await prisma.atsScanV2.findFirst({
      where: {
        id: id || '',
        userId: userId
      }
    });
    
    if (!scanResult) {
      return res.status(404).json({ error: 'V2 scan results not found' });
    }
    
    // Transform database result back to API format
    const apiResult = {
      scanId: scanResult.id,
      atsChecks: scanResult.atsChecks,
      skills: scanResult.skillsSplit,
      recruiterPsychology: scanResult.recruiterPsych,
      industry: scanResult.industryJson,
      market: scanResult.marketJson,
      companyOptimization: scanResult.companyOpt,
      predictive: scanResult.predictiveV2,
      
      // V2 Enhanced Scoring System
      overallScoreV2: scanResult.overallScoreV2,
      subscoresV2: scanResult.subscoresV2,
      
      // Legacy compatibility
      overallScore: (scanResult.overallScoreV2 as any)?.overall || 75,
      
      createdAt: scanResult.createdAt.toISOString()
    };
    
    return res.json(apiResult);
    
  } catch (error: any) {
    console.error('Failed to retrieve v2 scan results:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve results',
      message: error.message 
    });
  }
});

/**
 * Helper function to extract job title from job description
 */
function extractJobTitle(jobDescription: string): string {
  // Try to extract title from first few lines
  const lines = jobDescription.split('\n').filter(line => line.trim().length > 0);
  
  // Look for common title patterns
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    
    // Skip common non-title lines
    if (/^(job|position|role|about|company|description|overview)/i.test(cleaned)) {
      continue;
    }
    
    // If line looks like a title (reasonable length, no excessive punctuation)
    if (cleaned.length > 3 && cleaned.length < 100 && !/[.]{2,}/.test(cleaned)) {
      return cleaned.replace(/^(title|position|role):\s*/i, '');
    }
  }
  
  // Fallback
  return 'Position';
}

// Helper functions for accurate data extraction

/**
 * Calculate keyword density per 1000 words
 */
function calculateKeywordDensity(resumeText: string, jobDescription: string): number {
  const resumeWords = resumeText.split(/\s+/).length;
  const jobKeywords = extractKeywordsFromJD(jobDescription);
  const resumeLower = resumeText.toLowerCase();
  
  let matchCount = 0;
  jobKeywords.forEach(keyword => {
    if (resumeLower.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  });
  
  return Math.round((matchCount / resumeWords) * 1000);
}

/**
 * Extract key skills/keywords from job description
 */
function extractKeywordsFromJD(jobDescription: string): string[] {
  const commonSkills = [
    'javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes',
    'project management', 'agile', 'scrum', 'leadership', 'communication', 'teamwork',
    'problem solving', 'analytical', 'creative', 'strategic thinking'
  ];
  
  const jdLower = jobDescription.toLowerCase();
  return commonSkills.filter(skill => jdLower.includes(skill));
}

/**
 * Extract years of experience from resume
 */
function extractExperienceYears(resumeText: string): number {
  // Look for experience patterns
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
    /(\d+)\+?\s*years?\s*in/gi,
    /experience:\s*(\d+)\+?\s*years?/gi
  ];
  
  for (const pattern of patterns) {
    const match = resumeText.match(pattern);
    if (match) {
      const years = parseInt(match[0].match(/\d+/)?.[0] || '0');
      if (years > 0 && years <= 50) return years;
    }
  }
  
  // Fallback: count work experience entries
  const workEntries = resumeText.match(/\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|current)/gi);
  if (workEntries && workEntries.length > 0) {
    let totalYears = 0;
    workEntries.forEach(entry => {
      const years = entry.match(/20\d{2}/g);
      if (years && years.length >= 1) {
        const startYear = parseInt(years[0]);
        const endYear = years[1] ? parseInt(years[1]) : new Date().getFullYear();
        totalYears += Math.max(0, endYear - startYear);
      }
    });
    return Math.min(totalYears, 30); // Cap at 30 years
  }
  
  return 2; // Default fallback
}

/**
 * Extract required years from job description
 */
function extractRequiredYears(jobDescription: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience\s*(?:required|preferred|needed)/gi,
    /minimum\s*(?:of\s*)?(\d+)\+?\s*years?/gi,
    /at\s*least\s*(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:relevant\s*)?experience/gi
  ];
  
  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match) {
      const years = parseInt(match[0].match(/\d+/)?.[0] || '0');
      if (years > 0 && years <= 20) return years;
    }
  }
  
  // Look for seniority level indicators
  const jdLower = jobDescription.toLowerCase();
  if (jdLower.includes('senior') || jdLower.includes('lead')) return 5;
  if (jdLower.includes('mid-level') || jdLower.includes('intermediate')) return 3;
  if (jdLower.includes('junior') || jdLower.includes('entry')) return 1;
  
  return 2; // Default fallback
}

// Legacy functions removed - using new V2 scoring engine

/**
 * Old scoring functions replaced by scoreEngine.ts and subscores.ts
 * 
function calculateV2OverallScore_OLD({
  atsChecks,
  skillsSplit,
  recruiterPsych,
  industryMarket,
  companyOptimization,
  predictiveEnhanced
}: {
  atsChecks: any;
  skillsSplit: any;
  recruiterPsych: any;
  industryMarket: any;
  companyOptimization: any;
  predictiveEnhanced: any;
}): number {
  let score = 0;
  let totalWeight = 0;
  
  // ATS Foundational Score (30% weight)
  const atsFoundationalScore = calculateAtsFoundationalScore(atsChecks);
  score += atsFoundationalScore * 0.30;
  totalWeight += 0.30;
  
  // Skills Score (25% weight)
  const skillsScore = calculateSkillsScore(skillsSplit);
  score += skillsScore * 0.25;
  totalWeight += 0.25;
  
  // Recruiter Psychology Score (20% weight)
  const psychScore = (recruiterPsych.sixSecondImpression + recruiterPsych.narrativeCoherence) / 2;
  score += psychScore * 0.20;
  totalWeight += 0.20;
  
  // Market Position Score (15% weight)
  score += industryMarket.marketPercentile * 0.15;
  totalWeight += 0.15;
  
  // Company Optimization Bonus (10% weight, if enabled)
  if (companyOptimization.enabled) {
    const companyScore = (companyOptimization.cultureAlignment + companyOptimization.techStackMatch + companyOptimization.backgroundFit) / 3;
    score += companyScore * 0.10;
    totalWeight += 0.10;
  }
  
  return Math.round(score / totalWeight);
}

/**
 * Calculate ATS foundational score
 */
function calculateAtsFoundationalScore(atsChecks: any): number {
  let score = 0;
  let checks = 0;
  
  // File checks (10 points each)
  if (atsChecks.fileTypeOk) score += 10;
  if (atsChecks.fileNameOk) score += 10;
  checks += 2;
  
  // Contact checks (15 points each)
  if (atsChecks.contact.email) score += 15;
  if (atsChecks.contact.phone) score += 15;
  if (atsChecks.contact.location) score += 10;
  checks += 3;
  
  // Section checks (10 points each)
  if (atsChecks.sections.experience) score += 10;
  if (atsChecks.sections.education) score += 10;
  if (atsChecks.sections.skills) score += 10;
  if (atsChecks.sections.summary) score += 5;
  checks += 4;
  
  // Date validity (10 points)
  if (atsChecks.datesValid) score += 10;
  checks += 1;
  
  // Word count status (10 points)
  if (atsChecks.wordCountStatus === 'optimal') score += 10;
  else if (atsChecks.wordCountStatus === 'under') score += 5;
  else score += 3; // over
  checks += 1;
  
  // Job title match (15 points)
  if (atsChecks.jobTitleMatch.exact) score += 15;
  else if (atsChecks.jobTitleMatch.normalizedSimilarity > 0.8) score += 12;
  else if (atsChecks.jobTitleMatch.normalizedSimilarity > 0.6) score += 8;
  else score += 3;
  checks += 1;
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate skills score
 */
function calculateSkillsScore(skillsSplit: any): number {
  let score = 50; // Base score
  
  // Hard skills bonus
  score += Math.min(30, skillsSplit.hard.found.length * 3);
  
  // Soft skills bonus
  score += Math.min(15, skillsSplit.soft.found.length * 2);
  
  // Penalty for missing critical hard skills
  const criticalMissing = Object.values(skillsSplit.hard.impactWeights).filter((weight: any) => weight <= -20).length;
  score += criticalMissing * 5; // impactWeights are negative, so this reduces score
  
  // Transferable skills bonus
  score += Math.min(10, skillsSplit.transferable.length * 5);
  
  return Math.max(0, Math.min(100, score));
}

export default router;
