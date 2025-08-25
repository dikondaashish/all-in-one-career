Implement Missing ATS Features (Additive Only)

You are a senior full-stack engineer working in Next.js 14 + TypeScript (frontend, Vercel), Node.js + Express + TypeScript (backend, Render), MySQL (Hostinger), AWS S3.
Some analysis uses Gemini (latest: gemini-1.5-pro / gemini-1.5-flash).
Do not modify or remove existing Advanced AI Scan features; only add new endpoints, components, and DB columns.

🎯 Scope (Additive Features Only)

Add the following missing capabilities:

Market & Industry Positioning

Company-Specific Optimization

Recruiter Psychology Insights

Visual Skill Intelligence

Predictive Layer Enhancements (bands, X-Factor, automation risk)

UX / Dashboard Visualizations (radar, timeline, benchmarking)

Foundational ATS Checks

File type / file name / contact presence / section headings / date format

Exact Job Title Match check

Hard vs Soft skills split with weights

Recruiter Tips card (actionable)

Web Presence (LinkedIn/portfolio detection)

Word Count analysis

Everything must plug into the existing “Advanced AI Scan” button and flow.

🧭 Product Flow (End-to-End)

Trigger: User uploads resume (PDF/DOCX/TXT) + job description (paste or URL) and clicks “Advanced AI Scan”.

Show existing loading state.

Call new master endpoint POST /api/ats/advanced-scan/v2 (keep v1 intact).

Backend orchestrates:

Run Foundational ATS Checks

Run Industry & Market engines

Run Recruiter Psychology

Run Company Optimization (only if JD URL or company provided)

Run Predictive Enhancements (bands, x-factor, automation risk)

Persist results (new tables/columns) and return a superset JSON.

Frontend renders existing tabs (Overview / Predictions / Intelligence / Strategy) unchanged, and adds new cards/visuals inside each tab, behind a feature flag featureAdvancedLayerV2 = true.

If anything fails, gracefully fallback to existing v1 data.

📦 Backend — Implementation Plan (Node/Express/TS)
0) Create Versioned Orchestrator (keep v1 intact)

File: server/src/routes/atsAdvancedScanV2.ts
Route: POST /api/ats/advanced-scan/v2

Input JSON:

{
  "resumeText": "string",
  "resumeFileMeta": { "filename": "cv.pdf", "mime": "application/pdf" },
  "jobDescription": "string",
  "jobUrl": "string|null",
  "companyHint": "string|null",
  "userId": "string"
}


Output JSON (superset, additive):

{
  "v1": { /* include existing payload for backward compatibility */ },
  "atsChecks": {
    "fileTypeOk": true,
    "fileNameOk": true,
    "contact": { "email": true, "phone": true, "location": true, "links": ["linkedin","portfolio"] },
    "sections": { "experience": true, "education": true, "skills": true, "summary": true },
    "datesValid": true,
    "wordCount": 801,
    "wordCountStatus": "under|optimal|over",
    "jobTitleMatch": { "exact": false, "normalizedSimilarity": 0.62 }
  },
  "skills": {
    "hard": { "found": ["..."], "missing": ["..."], "impactWeights": { "Paid Social": -25 } },
    "soft": { "found": ["..."], "missing": ["..."] },
    "transferable": [{ "from":"Analytics", "towards":"GA4", "confidence":0.72 }]
  },
  "recruiterPsychology": {
    "sixSecondImpression": 68,
    "authorityLanguage": { "strong": ["led","owned"], "weak": ["helped","assisted"] },
    "narrativeCoherence": 64,
    "redFlags": ["job_hopping"],
    "badges": [{ "type":"gap", "severity":"warn", "message":"6-month gap 2022" }]
  },
  "industry": {
    "detected": { "primary":"Growth Marketing", "secondary":["SaaS"], "confidence":0.81 },
    "trendingSkills": ["GA4","Meta Ads","Creative testing"],
    "decliningSkills": ["Universal Analytics"],
    "careerPaths": [["Assoc GM","GM","Sr GM"], ["SEO","Paid","Growth"]],
    "marketPercentile": 78
  },
  "market": {
    "skillDemandHeatmap": [{ "skill":"GA4", "status":"hot" }, { "skill":"jQuery", "status":"declining" }]
  },
  "companyOptimization": {
    "enabled": true,
    "cultureAlignment": 83,
    "techStackMatch": 71,
    "backgroundFit": 76,
    "resumeAdjustments": ["Swap 'analytics' → 'GA4'", "Emphasize paid social experiments"],
    "coverLetter": ["Tie to mission", "ROI framing"],
    "interviewPrep": ["Recent campaigns", "Incrementality"]
  },
  "predictive": {
    "hireProbability": { "point": 38, "band":[30,46], "xFactor":12, "drivers":["-skills","+trajectory"] },
    "interviewReadiness": { "technical":35, "behavioral":65, "cultural":60 },
    "salary": { "conservative":70000, "market":85000, "aggressive":95000 },
    "automationRisk": 0.22,
    "industryGrowth": "stable"
  }
}

