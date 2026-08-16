import { createPrismaClient } from "@vexonac/database";
const prisma = createPrismaClient({
    log: false,
    accelerate: false,
});
export default prisma;
