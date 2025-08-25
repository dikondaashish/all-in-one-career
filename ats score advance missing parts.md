Implement Missing ATS Features (Next.js + Node/Express + Gemini 2.0 + MySQL + S3)

Context
Frontend: Next.js 14 + TypeScript, deployed on Vercel
Backend: Node.js + Express + TypeScript, deployed on Render
DB: MySQL (Hostinger) via Prisma
File storage: AWS S3
AI: Google Gemini 2.0 (use latest stable model id, e.g. "gemini-2.0-pro-exp"; if not available, fallback to "gemini-1.5-pro-latest")

Goal
Add the following missing features and wire them into our Advanced AI Scanner flow:

Market & Industry Positioning

Company-Specific Optimization

Recruiter Psychology Insights

Visual Skill Intelligence (with impact weighting)

Predictive Enhancements (confidence bands, X-factor, automation risk)

ATS Compatibility & Searchability checks (file type, file name, headings, contact info, date formats)

Job Title Match

Hard vs Soft skill split

Recruiter Tips card

Web presence detection

Word count check

Visual-first dashboard (radar charts, timeline, percentile, alerts)

0) End-to-End UX Flow (what the user sees)

Trigger: User uploads resume (.docx/.pdf/.txt) + provides job description (paste or URL) → clicks “Advanced AI Scan”
Loading: Show progress steps: Parsing → ATS Checks → Skill Intelligence → Market & Industry → Company Fit → Predictions → Strategy
Results order (tabs):

Overview: Overall score, percentile vs market, top 3 fixes, red/yellow/green alerts

Predictions: Hire probability with confidence band, interview readiness, salary playbook, X-factor

Intelligence: Industry trends, skill demand heatmap, market benchmarks, hard vs soft with impact weights

Company Fit (if URL/company provided): Culture / Tech stack match, tailored rewrite suggestions

Strategy: Career timeline, automation risk, next roles, priority skills, action plan, export PDF

1) Backend — APIs, Models, and Services
1.1 Prisma schema additions (/backend/prisma/schema.prisma)
model ATSScanAdvanced {
  id                 String   @id @default(cuid())
  userId             String
  resumeObjectKey    String?  // S3 key for raw resume (optional)
  jdUrl              String?  // optional job URL
  overallScore       Int
  percentile         Int      // market percentile
  atsCompatibility   Json     // detailed ATS checks
  jobTitleMatch      Json     // { exactFound: bool, normalizedMatch: number }
  skills             Json     // { hardFound: string[], hardMissing: string[], softFound: string[], softMissing: string[], impactWeights: Record<string,int> }
  recruiterPsych     Json     // first6s, authorityLanguage, narrative, redFlags: string[]
  marketIntel        Json     // trends, hot/declining, benchmarks
  industryIntel      Json     // detection, confidence, career paths
  companyFit         Json?    // cultureMatch, techStackMatch, rewriteSuggestions[]
  predictions        Json     // hireProbability {prob, ci}, interviewReadiness, salaryPlaybook, xFactor, automationRisk
  strategy           Json     // nextRoles[], skillGaps[], timeline, actions[]
  wordStats          Json     // { wordCount: number, recommendedRange: [min,max] }
  webPresence        Json     // { linkedin: string?, portfolio: string?, github: string? }
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@map("ats_scans_advanced")
}

model MarketCache {
  id          String   @id @default(cuid())
  industry    String
  payload     Json
  updatedAt   DateTime @default(now())
  @@map("market_cache")
}

1.2 S3 utility (/backend/src/lib/s3.ts)

putObject(buffer, key, contentType) for resume uploads from FE (optional)

getSignedUrl(key) for debug/exports

1.3 Gemini client (/backend/src/lib/gemini.ts)

Export genAI + getModel("gemini-2.0-pro-exp") with fallback to "gemini-1.5-pro-latest"

Helper generateJson(prompt: string, safety={}) → must parse/validate JSON, handle retries

1.4 Parsing & ATS checks (/backend/src/services/atsChecks.ts)

Input: raw text of resume + file metadata + JD text/title

Output:

