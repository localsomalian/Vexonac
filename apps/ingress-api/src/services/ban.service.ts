import type { Prisma } from '@vexonac/database'
import prisma from '../lib/prisma'
import { parseIdentifierType } from '../lib/utils'
import { env } from '../lib/env'

export interface CreateBanInput {
	licenseId: string
	playerLicense: string
	reason: string
	details?: Record<string, any>
	evidenceUrl?: string | null
	bannedBy?: string
	duration?: number
	playerName?: string
	identifiers?: string[]
	serverName?: string
}

export interface CreateBanResult {
	banId: string
	banDbId: string
	playerName: string
	playerLicense: string
	reason: string
	evidenceUrl: string | null
	expiresAt: Date | null
	isPermanent: boolean
	identifiersBanned: number
	kickMessage: string
}

async function sendBanWebhook(result: CreateBanResult, licenseId: string, serverName: string, allIdentifiers: string[], evidenceUrl?: string | null): Promise<void> {
	try {
		const webhookUrl = env.SERVERS_BAN_WEBHOOK_URL
		if (!webhookUrl) return

		const extract = (prefix: string) => allIdentifiers.find((id) => id.startsWith(prefix))?.slice(prefix.length) ?? null
		const discordIds = allIdentifiers.filter((id) => id.startsWith('discord:')).map((id) => id.replace('discord:', ''))
		const steamId   = extract('steam:')
		const fivemId   = extract('fivem:') ?? extract('fid:')
		const licenseId_ = extract('license:')

		const idLines = [
			discordIds.length > 0 ? `**Discord:** ${discordIds.map((id) => `<@${id}>`).join(' ')}` : null,
			steamId    ? `**Steam:** \`${steamId}\`` : null,
			fivemId    ? `**FiveM:** \`${fivemId}\`` : null,
			licenseId_ ? `**License:** \`${licenseId_}\`` : null,
		].filter(Boolean).join('\n')

		const expiryText = result.isPermanent
			? '🔴 Permanent'
			: `⏳ Expires <t:${Math.floor(result.expiresAt!.getTime() / 1000)}:R>`

		const desc = [
			`**Server:** ${serverName || licenseId}`,
			`**Player:** ${result.playerName}`,
			`**Reason:** ${result.reason}`,
			`**Duration:** ${expiryText}`,
			`**Ban ID:** #${result.banId}`,
			idLines ? `\n${idLines}` : null,
		].filter(Boolean).join('\n')

		const isVideo = evidenceUrl && (evidenceUrl.includes('/recordings/') || evidenceUrl.includes('vexonac-capture.webm'))
		const embed: any = {
			color: 0xed4245,
			type: 'rich',
			description: desc,
			url: 'https://www.vexonac.com/',
			author: {
				name: 'Player Banned',
				url: 'https://www.vexonac.com/',
				icon_url: 'https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&',
			},
			...(!isVideo && evidenceUrl ? { image: { url: evidenceUrl } } : {}),
			footer: { text: 'VexonAC' },
			timestamp: new Date().toISOString(),
		}

		await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: isVideo ? evidenceUrl : undefined, embeds: [embed] }),
		})
	} catch (_) {}
}

