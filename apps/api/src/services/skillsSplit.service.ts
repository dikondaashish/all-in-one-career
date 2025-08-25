/**
 * Skills Split Service - Split skills into hard/soft/transferable with impact weights
 */

interface SkillsSplitInput {
  resumeText: string;
  jobText: string;
}

interface SkillsSplitResult {
  hard: {
    found: string[];
    missing: string[];
    impactWeights: Record<string, number>;
  };
  soft: {
    found: string[];
    missing: string[];
  };
  transferable: Array<{
    from: string;
    towards: string;
    confidence: number;
  }>;
}

// Comprehensive skill databases
const HARD_SKILLS = [
  // Technical/Programming
  "JavaScript", "TypeScript", "Python", "Java", "C++", "React", "Node.js", "Angular", "Vue.js",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
  
  // Marketing/Analytics
  "Google Analytics", "GA4", "Google Ads", "Meta Ads", "Facebook Ads", "LinkedIn Ads", "Paid Social",
  "Paid Search", "SEO", "SEM", "PPC", "Conversion Rate Optimization", "A/B Testing", "Looker",
  "Tableau", "Power BI", "HubSpot", "Salesforce", "Marketo", "Pardot",
  
  // Design/Creative
  "Photoshop", "Illustrator", "InDesign", "Figma", "Sketch", "Adobe Creative Suite", "UI/UX Design",
  "Wireframing", "Prototyping", "Design Systems", "Canva", "After Effects",
  
  // Finance/Accounting
  "Excel", "QuickBooks", "SAP", "Financial Modeling", "Budgeting", "Forecasting", "GAAP", "IFRS",
  "Tax Preparation", "Audit", "Financial Analysis", "Variance Analysis",
  
  // Operations/Management
  "Project Management", "Agile", "Scrum", "Kanban", "Jira", "Asana", "Monday.com", "Slack", "Teams",
  "Process Improvement", "Lean", "Six Sigma", "Change Management", "Risk Management",
  
  // Sales/CRM
  "CRM", "Lead Generation", "Pipeline Management", "Cold Calling", "Cold Emailing", "Sales Forecasting",
  "Account Management", "Customer Success", "Upselling", "Cross-selling"
];

const SOFT_SKILLS = [
  "Communication", "Leadership", "Teamwork", "Problem Solving", "Critical Thinking", "Creativity",
  "Adaptability", "Time Management", "Organization", "Attention to Detail", "Analytical Thinking",
  "Collaboration", "Interpersonal Skills", "Presentation Skills", "Negotiation", "Conflict Resolution",
  "Emotional Intelligence", "Decision Making", "Strategic Thinking", "Innovation", "Mentoring",
  "Coaching", "Delegation", "Multitasking", "Customer Service", "Relationship Building",
  "Active Listening", "Empathy", "Patience", "Resilience", "Stress Management", "Ownership",
  "Accountability", "Initiative", "Proactivity", "Flexibility", "Cultural Awareness"
];

// Transferable skill mappings
const TRANSFERABLE_MAPPINGS = [
  { from: "analytics", towards: "GA4", confidence: 0.8 },
  { from: "universal analytics", towards: "GA4", confidence: 0.9 },
  { from: "facebook ads", towards: "meta ads", confidence: 0.95 },
  { from: "google adwords", towards: "google ads", confidence: 0.95 },
  { from: "excel", towards: "google sheets", confidence: 0.7 },
  { from: "powerpoint", towards: "google slides", confidence: 0.7 },
  { from: "photoshop", towards: "figma", confidence: 0.6 },
  { from: "sketch", towards: "figma", confidence: 0.8 },
  { from: "salesforce", towards: "hubspot", confidence: 0.6 },
  { from: "mysql", towards: "postgresql", confidence: 0.8 },
  { from: "javascript", towards: "typescript", confidence: 0.7 },
  { from: "angular", towards: "react", confidence: 0.6 },
  { from: "vue", towards: "react", confidence: 0.6 }
];