interface ATSCompatibility {
  fileType: 'pdf'|'docx'|'txt'|'unknown';
  fileNameOk: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  headings: { experience: boolean; education: boolean; skills: boolean; summary: boolean };
  datesValid: boolean;
}
interface JobTitleMatch { exactFound: boolean; normalizedMatch: number }
interface WordStats { wordCount: number; recommendedRange: [number, number] }
interface WebPresence { linkedin?: string; portfolio?: string; github?: string }


Implement regex-based contact detection; headings detection (tokenize lowercased headings); date patterns; file type from upload metadata; title match (exact + fuzzy).

1.5 Skill Intelligence (/backend/src/services/skills.ts)

Extract hard vs soft from JD + resume using:

Static lists + Gemini classification for ambiguous cases

Compute impact weights: required (weight 3), preferred (2), mentioned (1)

Output:

interface SkillIntel {
  hardFound: string[]; hardMissing: string[];
  softFound: string[]; softMissing: string[];
  impactWeights: Record<string, number>; // e.g., { "Paid Social": 3 }
  transferableNotes: Array<{ from: string; to: string; rationale: string }>;
}

1.6 Market & Industry (/backend/src/services/marketIndustry.ts)

detectIndustry(resumeText, jdText) via Gemini (JSON-only)

getMarketIntel(industry) from cache or Gemini synthesis: trends, hot vs declining skills, salary benchmarks, competition level

Output:

interface IndustryIntel { primary: string; secondary: string[]; confidence: number; careerPaths: string[][] }
interface MarketIntel { hot: string[]; declining: string[]; benchmarks: { salaryRange:[number,number], competition:number }, demandScores: Record<string,'hot'|'stable'|'declining'> }

1.7 Company Fit (/backend/src/services/companyFit.ts)

If jdUrl or company name present:

Lightweight scraper (server-side fetch + readability) or accept pasted JD + company name

Gemini prompt → culture values, tech stack, language tone

Generate resume rewrite suggestions (bullet replacements, keyword swaps)

Output:

interface CompanyFit {
  cultureMatch: number; techStackMatch: number; backgroundFit: number;
  rewriteSuggestions: string[]; keywordsToAdd: string[]; keywordsToAvoid: string[];
}

1.8 Recruiter Psychology (/backend/src/services/recruiterPsych.ts)

Gemini analysis over resume text:

first6s score, authority language score, story coherence, red flags

Output:

interface RecruiterPsych {
  first6s: number; authority: number; narrative: number; redFlags: string[];
  recruiterTips: string[]; // 5–7 concise actions
}

1.9 Predictions (/backend/src/services/predictions.ts)

Combine: SkillIntel + RecruiterPsych + MarketIntel + IndustryIntel + ATSCompatibility

Gemini prompt for:

Hire probability prob with confidenceInterval

Interview readiness (technical/behavioral/cultural)

Salary playbook (conservative/market/aggressive + leverage points)

X-factor reason list

Automation risk (0–100) + outlook

Output:

interface Predictions {
  hireProbability: { prob:number; confidenceInterval:[number,number]; reasoning:string[] };
  interviewReadiness: { technical:number; behavioral:number; cultural:number; suggestions:string[] };
  salaryPlaybook: { conservative:number; market:number; aggressive:number; leveragePoints:string[]; strategy:string[] };
  xFactor: string[];
  automationRisk: number;
}

1.10 Aggregation & scoring (/backend/src/services/aggregate.ts)

Compute overallScore from weighted subscores:

ATS compatibility 15%

Skill match + impact weights 30%

Recruiter psychology 15%

Market/Industry alignment 15%

Predictions (hire + interview) 25%

Compute percentile using MarketIntel benchmarks + heuristic normalization.

1.11 API Route — Advanced Scan (/backend/src/routes/ats/advanced-scan.ts)

POST /api/ats/advanced-scan

// Request
{
  "resumeText": string,             // or S3 objectKey if already uploaded
  "jobDescription": string,
  "jobUrl": string | null,
  "fileMeta": { "name": string, "type": "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain" }
}