export async function createBan(input: CreateBanInput): Promise<CreateBanResult> {
	const { licenseId, playerLicense, reason, details, evidenceUrl, bannedBy, duration, playerName, identifiers, serverName } = input

	const txResult = await (prisma.$transaction as (fn: (tx: Prisma.TransactionClient) => Promise<any>) => Promise<any>)(async (tx: Prisma.TransactionClient) => {
		let player = await tx.player.findUnique({
			where: { licenseId_playerLicense: { licenseId, playerLicense } },
			select: { id: true, playerName: true, identifiers: true, oldIdentifiers: true },
		})

		if (!player) {
			if (!identifiers || identifiers.length === 0) throw new Error('PLAYER_NOT_FOUND')
			player = await tx.player.upsert({
				where: { licenseId_playerLicense: { licenseId, playerLicense } },
				create: {
					licenseId,
					playerLicense,
					playerName: playerName || 'Unknown',
					identifiers: identifiers,
					oldIdentifiers: [],
					firstJoin: new Date(),
					lastJoin: new Date(),
				},
				update: {},
				select: { id: true, playerName: true, identifiers: true, oldIdentifiers: true },
			})
		}

		const currentIdentifiers = Array.isArray(player.identifiers) ? (player.identifiers as string[]) : []
		const oldIdentifiers = Array.isArray(player.oldIdentifiers) ? (player.oldIdentifiers as string[]) : []
		const providedIds = Array.isArray(identifiers) ? identifiers : []
		const allIdentifiers = [...new Set([...currentIdentifiers, ...oldIdentifiers, ...providedIds])]

		if (allIdentifiers.length === 0) throw new Error('NO_IDENTIFIERS_FOUND')

		let banId: string
		let attempts = 0
		do {
			banId = (Math.floor(Math.random() * 90000) + 10000).toString()
			attempts++
			const existing = await tx.ban.findUnique({
				where: { licenseId_banId: { licenseId, banId } },
			})
			if (!existing) break
			if (attempts >= 100) throw new Error('UNABLE_TO_GENERATE_UNIQUE_BAN_ID')
		} while (true)

		const expiresAt =
			duration && duration > 0 ? new Date(Date.now() + duration * 1000) : null

		// Use upsert so a player who is already banned gets their ban updated
		// rather than throwing a unique constraint error on (licenseId, playerId).
		const ban = await tx.ban.upsert({
			where: { licenseId_playerId: { licenseId, playerId: player.id } },
			create: {
				playerId: player.id,
				licenseId,
				banId,
				reason,
				details: details || {},
				evidenceUrl: evidenceUrl || null,
				expiresAt,
				bannedBy: bannedBy || null,
				bannedAt: new Date(),
			},
			update: {
				banId,
				reason,
				details: details || {},
				evidenceUrl: evidenceUrl || null,
				expiresAt,
				bannedBy: bannedBy || null,
				bannedAt: new Date(),
			},
		})

		await tx.banHistory.create({
			data: {
				playerId: player.id,
				licenseId,
				reason,
				details: details || {},
				evidenceUrl: evidenceUrl || null,
			},
		})

		const KNOWN_PREFIXES = ['license:', 'steam:', 'discord:', 'ip:', 'xbox:', 'live:', 'fivem:', 'fid:', 'sid:', 'sid2:']
		const filtered = allIdentifiers.filter((id) => KNOWN_PREFIXES.some((p) => id.startsWith(p)))

		await tx.bannedIdentifier.createMany({
			data: (filtered.length > 0 ? filtered : allIdentifiers).map((identifier) => ({
				banId: ban.id,
				type: parseIdentifierType(identifier),
				value: identifier,
			})),
			skipDuplicates: true,
		})

		await tx.serverLog.create({
			data: { licenseId, serverType: 'BAN_PLAYER', playerLicense, details: { reason } },
		})

		const isPermanent = expiresAt === null
		const expiryLine = isPermanent ? 'This ban is permanent.' : `Expires: ${expiresAt!.toUTCString()}`

		return {
			banId,
			banDbId: ban.id,
			playerName: player.playerName,
			playerLicense,
			reason,
			evidenceUrl: evidenceUrl || null,
			expiresAt,
			isPermanent,
			identifiersBanned: allIdentifiers.length,
			kickMessage: `You have been banned from this server.\n\nBan ID: #${banId}\nReason: ${reason}\n${expiryLine}\n\nKeep your Ban ID to appeal this ban.`,
			_allIdentifiers: allIdentifiers,
		}
	})

	const { _allIdentifiers, ...result } = txResult as any
	sendBanWebhook(result, licenseId, serverName || licenseId, _allIdentifiers, evidenceUrl).catch(() => {})
	return result as CreateBanResult
}
