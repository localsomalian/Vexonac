import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
export declare class WebSocketService {
    private static instance;
    private io;
    private consoleBuffer;
    private flushInterval;
    private constructor();
    static getInstance(): WebSocketService;
    initialize(httpServer: HttpServer): void;
    private setupSocketEvents;
    emitToServer(serverId: string, event: string, data: any, shouldAwait?: boolean, timeoutMs?: number): Promise<any> | void;
    /**
     * Send WebRTC events to a specific FiveM server
     */
    emitWebRTCToServer(serverId: string, event: string, data: any): void;
    getConnectedServersCount(): number;
    isServerConnected(serverId: string): boolean;
    getConnectedServerIds(): string[];
    getIO(): SocketIOServer | null;
    /**
     * Start console flush timer for optimized batching
     */
    private startConsoleFlushTimer;
    /**
     * Flush console buffers to subscribers
     */
    private flushConsoleBuffers;
    shutdown(): void;
}
export declare const websocketService: WebSocketService;
//# sourceMappingURL=websocket.service.d.ts.map