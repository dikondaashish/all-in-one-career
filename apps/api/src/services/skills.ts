// Skill Intelligence Service with Hard vs Soft Classification and Impact Weighting

import { generateJsonWithFallback } from '../lib/gemini';

export interface SkillIntel {
  hardFound: string[];
  hardMissing: string[];
  softFound: string[];
  softMissing: string[];
  impactWeights: Record<string, number>; // e.g., { "Paid Social": 3 }
  transferableNotes: Array<{
    from: string;
    to: string;
    rationale: string;
  }>;
}

// Static hard skills database
const HARD_SKILLS_DB = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  
  // Frameworks & Libraries
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails',
  'Next.js', 'Nuxt.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS',
  
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle', 'SQL Server', 'SQLite', 'DynamoDB',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
  'Terraform', 'Ansible', 'Puppet', 'Chef',
  
  // Tools & Technologies
  'Git', 'Linux', 'Windows', 'macOS', 'Figma', 'Adobe Creative Suite', 'Sketch', 'InVision',
  'Jira', 'Confluence', 'Slack', 'Microsoft Office', 'Google Workspace',
  
  // Marketing & Analytics
  'Google Analytics', 'GA4', 'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Twitter Ads',
  'HubSpot', 'Salesforce', 'Marketo', 'Pardot', 'Mailchimp', 'Klaviyo',
  'SEMrush', 'Ahrefs', 'Moz', 'Hotjar', 'Mixpanel', 'Amplitude',
  
  // Design & Creative
  'Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro', 'Final Cut Pro',
  'Canva', 'GIMP', 'Blender', '3ds Max', 'Maya',
  
  // Finance & Business
  'Excel', 'QuickBooks', 'SAP', 'Tableau', 'Power BI', 'Looker', 'R', 'SPSS', 'SAS',
  
  // Other Technical
  'Machine Learning', 'AI', 'Data Science', 'Blockchain', 'IoT', 'AR/VR', 'API Development',
  'Microservices', 'Agile', 'Scrum', 'Kanban', 'ITIL', 'PMP', 'Six Sigma',
];

// Static soft skills database
const SOFT_SKILLS_DB = [
  'Leadership', 'Communication', 'Problem Solving', 'Critical Thinking', 'Creativity', 'Adaptability',
  'Time Management', 'Project Management', 'Team Collaboration', 'Conflict Resolution',
  'Emotional Intelligence', 'Negotiation', 'Public Speaking', 'Presentation Skills',
  'Customer Service', 'Sales', 'Marketing Strategy', 'Strategic Planning', 'Decision Making',
  'Mentoring', 'Coaching', 'Training', 'Research', 'Analysis', 'Writing', 'Editing',
  'Organization', 'Planning', 'Attention to Detail', 'Multitasking', 'Stress Management',
  'Innovation', 'Entrepreneurship', 'Risk Management', 'Quality Assurance', 'Process Improvement',
];

/**
 * Extract and classify skills from resume and job description
 */
export async function extractSkillIntelligence(
  resumeText: string,
  jobDescription: string
): Promise<SkillIntel> {
  console.log('🧠 Starting skill intelligence extraction');

  // Extract skills using combined approach
  const resumeSkills = extractSkillsFromText(resumeText);
  const jobSkills = extractSkillsFromText(jobDescription);
  
  // Use Gemini for ambiguous classification
  const ambiguousClassification = await classifyAmbiguousSkills(
    resumeText, 
    jobDescription, 
    resumeSkills.ambiguous.concat(jobSkills.ambiguous)
  );
  
  // Combine static and AI classification
  const allResumeHard = [...resumeSkills.hard, ...ambiguousClassification.resumeHard];
  const allResumesoft = [...resumeSkills.soft, ...ambiguousClassification.resumeSoft];
  const allJobHard = [...jobSkills.hard, ...ambiguousClassification.jobHard];
  const allJobSoft = [...jobSkills.soft, ...ambiguousClassification.jobSoft];
  
  // Find matches and missing
  const hardFound = allResumeHard.filter(skill => 
    allJobHard.some(jobSkill => similarity(skill, jobSkill) > 0.8)
  );
  
  const hardMissing = allJobHard.filter(skill => 
    !allResumeHard.some(resumeSkill => similarity(resumeSkill, skill) > 0.8)
  );
  
  const softFound = allResumesoft.filter(skill => 
    allJobSoft.some(jobSkill => similarity(skill, jobSkill) > 0.8)
  );
  
  const softMissing = allJobSoft.filter(skill => 
    !allResumesoft.some(resumeSkill => similarity(resumeSkill, skill) > 0.8)
  );
  
  // Calculate impact weights
  const impactWeights = calculateImpactWeights(jobDescription, [...allJobHard, ...allJobSoft]);
  
  // Generate transferable skills insights
  const transferableNotes = await generateTransferableInsights(
    resumeText, 
    jobDescription, 
    hardMissing
  );
  
  return {
    hardFound,
    hardMissing,
    softFound,
    softMissing,
    impactWeights,
    transferableNotes,
  };
}

/**
 * Extract skills from text using static databases
 */
