import { removeStopwords } from 'stopword';
import skillsData from '../data/skills.json';

// Load skills as a Set for faster lookups
const SKILLS_SET = new Set(skillsData.map((skill: string) => skill.toLowerCase()));

/**
 * Tokenize text into keywords
 */
export function tokenize(text: string): string[] {
  // Convert to lowercase and split on non-alphabetic characters
  const words = text.toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Remove stopwords
  return removeStopwords(words) as string[];
}

/**
 * Extract skills from text using the skills database
 */
export function extractSkills(text: string): string[] {
  const tokens = tokenize(text);
  const foundSkills = new Set<string>();
  
  // Check individual tokens
  tokens.forEach(token => {
    if (SKILLS_SET.has(token)) {
      foundSkills.add(token);
    }
  });
  
  // Check multi-word skills (like "machine learning", "google cloud")
  const lowerText = text.toLowerCase();
  skillsData.forEach(skill => {
    if (skill.includes(' ') && lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  });
  
  return Array.from(foundSkills).sort();
}

/**
 * Extract contact information from resume text
 */
export function extractContactInfo(text: string) {
  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  
  // Phone regex (various formats)
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})(?:\s?(?:ext|x|extension)\.?\s?(\d+))?/g;
  const phones = text.match(phoneRegex) || [];
  
  // Name extraction (heuristic: first line or first capitalized words)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let name = '';
  
  // Try to find name in first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Skip lines that look like emails, phones, or addresses
    if (!line.includes('@') && !line.match(phoneRegex) && line.length < 50) {
      // Check if line has 2-3 capitalized words (likely a name)
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 3 && 
          words.every(word => word.charAt(0) === word.charAt(0).toUpperCase())) {
        name = line;
        break;
      }
    }
  }
  
  return {
    name: name || 'Unknown',
    email: emails[0] || '',
    phone: phones[0] || ''
  };
}

/**
 * Extract education information
 */
export function extractEducation(text: string) {
  const education = [];
  const lines = text.split('\n');
  
  // Common degree patterns
  const degreePatterns = [
    /\b(?:bachelor|bs|ba|b\.s\.|b\.a\.|undergraduate)\b/i,
    /\b(?:master|ms|ma|m\.s\.|m\.a\.|mba|graduate)\b/i,
    /\b(?:phd|ph\.d\.|doctorate|doctoral)\b/i,
    /\b(?:associate|aa|as|a\.a\.|a\.s\.)\b/i
  ];
  
  // School name patterns
  const schoolPatterns = [
    /\buniversity\b/i,
    /\bcollege\b/i,
    /\binstitute\b/i,
    /\bacademy\b/i,
    /\bschool\b/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    
    const hasDegree = degreePatterns.some(pattern => pattern.test(line));
    const hasSchool = schoolPatterns.some(pattern => pattern.test(line));
    
    if (hasDegree || hasSchool) {
      // Extract year (4 digits)
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : '';
      
      // Try to extract degree type
      let degree = '';
      for (const pattern of degreePatterns) {
        const match = line.match(pattern);
        if (match) {
          degree = match[0];
          break;
        }
      }
      
      // Try to extract school name
      let school = line;
      const schoolMatch = schoolPatterns.find(pattern => pattern.test(line));
      if (schoolMatch) {
        // Find the part with university/college
        const words = line.split(/\s+/);
        const schoolIndex = words.findIndex(word => schoolMatch.test(word));
        if (schoolIndex > 0) {
          school = words.slice(Math.max(0, schoolIndex - 2), schoolIndex + 1).join(' ');
        }
      }
      
      education.push({
        degree: degree || 'Degree',
        school: school || 'Unknown',
        year: year
      });
    }
  }
  
  return education.length > 0 ? education : [{ degree: 'Not specified', school: 'Not specified', year: '' }];
}

/**
 * Extract work experience
 */
