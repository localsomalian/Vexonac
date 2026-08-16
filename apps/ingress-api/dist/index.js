import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import process from "process";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import prisma from "./lib/prisma";
import healthRoutes from "./routes/health";
import { licenseRouter } from "./routes/license.routes";
import { screenshotRouter } from "./routes/screenshot.routes";
import { serverRouter } from "./routes/server.routes";
import { createWebRTCRouter } from "./routes/webrtc.routes";
import { websocketService } from "./services/websocket.service";
const app = express();
app.set("trust proxy", 1);
const server = createServer(app);
websocketService.initialize(server);
// Middleware
app.use(helmet());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-License-Key"],
}));
app.use(express.json({ limit: "10mb" }));
// API Routes
app.use("/api/license", licenseRouter);
app.use("/api/server", serverRouter);
app.use("/api/screenshot", screenshotRouter);
app.use("/api/webrtc", createWebRTCRouter({ io: websocketService.getIO() }));
// Health check with detailed monitoring
app.use("/", healthRoutes);
// Schemas are now defined in their respective route files
process.on("SIGINT", async () => {
    logger.info("Shutting down gracefully...");
    // Shutdown batch service gracefully
    websocketService.shutdown();
    await prisma.$disconnect();
    server.close(() => {
        logger.info("Server closed");
        process.exit(0);
    });
});
server.listen(env.PORT, () => {
    logger.info(`Ingress API running on port ${env.PORT}`);
});
