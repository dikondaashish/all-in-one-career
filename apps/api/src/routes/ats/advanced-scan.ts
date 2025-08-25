import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

// Import all services
import { analyzeATS, analyzeJobTitleMatch, analyzeWordStats, detectWebPresence } from '../../services/atsChecks';
import { extractSkillIntelligence } from '../../services/skills';
import { detectIndustry, getMarketIntel, generateIndustryRecommendations } from '../../services/marketIndustry';
import { analyzeCompanyFit, shouldAnalyzeCompany } from '../../services/companyFit';
import { analyzeRecruiterPsychology, analyzeSpecificConcerns, generateRecruiterOptimizations } from '../../services/recruiterPsych';
import { generatePredictions, generateInterviewPrep, generateNegotiationStrategy } from '../../services/predictions';
import { calculateOverallScore } from '../../services/aggregate';
import { putObject, generateS3Key, isS3Configured } from '../../lib/s3';

const router: Router = Router();
const prisma = new PrismaClient();

// Rate limiting: 10 scans per hour per user
const scanRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Rate limit exceeded. Maximum 10 scans per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
async function authenticateUser(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Import Firebase Admin SDK dynamically
    const firebase = await import('../../lib/firebase');
    const decodedToken = await firebase.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * POST /api/ats/advanced-scan
 * Comprehensive ATS analysis with all missing features
 */
router.post('/advanced-scan', scanRateLimit, authenticateUser, async (req: any, res: Response) => {
  const startTime = Date.now();
  console.log('🚀 Starting advanced ATS scan...');

  try {
    const { resumeText, jobDescription, jobUrl, fileMeta } = req.body;
    const userId = req.user.uid;

    // Validate inputs
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'resumeText and jobDescription are required' 
      });
    }

    if (resumeText.length < 100) {
      return res.status(400).json({ 
        error: 'Resume too short', 
        details: 'Resume must be at least 100 characters' 
      });
    }

    console.log('📝 Input validation passed');

    // Optional S3 upload for resume storage
    let resumeObjectKey: string | null = null;
    if (fileMeta && isS3Configured()) {
      try {
        const s3Key = generateS3Key(userId, fileMeta.name, fileMeta.type);
        const resumeBuffer = Buffer.from(resumeText, 'utf-8');
        await putObject(resumeBuffer, s3Key, 'text/plain');
        resumeObjectKey = s3Key;
        console.log('📁 Resume uploaded to S3');
      } catch (s3Error) {
        console.warn('⚠️ S3 upload failed:', s3Error);
        // Continue without S3 - not critical
      }
    }

    // Step 1: ATS Compatibility Analysis
    console.log('🔍 Step 1: ATS compatibility analysis...');
    const atsCompatibility = analyzeATS(resumeText, fileMeta || { name: 'resume.txt', type: 'text/plain' });
    
    // Step 2: Job Title Match Analysis
    console.log('🎯 Step 2: Job title match analysis...');
    const jobTitle = extractJobTitle(jobDescription);
    const jobTitleMatch = analyzeJobTitleMatch(resumeText, jobTitle);
    
    // Step 3: Word Stats & Web Presence
    console.log('📊 Step 3: Word stats and web presence...');
    const wordStats = analyzeWordStats(resumeText);
    const webPresence = detectWebPresence(resumeText);

    // Step 4: Skill Intelligence Analysis
    console.log('🧠 Step 4: Skill intelligence extraction...');
    const skillIntel = await extractSkillIntelligence(resumeText, jobDescription);

    // Step 5: Industry Detection
    console.log('🏭 Step 5: Industry intelligence detection...');
    const industryIntel = await detectIndustry(resumeText, jobDescription);

    // Step 6: Market Intelligence
    console.log('📈 Step 6: Market intelligence analysis...');
    const marketIntel = await getMarketIntel(
      industryIntel.primary,
      skillIntel.hardFound.concat(skillIntel.softFound),
      skillIntel.hardMissing.concat(skillIntel.softMissing)
    );

    // Step 7: Recruiter Psychology Analysis
    console.log('👁️ Step 7: Recruiter psychology analysis...');
    const recruiterPsych = await analyzeRecruiterPsychology(resumeText, jobDescription);
    const recruiterConcerns = analyzeSpecificConcerns(resumeText);
    const recruiterOptimizations = generateRecruiterOptimizations(recruiterPsych, recruiterConcerns);

    // Step 8: Company Fit Analysis (if applicable)
    console.log('🏢 Step 8: Company fit analysis...');
    let companyFit = null;
    if (shouldAnalyzeCompany(jobUrl)) {
      companyFit = await analyzeCompanyFit(resumeText, jobDescription, jobUrl);
    }

    // Step 9: Comprehensive Predictions
    console.log('🔮 Step 9: Predictions generation...');
    const predictions = await generatePredictions(
      skillIntel,
      recruiterPsych,
      marketIntel,
      industryIntel,
      atsCompatibility,
      resumeText,
      jobDescription
    );

    // Step 10: Overall Score & Analysis
    console.log('🎯 Step 10: Overall scoring and analysis...');
    const overallAnalysis = calculateOverallScore(
      atsCompatibility,
      jobTitleMatch,
      skillIntel,
      recruiterPsych,
      marketIntel,
      industryIntel,
      predictions,
      wordStats,
      companyFit || undefined
    );

    // Step 11: Generate Strategic Recommendations
    console.log('📋 Step 11: Strategic recommendations...');
    const industryRecommendations = await generateIndustryRecommendations(
      industryIntel.primary,
      skillIntel.hardMissing,
      marketIntel
    );

    const interviewPrep = generateInterviewPrep(predictions, skillIntel, industryIntel);
    const negotiationStrategy = generateNegotiationStrategy(predictions, marketIntel, skillIntel);

    // Build strategy object
    const strategy = {
      nextRoles: generateNextRoles(industryIntel, skillIntel, predictions),
      prioritySkills: generatePrioritySkills(skillIntel, marketIntel),
      actionsShortTerm: [
        ...overallAnalysis.priorityFixes.slice(0, 3),
        ...recruiterOptimizations.slice(0, 2)
      ],
      actionsLongTerm: [
        ...industryRecommendations.slice(0, 3),
        ...interviewPrep.technical.slice(0, 2)
      ]
    };

    // Step 12: Save to Database
    console.log('💾 Step 12: Saving to database...');
    const scanRecord = await prisma.aTSScanAdvanced.create({
      data: {
        userId,
        resumeObjectKey,
        jdUrl: jobUrl || null,
        overallScore: overallAnalysis.overallScore,
        percentile: overallAnalysis.percentile,
        atsCompatibility: JSON.parse(JSON.stringify(atsCompatibility)),
        jobTitleMatch: JSON.parse(JSON.stringify(jobTitleMatch)),
        skills: JSON.parse(JSON.stringify(skillIntel)),
        recruiterPsych: JSON.parse(JSON.stringify({
          ...recruiterPsych,
          concerns: recruiterConcerns,
          optimizations: recruiterOptimizations
        })),
        marketIntel: JSON.parse(JSON.stringify(marketIntel)),
        industryIntel: JSON.parse(JSON.stringify(industryIntel)),
        companyFit: companyFit ? JSON.parse(JSON.stringify(companyFit)) : null,
        predictions: JSON.parse(JSON.stringify(predictions)),
        strategy: JSON.parse(JSON.stringify(strategy)),
        wordStats: JSON.parse(JSON.stringify(wordStats)),
        webPresence: JSON.parse(JSON.stringify(webPresence)),
      },
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ Advanced ATS scan completed in ${processingTime}ms`);

    // Return comprehensive response
    res.json({
      scanId: scanRecord.id,
      overallScore: overallAnalysis.overallScore,
      percentile: overallAnalysis.percentile,
      breakdown: overallAnalysis.breakdownScores,
      strengths: overallAnalysis.topStrengths,
      weaknesses: overallAnalysis.topWeaknesses,
      atsCompatibility,
      jobTitleMatch,
      skills: skillIntel,
      recruiterPsych: {
        ...recruiterPsych,
        concerns: recruiterConcerns,
        optimizations: recruiterOptimizations,
      },
      marketIntel,
      industryIntel,
      companyFit,
      predictions,
      strategy,
      wordStats,
      webPresence,
      interviewPrep,
      negotiationStrategy,
      processingTime,
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Advanced ATS scan failed:', error);
    
    res.status(500).json({
      error: 'Advanced analysis failed',
      message: error.message,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/ats/advanced-results/:id
 * Retrieve advanced scan results
 */
router.get('/advanced-results/:id', authenticateUser, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const scanResult = await prisma.aTSScanAdvanced.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!scanResult) {
      return res.status(404).json({ error: 'Scan results not found' });
    }

    res.json({
      results: scanResult,
    });

  } catch (error) {
    console.error('Failed to fetch advanced scan results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Helper functions

function extractJobTitle(jobDescription: string): string {
  const lines = jobDescription.split('\n').filter(line => line.trim().length > 0);
  
  // Try to find job title in first few lines
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && trimmed.length < 50 && !trimmed.includes('.') && !trimmed.includes(',')) {
      return trimmed;
    }
  }
  
  return 'Software Engineer'; // Fallback
}

function generateNextRoles(
  industryIntel: any,
  skillIntel: any,
  predictions: any
): Array<{ title: string; timeframe: string; probability: number; salaryRange: [number, number] }> {
  const currentLevel = inferCurrentLevel(skillIntel);
  const baseSalary = predictions.salaryPlaybook.market;
  
  return [
    {
      title: `Senior ${currentLevel}`,
      timeframe: '12-18 months',
      probability: 75,
      salaryRange: [Math.round(baseSalary * 1.2), Math.round(baseSalary * 1.4)] as [number, number]
    },
    {
      title: `Lead ${currentLevel}`,
      timeframe: '2-3 years',
      probability: 60,
      salaryRange: [Math.round(baseSalary * 1.4), Math.round(baseSalary * 1.7)] as [number, number]
    },
    {
      title: `Manager/Director`,
      timeframe: '3-5 years',
      probability: 45,
      salaryRange: [Math.round(baseSalary * 1.6), Math.round(baseSalary * 2.0)] as [number, number]
    }
  ];
}

function generatePrioritySkills(
  skillIntel: any,
  marketIntel: any
): Array<{ skill: string; importance: 'CRITICAL' | 'IMPORTANT' | 'NICE'; timeToAcquire: string }> {
  const prioritySkills: Array<{ skill: string; importance: 'CRITICAL' | 'IMPORTANT' | 'NICE'; timeToAcquire: string }> = [];
  
  // Critical missing skills
  skillIntel.hardMissing.slice(0, 3).forEach((skill: string) => {
    const isHot = marketIntel.hot.includes(skill);
    prioritySkills.push({
      skill,
      importance: isHot ? 'CRITICAL' : 'IMPORTANT',
      timeToAcquire: isHot ? '1-3 months' : '3-6 months'
    });
  });
  
  // Important hot skills not in missing (growth opportunities)
  marketIntel.hot.slice(0, 2).forEach((skill: string) => {
    if (!skillIntel.hardFound.includes(skill) && !skillIntel.hardMissing.includes(skill)) {
      prioritySkills.push({
        skill,
        importance: 'NICE',
        timeToAcquire: '6-12 months'
      });
    }
  });
  
  return prioritySkills.slice(0, 5);
}

function inferCurrentLevel(skillIntel: any): string {
  const skillCount = skillIntel.hardFound.length;
  
  if (skillCount > 15) return 'Engineer';
  if (skillCount > 10) return 'Developer';
  if (skillCount > 5) return 'Associate';
  return 'Analyst';
}

export default router;
