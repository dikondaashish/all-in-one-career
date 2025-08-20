import { removeStopwords } from 'stopword';
import skillsData from '../data/skills.json';

// Load skills as a Set for faster lookups
const SKILLS_SET = new Set(skillsData.map((skill: string) => skill.toLowerCase()));

/**
 * Tokenize text into keywords
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  
  // Convert to lowercase and split on non-letters
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
  
  // Remove stopwords
  const filtered = removeStopwords(words) as string[];
  
  // Remove duplicates
  return [...new Set(filtered)];
}

/**
 * Extract skills from text using our predefined skills list
 */
export function extractSkills(text: string): string[] {
  const tokens = tokenize(text);
  const skills = tokens.filter(token => SKILLS_SET.has(token));
  return [...new Set(skills)]; // Remove duplicates
}

/**
 * Extract resume fields from text using regex patterns
 */
export function extractResumeFields(text: string) {
  // Email regex
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  
  // Phone regex (various formats)
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  
  // Name extraction (first line that looks like a name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let name = '';
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    if (line.length < 50 && line.match(/^[A-Za-z\s]{2,}$/) && !line.toLowerCase().includes('resume')) {
      name = line;
      break;
    }
  }
  
  // Extract skills using our skills database
  const skills = extractSkills(text);
  
  // Simple education extraction
  const education = extractEducation(text);
  
  // Simple experience extraction
  const experience = extractExperience(text);
  
  return {
    name: name || null,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    skills,
    education,
    experience
  };
}

/**
 * Extract education information
 */
function extractEducation(text: string) {
  const education = [];
  const lines = text.split('\n');
  
  const educationKeywords = ['university', 'college', 'school', 'bachelor', 'master', 'phd', 'degree', 'education'];
  const degreeKeywords = ['bachelor', 'master', 'phd', 'bs', 'ms', 'ba', 'ma', 'bsc', 'msc'];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;
    
    const line = currentLine.toLowerCase();
    
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      const schoolMatch = currentLine.match(/([A-Za-z\s]+(?:university|college|school|institute))/i);
      const degreeMatch = currentLine.match(new RegExp(`(${degreeKeywords.join('|')}).*?in.*?([A-Za-z\\s]+)`, 'i'));
      const yearMatch = currentLine.match(/(\d{4})/);
      
      if (schoolMatch || degreeMatch) {
        education.push({
          school: schoolMatch && schoolMatch[1] ? schoolMatch[1].trim() : 'Unknown',
          degree: degreeMatch ? degreeMatch[0] : 'Unknown',
          year: yearMatch ? yearMatch[1] : null
        });
      }
    }
  }
  
  return education;
}

/**
 * Extract work experience
 */
function extractExperience(text: string) {
  const experience = [];
  const lines = text.split('\n');
  
  const titleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'specialist', 'consultant', 'director', 'lead', 'senior', 'junior'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Look for job titles
    if (titleKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
      const dateMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/i);
      
      if (dateMatch) {
        // Try to find company in nearby lines
        let company = 'Unknown';
        for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
          const nearbyLine = lines[j];
          if (j !== i && nearbyLine && nearbyLine.trim() && !nearbyLine.match(/^\d/)) {
            company = nearbyLine.trim();
            break;
          }
        }
        
        experience.push({
          title: line.trim(),
          company,
          start: dateMatch[1],
          end: dateMatch[2] === 'present' ? null : dateMatch[2],
          bullets: []
        });
      }
    }
  }
  
  return experience;
}

/**
 * Calculate match score between resume and job description
 */
export function calculateMatchScore(resumeSkills: string[], jdSkills: string[]): {
  score: number;
  missingSkills: string[];
  extraSkills: string[];
} {
  if (jdSkills.length === 0) {
    return {
      score: 0,
      missingSkills: [],
      extraSkills: resumeSkills
    };
  }
  
  const resumeSet = new Set(resumeSkills);
  const jdSet = new Set(jdSkills);
  
  const intersection = resumeSkills.filter(skill => jdSet.has(skill));
  const score = Math.round((intersection.length / Math.max(1, jdSkills.length)) * 100);
  
  const missingSkills = jdSkills.filter(skill => !resumeSet.has(skill));
  const extraSkills = resumeSkills.filter(skill => !jdSet.has(skill));
  
  return {
    score: Math.min(100, score),
    missingSkills,
    extraSkills
  };
}
