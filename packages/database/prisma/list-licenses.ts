import { PrismaClient } from './generated/client'
const prisma = new PrismaClient()
async function main() {
	const licenses = await prisma.license.findMany({
		select: { id: true, licenseKey: true, serverIp: true, isBanned: true, expiresAt: true, serverName: true },
	})
	console.log(JSON.stringify(licenses, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
