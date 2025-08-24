import { Router, Request, Response, NextFunction } from 'express';
import { AdvancedGeminiAnalyzer } from '../lib/gemini/advanced-analyzer';
import { IndustryIntelligenceEngine } from '../lib/intelligence/industry-analyzer';
import { HireProbabilityEngine } from '../lib/prediction/hire-probability';
import { MarketIntelligenceEngine } from '../lib/market/intelligence-engine';
import { InterviewReadinessEngine } from '../lib/prediction/interview-readiness';
import { SalaryNegotiationEngine } from '../lib/prediction/salary-negotiation';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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

// Advanced ATS Scan endpoint
router.post('/advanced-scan', authenticateToken, async (req: any, res) => {
  try {
    const { resumeText, jobDescription, companyName } = req.body;
    const userId = req.user.uid;

    console.log('🚀 Starting Advanced ATS Analysis...');

    // Initialize all engines
    const geminiAnalyzer = new AdvancedGeminiAnalyzer();
    const industryEngine = new IndustryIntelligenceEngine();
    const hireProbEngine = new HireProbabilityEngine();
    const marketEngine = new MarketIntelligenceEngine();
    const interviewEngine = new InterviewReadinessEngine();
    const salaryEngine = new SalaryNegotiationEngine();

    // Step 1: Advanced Gemini Analysis
    console.log('🧠 Starting Advanced AI Analysis...');
    const analysisRequest: any = {
      resumeText,
      jobDescription
    };
    
    if (companyName) {
      analysisRequest.industryContext = `Company: ${companyName}`;
    }
    
    const revolutionaryScoring = await geminiAnalyzer.performAdvancedAnalysis(analysisRequest);

    // Step 2: Industry Intelligence Detection
    console.log('🏭 Detecting Industry Intelligence...');
    const industryIntel = await industryEngine.detectIndustry(resumeText, jobDescription);

    // Step 3: Market Intelligence Analysis
    console.log('📈 Analyzing Market Position...');
    const skillsList = revolutionaryScoring.skillRelevancy.contextualMatches.map(m => m.skillName);
    const marketAdjustedScore = await marketEngine.getMarketAdjustedScore(
      revolutionaryScoring.skillRelevancy.score,
      skillsList,
      industryIntel.industryDetection.primary
    );

    // Step 4: Hire Probability Prediction
    console.log('🎯 Calculating Hire Probability...');
    const hireProbability = await hireProbEngine.calculateHireChance(
      revolutionaryScoring,
      jobDescription,
      industryIntel
    );

    // Step 5: Interview Readiness Assessment
    console.log('📝 Assessing Interview Readiness...');
    const interviewReadiness = await interviewEngine.predictInterviewSuccess(
      revolutionaryScoring,
      jobDescription,
      undefined, // Company profile would go here
      industryIntel
    );

    // Step 6: Salary Negotiation Intelligence
    console.log('💰 Calculating Salary Intelligence...');
    const salaryNegotiation = await salaryEngine.calculateNegotiationPower(
      revolutionaryScoring,
      jobDescription,
      {
        skillDemand: {},
        industryTrends: {},
        locationFactors: {}
      }
    );

    // Step 7: Calculate Overall Advanced Score
    const overallScore = calculateAdvancedOverallScore({
      revolutionaryScoring,
      hireProbability,
      marketAdjustedScore,
      industryIntel
    });

    // Step 8: Save to Database
    console.log('💾 Saving Advanced Analysis...');
    const scanResult = await prisma.atsScanAdvanced.create({
      data: {
        userId,
        overallScore,
        matchRate: hireProbability.probability,
        searchability: marketAdjustedScore.adjustedScore,
        atsCompatibility: revolutionaryScoring.recruiterAppeal.firstImpressionScore,
        
        // Advanced Intelligence Data
        skillRelevancy: revolutionaryScoring.skillRelevancy,
        careerTrajectory: revolutionaryScoring.careerTrajectory,
        impactScore: revolutionaryScoring.impactScore,
        recruiterAppeal: revolutionaryScoring.recruiterAppeal,
        redFlags: revolutionaryScoring.redFlags,
        
        industryDetection: JSON.parse(JSON.stringify(industryIntel.industryDetection)),
        industryScoring: JSON.parse(JSON.stringify(industryIntel.industrySpecificScoring)),
        
        hireProbability: JSON.parse(JSON.stringify(hireProbability)),
        interviewReadiness: JSON.parse(JSON.stringify(interviewReadiness)),
        salaryNegotiation: JSON.parse(JSON.stringify(salaryNegotiation)),
        
        marketPosition: JSON.parse(JSON.stringify(marketAdjustedScore)),
        skillDemand: JSON.parse(JSON.stringify(marketAdjustedScore.marketFactors)),
        
        // Original content
        resumeText,
        jobDescription,
        companyName: companyName || null,
        
        // Legacy fields for compatibility
        detailedAnalysis: {
          contactInformation: { score: 90, status: 'excellent', feedback: 'Complete contact information' },
          professionalSummary: { score: revolutionaryScoring.recruiterAppeal.storytellingQuality, status: 'good', feedback: 'Strong narrative coherence' },
          technicalSkills: { score: revolutionaryScoring.skillRelevancy.score, status: 'excellent', feedback: 'Well-aligned skills' },
          qualifiedAchievements: { score: revolutionaryScoring.impactScore.quantificationQuality, status: 'good', feedback: 'Good quantification of achievements' },
          educationCertifications: { score: 80, status: 'good', feedback: 'Relevant background' },
          atsFormat: { score: revolutionaryScoring.recruiterAppeal.firstImpressionScore, status: 'excellent', feedback: 'ATS-friendly format' }
        },
        hardSkillsFound: skillsList.slice(0, 10),
        hardSkillsMissing: industryIntel.industrySpecificScoring.techStack.required.filter(req => 
          !skillsList.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
        ).slice(0, 8),
        recruiterTips: [
          {
            category: 'Skills',
            title: 'Skill Enhancement',
            description: 'Focus on high-demand skills in your industry',
            priority: 'high'
          },
          {
            category: 'Experience',
            title: 'Achievement Quantification',
            description: 'Add more specific metrics to demonstrate impact',
            priority: 'medium'
          }
        ],
        keywordAnalysis: {
          totalJobKeywords: 25,
          foundKeywords: skillsList.slice(0, 8),
          missingKeywords: industryIntel.industrySpecificScoring.techStack.preferred.slice(0, 5),
          optimizationSuggestions: marketAdjustedScore.recommendations.slice(0, 3)
        },
        improvementSuggestions: marketAdjustedScore.recommendations
      }
    });

    console.log('✅ Advanced Analysis Complete!');
    
    res.json({
      success: true,
      scanId: scanResult.id,
      results: {
        overallScore,
        matchRate: hireProbability.probability,
        searchability: marketAdjustedScore.adjustedScore,
        atsCompatibility: revolutionaryScoring.recruiterAppeal.firstImpressionScore,
        
        // Advanced features
        skillRelevancy: revolutionaryScoring.skillRelevancy,
        careerTrajectory: revolutionaryScoring.careerTrajectory,
        impactScore: revolutionaryScoring.impactScore,
        recruiterAppeal: revolutionaryScoring.recruiterAppeal,
        redFlags: revolutionaryScoring.redFlags,
        
        industryIntel: industryIntel,
        marketPosition: marketAdjustedScore,
        
        hireProbability: hireProbability,
        interviewReadiness: interviewReadiness,
        salaryNegotiation: salaryNegotiation
      }
    });

  } catch (error: any) {
    console.error('Advanced ATS analysis failed:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message,
      details: 'Please try again with valid resume and job description content.'
    });
  }
});

