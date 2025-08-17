import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';
import { geminiGenerate } from '../lib/gemini';

interface SearchResult {
  type: 'Application' | 'Portfolio' | 'Referral' | 'Job Description';
  title: string;
  subInfo: string;
  id: string;
  link: string;
  relevanceScore: number;
  createdAt: Date;
}

interface SearchFilters {
  model?: 'applications' | 'portfolio' | 'referrals' | 'job-descriptions' | 'all';
  status?: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
  dateRange?: number; // days
}

export default function searchRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  r.get('/', async (req: any, res) => {
    try {
      const { query, model, status, dateRange } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      // Parse and validate filters
      const filters: SearchFilters = {};
      if (model && typeof model === 'string') {
        const modelValue = model as SearchFilters['model'];
        if (modelValue) {
          filters.model = modelValue;
        }
      }
      if (status && typeof status === 'string') {
        const statusValue = status as SearchFilters['status'];
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
      
      let extractedKeywords: string;
      try {
        extractedKeywords = await geminiGenerate(
          'gemini-1.5-flash',
          systemPrompt,
          query
        );
        console.log(`Gemini extracted keywords: "${extractedKeywords}"`);
      } catch (geminiError) {
        console.log('Gemini API failed, using fallback search:', geminiError);
        // Fallback: use the original query as keywords
        extractedKeywords = query;
      }

      console.log(`Search query: "${query}", Extracted keywords: "${extractedKeywords}", Filters:`, JSON.stringify(filters));

      // Search across multiple models
      const searchResults: SearchResult[] = [];

      // Helper function to calculate relevance score
      const calculateRelevanceScore = (text: string, type: string, createdAt: Date): number => {
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
        if (daysSinceCreation <= 7) score += 5;
        else if (daysSinceCreation <= 30) score += 3;
        else if (daysSinceCreation <= 90) score += 1;
        
        // Type priority
        const typePriority = { 'Application': 3, 'Job Description': 2, 'Portfolio': 1, 'Referral': 1 };
        score += typePriority[type as keyof typeof typePriority] || 0;
        
        return score;
      };

      // Helper function to apply date filter
      const applyDateFilter = (dateFilter: Date | undefined) => {
        if (!filters.dateRange || !dateFilter) return true;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.dateRange);
        return dateFilter >= cutoffDate;
      };

      // Search applications (if model filter allows)
      if (!filters.model || filters.model === 'applications' || filters.model === 'all') {
        const whereClause: any = {
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

        applications.forEach((app: any) => {
          if (applyDateFilter(app.createdAt)) {
            const relevanceScore = calculateRelevanceScore(
              `${app.role} ${app.company} ${app.notes || ''}`,
              'Application',
              app.createdAt
            );
            
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

        referrals.forEach((ref: any) => {
          if (applyDateFilter(ref.createdAt)) {
            const relevanceScore = calculateRelevanceScore(
              `${ref.role} ${ref.company} ${ref.notes || ''}`,
              'Referral',
              ref.createdAt
            );
            
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

        portfolios.forEach((portfolio: any) => {
          if (applyDateFilter(portfolio.createdAt)) {
            const relevanceScore = calculateRelevanceScore(
              `${portfolio.slug} ${portfolio.theme}`,
              'Portfolio',
              portfolio.createdAt
            );
            
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

        jobDescriptions.forEach((jd: any) => {
          if (applyDateFilter(jd.createdAt)) {
            const relevanceScore = calculateRelevanceScore(
              `${jd.title} ${jd.company} ${jd.content}`,
              'Job Description',
              jd.createdAt
            );
            
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
      
      // Record search history
      try {
        await prisma.searchHistory.create({
          data: {
            query: query,
            userId: req.user?.uid || null
          }
        });
      } catch (historyError) {
        console.log('Failed to record search history:', historyError);
      }
      
      res.json({
        query,
        extractedKeywords,
        filters,
        results: sortedResults,
        totalResults: searchResults.length
      });

    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        query: req.query.query
      });
    }
  });

  return r;
}
