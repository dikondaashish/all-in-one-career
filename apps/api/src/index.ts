import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import { initFirebase, verifyIdToken } from './lib/firebase';
import { geminiGenerate } from './lib/gemini';
import { authenticateToken, optionalAuth } from './middleware/auth';

// Validate critical environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.log('📋 Available environment variables:', Object.keys(process.env).filter(key => !key.includes('SECRET')));
} else {
  console.log('✅ All required environment variables are present');
}

import referralsRouter from './routes/referrals';
import portfolioRouter from './routes/portfolio';
import emailsRouter from './routes/emails';
import applicationsRouter from './routes/applications';

import profileRouter from './routes/profile';
import adminRouter from './routes/admin';
import searchRouter from './routes/search';
import askRouter from './routes/ask';
import searchInsightsRouter from './routes/search-insights';
import authRouter from './routes/auth';
import { notificationsRouter } from './routes/notifications';
import atsRouter from './routes/ats';




const app = express();
const logger = pino({ transport: { target: 'pino-pretty' } });

// Initialize Prisma with error handling
let prisma: PrismaClient;
try {
  prisma = new PrismaClient();
  console.log('📊 Prisma client initialized successfully');
} catch (prismaError) {
  console.error('❌ Failed to initialize Prisma client:', prismaError);
  process.exit(1);
}

// Create HTTP server for WebSocket integration
import { createServer } from 'http';
const server = createServer(app);

initFirebase();



// Configure CORS for frontend domains
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://all-in-one-career-web.vercel.app',
    'https://all-in-one-career-web-git-feature-global-search-dikondaashish.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// Optional auth attach (public routes still work)