// Get advanced scan results
router.get('/advanced-results/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const scanResult = await prisma.atsScanAdvanced.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!scanResult) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({
      success: true,
      results: {
        id: scanResult.id,
        overallScore: scanResult.overallScore,
        matchRate: scanResult.matchRate,
        searchability: scanResult.searchability,
        atsCompatibility: scanResult.atsCompatibility,
        
        // Advanced features
        skillRelevancy: scanResult.skillRelevancy,
        careerTrajectory: scanResult.careerTrajectory,
        impactScore: scanResult.impactScore,
        recruiterAppeal: scanResult.recruiterAppeal,
        redFlags: scanResult.redFlags,
        
        industryIntel: {
          industryDetection: scanResult.industryDetection,
          industrySpecificScoring: scanResult.industryScoring
        },
        marketPosition: scanResult.marketPosition,
        
        hireProbability: scanResult.hireProbability,
        interviewReadiness: scanResult.interviewReadiness,
        salaryNegotiation: scanResult.salaryNegotiation,
        
        // Legacy compatibility
        detailedAnalysis: scanResult.detailedAnalysis,
        hardSkillsFound: scanResult.hardSkillsFound,
        hardSkillsMissing: scanResult.hardSkillsMissing,
        recruiterTips: scanResult.recruiterTips,
        keywordAnalysis: scanResult.keywordAnalysis,
        improvementSuggestions: scanResult.improvementSuggestions,
        
        createdAt: scanResult.createdAt
      }
    });

  } catch (error: any) {
    console.error('Failed to get advanced scan results:', error);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
});

// Helper function to calculate overall advanced score
function calculateAdvancedOverallScore({
  revolutionaryScoring,
  hireProbability,
  marketAdjustedScore,
  industryIntel
}: any): number {
  const weights = {
    skillRelevancy: 0.25,
    careerTrajectory: 0.20,
    hireProbability: 0.20,
    marketPosition: 0.15,
    recruiterAppeal: 0.10,
    impactScore: 0.10
  };

  const score = Math.round(
    (revolutionaryScoring.skillRelevancy.score * weights.skillRelevancy) +
    (revolutionaryScoring.careerTrajectory.score * weights.careerTrajectory) +
    (hireProbability.probability * weights.hireProbability) +
    (marketAdjustedScore.adjustedScore * weights.marketPosition) +
    (revolutionaryScoring.recruiterAppeal.firstImpressionScore * weights.recruiterAppeal) +
    (revolutionaryScoring.impactScore.quantificationQuality * weights.impactScore)
  );

  return Math.min(100, Math.max(0, score));
}

export default router;