export function splitSkills({ resumeText, jobText }: SkillsSplitInput): SkillsSplitResult {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobText.toLowerCase();
  
  // Find skills in resume and job description
  const hardFound = findSkills(HARD_SKILLS, resumeLower);
  const softFound = findSkills(SOFT_SKILLS, resumeLower);
  
  const hardInJob = findSkills(HARD_SKILLS, jobLower);
  const softInJob = findSkills(SOFT_SKILLS, jobLower);
  
  // Calculate missing skills
  const hardMissing = hardInJob.filter(skill => !hardFound.includes(skill));
  const softMissing = softInJob.filter(skill => !softFound.includes(skill));
  
  // Calculate impact weights for missing hard skills
  const impactWeights = calculateImpactWeights(hardMissing, jobText);
  
  // Find transferable skills
  const transferable = findTransferableSkills(resumeText, hardMissing);
  
  return {
    hard: { found: hardFound, missing: hardMissing, impactWeights },
    soft: { found: softFound, missing: softMissing },
    transferable
  };
}

/**
 * Find skills that match in the given text
 */
function findSkills(skillsDatabase: string[], text: string): string[] {
  return skillsDatabase.filter(skill => {
    // Create regex for exact word boundary matching
    const regex = new RegExp(`\\b${escapeRegex(skill.toLowerCase())}\\b`, 'i');
    return regex.test(text);
  });
}

/**
 * Calculate impact weights for missing skills based on job importance
 */
function calculateImpactWeights(missingSkills: string[], jobText: string): Record<string, number> {
  const weights: Record<string, number> = {};
  const jobLower = jobText.toLowerCase();
  
  for (const skill of missingSkills) {
    let weight = -15; // Base penalty for missing hard skill
    
    // Check if skill appears multiple times (higher importance)
    const occurrences = (jobLower.match(new RegExp(escapeRegex(skill.toLowerCase()), 'g')) || []).length;
    if (occurrences > 1) weight -= 5;
    if (occurrences > 3) weight -= 5;
    
    // Check if skill appears in requirements/qualifications section
    const requirementsSection = extractRequirementsSection(jobText);
    if (requirementsSection && new RegExp(escapeRegex(skill.toLowerCase()), 'i').test(requirementsSection)) {
      weight -= 10;
    }
    
    // Check for emphasis keywords
    const emphasisKeywords = ['required', 'must have', 'essential', 'critical', 'key', 'important'];
    const skillContext = getSkillContext(jobText, skill);
    
    for (const keyword of emphasisKeywords) {
      if (new RegExp(keyword, 'i').test(skillContext)) {
        weight -= 5;
        break;
      }
    }
    
    // Cap the penalty
    weights[skill] = Math.max(weight, -30);
  }
  
  return weights;
}

/**
 * Find transferable skills from resume that could map to missing skills
 */
function findTransferableSkills(resumeText: string, missingSkills: string[]): Array<{from: string; towards: string; confidence: number}> {
  const transferable: Array<{from: string; towards: string; confidence: number}> = [];
  const resumeLower = resumeText.toLowerCase();
  
  for (const mapping of TRANSFERABLE_MAPPINGS) {
    // Check if resume has the "from" skill and job needs the "towards" skill
    const hasFromSkill = new RegExp(`\\b${escapeRegex(mapping.from)}\\b`, 'i').test(resumeLower);
    const needsTowardsSkill = missingSkills.some(skill => 
      skill.toLowerCase() === mapping.towards.toLowerCase()
    );
    
    if (hasFromSkill && needsTowardsSkill) {
      transferable.push({
        from: mapping.from,
        towards: mapping.towards,
        confidence: mapping.confidence
      });
    }
  }
  
  return transferable;
}

/**
 * Extract requirements/qualifications section from job description
 */
function extractRequirementsSection(jobText: string): string | null {
  const sections = [
    /requirements?:?\s*(.*?)(?=\n\s*[A-Z][^:]*:|$)/is,
    /qualifications?:?\s*(.*?)(?=\n\s*[A-Z][^:]*:|$)/is,
    /skills?:?\s*(.*?)(?=\n\s*[A-Z][^:]*:|$)/is,
    /must have:?\s*(.*?)(?=\n\s*[A-Z][^:]*:|$)/is
  ];
  
  for (const regex of sections) {
    const match = jobText.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Get context around a skill mention in job text
 */
function getSkillContext(jobText: string, skill: string): string {
  const regex = new RegExp(`(.{0,100}\\b${escapeRegex(skill)}\\b.{0,100})`, 'i');
  const match = jobText.match(regex);
  return match && match[1] ? match[1] : '';
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
