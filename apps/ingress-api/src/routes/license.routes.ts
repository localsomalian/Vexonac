import { Router } from "express";
import rateLimit from "express-rate-limit";
import { apiMiddleware } from "../middleware/auth.middleware";

// Import individual endpoint handlers
import { authenticateHandler } from "./endpoints/license/auth";
import { banPlayer } from "./endpoints/license/banPlayer";
import { checkPlayer } from "./endpoints/license/checkPlayer";
import { checkTokens } from "./endpoints/license/checkTokens";
import { getConfigHandler } from "./endpoints/license/getConfig";
import retardHandler from "./endpoints/license/crackDetection";
import { savePlayTime } from "./endpoints/license/savePlayTime";
import { unbanAllPlayers } from "./endpoints/license/unbanAllPlayers";
import { unbanPlayer } from "./endpoints/license/unbanPlayer";
import updateHandler from "./endpoints/license/update";
import { getBanInfo } from "./endpoints/license/getBanInfo";
import { sendLogHandler } from "./endpoints/license/sendLog";
import { getLatestVersionHandler } from "./endpoints/license/getLatestVersion";

const licenseRouter = Router();

// Rate limiting for FiveM servers
const fivemLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply middleware to license routes
licenseRouter.use(fivemLimiter);
licenseRouter.use(apiMiddleware);

// License routes (note: these will be mounted at /api/license so we don't need /license prefix here)
licenseRouter.post("/:licenseKey/auth", authenticateHandler);
licenseRouter.get("/:licenseKey/config", getConfigHandler);
licenseRouter.get("/:licenseKey/latestVersion", getLatestVersionHandler);
licenseRouter.get("/:licenseKey/update", updateHandler);
licenseRouter.post("/:licenseKey/retard", retardHandler);
licenseRouter.post("/:licenseKey/checkPlayer", checkPlayer);
licenseRouter.post("/:licenseKey/checkTokens", checkTokens);
licenseRouter.post("/:licenseKey/banPlayer", banPlayer);
licenseRouter.post("/:licenseKey/unbanPlayer", unbanPlayer);
licenseRouter.post("/:licenseKey/unbanAllPlayers", unbanAllPlayers);
licenseRouter.post("/:licenseKey/getBanInfo", getBanInfo);
licenseRouter.post("/:licenseKey/savePlayTime", savePlayTime);

licenseRouter.post("/:licenseKey/sendLog", sendLogHandler);

export { licenseRouter };
