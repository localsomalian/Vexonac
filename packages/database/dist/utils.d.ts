import { PrismaClient } from "./index";
/**
 * Create a Prisma client instance with common configuration
 * @param options - Optional Prisma client options
 * @returns Configured Prisma client instance
 */
export declare function createPrismaClient(options?: {
    log?: boolean;
    accelerate?: boolean;
}): PrismaClient<{
    log: ("query" | "warn" | "error")[];
}, never, import("../prisma/generated/client/runtime/library").DefaultArgs> | import("../prisma/generated/client/runtime/library").DynamicClientExtensionThis<import("./index").Prisma.TypeMap<import("../prisma/generated/client/runtime/library").InternalArgs & {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>, import("./index").Prisma.TypeMapCb<{
    log: ("query" | "warn" | "error")[];
}>, {
    result: {};
    model: {};
    query: {};
    client: {};
}>;
/**
 * Common database connection health check
 * @param prisma - Prisma client instance
 * @returns Promise<boolean> - True if connection is healthy
 */
export declare function checkDatabaseHealth(prisma: PrismaClient): Promise<boolean>;
/**
 * Gracefully disconnect from database
 * @param prisma - Prisma client instance
 */
export declare function disconnectDatabase(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=utils.d.ts.map