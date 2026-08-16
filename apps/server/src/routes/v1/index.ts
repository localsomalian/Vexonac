import { Router } from "express";
import authRoutes from "./auth.routes";
import keysRoutes from "./keys.routes";
import statsRoutes from "./stats.routes";
import bansRoutes from "./bans.routes";
import serverRoutes from "./server.routes";
import playerRoutes from "./player.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/keys", keysRoutes);
router.use("/stats", statsRoutes);
router.use("/bans", bansRoutes);
router.use("/server", serverRoutes);
router.use("/player", playerRoutes);

export default router;

