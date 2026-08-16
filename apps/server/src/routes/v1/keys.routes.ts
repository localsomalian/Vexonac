import { Router } from "express";
import { apiKeyAuth } from "../../middleware/api-auth.middleware";

const router = Router();

// Apply authentication middleware to all routes in this router
router.use(apiKeyAuth as any);

router.get("/usage", (req, res: any) => {
  const apiKey = req.apiKey!;

  const now = new Date();
  const resetDate = new Date(apiKey.monthlyResetDate);
  
  // Calculate days remaining until reset
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilReset = Math.max(0, Math.ceil((resetDate.getTime() - now.getTime()) / msPerDay));

  // Calculate usage percentage
  const usagePercent = apiKey.monthlyRequestLimit > 0 
    ? (apiKey.currentMonthlyUsage / apiKey.monthlyRequestLimit) * 100 
    : 0;

  return res.status(200).json({
    usage: {
      current: apiKey.currentMonthlyUsage,
      limit: apiKey.monthlyRequestLimit,
      remaining: Math.max(0, apiKey.monthlyRequestLimit - apiKey.currentMonthlyUsage),
      percentage: Number(usagePercent.toFixed(2))
    },
    period: {
      resetDate: apiKey.monthlyResetDate,
      daysRemaining: daysUntilReset
    },
    lifetime: {
        totalRequests: apiKey.totalRequests,
        lastUsedAt: apiKey.lastUsedAt
    }
  });
});

export default router;

