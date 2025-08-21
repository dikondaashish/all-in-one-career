/**
 * Sample ATS scan data with excellent metrics for demonstration
 */

export const SAMPLE_ATS_SCAN_DATA = {
  id: 'sample-scan-demo-123',
  scanId: 'sample-scan-demo-123',
  fileName: 'John_Doe_Senior_Software_Engineer.pdf',
  fileType: '.pdf',
  matchScore: 89,
  createdAt: new Date().toISOString(),
  jdText: `Senior Software Engineer - Full Stack Development

We are seeking an experienced Senior Software Engineer to join our dynamic development team. The ideal candidate will have strong expertise in modern web technologies and cloud platforms.

Key Requirements:
• 5+ years of experience in software development
• Proficiency in JavaScript, TypeScript, React, and Node.js
• Experience with cloud platforms (AWS, Azure, or Google Cloud)
• Strong knowledge of SQL and NoSQL databases (PostgreSQL, MongoDB)
• Experience with containerization (Docker, Kubernetes)
• Familiarity with CI/CD pipelines and DevOps practices
• Knowledge of microservices architecture
• Experience with API development and RESTful services
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Bachelor's degree in Computer Science or related field

Preferred Qualifications:
• Experience with Python and machine learning frameworks
• Knowledge of GraphQL and modern API design
• Experience with Agile/Scrum methodologies
• Contributions to open-source projects
• Experience with test-driven development (TDD)
• Familiarity with modern frontend frameworks beyond React

We offer competitive compensation, comprehensive benefits, and opportunities for professional growth in a collaborative environment.`,
  
  parsedJson: {
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    summary: 'Experienced Senior Software Engineer with 6+ years in full-stack development, specializing in React, Node.js, and cloud architecture. Proven track record of leading development teams and delivering scalable applications.',
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 
      'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST APIs', 'Git', 
      'CI/CD', 'Microservices', 'TDD', 'Agile', 'Scrum', 'Machine Learning'
    ],
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        duration: '2021 - Present',
        description: 'Lead full-stack development using React, Node.js, and AWS. Architected microservices handling 1M+ daily requests.'
      },
      {
        title: 'Software Engineer',
        company: 'StartupXYZ',
        duration: '2019 - 2021',
        description: 'Developed scalable web applications using React and Python. Implemented CI/CD pipelines reducing deployment time by 60%.'
      },
      {
        title: 'Junior Developer',
        company: 'DevSolutions',
        duration: '2018 - 2019',
        description: 'Built responsive web interfaces and RESTful APIs. Contributed to open-source projects.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of California, Berkeley',
        year: '2018'
      }
    ]
  },

  // Enhanced analysis data
  searchabilityItems: [
    {
      title: 'Contact Information',
      description: 'Complete contact details including email and phone',
      status: 'good' as const
    },
    {
      title: 'Professional Summary',
      description: 'Strong summary highlighting key experience and skills',
      status: 'good' as const
    },
    {
      title: 'Technical Skills Section',
      description: 'Well-organized skills section with relevant technologies',
      status: 'good' as const
    },
    {
      title: 'Quantified Achievements',
      description: 'Contains specific metrics and measurable results',
      status: 'good' as const
    },
    {
      title: 'Keyword Optimization',
      description: 'High keyword match rate with job requirements',
      status: 'good' as const
    },
    {
      title: 'ATS-Friendly Format',
      description: 'Clean, readable format that ATS systems can parse',
      status: 'good' as const
    }
  ],

  recruiterTips: [
    {
      type: 'good' as const,
      title: 'Strong Technical Foundation',
      description: 'Excellent match for required technologies (React, Node.js, AWS). Experience level aligns perfectly with senior role requirements.'
    },
    {
      type: 'good' as const,
      title: 'Leadership Potential',
      description: 'Demonstrates progression from Junior to Senior role. Experience leading teams and architecting systems shows growth mindset.'
    },
    {
      type: 'good' as const,
      title: 'Cultural Fit Indicators',
      description: 'Open-source contributions and continuous learning suggest collaborative nature and passion for technology.'
    },
    {
      type: 'warning' as const,
      title: 'Consider Azure/GCP Experience',
      description: 'While AWS experience is strong, consider asking about multi-cloud experience for broader infrastructure knowledge.'
    }
  ],

  // Keyword analysis
  keywords: [
    { keyword: 'JavaScript', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'TypeScript', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'React', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'Node.js', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'AWS', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'Docker', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'Kubernetes', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'PostgreSQL', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'MongoDB', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'GraphQL', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'REST APIs', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'CI/CD', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'Microservices', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'TDD', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'Agile', inResume: true, inJobDesc: true, weight: 2.0 },
    { keyword: 'Python', inResume: true, inJobDesc: true, weight: 1.5 },
    { keyword: 'Machine Learning', inResume: true, inJobDesc: true, weight: 1.5 },
    { keyword: 'Azure', inResume: false, inJobDesc: true, weight: 1.5 },
    { keyword: 'Google Cloud', inResume: false, inJobDesc: true, weight: 1.5 }
  ],

  // Skills breakdown
  present: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker', 
    'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST APIs', 
    'CI/CD', 'Microservices', 'TDD', 'Agile', 'Python', 'Machine Learning'
  ],
  
  missing: ['Azure', 'Google Cloud'],
  
  summary: {
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 
      'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST APIs', 'Git', 
      'CI/CD', 'Microservices', 'TDD', 'Agile', 'Scrum', 'Machine Learning'
    ]
  },

  extractedChars: 2847,
  analyzedAt: new Date().toISOString(),

  // Additional metrics for enhanced display
  metrics: {
    overallScore: 89,
    skillsMatch: 94,
    experienceMatch: 87,
    educationMatch: 100,
    keywordDensity: 82,
    atsCompatibility: 96
  },

  // Competitive analysis data
  competitiveAnalysis: {
    industryAverage: 72,
    topPerformer: 95,
    yourPosition: 89,
    improvementAreas: [
      'Multi-cloud experience (Azure, GCP)',
      'Additional leadership certifications',
      'More quantified achievements'
    ],
    strengths: [
      'Strong technical skill alignment',
      'Progressive career growth',
      'Open-source contributions',
      'Modern technology stack'
    ]
  }
};

export default SAMPLE_ATS_SCAN_DATA;
