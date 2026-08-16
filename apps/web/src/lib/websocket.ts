// Socket.io client for real-time player updates
import { type PlayerData } from "@vexonac/types";
import { io, Socket } from "socket.io-client";
import { env } from "./env";

// Optimized interfaces matching server-side shortened field names
export interface PlayerUpdate {
  serverId: string;
  players: PlayerData[];
  timestamp: number;
}

// WebRTC interfaces
export interface WebRTCAnswer {
  streamId: string;
  playerId: string;
  serverId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCICECandidate {
  streamId: string;
  playerId: string;
  serverId: string;
  candidate: RTCIceCandidateInit;
}

export interface StreamEvent {
  streamId: string;
  playerId: string;
  playerName: string;
  serverName: string;
  serverId: string;
  startTime?: number;
  reason?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private serverSubscribed: string | null = null;
  private webrtcSubscribed: boolean = false;
  private webrtcSubscriptionCount: number = 0;
  private eventHandlers = new Map<string, Function[]>();
  private streamHandlers = new Map<string, Function[]>(); // For stream-specific handlers
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private consoleSubscribed: string | null = null; // serverId for console subscription

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = io(env.WEB_APP_WEBSOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;

      if (this.serverSubscribed) {
        const serverId = this.serverSubscribed.replace("server:", "");
        this.socket?.emit("subscribe-server", serverId);
      }

      if (this.webrtcSubscribed) {
        this.socket?.emit("webrtc:subscribe");
      }

      // Re-subscribe console on reconnect
      if (this.consoleSubscribed) {
        this.socket?.emit("console:subscribe", { serverId: this.consoleSubscribed });
      }
    });

    this.socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        setTimeout(() => this.connect(), this.reconnectDelay);
      }

      // Notify console subscribers that the connection dropped
      if (this.consoleSubscribed) {
        this.emitToHandlers("console:disconnected", {
          serverId: this.consoleSubscribed,
          reason: "Panel connection lost",
        });
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("📡 WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("📡 Max reconnection attempts reached");
      }
    });

    // Handle WebRTC events
    this.socket.on("webrtc:answer", (data: WebRTCAnswer) => {
      this.emitToHandlers("webrtcAnswer", data);
    });

    this.socket.on("webrtc:ice_candidate", (data: WebRTCICECandidate) => {
      this.emitToHandlers("webrtcICECandidate", data);
    });

    this.socket.on("stream:started", (data: StreamEvent) => {
      this.emitToHandlers("streamStarted", data);
    });

    this.socket.on("stream:stopped", (data: StreamEvent) => {
      this.emitToHandlers("streamStopped", data);
    });

    // Handle detection alerts
    this.socket.on("detection:alert", (data: any) => {
      this.emitToHandlers("detection:alert", data);
    });

    // Handle Console events
    this.socket.on("console:connected", (data: any) => {
      this.emitToHandlers("console:connected", data);
    });

    this.socket.on("console:disconnected", (data: any) => {
      this.emitToHandlers("console:disconnected", data);
    });

    this.socket.on("console:output", (data: any) => {
      this.emitToHandlers("console:output", data);
    });

    this.socket.on("console:command_result", (data: any) => {
      this.emitToHandlers("console:command_result", data);
    });

    this.socket.on("error", (error) => {
      console.error("📡 WebSocket error:", error);
    });
  }

  subscribeToConsole(serverId: string) {
    this.consoleSubscribed = serverId;
    if (this.socket?.connected) {
      this.socket.emit("console:subscribe", { serverId });
    }
  }

  unsubscribeFromConsole(serverId: string) {
    if (this.consoleSubscribed === serverId) {
      this.consoleSubscribed = null;
    }
    if (this.socket?.connected) {
      this.socket.emit("console:unsubscribe", { serverId });
    }
  }

  subscribeToServer(serverId: string) {
    const subscriptionKey = `server:${serverId}`;

    if (!this.socket?.connected) {
      this.serverSubscribed = subscriptionKey;
      return;
    }

    if (this.serverSubscribed === subscriptionKey) {
      return;
    }

    this.serverSubscribed = subscriptionKey;
    this.socket.emit("subscribe-server", serverId);
  }

  unsubscribeFromServer(serverId: string) {
    const subscriptionKey = `server:${serverId}`;
    if (this.serverSubscribed !== subscriptionKey) {
      return;
    }

    this.serverSubscribed = null;
    if (this.socket?.connected) {
      this.socket.emit("unsubscribe-server", serverId);
    }
  }

  // WebRTC subscription methods with reference counting
  subscribeToWebRTC() {
    this.webrtcSubscriptionCount++;

    if (this.webrtcSubscriptionCount === 1 && !this.webrtcSubscribed) {
      this.webrtcSubscribed = true;
      if (this.socket?.connected) {
        this.socket.emit("webrtc:subscribe");
        //console.log("📡 WebRTC subscribed (first subscriber)");
      }
    }
  }

  unsubscribeFromWebRTC() {
    this.webrtcSubscriptionCount = Math.max(
      0,
      this.webrtcSubscriptionCount - 1
    );

    if (this.webrtcSubscriptionCount === 0 && this.webrtcSubscribed) {
      this.webrtcSubscribed = false;
      if (this.socket?.connected) {
        this.socket.emit("webrtc:unsubscribe");
        //console.log("📡 WebRTC unsubscribed (no more subscribers)");
      }
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Stream-specific event handling
  onStream(streamId: string, event: string, handler: Function) {
    const key = `${streamId}:${event}`;
    if (!this.streamHandlers.has(key)) {
      this.streamHandlers.set(key, []);
    }
    this.streamHandlers.get(key)!.push(handler);
  }

  offStream(streamId: string, event: string, handler: Function) {
    const key = `${streamId}:${event}`;
    const handlers = this.streamHandlers.get(key);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      // Clean up empty handler arrays
      if (handlers.length === 0) {
        this.streamHandlers.delete(key);
      }
    }
  }

  // Emit events to server
  emit(event: string, data?: any, callback?: (response: any) => void) {
    if (!this.socket?.connected) {
      console.warn("Cannot emit - socket not connected");
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  private emitToHandlers(event: string, data: any) {
    // Emit to global handlers
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }

    // Emit to stream-specific handlers if the data has a streamId
    if (data && data.streamId) {
      const streamKey = `${data.streamId}:${event}`;
      const streamHandlers = this.streamHandlers.get(streamKey);
      if (streamHandlers) {
        streamHandlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(
              `Error in stream ${data.streamId} ${event} handler:`,
              error
            );
          }
        });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.serverSubscribed = null;
    this.webrtcSubscribed = false;
    this.eventHandlers.clear();
  }

  get isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

