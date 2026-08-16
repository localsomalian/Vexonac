import { Router, raw } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
const screenshotRouter = Router();
// token → Discord CDN URL (populated after upload completes)
const pendingScreenshots = new Map();
export function resolveScreenshotToken(token) {
    return pendingScreenshots.has(token) ? (pendingScreenshots.get(token) ?? null) : undefined;
}
// Called by the FiveM NUI to get an upload URL.
// Returns { uploadUrl, publicUrl } — NUI PUTs the image to uploadUrl,
// then calls screenshotSaved with publicUrl.
// publicUrl is a "pending:{token}" sentinel that web/server.js resolves
// via the screenshot:resolve socket event once the Discord upload finishes.
screenshotRouter.get('/presign', async (req, res) => {
    const licenseKey = req.query.licenseKey || '';
    const token = randomUUID();
    pendingScreenshots.set(token, null);
    setTimeout(() => pendingScreenshots.delete(token), 120000);
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3002';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const uploadUrl = `${protocol}://${host}/api/screenshot/upload/${token}?licenseKey=${encodeURIComponent(licenseKey)}`;
    res.json({ uploadUrl, publicUrl: `pending:${token}` });
});
// Called by the FiveM NUI when it wants to upload a screen recording.
// Same proxy pattern as screenshots.
screenshotRouter.get('/presign-recording', async (req, res) => {
    const licenseKey = req.query.licenseKey || '';
    const token = randomUUID();
    pendingScreenshots.set(token, null);
    setTimeout(() => pendingScreenshots.delete(token), 120000);
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3002';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const uploadUrl = `${protocol}://${host}/api/screenshot/upload/${token}?licenseKey=${encodeURIComponent(licenseKey)}`;
    res.json({ uploadUrl, publicUrl: `pending:${token}` });
});
// Receives the raw image/video from the NUI, forwards it to the server's
// configured Discord MainWebhook, and stores the resulting CDN URL.
screenshotRouter.put('/upload/:token', raw({ type: '*/*', limit: '15mb' }), async (req, res) => {
    const { token } = req.params;
    const licenseKey = req.query.licenseKey || '';
    if (!pendingScreenshots.has(token)) {
        res.status(404).json({ error: 'Unknown token' });
        return;
    }
    try {
        const license = await prisma.license.findUnique({
            where: { licenseKey },
            select: { configuration: true },
        });
        const cfg = license?.configuration || {};
        const webhookUrl = cfg.Settings?.MainWebhook || cfg.Settings?.ScreenshotsWebhook || '';
        if (webhookUrl) {
            const body = req.body;
            const contentType = req.headers['content-type'] || 'image/webp';
            const ext = contentType.includes('webm') ? 'webm' : 'webp';
            const filename = `screenshot.${ext}`;
            const formData = new FormData();
            formData.append('file', new Blob([body], { type: contentType }), filename);
            const response = await fetch(webhookUrl, { method: 'POST', body: formData });
            if (response.ok) {
                const data = await response.json();
                const cdnUrl = data?.attachments?.[0]?.url || data?.attachments?.[0]?.proxy_url || '';
                if (cdnUrl)
                    pendingScreenshots.set(token, cdnUrl);
            }
        }
    }
    catch (_) { }
    res.status(200).json({ ok: true });
});
export { screenshotRouter };
