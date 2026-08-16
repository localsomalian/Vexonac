import { type PlayerData } from "@vexonac/types";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import prisma from "../../prisma";
import { webrtcHandler } from "../services/webrtc-handler";
import { emitToServer } from "./emitToServer";

let socketServer: SocketIOServer | null = null;

// In-memory connection tracking
const connectionLimits = {
  maxConnectionsPerServer: 100,
  maxTotalConnections: 10000,
};

const serverConnections = new Map<string, Set<string>>();
const webrtcConnections = new Set<string>(); // Track WebRTC-enabled connections
const consoleConnections = new Map<string, Set<string>>(); // Track console subscriptions by server
let totalConnections = 0;

export const initializeSocket = (httpServer: HttpServer) => {
  socketServer = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? [
              "https://vexonac.com",
              "https://www.vexonac.com",
              "https://ingress.vexonac.com",
              "https://api.vexonac.com",
              "https://vexonac.cloud",
            ]
          : [
              "http://localhost:3002",
              "http://localhost:3001",
              "http://localhost:3000",
            ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 1e6,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  socketServer.on("connection", (socket) => {
    const rateLimiter = new Map<string, number>();
    const socketSubscriptions = new Set<string>();

    if (totalConnections >= connectionLimits.maxTotalConnections) {
      socket.emit("error", { message: "Server at capacity" });
      socket.disconnect();
      return;
    }

    totalConnections++;

    const checkRateLimit = (
      action: string,
      limitMs: number = 1000
    ): boolean => {
      const now = Date.now();
      const lastAction = rateLimiter.get(action) || 0;
      if (now - lastAction < limitMs) return false;
      rateLimiter.set(action, now);
      return true;
    };

    socket.on("subscribe-server", async (serverId: string) => {
      if (!checkRateLimit("subscribe-server", 2000)) return;

      const subscriptionKey = `server:${serverId}`;
      if (socketSubscriptions.has(subscriptionKey)) return;

      const serverConns = serverConnections.get(serverId) || new Set();
      if (serverConns.size >= connectionLimits.maxConnectionsPerServer) {
        socket.emit("error", { message: "Server subscription limit reached" });
        return;
      }

      socket.join(subscriptionKey);
      socketSubscriptions.add(subscriptionKey);
      serverConns.add(socket.id);
      serverConnections.set(serverId, serverConns);
    });

    socket.on("unsubscribe-server", (serverId: string) => {
      const subscriptionKey = `server:${serverId}`;
      if (!socketSubscriptions.has(subscriptionKey)) return;

      socket.leave(subscriptionKey);
      socketSubscriptions.delete(subscriptionKey);

      const serverConns = serverConnections.get(serverId);
      if (serverConns) {
        serverConns.delete(socket.id);
        if (serverConns.size === 0) {
          serverConnections.delete(serverId);
        }
      }
    });

    // WebRTC event handlers for web app connections
    socket.on("webrtc:subscribe", () => {
      if (!checkRateLimit("webrtc:subscribe", 1000)) return;
      webrtcConnections.add(socket.id);
      console.log("ðŸŽ¥ Web app subscribed to WebRTC events:", socket.id);
    });

    socket.on("webrtc:unsubscribe", () => {
      webrtcConnections.delete(socket.id);
      console.log("ðŸŽ¥ Web app unsubscribed from WebRTC events:", socket.id);
    });

    // Console event handlers
    socket.on("console:subscribe", async (data: { serverId: string }) => {
      if (!checkRateLimit("console:subscribe", 1000)) return;

      const { serverId } = data;

      const consoleConns = consoleConnections.get(serverId) || new Set();
      consoleConns.add(socket.id);
      consoleConnections.set(serverId, consoleConns);

      const result = await emitToServer(
        serverId,
        "console:subscribe",
        {},
        false
      );
    });

    socket.on("console:unsubscribe", (data: { serverId: string }) => {
      const { serverId } = data;
      const consoleConns = consoleConnections.get(serverId);
      if (consoleConns) {
        consoleConns.delete(socket.id);
        if (consoleConns.size === 0) {
          consoleConnections.delete(serverId);

          // Forward unsubscription to ingress API using the same method as other events
          emitToServer(serverId, "console:unsubscribe", {}, false).catch(
            console.error
          );
        }
      }
    });

    socket.on(
      "console:command",
      async (data: { serverId: string; command: string; username: string }) => {
        if (!checkRateLimit("console:command", 500)) return;

        const { serverId, command, username } = data;

        await emitToServer(
          serverId,
          "console:command",
          { command, username },
          true
        );
      }
    );

    socket.on("disconnect", () => {
      totalConnections--;
      webrtcConnections.delete(socket.id);

      // Clean up server connections
      for (const [serverId, serverConns] of serverConnections.entries()) {
        serverConns.delete(socket.id);
        if (serverConns.size === 0) {
          serverConnections.delete(serverId);
        }
      }

      // Clean up console connections
      for (const [serverId, consoleConns] of consoleConnections.entries()) {
        consoleConns.delete(socket.id);
        if (consoleConns.size === 0) {
          consoleConnections.delete(serverId);

          // Notify ingress API that console is no longer needed
          emitToServer(serverId, "console:unsubscribe", {}, false).catch(
            console.error
          );
        }
      }

      socketSubscriptions.clear();
      rateLimiter.clear();
    });
  });

  console.log(
    "ðŸ”Œ Optimized Socket.io server with Prisma database and WebRTC support"
  );
  return socketServer;
};

// Get players for server
export const getPlayersForServer = async (
  serverId: string
): Promise<PlayerData[]> => {
  try {
    const serverInfo = await prisma.serverInfo.findUnique({
      where: { licenseId: serverId },
      select: { playerList: true },
    });

    return (serverInfo?.playerList as unknown as PlayerData[]) || [];
  } catch (error) {
    console.error(`Error getting players for server ${serverId}:`, error);
    return [];
  }
};

// WebRTC event emission functions
export const emitWebRTCAnswer = (data: any) => {
  if (socketServer && webrtcConnections.size > 0) {
    console.log(
      "ðŸ“¡ Emitting WebRTC answer to",
      webrtcConnections.size,
      "web app connections"
    );
    webrtcConnections.forEach((socketId) => {
      socketServer?.to(socketId).emit("webrtc:answer", data);
    });
  }
};

export const emitWebRTCICECandidate = (data: any) => {
  if (socketServer && webrtcConnections.size > 0) {
    console.log(
      "ðŸ§Š Emitting ICE candidate to",
      webrtcConnections.size,
      "web app connections"
    );
    webrtcConnections.forEach((socketId) => {
      socketServer?.to(socketId).emit("webrtc:ice_candidate", data);
    });
  }
};

export const emitStreamStarted = (data: any) => {
  if (socketServer && webrtcConnections.size > 0) {
    console.log(
      "ðŸŽ¥ Emitting stream started to",
      webrtcConnections.size,
      "web app connections"
    );
    webrtcConnections.forEach((socketId) => {
      socketServer?.to(socketId).emit("stream:started", data);
    });
  }
};

export const emitStreamStopped = (data: any) => {
  if (socketServer && webrtcConnections.size > 0) {
    console.log(
      "ðŸ›‘ Emitting stream stopped to",
      webrtcConnections.size,
      "web app connections"
    );
    webrtcConnections.forEach((socketId) => {
      socketServer?.to(socketId).emit("stream:stopped", data);
    });
  }
};

// Console event emission functions
export const emitConsoleOutput = (
  serverId: string,
  output: string,
  timestamp: number
) => {
  if (socketServer) {
    const consoleConns = consoleConnections.get(serverId);
    if (consoleConns && consoleConns.size > 0) {
      consoleConns.forEach((socketId) => {
        socketServer
          ?.to(socketId)
          .emit("console:output", { serverId, output, timestamp });
      });
    }
  }
};

export const emitConsoleConnected = (serverId: string) => {
  if (socketServer) {
    const consoleConns = consoleConnections.get(serverId);
    if (consoleConns && consoleConns.size > 0) {
      consoleConns.forEach((socketId) => {
        socketServer?.to(socketId).emit("console:connected", { serverId });
      });
    }
  }
};

export const emitConsoleDisconnected = (serverId: string, reason?: string) => {
  if (socketServer) {
    const consoleConns = consoleConnections.get(serverId);
    if (consoleConns && consoleConns.size > 0) {
      consoleConns.forEach((socketId) => {
        socketServer
          ?.to(socketId)
          .emit("console:disconnected", { serverId, reason });
      });
    }
  }
};

export const emitConsoleCommandResult = (
  serverId: string,
  command: string,
  success: boolean,
  output?: string
) => {
  if (socketServer) {
    const consoleConns = consoleConnections.get(serverId);
    if (consoleConns && consoleConns.size > 0) {
      consoleConns.forEach((socketId) => {
        socketServer
          ?.to(socketId)
          .emit("console:command_result", {
            serverId,
            command,
            success,
            output,
          });
      });
    }
  }
};

export const emitDetectionAlert = (serverId: string, data: any) => {
  if (socketServer) {
    const subscriptionKey = `server:${serverId}`;
    socketServer.to(subscriptionKey).emit("detection:alert", { serverId, ...data });
  }
};

export const getSocket = () => socketServer;


