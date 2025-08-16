import { Router } from 'express';
import { geminiGenerate } from '../lib/gemini';
export default function searchRouter(prisma, logger) {
    const r = Router();
    r.get('/', async (req, res) => {
        try {
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'Query parameter is required' });
            }
            // Use Gemini to extract keywords and intent
            const systemPrompt = `You are a search assistant. Analyze the user's search query and extract relevant keywords and intent for searching through job applications, portfolios, emails, referrals, and tasks. Return only the most relevant keywords separated by spaces.`;
            const extractedKeywords = await geminiGenerate('gemini-1.5-flash', systemPrompt, query);
            logger.info(`Search query: "${query}", Extracted keywords: "${extractedKeywords}"`);
            // Search across multiple models
            const searchResults = [];
            // Search applications
            const applications = await prisma.application.findMany({
                where: {
                    OR: [
                        { company: { contains: extractedKeywords, mode: 'insensitive' } },
                        { role: { contains: extractedKeywords, mode: 'insensitive' } },
                        { notes: { contains: extractedKeywords, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                include: {
                    user: { select: { email: true } }
                }
            });
            applications.forEach(app => {
                searchResults.push({
                    type: 'Application',
                    title: `${app.role} at ${app.company}`,
                    subInfo: `Status: ${app.status} • ${app.user.email}`,
                    id: app.id,
                    link: `/applications/${app.id}`
                });
            });
            // Search referral requests
            const referrals = await prisma.referralRequest.findMany({
                where: {
                    OR: [
                        { company: { contains: extractedKeywords, mode: 'insensitive' } },
                        { role: { contains: extractedKeywords, mode: 'insensitive' } },
                        { notes: { contains: extractedKeywords, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                include: {
                    user: { select: { email: true } }
                }
            });
            referrals.forEach(ref => {
                searchResults.push({
                    type: 'Referral',
                    title: `${ref.role} at ${ref.company}`,
                    subInfo: `Status: ${ref.status} • ${ref.user.email}`,
                    id: ref.id,
                    link: `/referrals/${ref.id}`
                });
            });
            // Search portfolio sites
            const portfolios = await prisma.portfolioSite.findMany({
                where: {
                    OR: [
                        { slug: { contains: extractedKeywords, mode: 'insensitive' } },
                        { theme: { contains: extractedKeywords, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                include: {
                    user: { select: { email: true } }
                }
            });
            portfolios.forEach(portfolio => {
                searchResults.push({
                    type: 'Portfolio',
                    title: `Portfolio: ${portfolio.slug}`,
                    subInfo: `Theme: ${portfolio.theme} • ${portfolio.user.email}`,
                    id: portfolio.id,
                    link: `/portfolio/${portfolio.slug}`
                });
            });
            // Search job descriptions (for applications)
            const jobDescriptions = await prisma.jobDescription.findMany({
                where: {
                    OR: [
                        { title: { contains: extractedKeywords, mode: 'insensitive' } },
                        { company: { contains: extractedKeywords, mode: 'insensitive' } },
                        { content: { contains: extractedKeywords, mode: 'insensitive' } }
                    ]
                },
                take: 5
            });
            jobDescriptions.forEach(jd => {
                searchResults.push({
                    type: 'Job Description',
                    title: `${jd.title} at ${jd.company}`,
                    subInfo: `Posted: ${jd.createdAt.toLocaleDateString()}`,
                    id: jd.id,
                    link: `/job-descriptions/${jd.id}`
                });
            });
            // Sort results by relevance (simple scoring based on type and content)
            const sortedResults = searchResults
                .sort((a, b) => {
                // Prioritize applications and job descriptions
                const typePriority = { 'Application': 3, 'Job Description': 2, 'Portfolio': 1, 'Referral': 1 };
                const aScore = typePriority[a.type] || 0;
                const bScore = typePriority[b.type] || 0;
                return bScore - aScore;
            })
                .slice(0, 5); // Return top 5 results
            logger.info(`Search completed. Found ${sortedResults.length} results for query: "${query}"`);
            res.json({
                query,
                extractedKeywords,
                results: sortedResults,
                totalResults: searchResults.length
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Search failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return r;
}
//# sourceMappingURL=search.js.map