function extractSkillsFromText(text: string): {
  hard: string[];
  soft: string[];
  ambiguous: string[];
} {
  const textLower = text.toLowerCase();
  
  const hard = HARD_SKILLS_DB.filter(skill => 
    textLower.includes(skill.toLowerCase())
  );
  
  const soft = SOFT_SKILLS_DB.filter(skill => 
    textLower.includes(skill.toLowerCase())
  );
  
  // Extract potential skills not in our databases
  const skillPatterns = [
    /(?:experience with|skilled in|proficient in|expertise in|knowledge of)\s+([A-Z][a-zA-Z\s&.+-]{2,20})/gi,
    /(?:technologies?|tools?|platforms?):\s*([A-Z][a-zA-Z\s,&.+-]{10,100})/gi,
  ];
  
  const ambiguous: string[] = [];
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const extracted = match.split(':')[1]?.trim() || match;
        if (extracted && !hard.includes(extracted) && !soft.includes(extracted)) {
          ambiguous.push(extracted);
        }
      });
    }
  });
  
  return { hard, soft, ambiguous };
}

/**
 * Use Gemini to classify ambiguous skills
 */
async function classifyAmbiguousSkills(
  resumeText: string,
  jobDescription: string,
  ambiguousSkills: string[]
): Promise<{
  resumeHard: string[];
  resumeSoft: string[];
  jobHard: string[];
  jobSoft: string[];
}> {
  if (ambiguousSkills.length === 0) {
    return { resumeHard: [], resumeSoft: [], jobHard: [], jobSoft: [] };
  }
  
  const prompt = `
Classify these skills as hard (technical, measurable) or soft (interpersonal, behavioral) skills.

RESUME:
${resumeText.substring(0, 1000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 1000)}

AMBIGUOUS SKILLS TO CLASSIFY:
${ambiguousSkills.join(', ')}

Return JSON with skills found in resume and job description:

{
  "resumeHard": ["skill1", "skill2"],
  "resumeSoft": ["skill3", "skill4"],
  "jobHard": ["skill5", "skill6"],
  "jobSoft": ["skill7", "skill8"]
}`;

  try {
    return await generateJsonWithFallback(prompt);
  } catch (error) {
    console.warn('⚠️ Failed to classify ambiguous skills:', error);
    return { resumeHard: [], resumeSoft: [], jobHard: [], jobSoft: [] };
  }
}

/**
 * Calculate impact weights for skills based on job description context
 */
function calculateImpactWeights(
  jobDescription: string,
  allSkills: string[]
): Record<string, number> {
  const weights: Record<string, number> = {};
  const jdLower = jobDescription.toLowerCase();
  
  allSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    let weight = 1; // Default weight (mentioned)
    
    // Check for requirement keywords
    const requiredPatterns = [
      `required ${skillLower}`,
      `must have ${skillLower}`,
      `essential ${skillLower}`,
      `mandatory ${skillLower}`,
    ];
    
    const preferredPatterns = [
      `preferred ${skillLower}`,
      `nice to have ${skillLower}`,
      `bonus ${skillLower}`,
      `plus ${skillLower}`,
    ];
    
    if (requiredPatterns.some(pattern => jdLower.includes(pattern))) {
      weight = 3; // Critical
    } else if (preferredPatterns.some(pattern => jdLower.includes(pattern))) {
      weight = 2; // Important
    } else if (jdLower.includes(skillLower)) {
      // Check frequency and context
      const occurrences = (jdLower.match(new RegExp(skillLower, 'g')) || []).length;
      if (occurrences >= 3) {
        weight = 3; // Mentioned multiple times = critical
      } else if (occurrences >= 2) {
        weight = 2; // Important
      }
    }
    
    weights[skill] = weight;
  });
  
  return weights;
}

/**
 * Generate transferable skills insights using Gemini
 */
async function generateTransferableInsights(
  resumeText: string,
  jobDescription: string,
  missingSkills: string[]
): Promise<Array<{ from: string; to: string; rationale: string }>> {
  if (missingSkills.length === 0) {
    return [];
  }
  
  const prompt = `
Analyze transferable skills opportunities.

RESUME SKILLS:
${resumeText.substring(0, 800)}

MISSING JOB SKILLS:
${missingSkills.slice(0, 5).join(', ')}

Find 3-5 transferable skill connections where resume experience can bridge to missing job skills.

{
  "transferable": [
    {
      "from": "Current skill from resume",
      "to": "Missing job skill",
      "rationale": "Brief explanation of connection"
    }
  ]
}`;

  try {
    const result = await generateJsonWithFallback(prompt);
    return result.transferable || [];
  } catch (error) {
    console.warn('⚠️ Failed to generate transferable insights:', error);
    return [];
  }
}

/**
 * Calculate similarity between two strings
 */
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  if (aLower === bLower) return 1.0;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.9;
  
  // Simple word overlap
  const aWords = aLower.split(/\s+/);
  const bWords = bLower.split(/\s+/);
  const intersection = aWords.filter(word => bWords.includes(word));
  const union = [...new Set([...aWords, ...bWords])];
  
  return intersection.length / union.length;
}