// Response
{
  "scanId": string,
  "overallScore": number,
  "percentile": number,
  "atsCompatibility": ATSCompatibility,
  "jobTitleMatch": JobTitleMatch,
  "skills": SkillIntel,
  "recruiterPsych": RecruiterPsych,
  "marketIntel": MarketIntel,
  "industryIntel": IndustryIntel,
  "companyFit": CompanyFit | null,
  "predictions": Predictions,
  "strategy": {
    "nextRoles": Array<{ title:string; timeframe:string; probability:number; salaryRange:[number,number] }>,
    "prioritySkills": Array<{ skill:string; importance:'CRITICAL'|'IMPORTANT'|'NICE'; timeToAcquire:string }>,
    "actionsShortTerm": string[],
    "actionsLongTerm": string[]
  },
  "wordStats": WordStats,
  "webPresence": WebPresence
}


Auth: Bearer token (Firebase or existing)

Store full payload in ATSScanAdvanced row

Return saved row ID for FE hydration

1.12 Security, Limits, Reliability

Validate payload size, sanitize JD URL, timeouts on scraping, retry Gemini once

Circuit-breakers for external fetches, log to console + Sentry (if configured)

Rate limit per user (e.g., 10 scans/hour) at API gateway

2) Gemini JSON-Only Prompts (copy/paste)

All prompts MUST respond with valid JSON ONLY. No prose, no markdown.

2.1 Industry Detection
You are an industry classifier. Return JSON ONLY.

INPUT:
RESUME:
{{resumeText}}
JOB:
{{jobDescription}}

TASK:
Detect primary industry and 1–3 secondary specializations and confidence (0–1). Provide typical career paths for this industry (2–3 arrays from junior→senior).

JSON:
{
  "primary": "Growth Marketing",
  "secondary": ["SaaS", "B2C"],
  "confidence": 0.87,
  "careerPaths": [
    ["Marketing Associate","Growth Marketer","Growth Manager","Head of Growth"],
    ["Performance Marketer","Growth Manager","Growth Lead"]
  ]
}

2.2 Market Intelligence Synthesis
You are a market analyst. Return JSON ONLY.

INPUT:
INDUSTRY: {{industry}}
RESUME SKILLS: {{skillsArray}}
JOB SKILLS: {{jdSkillsArray}}

TASK:
Provide hot vs declining skills, demand scores for top 20 skills, salary benchmarks, competition level (0–100).

JSON:
{
  "hot": ["Paid Social","GA4","Lifecycle"],
  "declining": ["Print Media"],
  "benchmarks": { "salaryRange":[90000,130000], "competition": 72 },
  "demandScores": { "Paid Social":"hot","GA4":"hot","Print Media":"declining" }
}

2.3 Recruiter Psychology
You are a senior recruiter. Return JSON ONLY.

INPUT:
RESUME:
{{resumeText}}

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
}

2.4 Company Fit & Rewrite
You are a company-fit optimizer. Return JSON ONLY.

INPUT:
COMPANY CONTEXT:
{{companySignalsJSON}}
RESUME:
{{resumeText}}
JOB:
{{jobDescription}}

TASK:
Score cultureMatch, techStackMatch, backgroundFit (0–100). Propose 5–10 resume rewrite suggestions, keywords to add/avoid.

JSON:
{
  "cultureMatch": 78,
  "techStackMatch": 64,
  "backgroundFit": 71,
  "rewriteSuggestions": [
    "Mention GA4 explicitly in Skills",
    "Add 'managed $250k monthly budget'",
    "Use 'experiment velocity' once"
  ],
  "keywordsToAdd": ["GA4","Paid Social","CAC","LTV"],
  "keywordsToAvoid": ["general marketing","assisted","helped"]
}

2.5 Predictions (Hire/Interview/Salary/X-factor/Automation Risk)
You are a hiring outcomes predictor. Return JSON ONLY.

INPUT:
SKILLS: {{skillsJSON}}
RECRUITER: {{recruiterPsychJSON}}
MARKET: {{marketIntelJSON}}
INDUSTRY: {{industryIntelJSON}}
ATS: {{atsCompatJSON}}

TASK:
Compute hireProbability with confidenceInterval, interviewReadiness (technical, behavioral, cultural), salary playbook, xFactor notes, automationRisk (0–100).

