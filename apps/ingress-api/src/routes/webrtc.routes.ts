import { Request, Response, Router } from "express";
import { Server } from "socket.io";

interface WebRTCRouterOptions {
  io: Server;
}

interface ActiveStream {
  streamId: string;
  playerId: string;
  playerName: string;
  serverName: string;
  startTime: number;
  fivemServerUrl: string | undefined;
}

// Store active streaming sessions
const activeStreams = new Map<string, ActiveStream>();

export function createWebRTCRouter({ io }: WebRTCRouterOptions): Router {
  const router = Router();

  // Handle WebRTC offers from web app
  router.post("/offer", async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId, offer, streamId } = req.body;

      if (!playerId || !offer) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: playerId, offer",
        });
        return;
      }

      const finalStreamId = streamId || `stream_${playerId}_${Date.now()}`;

      console.log(
        "📡 [WebRTC] Forwarding offer to FiveM server for player:",
        playerId
      );

      // Find the active stream to get the FiveM server URL
      const activeStream = Array.from(activeStreams.values()).find(
        (stream) => stream.playerId === playerId
      );

      if (!activeStream || !activeStream.fivemServerUrl) {
        res.status(404).json({
          success: false,
          error: "Player not found or not streaming",
        });
        return;
      }

      // Forward the offer to the FiveM server
      const fivemResponse = await fetch(
        `${activeStream.fivemServerUrl}/webrtc/offer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId,
            offer,
            streamId: finalStreamId,
          }),
        }
      );

      if (!fivemResponse.ok) {
        throw new Error(
          `FiveM server responded with status: ${fivemResponse.status}`
        );
      }

      const result = await fivemResponse.json();

      // Notify web app via socket.io
      io.to(`player_${playerId}`).emit("webrtc:offer_sent", {
        streamId: finalStreamId,
        success: true,
      });

      res.json({
        success: true,
        streamId: finalStreamId,
        message: "Offer forwarded to FiveM server",
      });
    } catch (error) {
      console.error("❌ [WebRTC] Error handling offer:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // Handle WebRTC answers from FiveM servers
  router.post("/answer", async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId, answer, streamId } = req.body;

      if (!playerId || !answer || !streamId) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: playerId, answer, streamId",
        });
        return;
      }

      console.log(
        "📡 [WebRTC] Received answer from FiveM server for player:",
        playerId
      );

      // Forward the answer to the web app via socket.io
      io.to(`stream_${streamId}`).emit("webrtc:answer", {
        playerId,
        answer,
        streamId,
      });

      res.json({
        success: true,
        message: "Answer forwarded to web app",
      });
    } catch (error) {
      console.error("❌ [WebRTC] Error handling answer:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // Handle ICE candidates from FiveM servers
  router.post(
    "/ice-candidate",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { playerId, streamId, candidate, source } = req.body;

        if (!playerId || !candidate) {
          res.status(400).json({
            success: false,
            error: "Missing required fields: playerId, candidate",
          });
          return;
        }

        console.log(
          "🧊 [WebRTC] ICE candidate from",
          source || "unknown",
          "for player:",
          playerId
        );

        // Forward ICE candidate to web app via socket.io
        io.to(`stream_${streamId}`).emit("webrtc:ice_candidate", {
          playerId,
          candidate,
          streamId,
          source,
        });

        res.json({
          success: true,
          message: "ICE candidate forwarded",
        });
      } catch (error) {
        console.error("❌ [WebRTC] Error handling ICE candidate:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Handle ICE candidates from web app to FiveM servers
  router.post(
    "/ice-candidate-remote",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { playerId, streamId, candidate } = req.body;

        if (!playerId || !candidate) {
          res.status(400).json({
            success: false,
            error: "Missing required fields: playerId, candidate",
          });
          return;
        }

        console.log(
          "🧊 [WebRTC] Forwarding remote ICE candidate to FiveM server for player:",
          playerId
        );

        // Find the active stream to get the FiveM server URL
        const activeStream = Array.from(activeStreams.values()).find(
          (stream) => stream.playerId === playerId
        );

        if (!activeStream || !activeStream.fivemServerUrl) {
          res.status(404).json({
            success: false,
            error: "Player not found or not streaming",
          });
          return;
        }

        // Forward the ICE candidate to the FiveM server
        const fivemResponse = await fetch(
          `${activeStream.fivemServerUrl}/webrtc/ice-candidate-remote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerId,
              candidate,
              streamId,
            }),
          }
        );

        if (!fivemResponse.ok) {
          throw new Error(
            `FiveM server responded with status: ${fivemResponse.status}`
          );
        }

        res.json({
          success: true,
          message: "ICE candidate forwarded to FiveM server",
        });
      } catch (error) {
        console.error(
          "❌ [WebRTC] Error handling remote ICE candidate:",
          error
        );
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Handle stream started notifications from FiveM servers
  router.post(
    "/stream-started",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { playerId, streamId, playerName, serverName, startTime } =
          req.body;
        const fivemServerUrl =
          req.get("X-FiveM-Server-URL") || req.get("Origin");

        if (!playerId || !streamId) {
          res.status(400).json({
            success: false,
            error: "Missing required fields: playerId, streamId",
          });
          return;
        }

        console.log(
          "🎥 [WebRTC] Stream started:",
          streamId,
          "for player:",
          playerId
        );

        // Store the active stream
        activeStreams.set(streamId, {
          streamId,
          playerId,
          playerName: playerName || `Player ${playerId}`,
          serverName: serverName || "Unknown Server",
          startTime: startTime || Date.now(),
          fivemServerUrl,
        });

        // Notify web app via socket.io
        io.emit("stream:started", {
          streamId,
          playerId,
          playerName,
          serverName,
          startTime,
        });

        res.json({
          success: true,
          message: "Stream started notification received",
        });
      } catch (error) {
        console.error("❌ [WebRTC] Error handling stream started:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Handle stream stopped notifications from FiveM servers
  router.post(
    "/stream-stopped",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { playerId, playerName, reason } = req.body;

        if (!playerId) {
          res.status(400).json({
            success: false,
            error: "Missing required field: playerId",
          });
          return;
        }

        console.log(
          "🛑 [WebRTC] Stream stopped for player:",
          playerId,
          reason ? `(${reason})` : ""
        );

        // Find and remove the active stream
        const streamToRemove = Array.from(activeStreams.entries()).find(
          ([, stream]) => stream.playerId === playerId
        );

        if (streamToRemove) {
          const [streamId] = streamToRemove;
          activeStreams.delete(streamId);

          // Notify web app via socket.io
          io.emit("stream:stopped", {
            streamId,
            playerId,
            playerName,
            reason,
          });
        }

        res.json({
          success: true,
          message: "Stream stopped notification received",
        });
      } catch (error) {
        console.error("❌ [WebRTC] Error handling stream stopped:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  // Get active streaming sessions
  router.get("/sessions", (req: Request, res: Response): void => {
    try {
      const sessions = Array.from(activeStreams.values()).map((stream) => ({
        ...stream,
        duration: Date.now() - stream.startTime,
      }));

      res.json({
        success: true,
        sessions,
        count: sessions.length,
      });
    } catch (error) {
      console.error("❌ [WebRTC] Error getting sessions:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // Start streaming request from web app to FiveM server
  router.post(
    "/start-stream",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { playerId, streamId } = req.body;

        if (!playerId) {
          res.status(400).json({
            success: false,
            error: "Missing required field: playerId",
          });
          return;
        }

        console.log("🚀 [WebRTC] Start stream request for player:", playerId);

        // For now, we'll broadcast this request - in a real implementation,
        // you'd need to know which FiveM server the player is on
        io.emit("stream:start_request", {
          playerId,
          streamId: streamId || `stream_${playerId}_${Date.now()}`,
        });

        res.json({
          success: true,
          message: "Start stream request sent",
        });
      } catch (error) {
        console.error(
          "❌ [WebRTC] Error handling start stream request:",
          error
        );
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );

  return router;
}
