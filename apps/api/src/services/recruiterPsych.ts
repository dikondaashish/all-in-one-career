// Recruiter Psychology Analysis Service

import { generateJsonWithFallback } from '../lib/gemini';

export interface RecruiterPsych {
  first6s: number;
  authority: number;
  narrative: number;
  redFlags: string[];
  recruiterTips: string[];
}

/**
 * Analyze resume from recruiter psychology perspective
 */
export async function analyzeRecruiterPsychology(
  resumeText: string,
  jobDescription: string
): Promise<RecruiterPsych> {
  console.log('👁️ Starting recruiter psychology analysis');

  try {
    // Use Gemini for detailed psychological analysis
    const analysis = await generateRecruiterAnalysis(resumeText);
    
    // Generate specific tips based on job description
    const contextualTips = await generateContextualTips(resumeText, jobDescription, analysis);
    
    const result: RecruiterPsych = {
      ...analysis,
      recruiterTips: [...analysis.recruiterTips, ...contextualTips].slice(0, 7), // Max 7 tips
    };

    console.log('✅ Recruiter psychology analysis completed');
    return result;
  } catch (error) {
    console.error('❌ Recruiter psychology analysis failed:', error);
    
    // Fallback analysis
    return generateFallbackAnalysis(resumeText);
  }
}

/**
 * Generate recruiter analysis using Gemini
 */
async function generateRecruiterAnalysis(resumeText: string): Promise<RecruiterPsych> {
  const prompt = `You are a senior recruiter. Return JSON ONLY.

INPUT:
RESUME:
${resumeText}

TASK:
Score first-6-seconds, authority language, narrative coherence (0–100). List red flags and 5–7 recruiter tips.

JSON:
{
  "first6s": 68,
  "authority": 62,
  "narrative": 70,
  "redFlags": ["Job title mismatch with target role","Weak action verbs in 3 bullets"],
  "recruiterTips": [
    "Replace 'assisted' with 'led' where true",
    "Add budget ownership for ad spend",
    "Quantify 3 more bullets with % or $",
    "Mirror job title in summary",
    "Move outdated tech to 'Additional'"
  ]
}`;

  return await generateJsonWithFallback<RecruiterPsych>(prompt);
}

/**
 * Generate contextual tips based on job description
 */
async function generateContextualTips(
  resumeText: string,
  jobDescription: string,
  baseAnalysis: RecruiterPsych
): Promise<string[]> {
  const prompt = `You are a recruitment expert. Return JSON ONLY.

INPUT:
RESUME ANALYSIS:
First 6s Score: ${baseAnalysis.first6s}
Authority Score: ${baseAnalysis.authority}
Red Flags: ${baseAnalysis.redFlags.join(', ')}

JOB DESCRIPTION:
${jobDescription.substring(0, 800)}

RESUME:
${resumeText.substring(0, 800)}

TASK:
Provide 3-5 specific tips to improve this resume for this exact job opportunity.

JSON:
{
  "contextualTips": [
    "Mirror the job title '${jobDescription.split('\n')[0]}' in your professional summary",
    "Add specific metrics that match the job's success criteria",
    "Reorganize skills to match the job's technology stack order"
  ]
}`;

  try {
    const result = await generateJsonWithFallback<{ contextualTips: string[] }>(prompt);
    return result.contextualTips || [];
  } catch (error) {
    console.warn('⚠️ Failed to generate contextual tips:', error);
    return [];
  }
}

/**
 * Generate fallback analysis when AI fails
 */
