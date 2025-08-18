import request from 'supertest';
import { createServer } from '../../index';
// Mock Prisma client
const mockPrisma = {
    application: {
        findMany: jest.fn(),
    },
    referralRequest: {
        findMany: jest.fn(),
    },
    portfolioSite: {
        findMany: jest.fn(),
    },
    jobDescription: {
        findMany: jest.fn(),
    },
};
// Mock Gemini
jest.mock('../../lib/gemini', () => ({
    geminiGenerate: jest.fn().mockResolvedValue('test keywords'),
}));
describe('Search API Endpoint', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        app = createServer(mockPrisma);
    });
    describe('GET /search', () => {
        it('should return 400 when query parameter is missing', async () => {
            const response = await request(app).get('/search');
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Query parameter is required');
        });
        it('should return 400 when query parameter is empty', async () => {
            const response = await request(app).get('/search?query=');
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Query parameter is required');
        });
        it('should filter by model type when specified', async () => {
            const mockApplications = [
                {
                    id: '1',
                    role: 'Software Engineer',
                    company: 'Test Company',
                    status: 'APPLIED',
                    createdAt: new Date(),
                    user: { email: 'test@example.com' },
                },
            ];
            mockPrisma.application.findMany.mockResolvedValue(mockApplications);
            mockPrisma.referralRequest.findMany.mockResolvedValue([]);
            mockPrisma.portfolioSite.findMany.mockResolvedValue([]);
            mockPrisma.jobDescription.findMany.mockResolvedValue([]);
            const response = await request(app).get('/search?query=software&model=applications');
            expect(response.status).toBe(200);
            expect(response.body.filters.model).toBe('applications');
            expect(mockPrisma.application.findMany).toHaveBeenCalled();
            expect(mockPrisma.referralRequest.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.portfolioSite.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.jobDescription.findMany).not.toHaveBeenCalled();
        });
        it('should filter by date range when specified', async () => {
            const mockApplications = [
                {
                    id: '1',
                    role: 'Software Engineer',
                    company: 'Test Company',
                    status: 'APPLIED',
                    createdAt: new Date(), // Recent date
                    user: { email: 'test@example.com' },
                },
            ];
            mockPrisma.application.findMany.mockResolvedValue(mockApplications);
            mockPrisma.referralRequest.findMany.mockResolvedValue([]);
            mockPrisma.portfolioSite.findMany.mockResolvedValue([]);
            mockPrisma.jobDescription.findMany.mockResolvedValue([]);
            const response = await request(app).get('/search?query=software&dateRange=30');
            expect(response.status).toBe(200);
            expect(response.body.filters.dateRange).toBe(30);
            expect(response.body.results).toHaveLength(1);
        });
        it('should filter applications by status when specified', async () => {
            const mockApplications = [
                {
                    id: '1',
                    role: 'Software Engineer',
                    company: 'Test Company',
                    status: 'APPLIED',
                    createdAt: new Date(),
                    user: { email: 'test@example.com' },
                },
            ];
            mockPrisma.application.findMany.mockResolvedValue(mockApplications);
            mockPrisma.referralRequest.findMany.mockResolvedValue([]);
            mockPrisma.portfolioSite.findMany.mockResolvedValue([]);
            mockPrisma.jobDescription.findMany.mockResolvedValue([]);
            const response = await request(app).get('/search?query=software&status=APPLIED');
            expect(response.status).toBe(200);
            expect(response.body.filters.status).toBe('APPLIED');
            expect(mockPrisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'APPLIED',
                }),
            }));
        });
        it('should return results sorted by relevance score', async () => {
            const mockApplications = [
                {
                    id: '1',
                    role: 'Software Engineer',
                    company: 'Test Company',
                    status: 'APPLIED',
                    createdAt: new Date(),
                    user: { email: 'test@example.com' },
                },
                {
                    id: '2',
                    role: 'Senior Software Engineer',
                    company: 'Another Company',
                    status: 'INTERVIEW',
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    user: { email: 'test2@example.com' },
                },
            ];
            mockPrisma.application.findMany.mockResolvedValue(mockApplications);
            mockPrisma.referralRequest.findMany.mockResolvedValue([]);
            mockPrisma.portfolioSite.findMany.mockResolvedValue([]);
            mockPrisma.jobDescription.findMany.mockResolvedValue([]);
            const response = await request(app).get('/search?query=software engineer');
            expect(response.status).toBe(200);
            expect(response.body.results).toHaveLength(2);
            // Results should be sorted by relevance score (newer first due to date boost)
            expect(response.body.results[0].id).toBe('1');
        });
        it('should handle multiple filters simultaneously', async () => {
            const mockApplications = [
                {
                    id: '1',
                    role: 'Software Engineer',
                    company: 'Test Company',
                    status: 'APPLIED',
                    createdAt: new Date(),
                    user: { email: 'test@example.com' },
                },
            ];
            mockPrisma.application.findMany.mockResolvedValue(mockApplications);
            mockPrisma.referralRequest.findMany.mockResolvedValue([]);
            mockPrisma.portfolioSite.findMany.mockResolvedValue([]);
            mockPrisma.jobDescription.findMany.mockResolvedValue([]);
            const response = await request(app).get('/search?query=software&model=applications&status=APPLIED&dateRange=30');
            expect(response.status).toBe(200);
            expect(response.body.filters).toEqual({
                model: 'applications',
                status: 'APPLIED',
                dateRange: 30,
            });
        });
    });
});
//# sourceMappingURL=search.test.js.map