app.use(async (req: any, _res, next) => {
  const auth = req.header('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try { req.user = await verifyIdToken(token); } catch {}
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.1',
    features: {
      database: !!process.env.DATABASE_URL,
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      gemini: !!process.env.GEMINI_API_KEY
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});



// Add root-level search endpoint for frontend compatibility
app.get('/api/search', async (req: any, res) => {
  try {
    const { query, model, status, dateRange } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Parse and validate filters
    const filters: any = {};
    if (model && typeof model === 'string') {
      filters.model = model;
    }
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    if (dateRange && typeof dateRange === 'string') {
      const days = parseInt(dateRange);
      if (!isNaN(days) && days > 0) {
        filters.dateRange = days;
      }
    }

    // Use Gemini to extract keywords and intent
    const systemPrompt = `You are a search assistant. Analyze the user's search query and extract relevant keywords and intent for searching through job applications, portfolios, emails, referrals, and tasks. 

IMPORTANT: 
- Preserve email addresses completely (e.g., "dikondaashish@gmail.com" should remain as "dikondaashish@gmail.com")
- Keep domain names intact (e.g., "google.com" should remain as "google.com")
- Return only the most relevant keywords separated by spaces
- Do not strip important identifiers or email addresses`;

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
    const searchResults: any[] = [];

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
          { notes: { contains: extractedKeywords, mode: 'insensitive' } },
          { user: { email: { contains: extractedKeywords, mode: 'insensitive' } } }
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
          searchResults.push({
            type: 'Application',
            title: `${app.role} at ${app.company}`,
            subInfo: app.notes || `Applied on ${app.createdAt.toLocaleDateString()}`,
            id: app.id,
            link: `/applications/${app.id}`,
            relevanceScore: calculateRelevanceScore(`${app.role} ${app.company}`, 'Application', app.createdAt)
          });
        }
      });
    }

    // Search referrals (if model filter allows)
    if (!filters.model || filters.model === 'referrals' || filters.model === 'all') {
      const referrals = await prisma.referralRequest.findMany({
        where: {
          OR: [
            { company: { contains: extractedKeywords } },
            { role: { contains: extractedKeywords } },
            { notes: { contains: extractedKeywords } }
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
          searchResults.push({
            type: 'Referral',
            title: `${ref.role} at ${ref.company}`,
            subInfo: ref.notes || `Referral requested on ${ref.createdAt.toLocaleDateString()}`,
            id: ref.id,
            link: `/referrals/${ref.id}`,
            relevanceScore: calculateRelevanceScore(`${ref.role} ${ref.company}`, 'Referral', ref.createdAt)
          });
        }
      });
    }

    // Search portfolios (if model filter allows)
    if (!filters.model || filters.model === 'portfolio' || filters.model === 'all') {
      const portfolios = await prisma.portfolioSite.findMany({
        where: {
          OR: [
            { slug: { contains: extractedKeywords } },
            { theme: { contains: extractedKeywords } }
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
          searchResults.push({
            type: 'Portfolio',
            title: `Portfolio: ${portfolio.slug}`,
            subInfo: `Theme: ${portfolio.theme} | Created on ${portfolio.createdAt.toLocaleDateString()}`,
            id: portfolio.id,
            link: `/portfolio/${portfolio.id}`,
            relevanceScore: calculateRelevanceScore(`${portfolio.slug} ${portfolio.theme}`, 'Portfolio', portfolio.createdAt)
          });
        }
      });
    }

    // Search job descriptions (if model filter allows)
    if (!filters.model || filters.model === 'job-descriptions' || filters.model === 'all') {
      const jobDescriptions = await prisma.jobDescription.findMany({
        where: {
          OR: [
            { title: { contains: extractedKeywords } },
            { company: { contains: extractedKeywords } },
            { content: { contains: extractedKeywords } }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      jobDescriptions.forEach((jd: any) => {
        if (applyDateFilter(jd.createdAt)) {
          searchResults.push({
            type: 'Job Description',
            title: `${jd.title} at ${jd.company}`,
            subInfo: `Posted on ${jd.createdAt.toLocaleDateString()}`,
            id: jd.id,
            link: `/job-descriptions/${jd.id}`,
            relevanceScore: calculateRelevanceScore(`${jd.title} ${jd.company}`, 'Job Description', jd.createdAt)
          });
        }
      });
    }

    // Sort by relevance score and limit results
    const sortedResults = searchResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map(({ relevanceScore, ...result }) => result);

    // If no results found with extracted keywords, try with original query as fallback
    if (sortedResults.length === 0 && extractedKeywords !== query) {
      console.log(`No results with extracted keywords, trying fallback search with original query: "${query}"`);
      
      // Simple fallback search with original query
      const fallbackApplications = await prisma.application.findMany({
        where: {
          OR: [
            { company: { contains: query } },
            { role: { contains: query } },
            { notes: { contains: query } },
            { user: { email: { contains: query } } }
          ]
        },
        take: 5,
        include: {
          user: { select: { email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      fallbackApplications.forEach((app: any) => {
        searchResults.push({
          type: 'Application',
          title: `${app.role} at ${app.company}`,
          subInfo: app.notes || `Applied on ${app.createdAt.toLocaleDateString()}`,
          id: app.id,
          link: `/applications/${app.id}`,
          relevanceScore: 1 // Lower score for fallback results
        });
      });

      // Update sorted results with fallback
      const fallbackResults = searchResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
        .map(({ relevanceScore, ...result }) => result);
      
      console.log(`Fallback search found ${fallbackResults.length} results`);
      sortedResults.push(...fallbackResults);
    }

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
    console.error('Root search endpoint error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      query: req.query.query
    });
  }
});

// STEP 7: Apply authentication middleware to protected routes



app.use('/referrals', authenticateToken, referralsRouter(prisma, logger));
app.use('/portfolio', authenticateToken, portfolioRouter(prisma, logger));
app.use('/emails', authenticateToken, emailsRouter(prisma, logger));
app.use('/applications', authenticateToken, applicationsRouter(prisma, logger));

app.use('/admin', authenticateToken, adminRouter(prisma, logger));
app.use('/search', optionalAuth, searchRouter(prisma, logger));
app.use('/ask', optionalAuth, askRouter(prisma, logger));
app.use('/search-insights', optionalAuth, searchInsightsRouter(prisma, logger));
app.use('/api/auth', authRouter(prisma));

// Admin announcement endpoint - bypasses authentication, uses admin secret only
// MUST be registered BEFORE the authenticated /api/notifications route
app.post('/api/notifications/announce', async (req: any, res) => {
  try {
    // Validate admin secret
    const adminSecret = req.headers['x-admin-secret'] as string;
    const expectedSecret = process.env.ADMIN_SECRET || 'climbly_admin_secret_2024';
    
    if (!adminSecret || adminSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // Validate request body
    const { type, title, message } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, title, message' 
      });
    }

    // Validate notification type
    const validTypes = ['FEATURE', 'SYSTEM', 'TASK', 'PROMOTION'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ 
        error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found in database' });
    }

    // Create notifications for all users
    const notifications = [];
    for (const user of users) {
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: type.toUpperCase(),
          title,
          message,
          isRead: false,
          archived: false
        }
      });
      notifications.push(notification);
    }

    res.json({ 
      success: true, 
      message: `Announcement sent to ${notifications.length} users`,
      sentTo: notifications.length,
      announcement: { type, title, message }
    });

  } catch (error) {
    console.error('Error creating global announcement:', error);
    res.status(500).json({ error: 'Failed to create global announcement' });
  }
});

app.use('/api/notifications', authenticateToken, notificationsRouter(prisma));

// ATS Scanner routes
app.use('/api/ats', atsRouter(prisma));





// Add profile routes at root level for frontend compatibility
// Profile routes - most endpoints use optional auth, but upload-avatar requires full auth
app.use('/api/profile', optionalAuth, profileRouter(prisma, logger));

// Add missing routes for sidebar navigation
app.get('/api/settings', (req: any, res) => {
  res.json({ message: 'Settings endpoint - coming soon' });
});

app.get('/api/logout', (req: any, res) => {
  try {
    // Log the logout attempt
    console.log('Logout request received from:', req.user?.uid || 'guest user');
    
    // For now, just return success - Firebase handles the actual logout
    // In the future, you could add server-side session invalidation here
    res.json({ 
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

const PORT = Number(process.env.PORT || 4000);

// Add process error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  // Don't exit in production
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  // Don't exit in production, but log the error
});

// Handle server errors
server.on('error', (error: any) => {
  logger.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  }
});

server.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 API server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📦 Database: ${process.env.DATABASE_URL ? 'Connected' : 'URL not set'}`);
  
  // Test database connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connection successful');
  } catch (dbError) {
    logger.error({ dbError }, '❌ Database connection failed');
    // Don't exit in production, continue with limited functionality
  }
});