function generateFallbackAnalysis(resumeText: string): RecruiterPsych {
  const analysis = {
    first6s: 0,
    authority: 0,
    narrative: 0,
    redFlags: [] as string[],
    recruiterTips: [] as string[],
  };

  // Basic first 6 seconds analysis
  const hasContactInfo = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText);
  const hasPhone = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  const hasSummary = /summary|objective|profile/i.test(resumeText.substring(0, 500));
  const hasTitle = resumeText.split('\n').some(line => 
    line.trim().length > 0 && line.trim().length < 50 && 
    /[a-z]/.test(line) && /[A-Z]/.test(line)
  );

  analysis.first6s = (
    (hasContactInfo ? 25 : 0) +
    (hasPhone ? 25 : 0) +
    (hasSummary ? 25 : 0) +
    (hasTitle ? 25 : 0)
  );

  // Basic authority analysis
  const strongVerbs = ['led', 'managed', 'created', 'developed', 'increased', 'achieved', 'designed'];
  const weakVerbs = ['helped', 'assisted', 'worked on', 'participated', 'contributed'];
  
  const strongVerbCount = strongVerbs.filter(verb => 
    new RegExp(`\\b${verb}\\b`, 'gi').test(resumeText)
  ).length;
  
  const weakVerbCount = weakVerbs.filter(verb => 
    new RegExp(`\\b${verb}\\b`, 'gi').test(resumeText)
  ).length;
  
  const hasNumbers = (resumeText.match(/\d+%|\$\d+|\d+\+/g) || []).length;
  
  analysis.authority = Math.min(100, (strongVerbCount * 15) + (hasNumbers * 5) - (weakVerbCount * 10));

  // Basic narrative analysis
  const sections = resumeText.split(/\n\s*\n/);
  const hasClearSections = sections.length >= 3;
  const hasConsistentFormat = resumeText.includes('•') || resumeText.includes('-') || /\d+\./.test(resumeText);
  const hasDateProgression = /20\d{2}/.test(resumeText);
  
  analysis.narrative = (
    (hasClearSections ? 40 : 0) +
    (hasConsistentFormat ? 30 : 0) +
    (hasDateProgression ? 30 : 0)
  );

  // Generate red flags
  if (!hasContactInfo) analysis.redFlags.push('Missing email address');
  if (!hasPhone) analysis.redFlags.push('Missing phone number');
  if (weakVerbCount > strongVerbCount) analysis.redFlags.push('Too many weak action verbs');
  if (hasNumbers < 3) analysis.redFlags.push('Insufficient quantification');
  if (!hasSummary) analysis.redFlags.push('Missing professional summary');

  // Generate basic tips
  const tips = [
    'Add strong action verbs like "led", "created", "increased"',
    'Quantify achievements with specific numbers and percentages',
    'Include a compelling professional summary at the top',
    'Ensure contact information is clearly visible',
    'Use consistent formatting throughout the document',
    'Highlight relevant keywords from job descriptions',
    'Remove or minimize weak language like "helped" or "assisted"'
  ];

  analysis.recruiterTips = tips.slice(0, 5);

  console.log('📊 Fallback analysis completed');
  return analysis;
}

/**
 * Analyze specific recruiter concerns
 */
export function analyzeSpecificConcerns(resumeText: string): {
  gapConcerns: string[];
  overqualificationRisk: boolean;
  jobHoppingRisk: boolean;
  keywordStuffingRisk: boolean;
} {
  const lines = resumeText.split('\n');
  const dates = resumeText.match(/20\d{2}/g) || [];
  
  // Detect employment gaps
  const years = dates.map(d => parseInt(d)).sort((a, b) => b - a);
  const gaps: string[] = [];
  
  for (let i = 0; i < years.length - 1; i++) {
    const currentYear = years[i];
    const nextYear = years[i + 1];
    if (currentYear && nextYear) {
      const gap = currentYear - nextYear;
      if (gap > 1) {
        gaps.push(`${gap}-year gap between ${nextYear} and ${currentYear}`);
      }
    }
  }

  // Detect job hopping (many short positions)
  const jobHoppingRisk = dates.length > 6 && years.length > 0;

  // Detect keyword stuffing
  const words = resumeText.toLowerCase().split(/\s+/);
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  const repeatedWords = Object.entries(wordCount).filter(([_, count]) => count > 5);
  const keywordStuffingRisk = repeatedWords.length > 3;

  // Detect overqualification
  const seniorIndicators = ['senior', 'lead', 'director', 'vp', 'vice president', 'chief', 'head of'];
  const overqualificationRisk = seniorIndicators.some(indicator => 
    resumeText.toLowerCase().includes(indicator)
  );

  return {
    gapConcerns: gaps,
    overqualificationRisk,
    jobHoppingRisk,
    keywordStuffingRisk,
  };
}

/**
 * Generate recruiter-specific optimization recommendations
 */
export function generateRecruiterOptimizations(
  analysis: RecruiterPsych,
  concerns: ReturnType<typeof analyzeSpecificConcerns>
): string[] {
  const optimizations: string[] = [];

  // First 6 seconds optimizations
  if (analysis.first6s < 70) {
    optimizations.push('Move contact information to the top of the resume');
    optimizations.push('Add a clear, compelling professional title below your name');
    optimizations.push('Start with a strong professional summary highlighting key value');
  }

  // Authority optimizations
  if (analysis.authority < 70) {
    optimizations.push('Replace passive voice with strong action verbs');
    optimizations.push('Add specific metrics and quantified achievements');
    optimizations.push('Use power words that demonstrate leadership and impact');
  }

  // Narrative optimizations
  if (analysis.narrative < 70) {
    optimizations.push('Organize content with clear, consistent section headings');
    optimizations.push('Use bullet points for easy scanning');
    optimizations.push('Ensure chronological consistency in work history');
  }

  // Address specific concerns
  if (concerns.gapConcerns.length > 0) {
    optimizations.push('Address employment gaps with brief explanations');
  }

  if (concerns.jobHoppingRisk) {
    optimizations.push('Group short-term roles or provide context for job changes');
  }

  if (concerns.keywordStuffingRisk) {
    optimizations.push('Reduce keyword repetition and use natural language');
  }

  return optimizations.slice(0, 8); // Max 8 optimizations
}
