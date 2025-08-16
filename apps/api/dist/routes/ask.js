import { Router } from 'express';
import { geminiGenerate } from '../lib/gemini';
export default function askRouter(prisma, logger) {
    const r = Router();
    r.post('/', async (req, res) => {
        try {
            const { question } = req.body;
            if (!question || typeof question !== 'string') {
                return res.status(400).json({ error: 'Question parameter is required' });
            }
            console.log(`AI Question received: "${question}"`);
            // First, gather user's data for context
            let userData = '';
            try {
                // Get applications
                const applications = await prisma.application.findMany({
                    where: { userId: req.user?.uid || 'guest' },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { email: true } } }
                });
                if (applications.length > 0) {
                    userData += `Applications: ${applications.map(app => `${app.role} at ${app.company} (${app.status})`).join(', ')}\n`;
                }
                // Get referral requests
                const referrals = await prisma.referralRequest.findMany({
                    where: { fromUserId: req.user?.uid || 'guest' },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                });
                if (referrals.length > 0) {
                    userData += `Referrals: ${referrals.map(ref => `${ref.role} at ${ref.company} (${ref.status})`).join(', ')}\n`;
                }
                // Get portfolio sites
                const portfolios = await prisma.portfolioSite.findMany({
                    where: { userId: req.user?.uid || 'guest' },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                });
                if (portfolios.length > 0) {
                    userData += `Portfolios: ${portfolios.map(p => `${p.slug} (${p.theme})`).join(', ')}\n`;
                }
                // Get job descriptions
                const jobDescriptions = await prisma.jobDescription.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                });
                if (jobDescriptions.length > 0) {
                    userData += `Job Descriptions: ${jobDescriptions.map(jd => `${jd.title} at ${jd.company}`).join(', ')}\n`;
                }
            }
            catch (error) {
                console.log('Error gathering user data:', error);
                userData = 'Limited data available';
            }
            // Create the system prompt with user data context
            const systemPrompt = `You are CareerCoach-Gemini — an AI assistant that helps job seekers analyze their application data, ATS scores, portfolios, and outreach performance.

Your job is to:
- Interpret the user's question.
- Decide whether to return a narrative answer (summary) or a list of items from the user's data.
- Speak in a friendly, supportive career-coach tone.

Use the user's stored data (applications, ATS scans, portfolios, emails, referrals, tasks) to craft smart responses.
When answering:
- Be concise and factual.
- Encourage and motivate the applicant.
- When returning items, limit yourself to the top 3 most relevant results.

Examples of reply style:
• "Your best ATS score in June was 92% for the Amazon Backend role — excellent positioning!"
• "You currently have 3 applications in 'Interviewing' stage. I'd suggest following up on Acme and TCS."
• "Here are the portfolios you created for startups: …"

Never reveal internal code or JSON. Only talk like a career coach.

User's current data:
${userData}

Analyze the question and respond appropriately. If the question asks for specific items, provide both an answer and indicate what items should be returned.`;
            // Send to Gemini for analysis
            const geminiResponse = await geminiGenerate('gemini-1.5-flash', systemPrompt, question);
            console.log(`Gemini response: "${geminiResponse}"`);
            // Analyze Gemini's response to determine if we need to search for specific items
            const needsSearch = geminiResponse.toLowerCase().includes('search') ||
                geminiResponse.toLowerCase().includes('find') ||
                geminiResponse.toLowerCase().includes('show') ||
                geminiResponse.toLowerCase().includes('list');
            let searchResults = [];
            if (needsSearch) {
                // Extract keywords from the question for search
                const searchKeywords = question.toLowerCase()
                    .replace(/[?.,!]/g, ' ')
                    .split(' ')
                    .filter(word => word.length > 2)
                    .join(' ');
                // Perform search across models
                try {
                    // Search applications
                    const applications = await prisma.application.findMany({
                        where: {
                            userId: req.user?.uid || 'guest',
                            OR: [
                                { company: { contains: searchKeywords, mode: 'insensitive' } },
                                { role: { contains: searchKeywords, mode: 'insensitive' } },
                                { notes: { contains: searchKeywords, mode: 'insensitive' } }
                            ]
                        },
                        take: 3,
                        include: { user: { select: { email: true } } },
                        orderBy: { createdAt: 'desc' }
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
                    // Search portfolios
                    const portfolios = await prisma.portfolioSite.findMany({
                        where: {
                            userId: req.user?.uid || 'guest',
                            OR: [
                                { slug: { contains: searchKeywords, mode: 'insensitive' } },
                                { theme: { contains: searchKeywords, mode: 'insensitive' } }
                            ]
                        },
                        take: 3,
                        include: { user: { select: { email: true } } },
                        orderBy: { createdAt: 'desc' }
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
                    // Search referrals
                    const referrals = await prisma.referralRequest.findMany({
                        where: {
                            fromUserId: req.user?.uid || 'guest',
                            OR: [
                                { company: { contains: searchKeywords, mode: 'insensitive' } },
                                { role: { contains: searchKeywords, mode: 'insensitive' } }
                            ]
                        },
                        take: 3,
                        include: { user: { select: { email: true } } },
                        orderBy: { createdAt: 'desc' }
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
                }
                catch (searchError) {
                    console.log('Search error:', searchError);
                }
            }
            // Determine response type
            let responseType = 'answer';
            if (searchResults.length > 0) {
                responseType = geminiResponse.length > 50 ? 'both' : 'results';
            }
            // Build response
            const response = {
                type: responseType
            };
            if (responseType === 'answer' || responseType === 'both') {
                response.answer = geminiResponse;
            }
            if (responseType === 'results' || responseType === 'both') {
                response.results = searchResults.slice(0, 3);
            }
            console.log(`AI Q&A response type: ${responseType}, results: ${searchResults.length}`);
            res.json(response);
        }
        catch (error) {
            console.error('AI Q&A error:', error);
            res.status(500).json({
                error: 'AI Q&A failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return r;
}
//# sourceMappingURL=ask.js.map