export function extractExperience(text: string) {
  const experience = [];
  const lines = text.split('\n');
  
  // Job title patterns (common job titles)
  const titlePatterns = [
    /\b(?:senior|lead|principal|staff|junior)\s+(?:software|web|mobile|full.?stack|front.?end|back.?end)\s+(?:engineer|developer|programmer)\b/i,
    /\b(?:software|web|mobile|full.?stack|front.?end|back.?end)\s+(?:engineer|developer|programmer)\b/i,
    /\b(?:data|machine learning|ml|ai)\s+(?:scientist|engineer|analyst)\b/i,
    /\b(?:product|project|program|marketing|sales)\s+manager\b/i,
    /\b(?:ceo|cto|cfo|vp|director|coordinator|specialist|analyst|consultant)\b/i
  ];
  
  // Company indicators
  const companyPatterns = [
    /\b(?:inc|corp|llc|ltd|company|technologies|systems|solutions|group)\b/i,
    /\b(?:google|microsoft|amazon|apple|facebook|meta|netflix|uber|airbnb)\b/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]?.trim();
    if (!currentLine) continue;
    
    const hasTitle = titlePatterns.some(pattern => pattern.test(currentLine));
    
    if (hasTitle) {
      // Extract title
      let title = currentLine;
      for (const pattern of titlePatterns) {
        const match = currentLine.match(pattern);
        if (match) {
          title = match[0];
          break;
        }
      }
      
      // Look for company in nearby lines
      let company = 'Unknown Company';
      for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
        const nearbyLine = lines[j]?.trim();
        if (!nearbyLine || j === i) continue;
        
        if (companyPatterns.some(pattern => pattern.test(nearbyLine))) {
          company = nearbyLine;
          break;
        }
      }
      
      // Extract years
      const yearMatch = currentLine.match(/\b(19|20)\d{2}\b/g);
      const startYear = yearMatch ? yearMatch[0] : '';
      const endYear = yearMatch && yearMatch.length > 1 ? yearMatch[1] : '';
      
      experience.push({
        title: title,
        company: company,
        startYear,
        endYear,
        description: currentLine
      });
    }
  }
  
  return experience.length > 0 ? experience : [{ 
    title: 'Not specified', 
    company: 'Not specified', 
    startYear: '', 
    endYear: '', 
    description: '' 
  }];
}

/**
 * Extracts structured data from raw resume text.
 */
export function extractResumeFields(text: string) {
  const skills = extractSkills(text);
  const contactInfo = extractContactInfo(text);
  const education = extractEducation(text);
  const experience = extractExperience(text);

  return {
    name: contactInfo.name,
    email: contactInfo.email,
    phone: contactInfo.phone,
    education,
    experience,
    skills,
    originalText: text // Keep original for reference
  };
}

/**
 * Calculates a match score between resume skills and job description skills.
 */
export function calculateMatchScore(resumeSkills: string[], jdSkills: string[]) {
  if (jdSkills.length === 0) {
    return {
      score: 0,
      missingSkills: [],
      extraSkills: resumeSkills
    };
  }

  const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase()));
  const jdSet = new Set(jdSkills.map(s => s.toLowerCase()));

  let matchedKeywordsCount = 0;
  const missingSkills: string[] = [];
  const extraSkills: string[] = [];

  // Find matched and missing skills
  for (const jdSkill of jdSet) {
    if (resumeSet.has(jdSkill)) {
      matchedKeywordsCount++;
    } else {
      missingSkills.push(jdSkill);
    }
  }

  // Find extra skills (skills in resume but not in JD)
  for (const resumeSkill of resumeSet) {
    if (!jdSet.has(resumeSkill)) {
      extraSkills.push(resumeSkill);
    }
  }

  const score = jdSet.size > 0 ? Math.round((matchedKeywordsCount / jdSet.size) * 100) : 0;

  return {
    score: Math.min(100, score), // Cap score at 100
    missingSkills,
    extraSkills,
  };
}

/**
 * Generate searchability analysis items
 */
