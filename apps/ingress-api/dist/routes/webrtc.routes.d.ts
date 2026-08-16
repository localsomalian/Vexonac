import { Router } from "express";
import { Server } from "socket.io";
interface WebRTCRouterOptions {
    io: Server;
}
export declare function createWebRTCRouter({ io }: WebRTCRouterOptions): Router;
export {};
//# sourceMappingURL=webrtc.routes.d.ts.map