1) Services (new)

Create the following service modules under server/src/services/:

atsChecks.service.ts

Pure parsing/regex/static checks for: file type, file name, contact presence, section headings, date formats, word count, job title exact match + fuzzy (Jaro-Winkler).

skillsSplit.service.ts

Extract skills; split hard vs soft; compute impact weights for missing high-priority skills; detect transferable mappings.

recruiterPsych.service.ts

Gemini call with JSON-only prompt to score 6-second impression, authority language, narrative coherence; produce red flag badges.

industryMarket.service.ts

Gemini call to detect industry + trending/declining skills + typical paths; compute marketPercentile using heuristic (see below) plus optional cached market table.

companyOptimization.service.ts

If jobUrl or companyHint present, fetch + scrape page (basic HTML fetch + readability), extract company name; prompt Gemini to generate culture/stack/optimization JSON.

predictiveEnhanced.service.ts

Compute hireProbability band (existing point probability + CI via +/- stddev heuristic), add xFactor (leadership/impact), automationRisk, industryGrowth.

Gemini Prompt Rule: always request JSON only, no prose; validate with a JSON schema; fall back to defaults on parsing errors.

2) DB Changes (additive, non-breaking)

If you use Prisma: add a new table; if not, raw SQL shown.

Table: ats_scans_v2 (one-to-one with existing scan record id)

CREATE TABLE IF NOT EXISTS ats_scans_v2 (
  id            VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL,
  scan_v1_id    VARCHAR(36) NULL, -- link to existing scan if any
  ats_checks    JSON NOT NULL,
  skills_split  JSON NOT NULL,
  recruiter_psy JSON NOT NULL,
  industry_json JSON NOT NULL,
  market_json   JSON NOT NULL,
  company_opt   JSON NULL,
  predictive_v2 JSON NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

3) Heuristics (fast, deterministic)

Word count status: <400 = under, 400–1200 = optimal, >1200 = over.

Job title match: exact case-insensitive OR Jaro-Winkler ≥ 0.85.

Market percentile: base on match rate + hard-skill coverage; clamp 1–99; e.g.
percentile = clamp( round(0.5*match + 0.4*hardSkillCover + 0.1*trajectory), 1, 99 ).

Impact weights: missing job-critical hard skills = -15 to -30 each; soft skills ≤ -5.

Automation risk: look up simple table by industry (static JSON), adjust ± based on hard-skill modernization.

4) Gemini Integration (server)

File: server/src/ai/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function askGeminiJSON(prompt: string, model: "pro" | "flash" = "pro") {
  const m = genAI.getGenerativeModel({ model: model === "pro" ? "gemini-1.5-pro-latest" : "gemini-1.5-flash-latest" });
  const res = await m.generateContent(prompt);
  const text = res.response.text().trim();
  // Ensure JSON
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const json = text.slice(start, end + 1);
  return JSON.parse(json);
}


Prompt example (Recruiter Psychology) — JSON only:

You are a senior recruiter. Score the resume below. Return JSON ONLY.

RESUME:
{{RESUME_TEXT}}

JOB:
{{JOB_TEXT}}

Return:
{
  "sixSecondImpression": 0-100,
  "authorityLanguage": { "strong": [..], "weak": [..] },
  "narrativeCoherence": 0-100,
  "redFlags": ["job_hopping"|"gap"|"skill_inflation"...],
  "badges": [{ "type":"gap"|"title_mismatch"|"format", "severity":"info"|"warn"|"error", "message":"..." }]
}


