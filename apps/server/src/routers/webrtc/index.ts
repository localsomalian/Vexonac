import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { webrtcHandler } from "../../services/webrtc-handler";

// Add this function to generate Cloudflare TURN credentials
// Free public TURN servers used as fallback when Cloudflare is not configured.
// OpenRelay is a community TURN service with no registration required.
const OPENRELAY_ICE_SERVERS = [
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turns:openrelay.metered.ca:443",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

async function generateCloudflareCredentials() {
  const turnTokenId = process.env.CLOUDFLARE_TURN_TOKEN_ID;
  const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;

  if (!turnTokenId || !apiToken) {
    return { iceServers: OPENRELAY_ICE_SERVERS };
  }

  try {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${turnTokenId}/credentials/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ttl: 3600,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ Cloudflare TURN API error ${response.status} — falling back to OpenRelay`);
      return { iceServers: OPENRELAY_ICE_SERVERS };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("⚠️ Cloudflare TURN unavailable — falling back to OpenRelay:", error);
    return { iceServers: OPENRELAY_ICE_SERVERS };
  }
}

export const webrtcRouter = router({
  // Get active streaming sessions (optionally filtered by server)
  getSessions: protectedProcedure
    .input(
      z.object({
        serverId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const allSessions = webrtcHandler.getActiveSessions();
        
        // Filter by serverId if provided
        const sessions = input?.serverId 
          ? allSessions.filter(session => session.serverId === input.serverId)
          : allSessions;

        return {
          success: true,
          sessions,
          count: sessions.length,
        };
      } catch (error) {
        console.error("❌ Error getting sessions:", error);
        return {
          success: false,
          sessions: [],
          count: 0,
          error: error instanceof Error ? error.message : "Internal server error",
        };
      }
    }),

  // Generate TURN credentials for FiveM servers
  generateTurnCredentials: publicProcedure
    .input(
      z.object({
        serverId: z.string(),
        playerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {        
        const credentials = await generateCloudflareCredentials();
                
        return {
          success: true,
          iceServers: credentials.iceServers,
        };
      } catch (error) {
        console.error("❌ Error generating TURN credentials:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate credentials",
        };
      }
    }),

  // Send WebRTC offer to FiveM server
  sendOffer: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        playerId: z.string(),
        streamId: z.string(),
        offer: z.object({
          type: z.literal("offer"),
          sdp: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { serverId, playerId, streamId, offer } = input;

        const success = await webrtcHandler.sendOfferToFivem(
          serverId,
          playerId,
          streamId,
          offer
        );

        if (success) {
          return {
            success: true,
            message: "Offer sent to FiveM server",
          };
        } else {
          return {
            success: false,
            error: "Server not found or not connected",
          };
        }
      } catch (error) {
        console.error("❌ Error sending offer:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    }),

  // Send ICE candidate to FiveM server
  sendICECandidate: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        playerId: z.string(),
        streamId: z.string(),
        candidate: z.object({
          candidate: z.string(),
          sdpMLineIndex: z.number().nullable(),
          sdpMid: z.string().nullable(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { serverId, playerId, streamId, candidate } = input;

        const success = await webrtcHandler.sendICECandidateToFivem(
          serverId,
          playerId,
          streamId,
          candidate
        );

        if (success) {
          return {
            success: true,
            message: "ICE candidate sent to FiveM server",
          };
        } else {
          return {
            success: false,
            error: "Server not found or not connected",
          };
        }
      } catch (error) {
        console.error("❌ Error sending ICE candidate:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    }),

  // Request stream from player
  requestStream: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        playerId: z.string(),
        streamId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { serverId, playerId, streamId } = input;

        const success = await webrtcHandler.requestStreamFromPlayer(
          serverId,
          playerId,
          streamId
        );

        if (success) {
          return {
            success: true,
            message: "Stream request sent to FiveM server",
          };
        } else {
          return {
            success: false,
            error: "Failed to send stream request",
          };
        }
      } catch (error) {
        console.error("❌ Error requesting stream:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    }),
});
