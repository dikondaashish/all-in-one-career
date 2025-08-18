import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type pino from 'pino';

interface SearchInsights {
  totalSearches: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  longestQueries: Array<{ query: string; length: number }>;
  recentQueries: Array<{ query: string; answer?: string | null; createdAt: Date }>;
}

export default function searchInsightsRouter(prisma: PrismaClient, logger: pino.Logger): Router {
  const r = Router();

  r.get('/', async (req: any, res) => {
    try {
      const userId = req.user?.uid;
      
      // Get total searches for the user (or all if no user)
      const totalSearches = await prisma.searchHistory.count({
        where: userId ? { userId } : {}
      });

      // Get top keywords by analyzing query text
      const allQueries = await prisma.searchHistory.findMany({
        where: userId ? { userId } : {},
        select: { query: true },
        orderBy: { createdAt: 'desc' }
      });

      // Extract and count keywords (simple approach: split by space and filter common words)
      const keywordCounts: { [key: string]: number } = {};
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'us', 'them'];

      allQueries.forEach(({ query }) => {
        const words = query.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2 && !commonWords.includes(word));
        
        words.forEach(word => {
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        });
      });

      const topKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

      // Get longest queries
      const longestQueries = allQueries
        .map(({ query }) => ({ query, length: query.length }))
        .sort((a, b) => b.length - a.length)
        .slice(0, 3);

      // Get recent queries with answers
      const recentQueries = await prisma.searchHistory.findMany({
        where: userId ? { userId } : {},
        select: { query: true, answer: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      const insights: SearchInsights = {
        totalSearches,
        topKeywords,
        longestQueries,
        recentQueries
      };

      console.log(`Search insights generated for user: ${userId || 'all'}, total searches: ${totalSearches}`);
      
      res.json(insights);

    } catch (error) {
      console.error('Search insights error:', error);
      res.status(500).json({ 
        error: 'Failed to generate search insights', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return r;
}