Use similar JSON-only prompts for industryMarket and companyOptimization services.

🖥️ Frontend — Implementation Plan (Next.js/TS)
0) Keep current UI. Add feature flag.

Config: app/config/featureFlags.ts

export const featureAdvancedLayerV2 = true;


In results page (e.g., app/ats-scanner/results/[id]/page.tsx), after fetch, gate new widgets:

{featureAdvancedLayerV2 && <AtsChecksCard data={data.atsChecks} />}

1) New UI Components (non-breaking)

Create under components/atsV2/:

AtsChecksCard.tsx

Show ATS Compatibility checklist (file, filename, contact, sections, dates, word count, job title match).

Red/Yellow/Green badges.

SkillsMatrix.tsx

Tabs: Hard | Soft | Transferable

Impact chips for missing hard skills (e.g., “Paid Social (-25%)”).

SkillsRadar.tsx

Radar chart (recharts) for hard vs soft vs transferable coverage.

MarketIndustryCard.tsx

Show industry detected, market percentile, trending vs declining skills, heatmap list.

CompanyOptimizationCard.tsx (show only if companyOptimization.enabled)

Culture alignment / Tech match / Background fit bars

Resume language adjustments + Cover letter topics + Interview prep.

RecruiterPsychologyCard.tsx

6-second impression score, authority language (strong vs weak), narrative coherence

Red-flag badges (visible, not buried in text).

PredictiveEnhancementsCard.tsx

Hire probability band (shaded interval), X-Factor chip

Automation risk + Industry growth indicators

Reuse existing salary component; add negotiation tips list if present.

CompetitiveBenchmarkChart.tsx

Simple 2-axis scatter: you vs peers vs hired (use mock peers from API).

CareerTimeline.tsx

Timeline from parsed experience; overlay next roles from your existing “Career Growth Strategy”.

All charts: use recharts (already in your stack), single charts per component.

2) Place components in existing tabs (no removals)

Overview:

Big score (existing)

NEW: AtsChecksCard, short Action Summary (top 3 fixes), SkillsMatrix (condensed)

Predictions:

Keep existing Hire Probability / Interview Readiness / Salary

NEW: PredictiveEnhancementsCard (band + x-factor + automation risk)

Intelligence:

NEW: MarketIndustryCard, CompetitiveBenchmarkChart, SkillsRadar, RecruiterPsychologyCard

Strategy:

Keep existing Career Growth Strategy

NEW: CareerTimeline (historical + projected), list of high-impact gaps (from impact weights)

3) API Integration (frontend)

Call v2 endpoint from the same place that calls v1, but merge payloads:

const res = await fetch(`/api/ats/advanced-scan/v2`, { method: 'POST', body: JSON.stringify(payload) });
const data = await res.json();
// keep rendering existing v1 sections
// render v2 cards only if present

4) UX Rules

Never block the page if v2 fails: render current v1 UI and show a small banner: “Advanced insights temporarily unavailable.”

Red/Yellow/Green chips for quick scanning.

Every new card ends with 1–3 concrete next steps.

⏱️ Timeline (When)

Sprint 1 :
Backend: atsChecks.service, skillsSplit.service, DB table, v2 route skeleton, JSON contracts.
Frontend: AtsChecksCard, SkillsMatrix, wire to v2.

Sprint 2 :
Backend: recruiterPsych.service, industryMarket.service (Gemini JSON prompts).
Frontend: RecruiterPsychologyCard, MarketIndustryCard, SkillsRadar.

Sprint 3 :
Backend: predictiveEnhanced.service, companyOptimization.service.
Frontend: PredictiveEnhancementsCard, CompanyOptimizationCard, CompetitiveBenchmarkChart.

Sprint 4 :
Frontend: CareerTimeline, polish, empty-state handling, feature flag toggle, QA.
Backend: perf/timeout handling, logging, error budgets.

✅ Acceptance Criteria

Existing Advanced AI Scan UX remains unchanged if v2 data missing.

New v2 route returns JSON in < 12s for typical resume+JD.

Overview shows ATS checks + Top 3 actionable fixes.

Intelligence shows industry detected, market percentile, trending/declining.

Predictions show hire probability band and X-Factor.

