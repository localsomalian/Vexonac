import { Router } from 'express'
import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

const router = Router()

const uploadLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	message: {
		error: 'Too many upload requests, please try again later',
		code: 429
	},
	standardHeaders: true,
	legacyHeaders: false
})

// Proxy to ingress presign — avoids needing Cloudflare R2 credentials.
// The NUI calls this to get an uploadUrl + publicUrl, then PUTs the file directly to uploadUrl.
router.post('/upload', uploadLimiter, async (req: Request, res: Response): Promise<void> => {
	try {
		const userAgent = req.get('User-Agent') || ''
		if (!userAgent.toLowerCase().includes('citizenfx')) {
			res.status(403).json({ success: false })
			return
		}

		const { fileType } = req.body
		const presignPath = fileType === 'video' ? '/api/screenshot/presign-recording' : '/api/screenshot/presign'

		// Call ingress internally via Docker service name.
		// Pass x-forwarded headers so the presign endpoint returns the correct external URL.
		const response = await fetch(`http://ingress:5000${presignPath}`, {
			method: 'POST',
			headers: {
				'x-forwarded-host': 'ingress.vexonac.com',
				'x-forwarded-proto': 'https',
			},
		})

		if (!response.ok) {
			res.status(500).json({ success: false, error: 'Failed to generate upload URL' })
			return
		}

		const { uploadUrl, publicUrl } = await response.json() as { uploadUrl: string; publicUrl: string }

		res.json({
			success: true,
			data: { uploadUrl, fileKey: publicUrl, publicUrl }
		})
	} catch (error) {
		console.error('R2 upload URL generation failed:', error)
		res.status(500).json({
			success: false,
			error: 'Failed to generate upload URL'
		})
	}
})

export default router
