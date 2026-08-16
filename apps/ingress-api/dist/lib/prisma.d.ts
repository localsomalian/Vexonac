declare const prisma: import("@vexonac/database").PrismaClient<{
    log: ("query" | "warn" | "error")[];
}, never, import("@vexonac/database/prisma/generated/client/runtime/library").DefaultArgs> | import("@vexonac/database/prisma/generated/client/runtime/library").DynamicClientExtensionThis<import("@vexonac/database").Prisma.TypeMap<import("@vexonac/database/prisma/generated/client/runtime/library").InternalArgs<{
    [x: string]: {
        [x: string]: unknown;
    };
}, {
    [x: string]: {
        [x: string]: unknown;
    };
}, {
    [x: string]: {
        [x: string]: unknown;
    };
}, {
    [x: string]: unknown;
}> & {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>, import("@vexonac/database").Prisma.TypeMapCb<{
    log: ("query" | "warn" | "error")[];
}>, {
    result: {};
    model: {};
    query: {};
    client: {};
}>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map