export async function incrementMetric(prisma, userId, type) {
    try {
        // Upsert user with metric increment
        await prisma.user.upsert({
            where: { email: userId },
            create: {
                email: userId,
                [type]: 1
            },
            update: {
                [type]: { increment: 1 }
            },
        });
        // Create log entry
        await prisma.log.create({
            data: {
                userId,
                action: type,
                message: `${type} incremented for user ${userId}`
            }
        });
    }
    catch (error) {
        console.error(`Error incrementing metric ${type} for user ${userId}:`, error);
        // Don't throw error to avoid breaking the main functionality
    }
}
//# sourceMappingURL=metrics.js.map