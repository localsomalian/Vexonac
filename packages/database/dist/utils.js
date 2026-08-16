import { PrismaClient } from "./index";
/**
 * Create a Prisma client instance with common configuration
 * @param options - Optional Prisma client options
 * @returns Configured Prisma client instance
 */
export function createPrismaClient(options) {
    const { log = true, accelerate = false } = options || {};
    const client = new PrismaClient({
        log: log && process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
    if (accelerate) {
        const { withAccelerate } = require("@prisma/extension-accelerate");
        return client.$extends(withAccelerate());
    }
    return client;
}
/**
 * Common database connection health check
 * @param prisma - Prisma client instance
 * @returns Promise<boolean> - True if connection is healthy
 */
export async function checkDatabaseHealth(prisma) {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error("Database health check failed:", error);
        return false;
    }
}
/**
 * Gracefully disconnect from database
 * @param prisma - Prisma client instance
 */
export async function disconnectDatabase(prisma) {
    try {
        await prisma.$disconnect();
    }
    catch (error) {
        console.error("Error disconnecting from database:", error);
    }
}
