/**
 * Recruiter Psychology Service - AI-powered recruiter psychology insights
 */

import { askGeminiJSON } from '../lib/gemini';

interface RecruiterPsychInput {
  resumeText: string;
  jobDescription: string;
}

interface RecruiterPsychResult {
  sixSecondImpression: number;
  authorityLanguage: {
    strong: string[];
    weak: string[];
  };
  narrativeCoherence: number;
  redFlags: string[];
  badges: Array<{
    type: string;
    severity: "info" | "warn" | "error";
    message: string;
  }>;
}

export async function analyzeRecruiterPsychology({ resumeText, jobDescription }: RecruiterPsychInput): Promise<RecruiterPsychResult> {
  const prompt = `You are a senior recruiter with 15+ years of experience. Analyze the resume below from a recruiter psychology perspective. Return JSON ONLY.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Analyze and score based on:
1. Six-second impression (0-100): What a recruiter sees in the first 6 seconds
2. Authority language: Strong vs weak action words used
3. Narrative coherence (0-100): How well the career story flows
4. Red flags: Common issues that concern recruiters
5. Badges: Specific issues or achievements to highlight

Return this exact JSON structure:
{
  "sixSecondImpression": 0-100,
  "authorityLanguage": { 
    "strong": ["led", "owned", "drove", "achieved", "built", "launched"],
    "weak": ["helped", "assisted", "participated", "was responsible for", "worked on", "involved in"]
  },
  "narrativeCoherence": 0-100,
  "redFlags": ["job_hopping", "employment_gap", "skill_inflation", "unclear_progression", "formatting_issues", "typos", "overqualified", "underqualified"],
  "badges": [
    { "type": "gap", "severity": "warn", "message": "6-month employment gap in 2022" },
    { "type": "achievement", "severity": "info", "message": "Consistent career progression" },
    { "type": "format", "severity": "error", "message": "Poor formatting affects readability" }
  ]
}

Focus on practical recruiter concerns like:
- Clear contact information
- Logical career progression
- Quantified achievements
- Appropriate length
- Professional formatting
- Skills alignment with job requirements
- Authority in language choices
- Red flags that would make a recruiter skip this resume`;

  try {
    const result = await askGeminiJSON(prompt, "flash");
    
    // Validate and provide fallbacks
    if (result.fallback) {
      return getFallbackPsychAnalysis(resumeText, jobDescription);
    }
    
    return {
      sixSecondImpression: Math.max(0, Math.min(100, result.sixSecondImpression || 50)),
      authorityLanguage: {
        strong: Array.isArray(result.authorityLanguage?.strong) ? result.authorityLanguage.strong : [],
        weak: Array.isArray(result.authorityLanguage?.weak) ? result.authorityLanguage.weak : []
      },
      narrativeCoherence: Math.max(0, Math.min(100, result.narrativeCoherence || 50)),
      redFlags: Array.isArray(result.redFlags) ? result.redFlags : [],
      badges: Array.isArray(result.badges) ? result.badges : []
    };
  } catch (error) {
    console.error('Recruiter psychology analysis failed:', error);
    return getFallbackPsychAnalysis(resumeText, jobDescription);
  }
}

/**
 * Fallback analysis using heuristics when AI fails
 */
function getFallbackPsychAnalysis(resumeText: string, jobDescription: string): RecruiterPsychResult {
  const badges: Array<{type: string; severity: "info" | "warn" | "error"; message: string}> = [];
  const redFlags: string[] = [];
  
  // Basic checks for six-second impression
  let sixSecondScore = 70; // Start with neutral
  
  // Contact information check
  if (!/[\w.+-]+@[\w-]+\.[\w.-]+/i.test(resumeText)) {
    sixSecondScore -= 20;
    badges.push({
      type: "contact",
      severity: "error",
      message: "Missing email address"
    });
    redFlags.push("missing_contact");
  }
  
  // Phone number check
  if (!/(\+?\d[\d\s\-\(\)]{8,})/.test(resumeText)) {
    sixSecondScore -= 10;
    badges.push({
      type: "contact",
      severity: "warn",
      message: "Missing phone number"
    });
  }
  
  // Length check
  const wordCount = resumeText.trim().split(/\s+/).length;
  if (wordCount < 300) {
    sixSecondScore -= 15;
    badges.push({
      type: "length",
      severity: "warn",
      message: "Resume appears too short"
    });
  } else if (wordCount > 1500) {
    sixSecondScore -= 10;
    badges.push({
      type: "length",
      severity: "warn",
      message: "Resume may be too long"
    });
    redFlags.push("too_lengthy");
  }
  
  // Employment gaps detection (simple heuristic)
  const years = resumeText.match(/\b20\d{2}\b/g) || [];
  const currentYear = new Date().getFullYear();
  const latestYear = Math.max(...years.map(y => parseInt(y)));
  
  if (currentYear - latestYear > 1) {
    redFlags.push("employment_gap");
    badges.push({
      type: "gap",
      severity: "warn",
      message: `Potential employment gap since ${latestYear}`
    });
    sixSecondScore -= 15;
  }
  
  // Authority language analysis
  const strongWords = ["led", "managed", "drove", "achieved", "built", "launched", "created", "developed", "improved", "increased", "optimized"];
  const weakWords = ["helped", "assisted", "participated", "was responsible for", "worked on", "involved in", "contributed to"];
  
  const foundStrong = strongWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(resumeText)
  );
  const foundWeak = weakWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(resumeText)
  );
  
  // Narrative coherence (simple scoring)
  let narrativeScore = 60;
  
  // Check for consistent formatting
  if (/^\s*[•\-\*]/.test(resumeText) || /\d+\./.test(resumeText)) {
    narrativeScore += 10;
  }
  
  // Check for quantified achievements
  if (/\d+%|\$\d+|increased|decreased|improved by/.test(resumeText)) {
    narrativeScore += 15;
    sixSecondScore += 10;
  }
  
  // Check for skills section
  if (/skills|competencies|technical/i.test(resumeText)) {
    narrativeScore += 10;
    sixSecondScore += 5;
  }
  
  return {
    sixSecondImpression: Math.max(0, Math.min(100, sixSecondScore)),
    authorityLanguage: {
      strong: foundStrong,
      weak: foundWeak
    },
    narrativeCoherence: Math.max(0, Math.min(100, narrativeScore)),
    redFlags,
    badges
  };
}
