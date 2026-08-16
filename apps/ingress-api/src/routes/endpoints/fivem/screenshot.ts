import { Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import prisma from '../../../lib/prisma'
import { env } from '../../../lib/env'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Busboy = require('busboy') as (opts: Record<string, unknown>) => NodeJS.EventEmitter & { on(e: string, fn: (...args: any[]) => void): any }

const SCREENSHOT_DIR = '/app/screenshots'
const TTL_MS = 30 * 60 * 1000
try { fs.mkdirSync(SCREENSHOT_DIR, { recursive: true }) } catch (_) {}

function saveDetectionScreenshot(data: Buffer, contentType: string): string {
	const viewToken = randomUUID()
	const ext = contentType.includes('webm') || contentType.includes('matroska') ? 'webm' : 'webp'
	const fp = path.join(SCREENSHOT_DIR, `${viewToken}.${ext}`)
	fs.writeFileSync(fp, data)
	setTimeout(() => { try { fs.unlinkSync(fp) } catch (_) {} }, TTL_MS)
	return viewToken
}

export const fivemScreenshotHandler = async (req: Request, res: Response): Promise<void> => {
	const apiKey = (req.headers['x-api-key'] as string | undefined)?.trim()
	if (!apiKey) {
		res.status(401).json({ error: 'Unauthorized' })
		return
	}

	const license = await prisma.license.findUnique({
		where: { licenseKey: apiKey },
		select: { id: true, isBanned: true, expiresAt: true, configuration: true },
	})

	if (!license || license.isBanned || license.expiresAt <= new Date()) {
		res.status(401).json({ error: 'Invalid or expired license' })
		return
	}

	const cfg = (license.configuration as Record<string, any>) || {}
	const webhookUrl: string = cfg.Settings?.ScreenshotsWebhook || cfg.Settings?.MainWebhook || ''

	const chunks: Buffer[] = []
	let fileContentType = 'image/webp'
	let fileFound = false

	const busboy = Busboy({ headers: req.headers, limits: { fileSize: 15 * 1024 * 1024 } })

	busboy.on('file', (_field: string, fileStream: NodeJS.ReadableStream, info: { mimeType: string }) => {
		fileFound = true
		fileContentType = info.mimeType || 'image/webp'
		fileStream.on('data', (chunk: Buffer) => chunks.push(chunk))
	})

	busboy.on('finish', async () => {
		if (!fileFound || chunks.length === 0) {
			res.status(400).json({ error: 'No screenshot data received' })
			return
		}

		const body = Buffer.concat(chunks)
		let cdnUrl = ''

		if (webhookUrl) {
			try {
				const ext = fileContentType.includes('webm') || fileContentType.includes('matroska') ? 'webm' : 'webp'
				const formData = new FormData()
				formData.append('file', new Blob([body], { type: fileContentType }), `screenshot.${ext}`)
				const response = await fetch(webhookUrl, { method: 'POST', body: formData })
				if (response.ok) {
					const data = await response.json() as any
					cdnUrl = data?.attachments?.[0]?.url || data?.attachments?.[0]?.proxy_url || ''
				}
			} catch (_) {}
		}

		if (!cdnUrl) {
			// Disk fallback: save locally and return a view URL
			const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3002'
			const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http'
			const publicBase = env.PUBLIC_URL || `${protocol}://${host}`
			const viewToken = saveDetectionScreenshot(body, fileContentType)
			const viewUrl = `${publicBase}/api/screenshot/view/${viewToken}`
			res.status(200).json({ ok: true, url: viewUrl, attachments: [{ url: viewUrl, proxy_url: viewUrl }] })
			return
		}

		res.status(200).json({ ok: true, url: cdnUrl, attachments: [{ url: cdnUrl, proxy_url: cdnUrl }] })
	})

	busboy.on('error', () => res.status(500).json({ error: 'Upload failed' }))
	req.pipe(busboy as unknown as NodeJS.WritableStream)
}
