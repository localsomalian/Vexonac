import { createHmac, timingSafeEqual } from "crypto";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { onServerShutdown } from "../handlers/onServerShutdown";
import { updateServerInfos } from "../handlers/updateServerInfos";
import { logger } from "../lib/logger";
import { env } from "../lib/env";
import prisma from "../lib/prisma";
import { batchUpdateService } from "./batch-update.service";
import { createBan } from "./ban.service";
import licenseService from "./license.service";
import { ConsoleBufferService } from "./console-buffer.service";
import { resolveScreenshotToken } from "../routes/screenshot.routes";

function signPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (!env.WS_SIGNING_SECRET) return payload;
  const ts = Date.now();
  const sig = createHmac("sha256", env.WS_SIGNING_SECRET)
    .update(ts + ":" + JSON.stringify(payload))
    .digest("hex");
  return { ...payload, _ts: ts, _sig: sig };
}

function getClientIp(ip: string, cfConnectingIp: string | undefined, xForwardedFor?: string | string[]): string {
  if (cfConnectingIp && typeof cfConnectingIp === "string") {
    return cfConnectingIp;
  }
  if (xForwardedFor) {
    const forwarded = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    const first = forwarded?.split(",")?.[0]?.trim();
    if (first) return first;
  }
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  if (ip === "::1") {
    return "127.0.0.1";
  }
  return ip;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private consoleBuffer: ConsoleBufferService;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.consoleBuffer = ConsoleBufferService.getInstance();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(httpServer: HttpServer): void {
    try {
      const allowedOrigins = [
        env.CORS_ORIGIN,
        "https://vexonac.com",
        "https://www.vexonac.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter(Boolean);

      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: (origin, callback) => {
            // Game servers don't send an origin header — allow those
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} not allowed`));
          },
          methods: ["GET", "POST"],
          allowedHeaders: ["User-Agent", "Content-Type"],
          credentials: true,
        },
        connectTimeout: 10000,
      });

      this.io.use(async (socket, next) => {
        try {
          const query = socket.handshake.query;
          const userAgent = socket.handshake.headers["user-agent"];
          const clientIp = getClientIp(
            socket.handshake.address,
            socket.handshake.headers["cf-connecting-ip"] as string | undefined,
            socket.handshake.headers["x-forwarded-for"]
          );

          if (!userAgent || userAgent !== "VexonAC_Server") {
            return next(new Error("Invalid user agent"));
          }

          const licenseKey = query.licenseKey as string;
          const version = query.version as string;

          if (!licenseKey || !version) {
            logger.warn(
              "Server connection attempt with invalid query parameters",
              {
                socketId: socket.id,
              }
            );
            return next(new Error("Invalid query parameters"));
          }

          // const latestVersion = await versionService.getLatestVersionString();
          // if (
          //   !latestVersion ||
          //   (version !== latestVersion && version !== latestVersion + "-beta")
          // ) {
          //   logger.warn("Version mismatch", {
          //     socketId: socket.id,
          //     licenseKey,
          //     version,
          //     latestVersion,
          //   });
          //   return next(
          //     new Error(`Version mismatch. Latest: ${latestVersion}`)
          //   );
          // }

          const validServer = await licenseService.validateServer(
            licenseKey,
            clientIp
          );
          if (!validServer) {
            logger.warn("Server validation failed", {
              socketId: socket.id,
              licenseKey,
              version,
              address: socket.handshake.address,
              clientIp,
              cfConnectingIp: socket.handshake.headers["cf-connecting-ip"],
              xForwardedFor: socket.handshake.headers["x-forwarded-for"],
              xRealIp: socket.handshake.headers["x-real-ip"],
              pseudoIpv4: socket.handshake.headers["cf-pseudo-ipv4"],
            });
            return next(new Error("Server validation failed"));
          }

          socket.data.licenseKey = licenseKey;
          socket.data.serverId = validServer.id;
          socket.data.version = version;
          socket.data.ip = clientIp;

          return next();
        } catch (error) {
          logger.error("Error in socket authentication middleware", {
            error,
            address: socket.handshake.address,
          });
          return next(new Error("Internal server error during authentication"));
        }
      });

      this.setupSocketEvents();
      this.startConsoleFlushTimer();
      logger.info("WebSocket server initialized successfully");
    } catch (error) {
      logger.error("Error initializing WebSocket server", { error });
    }
  }

  private setupSocketEvents(): void {
    if (!this.io) {
      console.error("Socket.IO not initialized yet");
      return;
    }

    // Handle server-app connections (from TypeScript server app)
    this.io.of("/server-app").on("connection", (socket) => {
      logger.info("Server app connected: " + socket.id);

      socket.on("disconnect", () => {
        logger.info("Server app disconnected: " + socket.id);
      });

      // Handle WebRTC events from server app to forward to FiveM servers
      socket.on("webrtc:offer", (data: any) => {
        this.emitWebRTCToServer(data.serverId, "webrtc:offer", {
          playerId: data.playerId,
          streamId: data.streamId,
          offer: data.offer,
        });
      });

      socket.on("webrtc:ice_candidate_remote", (data: any) => {
        this.emitWebRTCToServer(data.serverId, "webrtc:ice_candidate_remote", {
          playerId: data.playerId,
          streamId: data.streamId,
          candidate: data.candidate,
        });
      });

      socket.on("webrtc:start_stream_request", (data: any) => {
        this.emitWebRTCToServer(data.serverId, "webrtc:start_stream_request", {
          playerId: data.playerId,
          streamId: data.streamId,
          iceServers: data.iceServers, // Forward TURN credentials to FiveM server
        });
      });

      // Console command handling from server app
      socket.on("console:command", (data: any) => {
        try {
          if (this.isServerConnected(data.serverId)) {
            this.emitToServer(data.serverId, "console:command", {
              username: data.username,
              command: data.command,
            }, false);
          }
        } catch (error) {
          logger.error("Error processing console command", {
            error,
            serverId: data.serverId,
          });
        }
      });

      socket.on("console:subscribe", (data: any) => {
        try {
          // Subscribe to console buffer and get recent entries
          const recentEntries = this.consoleBuffer.subscribe(data.serverId);
          
          // Send recent entries to the subscriber
          if (recentEntries.length > 0) {
            for (const entry of recentEntries) {
              socket.emit("console:output", {
                serverId: entry.serverId,
                output: entry.output,
                timestamp: entry.timestamp,
              });
            }
          }

          // Request console connection from FiveM server (only if server is connected)
          if (this.isServerConnected(data.serverId)) {
            this.emitToServer(data.serverId, "console:subscribe", {}, false);
          } else {
            // Send disconnected event to subscriber
            socket.emit("console:disconnected", {
              serverId: data.serverId,
              reason: "Server not connected",
            });
          }
        } catch (error) {
          logger.error("Error processing console subscription", {
            error,
            serverId: data.serverId,
          });
        }
      });

      socket.on("console:unsubscribe", (data: any) => {
        try {
          logger.info("Console unsubscription request", {
            serverId: data.serverId,
          });

          // Unsubscribe from console buffer
          this.consoleBuffer.unsubscribe(data.serverId);

          // Request console disconnection from FiveM server (only if server is connected)
          if (this.isServerConnected(data.serverId)) {
            this.emitToServer(data.serverId, "console:unsubscribe", {}, false);
          }
        } catch (error) {
          logger.error("Error processing console unsubscription", {
            error,
            serverId: data.serverId,
          });
        }
      });
    });

    // Handle FiveM server connections
    this.io.on("connection", (socket) => {
      const { licenseKey, version, serverId } = socket.data;

      // Disconnect all previous sockets with the same serverId (except current)
      const roomName = `server:${serverId}`;
      if (this.io) {
        const room = this.io.sockets.adapter.rooms.get(roomName);
        if (room) {
          for (const socketId of room) {
            if (socketId !== socket.id) {
              const prevSocket = this.io.sockets.sockets.get(socketId);
              if (prevSocket) {
                prevSocket.disconnect(true);
              }
            }
          }
        }
      }

      socket.join(`server:${serverId}`);

      // Debug: Verify room joining
      const joinedRoomName = `server:${serverId}`;
      const joinedRoom = this.io?.sockets.adapter.rooms.get(joinedRoomName);
      logger.debug("Server joined room", {
        socketId: socket.id,
        serverId,
        roomName: joinedRoomName,
        roomSize: joinedRoom?.size || 0,
        socketInRoom: joinedRoom?.has(socket.id) || false,
      });

      socket.emit("authenticated", { success: true });

      // Push webhook URLs from database so FiveM can send Discord logs immediately
      prisma.license.findUnique({
        where: { licenseKey },
        select: { configuration: true, serverName: true },
      }).then((licenseData) => {
        if (licenseData?.serverName) {
          socket.data.serverName = licenseData.serverName;
        }
        if (licenseData?.configuration) {
          const cfg = licenseData.configuration as Record<string, any>;
          const s = cfg.Settings || {};
          socket.emit("serverWebhooks", {
            MainWebhook: s.MainWebhook || "",
            EntitiesWebhook: s.EntitiesWebhook || "",
            ExplosionsWebhook: s.ExplosionsWebhook || "",
            WeaponsWebhook: s.WeaponsWebhook || "",
            UnbansWebhook: s.UnbansWebhook || "",
            ConnectionsWebhook: s.ConnectionsWebhook || "",
            CommunityLogsWebhook: s.CommunityLogsWebhook || "",
            GlobalBanWebhook: s.GlobalBanWebhook || "",
            ScreenshotsWebhook: s.ScreenshotsWebhook || "",
          });
        }
      }).catch(() => {});

      logger.info("Server connected", {
        socketId: socket.id,
        serverId,
        ip: socket.data.ip,
        address: socket.handshake.address,
        cfConnectingIp: socket.handshake.headers["cf-connecting-ip"],
        xForwardedFor: socket.handshake.headers["x-forwarded-for"],
        xRealIp: socket.handshake.headers["x-real-ip"],
        pseudoIpv4: socket.handshake.headers["cf-pseudo-ipv4"],
      });

      socket.on("disconnect", () => {
        logger.info("Server disconnected", {
          socketId: socket.id,
          serverId,
        });
        onServerShutdown(socket);
      });

      socket.on("updateServerInfos", (data: any) => {
        try {
          updateServerInfos(socket, data);
        } catch (error) {
          logger.error("Error processing server update", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      // Called by web/server.js to register a ban via the authenticated socket,
      // bypassing the HTTP endpoint's IP validation (safe because the socket
      // handshake already validated the license and server identity).
      socket.on("banPlayer:setEvidence", async (data: { banDbId: string; evidenceUrl: string }) => {
        try {
          const ban = await prisma.ban.update({
            where: { id: data.banDbId },
            data: { evidenceUrl: data.evidenceUrl },
            select: { banId: true },
          })
          // Forward evidence to global ban log webhook
          const { env } = await import('../lib/env')
          const webhookUrl = env.SERVERS_BAN_WEBHOOK_URL
          if (webhookUrl && data.evidenceUrl) {
            const isVideo = data.evidenceUrl.includes('/recordings/') || data.evidenceUrl.includes('vexonac-capture.webm')
            const embed = {
              color: 0xed4245,
              description: `**Screenshot — Ban #${ban.banId}** (${socket.data.serverName || socket.data.serverId})`,
              image: isVideo ? undefined : { url: data.evidenceUrl },
              footer: { text: 'VexonAC' },
              timestamp: new Date().toISOString(),
            }
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(isVideo ? { content: data.evidenceUrl } : { embeds: [embed] }),
            }).catch(() => {})
          }
        } catch (_) {}
      })

      socket.on("screenshot:resolve", (data: { token: string }, callback: any) => {
        if (typeof callback !== 'function') return
        const url = resolveScreenshotToken(data?.token || '')
        callback({ url: url || null })
      })

      socket.on("banPlayer:register", async (data: any, callback: any) => {
        try {
          const result = await createBan({
            licenseId: socket.data.serverId,
            playerLicense: data.playerLicense,
            reason: data.reason || 'Unknown reason',
            details: data.details,
            evidenceUrl: data.evidenceUrl || null,
            bannedBy: data.bannedBy,
            duration: data.duration,
            playerName: data.playerName,
            identifiers: Array.isArray(data.identifiers) ? data.identifiers : undefined,
            serverName: socket.data.serverName,
          })
          if (typeof callback === 'function') callback({ success: true, ban: result })
        } catch (error) {
          logger.error("banPlayer:register error", { error, serverId: socket.data.serverId })
          const msg = error instanceof Error ? error.message : 'Internal error'
          if (typeof callback === 'function') callback({ success: false, error: msg })
        }
      })

      // WebRTC Event Handlers - Forward to server app
      socket.on("webrtc:stream_started", (data: any) => {
        try {
          logger.info("Stream started", {
            serverId: socket.data.serverId,
            streamId: data.streamId,
            playerId: data.playerId,
            playerName: data.playerName,
          });

          // Forward to server app namespace
          this.io?.of("/server-app").emit("webrtc:stream_started", {
            ...data,
            serverId: socket.data.serverId,
          });
        } catch (error) {
          logger.error("Error processing stream started", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      socket.on("webrtc:stream_stopped", (data: any) => {
        try {
          logger.info("Stream stopped", {
            serverId: socket.data.serverId,
            streamId: data.streamId,
            playerId: data.playerId,
            reason: data.reason,
          });

          // Forward to server app namespace
          this.io?.of("/server-app").emit("webrtc:stream_stopped", {
            ...data,
            serverId: socket.data.serverId,
          });
        } catch (error) {
          logger.error("Error processing stream stopped", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      socket.on("webrtc:answer", (data: any) => {
        try {
          logger.info("WebRTC answer received", {
            serverId: socket.data.serverId,
            streamId: data.streamId,
            playerId: data.playerId,
          });

          // Forward to server app namespace
          this.io?.of("/server-app").emit("webrtc:answer", {
            ...data,
            serverId: socket.data.serverId,
          });
        } catch (error) {
          logger.error("Error processing WebRTC answer", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      socket.on("webrtc:ice_candidate", (data: any) => {
        try {
          // Forward ICE candidates to server app namespace
          this.io?.of("/server-app").emit("webrtc:ice_candidate", {
            ...data,
            serverId: socket.data.serverId,
          });
        } catch (error) {
          logger.error("Error processing ICE candidate", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      // Console Event Handlers
      socket.on("console:output", (data: any) => {
        try {
          // Add to buffer instead of direct emission
          this.consoleBuffer.addOutput(socket.data.serverId, data.output);
        } catch (error) {
          logger.error("Error processing console output", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      socket.on("console:connected", (data: any) => {
        try {
          // Notify server app that console is available
          this.io?.of("/server-app").emit("console:connected", {
            serverId: socket.data.serverId,
          });
        } catch (error) {
          logger.error("Error processing console connected", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      socket.on("console:disconnected", (data: any) => {
        try {
          // Notify server app that console is unavailable
          this.io?.of("/server-app").emit("console:disconnected", {
            serverId: socket.data.serverId,
            reason: data.reason,
          });
        } catch (error) {
          logger.error("Error processing console disconnected", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });

      // Handle console command results from FiveM server
      socket.on("console:command_result", (data: any) => {
        try {
          // Forward result to server app namespace
          this.io?.of("/server-app").emit("console:command_result", {
            serverId: socket.data.serverId,
            command: data.command,
            success: data.success,
            output: data.output,
          });
        } catch (error) {
          logger.error("Error processing console command result", {
            error,
            serverId: socket.data.serverId,
          });
        }
      });
    });
  }

  public emitToServer(
    serverId: string,
    event: string,
    data: any,
    shouldAwait = true,
    timeoutMs = 10000
  ): Promise<any> | void {
    if (!this.io) {
      return Promise.reject(new Error("Socket.IO not initialized"));
    }

    // Debug logging
    const roomName = `server:${serverId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    logger.debug("Emitting to server", {
      serverId,
      event,
      roomName,
      roomExists: !!room,
      roomSize: room?.size || 0,
      allRooms: Array.from(this.io.sockets.adapter.rooms.keys()).filter(r => r.startsWith('server:')),
    });

    const socketId = [...(room || [])][0];
    if (!socketId) {
      const error = new Error(`No sockets found in server:${serverId}`);
      logger.warn("Failed to find server socket", {
        serverId,
        roomName,
      });
      if (shouldAwait) return Promise.reject(error);
      else {
        console.warn(error.message);
        return;
      }
    }

    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) {
      const error = new Error(`Socket with ID ${socketId} not found`);
      if (shouldAwait) return Promise.reject(error);
      else {
        console.warn(error.message);
        return;
      }
    }

    if (!shouldAwait) {
      socket.emit(event, data);
      return;
    }

    // Await response with timeout
    return new Promise((resolve, reject) => {
      let didRespond = false;

      const timeout = setTimeout(() => {
        if (!didRespond) {
          didRespond = true;
          reject(new Error("Socket response timed out"));
        }
      }, timeoutMs);

      socket.emit(event, data, (response: any) => {
        if (didRespond) return;
        didRespond = true;
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Send WebRTC events to a specific FiveM server
   */
  public emitWebRTCToServer(serverId: string, event: string, data: any): void {    
    if (!this.io) {
      console.error("âŒ [INGRESS DEBUG] Socket.IO not initialized");
      return;
    }

    const roomName = `server:${serverId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    
    if (!room || room.size === 0) {
      console.error("âŒ [INGRESS DEBUG] No FiveM server connected for serverId:", serverId);
      return;
    }
    
    this.emitToServer(serverId, event, data, false);
  }

  public getConnectedServersCount(): number {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }

  public isServerConnected(serverId: string): boolean {
    if (!this.io) return false;
    const roomName = `server:${serverId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size > 0 : false;
  }

  public getConnectedServerIds(): string[] {
    if (!this.io) return [];
    return Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('server:'))
      .map(room => room.replace('server:', ''));
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }

  public emitDetectionAlert(serverId: string, data: {
    playerName: string;
    code: string;
    severity: string;
    pts: number;
    totalScore: number;
    screenshotUrl?: string | null;
    identifiers: string[];
  }): void {
    if (!this.io) return;
    this.io.of("/server-app").emit("detection:alert", { serverId, ...data });
  }

  /**
   * Start console flush timer for optimized batching
   */
  private startConsoleFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flushConsoleBuffers();
    }, 250); // Flush every 250ms
  }

  /**
   * Flush console buffers to subscribers
   */
  private flushConsoleBuffers(): void {
    if (!this.io) return;

    const serverIds = this.consoleBuffer.getServerIds();
    for (const serverId of serverIds) {
      const entries = this.consoleBuffer.getBufferedEntries(serverId);
      if (entries.length === 0) continue;

      // Batch entries and emit to server app namespace
      for (const entry of entries) {
        this.io.of("/server-app").emit("console:output", {
          serverId: entry.serverId,
          output: entry.output,
          timestamp: entry.timestamp,
        });
      }
    }
  }

  public shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.consoleBuffer.shutdown();

    if (this.io) {
      this.io.close();
      this.io = null;
    }
    batchUpdateService.shutdown();
    logger.info("WebSocket server shut down");
  }
}

export const websocketService = WebSocketService.getInstance();