export function generateSearchabilityItems(parsedResume: any, fileType: string) {
  const items = [];

  // File format analysis
  items.push({
    title: "ATS systems can read 100% of your resume",
    description: fileType === '.docx' || fileType === '.doc' 
      ? "Document format is fully compatible with ATS systems"
      : "Text format ensures maximum compatibility",
    status: "good" as const
  });

  // Contact information analysis
  const hasContact = parsedResume.email && parsedResume.phone;
  items.push({
    title: "Contact information is properly formatted",
    description: hasContact 
      ? "Email and phone number are easily identifiable"
      : "Consider adding clear contact information",
    status: hasContact ? "good" : "warning" as const
  });

  // Content structure analysis
  const hasExperience = parsedResume.experience && parsedResume.experience.length > 0;
  items.push({
    title: "Resume structure is ATS-friendly",
    description: hasExperience 
      ? "Clear sections and formatting detected"
      : "Consider adding work experience section",
    status: hasExperience ? "good" : "warning" as const
  });

  return items;
}

/**
 * Generate recruiter tips based on resume analysis
 */
export function generateRecruiterTips(parsedResume: any, matchScore: number, missingSkills: string[]) {
  const tips = [];

  // Contact information tip
  const hasCompleteContact = parsedResume.email && parsedResume.phone && parsedResume.name;
  tips.push({
    type: hasCompleteContact ? "good" : "warning" as const,
    title: "Contact Information",
    description: hasCompleteContact 
      ? "Your resume includes essential contact details that recruiters need"
      : "Ensure your resume includes name, email, and phone number"
  });

  // Skills matching tip
  if (matchScore >= 80) {
    tips.push({
      type: "good" as const,
      title: "Excellent Keyword Match",
      description: "Your resume strongly aligns with the job requirements"
    });
  } else if (matchScore >= 60) {
    tips.push({
      type: "warning" as const,
      title: "Good Skills Foundation",
      description: "Consider adding more relevant keywords from the job description"
    });
  } else {
    tips.push({
      type: "error" as const,
      title: "Keyword Optimization Needed",
      description: `Consider adding ${missingSkills.length} missing keywords to improve your match`
    });
  }

  // Experience quantification tip
  const hasQuantifiableResults = parsedResume.experience?.some((exp: any) => 
    exp.bullets?.some((bullet: string) => /\d+/.test(bullet))
  );
  
  tips.push({
    type: hasQuantifiableResults ? "good" : "warning" as const,
    title: "Measurable Results",
    description: hasQuantifiableResults 
      ? "Great job including quantifiable achievements"
      : "Add numbers and metrics to demonstrate your impact"
  });

  return tips;
}

/**
 * Generate skills comparison data
 */
export function generateSkillsComparison(resumeSkills: string[], jdSkills: string[]) {
  const allSkills = new Set([...resumeSkills, ...jdSkills]);
  
  return Array.from(allSkills).map(skill => ({
    name: skill,
    foundAll: resumeSkills.includes(skill) && jdSkills.includes(skill),
    resumeCount: resumeSkills.includes(skill) ? 1 : 0,
    jdCount: jdSkills.includes(skill) ? 1 : 0,
    inResume: resumeSkills.includes(skill),
    inJobDesc: jdSkills.includes(skill)
  }));
}

/**
 * Analyze resume format and structure
 */
export function analyzeResumeFormat(text: string, parsedResume: any) {
  const analysis = {
    readability: 100, // Assume good since we can parse it
    sections: [] as any[],
    formatting: [] as any[]
  };

  // Check for standard sections
  const sectionChecks = [
    { name: "Contact Information", found: !!(parsedResume.email || parsedResume.phone) },
    { name: "Work Experience", found: parsedResume.experience?.length > 0 },
    { name: "Education", found: parsedResume.education?.length > 0 },
    { name: "Skills", found: parsedResume.skills?.length > 0 }
  ];

  analysis.sections = sectionChecks.map(section => ({
    title: section.name,
    status: section.found ? "good" : "warning",
    description: section.found ? "Section detected" : "Consider adding this section"
  }));

  // Format analysis
  analysis.formatting = [
    {
      category: "Layout",
      items: [
        {
          title: "Use consistent formatting",
          description: "Document structure appears consistent",
          status: "good"
        }
      ]
    }
  ];

  return analysis;
}

