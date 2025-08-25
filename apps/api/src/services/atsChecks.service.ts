/**
 * ATS Checks Service - Foundational ATS compatibility checks
 * Pure parsing/regex/static checks for file type, contact info, sections, etc.
 */

interface AtsChecksInput {
  resumeText: string;
  resumeFileMeta: { filename: string; mime: string };
  jobTitle: string;
}

interface AtsChecksResult {
  fileTypeOk: boolean;
  fileNameOk: boolean;
  contact: {
    email: boolean;
    phone: boolean;
    location: boolean;
    links: string[];
  };
  sections: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    summary: boolean;
  };
  datesValid: boolean;
  wordCount: number;
  wordCountStatus: "under" | "optimal" | "over";
  jobTitleMatch: {
    exact: boolean;
    normalizedSimilarity: number;
  };
}

export function runAtsChecks({ resumeText, resumeFileMeta, jobTitle }: AtsChecksInput): AtsChecksResult {
  // File type check
  const fileTypeOk = /pdf|word|officedocument|text\/plain/.test(resumeFileMeta.mime);
  
  // File name check (no special characters)
  const fileNameOk = !/[^\w\-.]/.test(resumeFileMeta.filename);
  
  // Contact information detection
  const contact = {
    email: /[\w.+-]+@[\w-]+\.[\w.-]+/i.test(resumeText),
    phone: /(\+?\d[\d\s\-\(\)]{8,})/.test(resumeText),
    location: /(USA|United States|[A-Za-z]+,\s?[A-Za-z]+|Remote)/i.test(resumeText),
    links: extractLinks(resumeText)
  };
  
  // Section presence detection
  const sections = {
    experience: /experience|employment|work\s+history/i.test(resumeText),
    education: /education|academic|degree|university|college/i.test(resumeText),
    skills: /skills|competencies|technical|proficiencies/i.test(resumeText),
    summary: /summary|profile|objective|about/i.test(resumeText),
  };
  
  // Date format validation (heuristic)
  const datesValid = /\b(20\d{2}|19\d{2})\b/.test(resumeText) || 
                    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i.test(resumeText);
  
  // Word count analysis
  const wordCount = resumeText.trim().split(/\s+/).length;
  const wordCountStatus: "under" | "optimal" | "over" = 
    wordCount < 400 ? "under" : wordCount > 1200 ? "over" : "optimal";
  
  // Job title matching
  const exact = new RegExp(`\\b${escapeRegex(jobTitle)}\\b`, "i").test(resumeText);
  const normalizedSimilarity = exact ? 1.0 : calculateJaroWinkler(jobTitle, resumeText);
  
  return {
    fileTypeOk,
    fileNameOk,
    contact,
    sections,
    datesValid,
    wordCount,
    wordCountStatus,
    jobTitleMatch: { exact, normalizedSimilarity }
  };
}

/**
 * Extract web presence links from resume text
 */
function extractLinks(text: string): string[] {
  const links: string[] = [];
  
  // LinkedIn detection
  if (/linkedin\.com\/in\/[\w-]+/i.test(text) || /linkedin/i.test(text)) {
    links.push("linkedin");
  }
  
  // Portfolio/website detection
  if (/portfolio|github\.com|behance|dribbble|personal\s+website/i.test(text) ||
      /https?:\/\/[\w.-]+\.[a-z]{2,}/i.test(text)) {
    links.push("portfolio");
  }
  
  // GitHub detection
  if (/github\.com\/[\w-]+/i.test(text)) {
    links.push("github");
  }
  
  return links;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Simple Jaro-Winkler similarity for job title matching
 * Returns a value between 0 and 1
 */
function calculateJaroWinkler(jobTitle: string, resumeText: string): number {
  // Extract potential job titles from resume (simple heuristic)
  const resumeTitles = resumeText
    .split(/\n/)
    .filter(line => line.length > 3 && line.length < 100)
    .map(line => line.trim())
    .filter(line => /^[A-Z]/.test(line) && !/^(Education|Experience|Skills|Summary|Projects|Certifications)/i.test(line))
    .slice(0, 10); // Check first 10 potential titles
  
  let maxSimilarity = 0;
  
  for (const title of resumeTitles) {
    const similarity = jaroWinklerDistance(jobTitle.toLowerCase(), title.toLowerCase());
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  return Math.round(maxSimilarity * 100) / 100;
}

/**
 * Jaro-Winkler distance implementation
 */
function jaroWinklerDistance(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  if (matchWindow < 0) return 0.0;
  
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Find transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler modification
  let prefix = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + (0.1 * prefix * (1 - jaro));
}
