/**
 * ATS Advanced Scan V2 - Enhanced foundational features orchestrator
 * Keeps v1 intact while adding comprehensive ATS checks, recruiter psychology, and market intelligence
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Import all v2 services
import { runAtsChecks } from '../services/atsChecks.service';
import { splitSkills } from '../services/skillsSplit.service';
import { analyzeRecruiterPsychology } from '../services/recruiterPsych.service';
import { analyzeIndustryMarket } from '../services/industryMarket.service';
import { optimizeForCompany } from '../services/companyOptimization.service';
import { enhancePredictions } from '../services/predictiveEnhanced.service';

const router: Router = Router();
const prisma = new PrismaClient();

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Import Firebase Admin SDK dynamically
    const firebase = await import('../lib/firebase');
    const decodedToken = await firebase.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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
    
    const v2ScanRecord = await prisma.atsScanV2.create({
      data: {
        id: scanId,
        userId: userId,
        atsChecks: JSON.parse(JSON.stringify(atsChecks)),
        skillsSplit: JSON.parse(JSON.stringify(skillsSplit)),
        recruiterPsych: JSON.parse(JSON.stringify(recruiterPsych)),
        industryJson: JSON.parse(JSON.stringify(industryMarket)),
        marketJson: JSON.parse(JSON.stringify({ skillDemandHeatmap: industryMarket.skillDemandHeatmap })),
        companyOpt: companyOptimization.enabled ? JSON.parse(JSON.stringify(companyOptimization)) : null,
        predictiveV2: JSON.parse(JSON.stringify(predictiveEnhanced)),
      }
    });
    console.log('✅ V2 scan saved with ID:', scanId);
    
    // === PHASE 8: CALCULATE OVERALL SCORE ===
    const overallScore = calculateV2OverallScore({
      atsChecks,
      skillsSplit,
      recruiterPsych,
      industryMarket,
      companyOptimization,
      predictiveEnhanced
    });
    
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
      overallScore,
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

/**
 * Calculate overall V2 score based on all components
 */
function calculateV2OverallScore({
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
