import { PrismaClient } from './generated/client'
const prisma = new PrismaClient()
async function main() {
	const result = await prisma.license.update({
		where: { licenseKey: 'vexonac-trial-0748cf0b-e216-49ac-9df6-a6acc17f34be' },
		data: { serverIp: '127.0.0.1' },
		select: { licenseKey: true, serverIp: true, isBanned: true, expiresAt: true },
	})
	console.log('Updated:', result)
}
main().catch(console.error).finally(() => prisma.$disconnect())