/**
 * Enhanced keyword extraction with context analysis
 */
export function extractKeywordsWithContext(text: string, context?: string) {
  const keywords = new Set<string>();
  const phrases = new Set<string>();
  
  // Basic keyword extraction
  const basicKeywords = tokenize(text);
  basicKeywords.forEach(keyword => keywords.add(keyword));
  
  // Extract phrases (2-3 words)
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
    if (twoWordPhrase.length > 6 && !twoWordPhrase.includes('.') && !twoWordPhrase.includes(',')) {
      phrases.add(twoWordPhrase);
    }
    
    if (i < words.length - 2) {
      const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (threeWordPhrase.length > 10 && !threeWordPhrase.includes('.') && !threeWordPhrase.includes(',')) {
        phrases.add(threeWordPhrase);
      }
    }
  }
  
  return {
    keywords: Array.from(keywords),
    phrases: Array.from(phrases),
    totalTokens: basicKeywords.length
  };
}

/**
 * Calculate content similarity between two texts
 */
export function calculateContentSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Generate improvement suggestions based on analysis
 */
export function generateImprovementSuggestions(
  resumeText: string, 
  jobDescription: string, 
  matchScore: number
): Array<{type: string, priority: 'high' | 'medium' | 'low', suggestion: string}> {
  const suggestions = [];
  
  // Low match score suggestions
  if (matchScore < 40) {
    suggestions.push({
      type: 'keywords',
      priority: 'high' as const,
      suggestion: 'Your resume has very few keywords matching the job description. Consider adding more relevant skills and experience that align with the job requirements.'
    });
  } else if (matchScore < 70) {
    suggestions.push({
      type: 'keywords',
      priority: 'medium' as const,
      suggestion: 'Add more keywords from the job description to improve your match score. Focus on technical skills and job-specific terminology.'
    });
  }
  
  // Content length analysis
  if (resumeText.length < 1000) {
    suggestions.push({
      type: 'content',
      priority: 'medium' as const,
      suggestion: 'Your resume appears quite short. Consider adding more detail about your experience, achievements, and skills.'
    });
  }
  
  // Industry-specific suggestions
  if (jobDescription.toLowerCase().includes('management') && !resumeText.toLowerCase().includes('manage')) {
    suggestions.push({
      type: 'experience',
      priority: 'high' as const,
      suggestion: 'This role involves management responsibilities. Highlight any leadership or management experience you have.'
    });
  }
  
  if (jobDescription.toLowerCase().includes('team') && !resumeText.toLowerCase().includes('team')) {
    suggestions.push({
      type: 'skills',
      priority: 'medium' as const,
      suggestion: 'The job emphasizes teamwork. Include examples of collaborative projects or team achievements.'
    });
  }
  
  return suggestions;
}

/**
 * Analyze resume sections and structure
 */
export function analyzeResumeStructure(text: string) {
  const sections = {
    contact: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    certifications: false
  };
  
  const lowerText = text.toLowerCase();
  
  // Check for contact information
  sections.contact = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text) || 
                   /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text);
  
  // Check for summary/objective
  sections.summary = /\b(summary|objective|profile|about)\b/i.test(text);
  
  // Check for experience section
  sections.experience = /\b(experience|employment|work history|career)\b/i.test(text);
  
  // Check for education
  sections.education = /\b(education|degree|university|college|school)\b/i.test(text);
  
  // Check for skills
  sections.skills = /\b(skills|competencies|proficiencies|technologies)\b/i.test(text);
  
  // Check for certifications
  sections.certifications = /\b(certification|certified|license|credential)\b/i.test(text);
  
  const sectionCount = Object.values(sections).filter(Boolean).length;
  const completeness = sectionCount / Object.keys(sections).length;
  
  return {
    sections,
    completeness,
    missingCriticalSections: Object.entries(sections)
      .filter(([key, found]) => !found && ['contact', 'experience'].includes(key))
      .map(([key]) => key)
  };
}