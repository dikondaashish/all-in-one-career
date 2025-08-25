// ATS Compatibility and Basic Checks Service

export interface ATSCompatibility {
  fileType: 'pdf' | 'docx' | 'txt' | 'unknown';
  fileNameOk: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  headings: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    summary: boolean;
  };
  datesValid: boolean;
}

export interface JobTitleMatch {
  exactFound: boolean;
  normalizedMatch: number;
}

export interface WordStats {
  wordCount: number;
  recommendedRange: [number, number];
}

export interface WebPresence {
  linkedin?: string;
  portfolio?: string;
  github?: string;
}

/**
 * Analyze ATS compatibility of resume text and metadata
 */
export function analyzeATS(
  resumeText: string,
  fileMeta: { name: string; type: string }
): ATSCompatibility {
  console.log('🔍 Starting ATS compatibility analysis');

  const fileType = getFileType(fileMeta.type);
  const fileNameOk = isFileNameOptimal(fileMeta.name);
  
  return {
    fileType,
    fileNameOk,
    hasEmail: hasEmailAddress(resumeText),
    hasPhone: hasPhoneNumber(resumeText),
    hasLocation: hasLocationInfo(resumeText),
    headings: analyzeHeadings(resumeText),
    datesValid: hasValidDates(resumeText),
  };
}

/**
 * Check job title match in resume
 */
export function analyzeJobTitleMatch(
  resumeText: string,
  jobTitle: string
): JobTitleMatch {
  console.log('🎯 Analyzing job title match');
  
  const normalizedJobTitle = normalizeTitle(jobTitle);
  const resumeLines = resumeText.toLowerCase();
  
  // Check for exact match
  const exactFound = resumeLines.includes(jobTitle.toLowerCase());
  
  // Calculate fuzzy match score
  const normalizedMatch = calculateTitleSimilarity(resumeText, normalizedJobTitle);
  
  return {
    exactFound,
    normalizedMatch,
  };
}

/**
 * Analyze word count and statistics
 */
export function analyzeWordStats(resumeText: string): WordStats {
  const words = resumeText.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Recommended range based on experience level (estimated from content)
  let recommendedRange: [number, number] = [400, 800];
  
  // Adjust based on content complexity
  if (wordCount > 1000) {
    recommendedRange = [600, 1200]; // Senior level
  } else if (wordCount < 300) {
    recommendedRange = [300, 600]; // Entry level
  }
  
  return {
    wordCount,
    recommendedRange,
  };
}

/**
 * Detect web presence in resume
 */
export function detectWebPresence(resumeText: string): WebPresence {
  const presence: WebPresence = {};
  
  // LinkedIn detection
  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) {
    presence.linkedin = linkedinMatch[0];
  }
  
  // Portfolio/Website detection
  const websiteMatch = resumeText.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|org|net|io|dev|me|co)(?:\/[\w-]*)?/gi);
  if (websiteMatch) {
    // Filter out common email domains and linkedin
    const portfolio = websiteMatch.find(url => 
      !url.includes('gmail.com') && 
      !url.includes('yahoo.com') && 
      !url.includes('outlook.com') &&
      !url.includes('linkedin.com')
    );
    if (portfolio) {
      presence.portfolio = portfolio;
    }
  }
  
  // GitHub detection
  const githubMatch = resumeText.match(/github\.com\/[\w-]+/i);
  if (githubMatch) {
    presence.github = githubMatch[0];
  }
  
  return presence;
}

// Helper functions

function getFileType(mimeType: string): ATSCompatibility['fileType'] {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'text/plain':
      return 'txt';
    default:
      return 'unknown';
  }
}

function isFileNameOptimal(fileName: string): boolean {
  // Check if filename follows best practices
  const optimal = /^[a-zA-Z]+_[a-zA-Z]+_Resume\.(pdf|docx)$/i;
  const acceptable = /^[a-zA-Z\s_-]+\.(pdf|docx)$/i;
  
  return optimal.test(fileName) || acceptable.test(fileName);
}

function hasEmailAddress(text: string): boolean {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  return emailRegex.test(text);
}

function hasPhoneNumber(text: string): boolean {
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  return phoneRegex.test(text);
}

function hasLocationInfo(text: string): boolean {
  const locationPatterns = [
    /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/, // City, ST
    /\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b/, // City, State
    /\b\d{5}(-\d{4})?\b/, // ZIP code
  ];
  
  return locationPatterns.some(pattern => pattern.test(text));
}

function analyzeHeadings(text: string): ATSCompatibility['headings'] {
  const lines = text.split('\n').map(line => line.trim().toLowerCase());
  
  const experienceKeywords = ['experience', 'work experience', 'employment', 'professional experience', 'work history'];
  const educationKeywords = ['education', 'academic background', 'qualifications'];
  const skillsKeywords = ['skills', 'technical skills', 'core competencies', 'technologies'];
  const summaryKeywords = ['summary', 'profile', 'objective', 'about', 'professional summary'];
  
  return {
    experience: lines.some(line => experienceKeywords.some(keyword => line.includes(keyword))),
    education: lines.some(line => educationKeywords.some(keyword => line.includes(keyword))),
    skills: lines.some(line => skillsKeywords.some(keyword => line.includes(keyword))),
    summary: lines.some(line => summaryKeywords.some(keyword => line.includes(keyword))),
  };
}

function hasValidDates(text: string): boolean {
  const datePatterns = [
    /\b\d{4}\s*[-–]\s*\d{4}\b/, // 2020 - 2023
    /\b\d{4}\s*[-–]\s*present\b/i, // 2020 - Present
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i, // Jan 2020
    /\b\d{1,2}\/\d{4}\b/, // 01/2020
  ];
  
  return datePatterns.some(pattern => pattern.test(text));
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateTitleSimilarity(resumeText: string, jobTitle: string): number {
  const resumeLower = resumeText.toLowerCase();
  const titleWords = jobTitle.split(' ').filter(word => word.length > 2);
  
  let matchedWords = 0;
  titleWords.forEach(word => {
    if (resumeLower.includes(word)) {
      matchedWords++;
    }
  });
  
  return Math.round((matchedWords / titleWords.length) * 100);
}
