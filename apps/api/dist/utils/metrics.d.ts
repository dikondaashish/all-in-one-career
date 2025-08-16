import { PrismaClient } from '@prisma/client';
export declare function incrementMetric(prisma: PrismaClient, userId: string, type: 'atsScans' | 'portfolios' | 'emails' | 'referrals' | 'trackerEvents'): Promise<void>;
//# sourceMappingURL=metrics.d.ts.map