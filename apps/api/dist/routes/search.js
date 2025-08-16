import { Router } from 'express';
import { geminiGenerate } from '../lib/gemini';
export default function searchRouter(prisma, logger) {
    const r = Router();
    r.get('/', async (req, res) => {
        try {
            const { query, model, status, dateRange } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'Query parameter is required' });
            }
            // Parse and validate filters
            const filters = {};
            if (model && typeof model === 'string') {
                const modelValue = model;
                if (modelValue) {
                    filters.model = modelValue;
                }
            }
            if (status && typeof status === 'string') {
                const statusValue = status;
                if (statusValue) {
                    filters.status = statusValue;
                }
            }
            if (dateRange && typeof dateRange === 'string') {
                const days = parseInt(dateRange);
                if (!isNaN(days) && days > 0) {
                    filters.dateRange = days;
                }
            }
            // Use Gemini to extract keywords and intent
            const systemPrompt = `You are a search assistant. Analyze the user's search query and extract relevant keywords and intent for searching through job applications, portfolios, emails, referrals, and tasks. Return only the most relevant keywords separated by spaces.`;
            const extractedKeywords = await geminiGenerate('gemini-1.5-flash', systemPrompt, query);
            console.log(`Search query: "${query}", Extracted keywords: "${extractedKeywords}", Filters:`, JSON.stringify(filters));
            // Search across multiple models
            const searchResults = [];
            // Helper function to calculate relevance score
            const calculateRelevanceScore = (text, type, createdAt) => {
                let score = 0;
                const keywords = extractedKeywords.toLowerCase().split(' ');
                const textLower = text.toLowerCase();
                // Boost for title matches
                keywords.forEach(keyword => {
                    if (textLower.includes(keyword)) {
                        score += 10; // High boost for title matches
                    }
                });
                // Boost for exact phrase matches
                if (textLower.includes(extractedKeywords.toLowerCase())) {
                    score += 15; // Very high boost for exact phrase
                }
                // Boost for newer content
                const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceCreation <= 7)
                    score += 5;
                else if (daysSinceCreation <= 30)
                    score += 3;
                else if (daysSinceCreation <= 90)
                    score += 1;
                // Type priority
                const typePriority = { 'Application': 3, 'Job Description': 2, 'Portfolio': 1, 'Referral': 1 };
                score += typePriority[type] || 0;
                return score;
            };
            // Helper function to apply date filter
            const applyDateFilter = (dateFilter) => {
                if (!filters.dateRange || !dateFilter)
                    return true;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - filters.dateRange);
                return dateFilter >= cutoffDate;
            };
            // Search applications (if model filter allows)
            if (!filters.model || filters.model === 'applications' || filters.model === 'all') {
                const whereClause = {
                    OR: [
                        { company: { contains: extractedKeywords, mode: 'insensitive' } },
                        { role: { contains: extractedKeywords, mode: 'insensitive' } },
                        { notes: { contains: extractedKeywords, mode: 'insensitive' } }
                    ]
                };
                // Apply status filter if specified
                if (filters.status) {
                    whereClause.status = filters.status;
                }
                const applications = await prisma.application.findMany({
                    where: whereClause,
                    take: 10,
                    include: {
                        user: { select: { email: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                applications.forEach((app) => {
                    if (applyDateFilter(app.createdAt)) {
                        const relevanceScore = calculateRelevanceScore(`${app.role} ${app.company} ${app.notes || ''}`, 'Application', app.createdAt);
                        searchResults.push({
                            type: 'Application',
                            title: `${app.role} at ${app.company}`,
                            subInfo: `Status: ${app.status} • ${app.user.email}`,
                            id: app.id,
                            link: `/applications/${app.id}`,
                            relevanceScore,
                            createdAt: app.createdAt
                        });
                    }
                });
            }
            // Search referral requests (if model filter allows)
            if (!filters.model || filters.model === 'referrals' || filters.model === 'all') {
                const referrals = await prisma.referralRequest.findMany({
                    where: {
                        OR: [
                            { company: { contains: extractedKeywords, mode: 'insensitive' } },
                            { role: { contains: extractedKeywords, mode: 'insensitive' } },
                            { notes: { contains: extractedKeywords, mode: 'insensitive' } }
                        ]
                    },
                    take: 10,
                    include: {
                        user: { select: { email: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                referrals.forEach((ref) => {
                    if (applyDateFilter(ref.createdAt)) {
                        const relevanceScore = calculateRelevanceScore(`${ref.role} ${ref.company} ${ref.notes || ''}`, 'Referral', ref.createdAt);
                        searchResults.push({
                            type: 'Referral',
                            title: `${ref.role} at ${ref.company}`,
                            subInfo: `Status: ${ref.status} • ${ref.user.email}`,
                            id: ref.id,
                            link: `/referrals/${ref.id}`,
                            relevanceScore,
                            createdAt: ref.createdAt
                        });
                    }
                });
            }
            // Search portfolio sites (if model filter allows)
            if (!filters.model || filters.model === 'portfolio' || filters.model === 'all') {
                const portfolios = await prisma.portfolioSite.findMany({
                    where: {
                        OR: [
                            { slug: { contains: extractedKeywords, mode: 'insensitive' } },
                            { theme: { contains: extractedKeywords, mode: 'insensitive' } }
                        ]
                    },
                    take: 10,
                    include: {
                        user: { select: { email: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                portfolios.forEach((portfolio) => {
                    if (applyDateFilter(portfolio.createdAt)) {
                        const relevanceScore = calculateRelevanceScore(`${portfolio.slug} ${portfolio.theme}`, 'Portfolio', portfolio.createdAt);
                        searchResults.push({
                            type: 'Portfolio',
                            title: `Portfolio: ${portfolio.slug}`,
                            subInfo: `Theme: ${portfolio.theme} • ${portfolio.user.email}`,
                            id: portfolio.id,
                            link: `/portfolio/${portfolio.slug}`,
                            relevanceScore,
                            createdAt: portfolio.createdAt
                        });
                    }
                });
            }
            // Search job descriptions (if model filter allows)
            if (!filters.model || filters.model === 'job-descriptions' || filters.model === 'all') {
                const jobDescriptions = await prisma.jobDescription.findMany({
                    where: {
                        OR: [
                            { title: { contains: extractedKeywords, mode: 'insensitive' } },
                            { company: { contains: extractedKeywords, mode: 'insensitive' } },
                            { content: { contains: extractedKeywords, mode: 'insensitive' } }
                        ]
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                });
                jobDescriptions.forEach((jd) => {
                    if (applyDateFilter(jd.createdAt)) {
                        const relevanceScore = calculateRelevanceScore(`${jd.title} ${jd.company} ${jd.content}`, 'Job Description', jd.createdAt);
                        searchResults.push({
                            type: 'Job Description',
                            title: `${jd.title} at ${jd.company}`,
                            subInfo: `Posted: ${jd.createdAt.toLocaleDateString()}`,
                            id: jd.id,
                            link: `/job-descriptions/${jd.id}`,
                            relevanceScore,
                            createdAt: jd.createdAt
                        });
                    }
                });
            }
            // Sort results by relevance score and return top 5
            const sortedResults = searchResults
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, 5)
                .map(({ relevanceScore, createdAt, ...result }) => result); // Remove internal fields from response
            console.log(`Search completed. Found ${sortedResults.length} results for query: "${query}" with filters:`, JSON.stringify(filters));
            res.json({
                query,
                extractedKeywords,
                filters,
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