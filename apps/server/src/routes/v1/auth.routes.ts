import { Router } from "express";
import { apiKeyAuth } from "../../middleware/api-auth.middleware";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Apply authentication middleware to all routes in this router
router.use(apiKeyAuth as any);

router.post("/verify", (req, res: any) => {
  const apiKey = req.apiKey!;

  // Calculate rate limit info
  const rateLimit = {
    limit: apiKey.rateLimitPerMinute,
  };

  // Parse permissions if it's a string (JSON)
  let permissions = apiKey.permissions;
  if (typeof permissions === 'string') {
    try {
        permissions = JSON.parse(permissions);
    } catch (e) {
        permissions = {};
    }
  }

  return res.status(200).json({
    valid: true,
    key: {
      id: apiKey.id,
      name: apiKey.name,
      tier: apiKey.tier,
      status: apiKey.status,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    },
    permissions: permissions,
    rateLimit: rateLimit,
    meta: {
      requestId: req.headers['x-request-id'] || uuidv4(),
      timestamp: new Date().toISOString()
    }
  });
});

export default router;

