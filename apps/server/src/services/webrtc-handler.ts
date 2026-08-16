import { env } from "@/lib/env";
import { Socket, io as SocketClient } from "socket.io-client";
import {
  emitStreamStarted,
  emitStreamStopped,
  emitWebRTCAnswer,
  emitWebRTCICECandidate,
  emitConsoleOutput,
  emitConsoleConnected,
  emitConsoleDisconnected,
  emitConsoleCommandResult,
  emitDetectionAlert,
} from "../lib/socket";

interface WebRTCSession {
  streamId: string;
  playerId: string;
  playerName: string;
  serverName: string;
  serverId: string;
  startTime: number;
}

export interface WebRTCSessionWithDuration extends WebRTCSession {
  duration: number;
}

export class WebRTCHandler {
  private ingressSocket: Socket | null = null;
  private activeSessions: Map<string, WebRTCSession> = new Map();

  constructor(private ingressApiUrl: string = env.INGRESS_API_WEBSOCKET_URL) {
    this.connectToIngressAPI();
  }

  private connectToIngressAPI() {
    console.log(`🔌 Connecting to ingress API at ${this.ingressApiUrl}`);

    let connectErrorLogged = false;

    this.ingressSocket = SocketClient(`${this.ingressApiUrl}/server-app`, {
      transports: ["websocket"],
      forceNew: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 30000,
    });

    this.ingressSocket.on("connect", () => {
      connectErrorLogged = false;
      console.log("✅ Connected to ingress API");
      this.ingressSocket?.emit("join", "server-app");
    });

    this.ingressSocket.on("connect_error", (error: any) => {
      if (!connectErrorLogged) {
        console.warn(`⚠️  Ingress API unavailable (${error.message}) — retrying in background`);
        connectErrorLogged = true;
      }
    });

    this.ingressSocket.on("disconnect", () => {
      console.log("⚠️  Disconnected from ingress API");
    });

    // Handle WebRTC events from ingress API
    this.ingressSocket.on("webrtc:stream_started", (data: any) => {      
      const session: WebRTCSession = {
        streamId: data.streamId,
        playerId: data.playerId,
        playerName: data.playerName,
        serverName: data.serverName,
        serverId: data.serverId,
        startTime: Date.now(),
      };

      this.activeSessions.set(data.streamId, session);
      emitStreamStarted(session);
    });

    this.ingressSocket.on("webrtc:stream_stopped", (data: any) => {
      this.activeSessions.delete(data.streamId);
      emitStreamStopped(data);
    });

    this.ingressSocket.on("webrtc:answer", (data: any) => {
      emitWebRTCAnswer(data);
    });

    this.ingressSocket.on("webrtc:ice_candidate", (data: any) => {
      emitWebRTCICECandidate(data);
    });

    // Console event handlers from ingress API (responses from FiveM server)
    this.ingressSocket.on("console:output", (data: any) => {
      emitConsoleOutput(data.serverId, data.output, data.timestamp);
    });

    this.ingressSocket.on("console:connected", (data: any) => {
      emitConsoleConnected(data.serverId);
    });

    this.ingressSocket.on("console:disconnected", (data: any) => {
      emitConsoleDisconnected(data.serverId, data.reason);
    });

    this.ingressSocket.on("console:command_result", (data: any) => {
      emitConsoleCommandResult(data.serverId, data.command, data.success, data.output);
    });

    this.ingressSocket.on("detection:alert", (data: any) => {
      emitDetectionAlert(data.serverId, data);
    });

    this.ingressSocket.on("error", (error: any) => {
      console.error("❌ Ingress API socket error:", error);
    });
  }

  // Send WebRTC offer to specific FiveM server via ingress API
  async sendOfferToFivem(
    serverId: string,
    playerId: string,
    streamId: string,
    offer: any
  ): Promise<boolean> {
    if (!this.ingressSocket?.connected) {
      console.error("❌ Not connected to ingress API");
      return false;
    }

    try {
      this.ingressSocket.emit("webrtc:offer", {
        serverId,
        playerId,
        streamId,
        offer,
      });

      return true;
    } catch (error) {
      console.error("❌ Failed to send offer:", error);
      return false;
    }
  }

  // Send ICE candidate to specific FiveM server via ingress API
  async sendICECandidateToFivem(
    serverId: string,
    playerId: string,
    streamId: string,
    candidate: any
  ): Promise<boolean> {
    if (!this.ingressSocket?.connected) {
      console.error("❌ Not connected to ingress API");
      return false;
    }

    try {
      this.ingressSocket.emit("webrtc:ice_candidate_remote", {
        serverId,
        playerId,
        streamId,
        candidate,
      });

      return true;
    } catch (error) {
      console.error("❌ Failed to send ICE candidate:", error);
      return false;
    }
  }

  // Request stream from player via ingress API
  async requestStreamFromPlayer(
    serverId: string,
    playerId: string,
    streamId?: string
  ): Promise<boolean> {
    
    if (!this.ingressSocket?.connected) {
      console.error("❌ [SERVER DEBUG] Not connected to ingress API", {
        socketExists: !!this.ingressSocket,
        connected: this.ingressSocket?.connected,
        ingressApiUrl: this.ingressApiUrl
      });
      return false;
    }

    try {
      const finalStreamId = streamId || `stream_${playerId}_${Date.now()}`;
      
      // Generate TURN credentials for the player
      let turnCredentials = null;
      try {
        const response = await fetch(`http://localhost:${env.PORT || 3000}/trpc/webrtc.generateTurnCredentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverId,
            playerId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result?.data?.success) {
            turnCredentials = data.result.data.iceServers;
          }
        }
      } catch (error) {
        console.warn("⚠️ [SERVER DEBUG] Failed to generate TURN credentials, using STUN only:", error);
      }
      
      this.ingressSocket.emit("webrtc:start_stream_request", {
        serverId,
        playerId,
        streamId: finalStreamId,
        iceServers: turnCredentials,
      });

      return true;
    } catch (error) {
      console.error("❌ [SERVER DEBUG] Failed to request stream:", error);
      return false;
    }
  }

  // Get active sessions
  getActiveSessions(): WebRTCSessionWithDuration[] {
    return Array.from(this.activeSessions.values()).map((session) => ({
      ...session,
      duration: Math.floor((Date.now() - session.startTime) / 1000),
    }));
  }

  // Check if connected to ingress API
  isConnected(): boolean {
    return this.ingressSocket?.connected || false;
  }

  // Clean up
  destroy() {
    if (this.ingressSocket) {
      this.ingressSocket.disconnect();
      this.ingressSocket = null;
    }

    this.activeSessions.clear();
  }
}

// Singleton instance
export const webrtcHandler = new WebRTCHandler();
