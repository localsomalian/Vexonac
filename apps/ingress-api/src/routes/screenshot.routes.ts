import { Router, raw, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Busboy = require('busboy') as (opts: Record<string, unknown>) => NodeJS.EventEmitter & { on(e: string, fn: (...args: any[]) => void): any }
import prisma from '../lib/prisma'
import { env } from '../lib/env'

const screenshotRouter = Router()

const SCREENSHOT_DIR = '/app/screenshots'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

// Ensure directory exists
try { fs.mkdirSync(SCREENSHOT_DIR, { recursive: true }) } catch (_) {}

type ScreenshotEntry = { url: string | null; viewToken: string }

// upload token → entry containing the resolved URL and pre-allocated view token
const pendingScreenshots = new Map<string, ScreenshotEntry>()

function screenshotFilePath(viewToken: string, ext: string): string {
	return path.join(SCREENSHOT_DIR, `${viewToken}.${ext}`)
}

function findScreenshotFile(viewToken: string): { filePath: string; contentType: string } | null {
	for (const [ext, ct] of [['webp', 'image/webp'], ['webm', 'video/webm']] as const) {
		const fp = screenshotFilePath(viewToken, ext)
		try {
			fs.accessSync(fp, fs.constants.R_OK)
			return { filePath: fp, contentType: ct }
		} catch (_) {}
	}
	return null
}

function saveScreenshotToDisk(viewToken: string, data: Buffer, contentType: string): string {
	const ext = contentType.includes('webm') || contentType.includes('matroska') ? 'webm' : 'webp'
	const fp = screenshotFilePath(viewToken, ext)
	fs.writeFileSync(fp, data)
	// Schedule deletion after TTL
	setTimeout(() => { try { fs.unlinkSync(fp) } catch (_) {} }, TTL_MS)
	return fp
}

export function resolveScreenshotToken(token: string): string | null {
	const entry = pendingScreenshots.get(token)
	if (!entry) return undefined as any
	return entry.url || null
}

async function validateLicenseKey(licenseKey: string): Promise<boolean> {
	if (!licenseKey) return false
	const license = await prisma.license.findUnique({
		where: { licenseKey },
		select: { id: true, isBanned: true, expiresAt: true },
	})
	return !!(license && !license.isBanned && license.expiresAt > new Date())
}

// Called by the FiveM NUI to get an upload URL.
// Returns { uploadUrl, publicUrl } — NUI PUTs the image to uploadUrl.
// publicUrl is pre-allocated so callers get a usable URL immediately.
screenshotRouter.all('/presign', async (req, res) => {
	// NUI browser makes this request from a fivem-internal:// origin — allow it.
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
	if (req.method === 'OPTIONS') { res.status(204).end(); return }

	const licenseKey = (req.query.licenseKey as string) || ''

	if (!await validateLicenseKey(licenseKey)) {
		res.status(401).json({ error: 'Invalid or expired license key' })
		return
	}

	const token = randomUUID()
	const viewToken = randomUUID()

	pendingScreenshots.set(token, { url: null, viewToken })
	setTimeout(() => pendingScreenshots.delete(token), 120_000)

	// Both uploadUrl and publicUrl must use the public base URL so game clients
	// (running on player PCs) and browsers can reach the ingress from outside Docker.
	const reqHost = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3002'
	const reqProto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
	const publicBase = env.PUBLIC_URL || `${reqProto}://${reqHost}`
	const uploadUrl = `${publicBase}/api/screenshot/upload/${token}?licenseKey=${encodeURIComponent(licenseKey)}`
	const publicUrl = `${publicBase}/api/screenshot/view/${viewToken}`

	// Include both flat and nested formats — NUI accesses response.data.uploadUrl
	res.json({ uploadUrl, publicUrl, success: true, data: { uploadUrl, publicUrl, fileKey: token } })
})

// Called by the FiveM NUI when it wants to upload a screen recording.
screenshotRouter.all('/presign-recording', async (req, res) => {
	const licenseKey = (req.query.licenseKey as string) || ''

	if (!await validateLicenseKey(licenseKey)) {
		res.status(401).json({ error: 'Invalid or expired license key' })
		return
	}

	const token = randomUUID()
	const viewToken = randomUUID()

	pendingScreenshots.set(token, { url: null, viewToken })
	setTimeout(() => pendingScreenshots.delete(token), 120_000)

	const reqHost2 = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3002'
	const reqProto2 = req.headers['x-forwarded-proto'] || req.protocol || 'http'
	const publicBase2 = env.PUBLIC_URL || `${reqProto2}://${reqHost2}`
	const uploadUrl2 = `${publicBase2}/api/screenshot/upload/${token}?licenseKey=${encodeURIComponent(licenseKey)}`
	const publicUrl2 = `${publicBase2}/api/screenshot/view/${viewToken}`

	res.json({ uploadUrl: uploadUrl2, publicUrl: publicUrl2, success: true, data: { uploadUrl: uploadUrl2, publicUrl: publicUrl2, fileKey: token } })
})

// Serves screenshots stored on disk (fallback when no Discord webhook is configured).
screenshotRouter.get('/view/:token', (req, res) => {
	const { token } = req.params as { token: string }
	const found = findScreenshotFile(token)
	if (!found) {
		res.status(404).json({ error: 'Not found or expired' })
		return
	}
	try {
		const data = fs.readFileSync(found.filePath)
		res.setHeader('Content-Type', found.contentType)
		res.setHeader('Cache-Control', 'public, max-age=1800')
		res.send(data)
	} catch (_) {
		res.status(404).json({ error: 'Not found or expired' })
	}
})

// Receives the raw image/video from the NUI, forwards it to the server's
// configured Discord MainWebhook, and stores the resulting CDN URL.
// Falls back to disk storage if no webhook is configured.
screenshotRouter.put('/upload/:token', raw({ type: '*/*', limit: '15mb' }), async (req: Request, res: Response) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
	if (req.method === 'OPTIONS') { res.status(204).end(); return }
	const { token } = req.params as { token: string }
	const licenseKey = (req.query.licenseKey as string) || ''

	const entry = pendingScreenshots.get(token)
	if (!entry) {
		res.status(404).json({ error: 'Unknown token' })
		return
	}

	const body = req.body as Buffer
	const contentType = req.headers['content-type'] || 'image/webp'

	if (!body || body.length === 0) {
		res.status(200).json({ ok: true })
		return
	}

	const reqHost = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3002'
	const reqProto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
	const publicBase = env.PUBLIC_URL || `${reqProto}://${reqHost}`

	let cdnUrl = ''

	try {
		const license = await prisma.license.findUnique({
			where: { licenseKey },
			select: { configuration: true },
		})

		const cfg = (license?.configuration as Record<string, any>) || {}
		const webhookUrl: string = cfg.Settings?.ScreenshotsWebhook || cfg.Settings?.MainWebhook || ''

		if (webhookUrl) {
			const ext = contentType.includes('webm') || contentType.includes('matroska') ? 'webm' : 'webp'
			const filename = `screenshot.${ext}`

			const formData = new FormData()
			formData.append('file', new Blob([body], { type: contentType }), filename)

			const response = await fetch(webhookUrl, { method: 'POST', body: formData })
			if (response.ok) {
				const data = await response.json() as any
				cdnUrl = data?.attachments?.[0]?.url || data?.attachments?.[0]?.proxy_url || ''
			}
		}
	} catch (_) {}

	if (cdnUrl) {
		entry.url = cdnUrl
	} else {
		saveScreenshotToDisk(entry.viewToken, body, contentType)
		entry.url = `${publicBase}/api/screenshot/view/${entry.viewToken}`
	}

	const finalUrl = entry.url || `${publicBase}/api/screenshot/view/${entry.viewToken}`
	res.status(200).json({
		ok: true,
		attachments: [{ url: finalUrl, proxy_url: finalUrl }],
	})
})

