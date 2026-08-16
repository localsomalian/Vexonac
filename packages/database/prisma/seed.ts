import { PrismaClient } from './generated/client'

const prisma = new PrismaClient()

const DEV_LICENSE_KEY = 'VEXONAC-DEV-LOCAL-0001'
const DEV_SERVER_IP = '127.0.0.1'

async function main() {
	const existing = await prisma.license.findUnique({
		where: { licenseKey: DEV_LICENSE_KEY },
	})

	if (existing) {
		await prisma.license.update({
			where: { licenseKey: DEV_LICENSE_KEY },
			data: {
				serverIp: DEV_SERVER_IP,
				isBanned: false,
				expiresAt: new Date('2099-01-01'),
			},
		})
		console.log('Dev license updated:', DEV_LICENSE_KEY)
	} else {
		await prisma.license.create({
			data: {
				licenseKey: DEV_LICENSE_KEY,
				discordId: 'DEV',
				serverIp: DEV_SERVER_IP,
				serverName: 'Local Dev Server',
				isBanned: false,
				expiresAt: new Date('2099-01-01'),
				configuration: {},
			},
		})
		console.log('Dev license created:', DEV_LICENSE_KEY)
	}

	console.log('serverIp:', DEV_SERVER_IP)
	console.log('Done. Put this in VexonAC/auth/license.txt:', DEV_LICENSE_KEY)
}

main()
	.catch((e) => { console.error(e); process.exit(1) })
	.finally(() => prisma.$disconnect())