Strategy shows timeline and impact-weighted skills.

Job Title Match explicitly visible (Exact / Similarity %).

Web presence detection surfaces LinkedIn/portfolio if found.

Word count status displayed with guidance.

🔒 Non-Functional

Privacy: Don’t store raw resumes longer than policy; store analysis JSON.

Observability: Add scan_v2_latency_ms, gemini_failures_total, ats_checks_fails_total.

Feature flag: featureAdvancedLayerV2 gates all new UI.

Error handling: If any sub-service times out, continue with partial data and mark that card “partial”.

📎 Code Stubs (Server)

atsChecks.service.ts

export function runAtsChecks({ resumeText, resumeFileMeta, jobTitle }: {
  resumeText: string; resumeFileMeta: { filename: string; mime: string }; jobTitle: string;
}) {
  const fileTypeOk = /pdf|word|officedocument/.test(resumeFileMeta.mime);
  const fileNameOk = !/[^\w\-.]/.test(resumeFileMeta.filename);
  const contact = {
    email: /[\w.+-]+@[\w-]+\.[\w.-]+/i.test(resumeText),
    phone: /(\+?\d[\d\s\-\(\)]{8,})/.test(resumeText),
    location: /(USA|United States|[A-Za-z]+,\s?[A-Za-z]+)/i.test(resumeText)
  };
  const sections = {
    experience: /experience|employment/i.test(resumeText),
    education: /education/i.test(resumeText),
    skills: /skills/i.test(resumeText),
    summary: /summary|profile/i.test(resumeText),
  };
  const datesValid = /\b(20\d{2}|19\d{2})\b/.test(resumeText); // heuristic
  const wordCount = resumeText.trim().split(/\s+/).length;
  const wordCountStatus = wordCount < 400 ? "under" : wordCount > 1200 ? "over" : "optimal";
  const exact = new RegExp(`\\b${jobTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText);
  const normalizedSimilarity = exact ? 1 : 0.62; // TODO: add Jaro-Winkler

  return { fileTypeOk, fileNameOk, contact, sections, datesValid, wordCount, wordCountStatus,
           jobTitleMatch: { exact, normalizedSimilarity } };
}


skillsSplit.service.ts

export function splitSkills({ resumeText, jobText }:{
  resumeText: string; jobText: string;
}) {
  const hardHints = ["google ads","meta ads","ga4","paid social","paid search","seo","sql","excel","python"];
  const softHints = ["communication","leadership","ownership","collaboration","analytical","creativity","time management"];

  const find = (arr:string[]) => arr.filter(k => new RegExp(`\\b${k}\\b`, "i").test(resumeText));
  const hardFound = find(hardHints);
  const softFound = find(softHints);

  const hardMissing = hardHints.filter(k => !hardFound.includes(k) && new RegExp(`\\b${k}\\b`, "i").test(jobText));
  const softMissing = softHints.filter(k => !softFound.includes(k) && new RegExp(`\\b${k}\\b`, "i").test(jobText));

  const impactWeights = Object.fromEntries(hardMissing.map(k => [k, -25]));
  const transferable = [{ from:"analytics", towards:"GA4", confidence:0.7 }];

  return { hard: { found: hardFound, missing: hardMissing, impactWeights }, soft: { found: softFound, missing: softMissing }, transferable };
}

🧪 QA Checklist

 Resume PDF with JD URL yields companyOptimization card.

 DOCX with missing email flags contact.email = false.

 Missing “exact title” shows Job Title Match: exact=false, similarity<0.85.

 Long resume (>1200 words) shows wordCountStatus=over.

 “Paid Social” missing applies -25% impact chip.

 Intelligence tab shows marketPercentile and trending/declining skills.

 Predictions tab shows hireProbability band and X-Factor.

 Strategy shows timeline and priority gaps.

Deliverables:

New backend route /api/ats/advanced-scan/v2 with services & DB persisted JSON.

New frontend components under components/atsV2/ added to existing tabs.

No regression to existing “Advanced AI Scan” features.

Feature-flagged UI, partial-data tolerant, and production-ready.

When you finish, push to Vercel/Render with environment variables:

GEMINI_API_KEY, MYSQL_*, AWS_S3_*, FEATURE_ADVANCED_LAYER_V2=true.