// Accepts multipart/form-data POST from screenshot-basic (files[] field).
screenshotRouter.post('/upload/:token', (req: Request, res: Response) => {
	const { token } = req.params as { token: string }
	const licenseKey = (req.query.licenseKey as string) || ''

	const entry = pendingScreenshots.get(token)
	if (!entry) {
		res.status(404).json({ error: 'Unknown token' })
		return
	}

	const reqHost2 = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3002'
	const reqProto2 = req.headers['x-forwarded-proto'] || req.protocol || 'http'
	const publicBase2 = env.PUBLIC_URL || `${reqProto2}://${reqHost2}`

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
			res.status(200).json({ ok: true })
			return
		}

		const body = Buffer.concat(chunks)
		let cdnUrl = ''

		try {
			const license = await prisma.license.findUnique({
				where: { licenseKey },
				select: { configuration: true },
			})

			const cfg = (license?.configuration as Record<string, any>) || {}
			const webhookUrl: string = cfg.Settings?.ScreenshotsWebhook || cfg.Settings?.MainWebhook || ''

			if (webhookUrl) {
				const ext = fileContentType.includes('webm') || fileContentType.includes('matroska') ? 'webm' : 'webp'
				const formData = new FormData()
				formData.append('file', new Blob([body], { type: fileContentType }), `screenshot.${ext}`)
				const response = await fetch(webhookUrl, { method: 'POST', body: formData })
				if (response.ok) {
					const data = await response.json() as any
					cdnUrl = data?.attachments?.[0]?.url || data?.attachments?.[0]?.proxy_url || ''
				}
			}
		} catch (_) {}

		if (cdnUrl) {
			entry.url = cdnUrl
		} else {
			saveScreenshotToDisk(entry.viewToken, body, fileContentType)
			entry.url = `${publicBase2}/api/screenshot/view/${entry.viewToken}`
		}

		const finalUrl = entry.url || `${publicBase2}/api/screenshot/view/${entry.viewToken}`
		res.status(200).json({
			ok: true,
			attachments: [{ url: finalUrl, proxy_url: finalUrl }],
		})
	})

	busboy.on('error', () => res.status(500).json({ error: 'Upload failed' }))
	req.pipe(busboy as unknown as NodeJS.WritableStream)
})

export { screenshotRouter }