JSON:
{
  "hireProbability": { "prob": 44, "confidenceInterval": [36, 52], "reasoning": ["Low hard-skill overlap","Good narrative"] },
  "interviewReadiness": { "technical": 35, "behavioral": 65, "cultural": 60, "suggestions": ["Study GA4","Prepare STAR stories on growth loops"] },
  "salaryPlaybook": { "conservative": 70000, "market": 85000, "aggressive": 95000, "leveragePoints": ["Cross-functional collaboration"], "strategy": ["Negotiate after verbal offer"] },
  "xFactor": ["AI analytics exposure"],
  "automationRisk": 22
}

3) Frontend — Components & Integration (Next.js 14)
3.1 API Hook (/frontend/src/hooks/useAdvancedScan.ts)

mutate({ resumeText, jobDescription, jobUrl, fileMeta }) → POST /api/ats/advanced-scan (backend URL)

Handle loading steps with server-sent progress (optional) or staged skeletons

3.2 UI — Tabs & Widgets (Tailwind + Framer Motion)

Overview Tab

Big score donut + percentile badge

Top 3 fixes (chips)

Alerts: red flags from recruiterPsych

Predictions Tab

Hire probability with confidence band (shaded bar)

Interview readiness bars; salary playbook cards; X-factor pills

Intelligence Tab

Radar chart: hard vs soft → use recharts RadarChart

Skill demand heatmap (list with hot/stable/declining badges)

Hard/Missing table with impact weight column

Word count + web presence badges

Company Fit Tab (if provided)

3 mini-meters: Culture / Tech stack / Background

Rewrite suggestions list + Keywords add/avoid tags

Strategy Tab

Career timeline (past → next roles)

Priority skills cards with chips (CRITICAL/IMPORTANT)

Automation risk gauge

Action plan (short vs long term)

Export PDF button (render from current JSON via react-pdf or server PDF)

Create these components under /frontend/src/components/ats/:

OverviewPanel.tsx, PredictionsPanel.tsx, IntelligencePanel.tsx, CompanyFitPanel.tsx, StrategyPanel.tsx

Shared charts in /frontend/src/components/ats/charts/* (Radar, Gauge, ConfidenceBand)

3.3 Routes & Page

Results page uses query ?scanId= to fetch payload and hydrate panels

Skeleton/placeholder states for each panel while loading

4) Acceptance Criteria (Done = ✅)

ATS checks visible with ✅/❌ and clear fixes (file type, file name, contact info, headings, dates)

Job title match chip with “Add to summary” CTA

Hard vs Soft sections + impact weight column

Recruiter Tips card (5–7 items)

Web presence detection (LinkedIn/portfolio/github)

Word count with recommended range

Percentile visible in Overview

Skill demand heatmap and industry trends present

Company Fit tab appears when company/JD URL provided with rewrite suggestions

Predictions show confidence interval band + X-factor + automation risk

Visual charts: radar, timeline, confidence band, gauges

PDF export contains all sections

5) When to Implement (Phased, but ship continuously)

Week 1: ATS checks + Job title match + Word count + Web presence + Hard/Soft split (+ FE panels)

Week 2: Recruiter psychology + Tips + Visual skill radar + Impact weights

Week 3: Industry detection + Market intel + Percentile + Heatmap

Week 4: Company fit + rewrite suggestions + keywords add/avoid

Week 5: Predictions upgrades (confidence bands, X-factor, automation risk) + Salary playbook

Week 6: Strategy tab (timeline, next roles, actions) + PDF export, polishing, error states

6) Why this design wins

Covers basic ATS reassurance users expect and

Delivers predictive, recruiter-grade intelligence competitors lack

Presents insights with premium, visual-first UX that builds trust

Now do the following:

Create backend services per file map above; wire route /api/ats/advanced-scan.

Add Prisma models and run migration.

Implement Gemini prompts exactly as JSON-only.

Build FE panels and charts; connect to response JSON.

Test with 3 sample resumes + 3 JDs (one good match, one partial, one mismatch).

Ship behind feature flag ADVANCED_AI_SCAN.

If anything is unclear, propose the file diff and we’ll iterate.