import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import { createServer } from "http";
import { initializeCronJobs, stopCronJobs } from "./crons";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { discordBot } from "./lib/discord-bot.service";
import { env } from "./lib/env";
import { initializeSocket } from "./lib/socket";
import { appRouter } from "./routers/index";
import { webrtcHandler } from "./services/webrtc-handler";
import { handleNOWPaymentsWebhook } from "./routes/payments/webhook-nowpayments";
import { handleSquareWebhook } from "./routes/payments/webhook-square";
import { handleMollieWebhook } from "./routes/payments/webhook-mollie";
import r2UploadRoutes from "./routes/r2-upload.routes";
import v1Routes from "./routes/v1";
import { handlePolarWebhook } from "./routes/payments/webhook-polar";
import { sendErrorLog } from "./lib/discord";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const httpServer = createServer(app);

// Define allowed origins
const allowedOrigins = [
  env.CORS_ORIGIN || "",
  "https://vexonac.com",
  "https://www.vexonac.com",
  "https://status.vexonac.com",
  "https://cfx-nui-vexonac", // FiveM R2 Upload
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

// Apply CORS middleware first and to all routes
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log rejected origins for debugging
      console.warn(`CORS: Rejected origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "User-Agent",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Initialize socket server with WebRTC support
const io = initializeSocket(httpServer);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.post("/api/payments/webhook/mollie",
  bodyParser.raw({ type: '*/*' }),
  async (req, res) => {
    try {
      await handleMollieWebhook(req, res);
    } catch (error) {
      console.error('âŒ Mollie webhook handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

app.post("/api/payments/webhook/polar",
  bodyParser.raw({ type: '*/*' }),
  async (req, res) => {
    try {
      await handlePolarWebhook(req, res);
    } catch (error) {
      console.error('âŒ Polar webhook handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

app.use(express.json());

// R2 upload routes
app.use("/api/r2", r2UploadRoutes);

// API v1 routes
app.use("/v1", v1Routes);

// NOWPayments webhook endpoint
app.post("/api/payments/webhook/nowpayments", async (req, res) => {
  try {
    await handleNOWPaymentsWebhook(req, res);
  } catch (error) {
    console.error('âŒ Webhook handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Square webhook endpoint
app.post("/api/payments/webhook/square", async (req, res) => {
  try {
    await handleSquareWebhook(req, res);
  } catch (error) {
    console.error('âŒ Square webhook handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

const port = env.PORT;
httpServer.listen(port, async () => {
  console.log(`Server is running on port ${port} in ${env.NODE_ENV} mode`);
  console.log(`Socket.io server is running on the same port`);

  // Start Discord bot if token is provided
  if (env.DISCORD_BOT_TOKEN) {
    try {
      const started = await discordBot.start();
      if (started) {
        console.log("Discord bot started successfully");
      } else {
        console.error("Failed to start Discord bot");
      }
    } catch (error) {
      console.error("Error starting Discord bot:", error);
    }
  } else {
    console.warn("Discord bot token not provided, bot will not start");
  }

  // Initialize cron jobs for database cleanup
  try {
    initializeCronJobs();
    console.log("Cron jobs initialized successfully");
  } catch (error) {
    console.error("Error initializing cron jobs:", error);
  }
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  stopCronJobs();
  await discordBot.stop();
  if (io) {
    io.close();
  }
  webrtcHandler.destroy();
  httpServer.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  stopCronJobs();
  await discordBot.stop();
  if (io) {
    io.close();
  }
  webrtcHandler.destroy();
  httpServer.close();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  sendErrorLog({
    message: `Uncaught exception: ${error.message}`,
    stack: error.stack,
    timestamp: new Date(),
    environment: env.NODE_ENV,
  }).finally(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  console.error("Unhandled rejection:", reason);
  sendErrorLog({
    message: `Unhandled rejection: ${message}`,
    stack,
    timestamp: new Date(),
    environment: env.NODE_ENV,
  });
});

