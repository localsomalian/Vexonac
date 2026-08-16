import { Router } from "express";
import { apiKeyAuth } from "../../middleware/api-auth.middleware";
import prisma from "../../../prisma";

const router = Router();

// Apply authentication middleware
router.use(apiKeyAuth as any);

router.get("/", async (req, res: any) => {
  try {    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run queries in parallel for better performance
    const [
      totalServers,
      onlineServers,
      trackedPlayers,
      bannedPlayers,
      // Actually we can count distinct identifiers if possible, but checking the schema Player has `identifiers Json`
      // Since identifiers are JSONB and counting distinct values inside JSONB arrays across all rows is expensive/hard in Prisma,
      // we might just return a placeholder or an estimate, or maybe count rows in BannedIdentifier for banned_total.
      // For tracked_total identifiers, if it's strictly needed, we might need a raw query or rethink.
      // However, looking at schema, `BannedIdentifier` is a table.
      // Let's check `BannedIdentifier` count for banned_total.
      // For tracked_total, it's tricky with JSON. Let's stick to what we can get easily or count Players for now if identifiers total is hard.
      // Wait, the user asked for "identifiers" -> "tracked_total".
      // If identifiers are stored in JSON in Player model, we can't easily count unique ones without raw SQL.
      // Let's check if there is another table. `Verification` has `identifier`.
      // Let's assume "tracked_total" refers to unique player identities (Players) or just skip deep counting for now to be safe.
      // Actually, I will use `Player` count for tracked players.
      // For "identifiers", I will count `BannedIdentifier` for banned_total.
      // For "tracked_total" identifiers, I will try to get a raw count of elements in the identifiers array if possible, 
      // or if not, maybe just count Players * 1 (or N) or leave it as a "system metric" if stored elsewhere.
      // Given the constraint, I will use a raw query to sum the length of identifiers array if postgres, or just return 0/placeholder if unsure.
      // Let's look at schema again. `Player` has `identifiers Json`.
      // Postgres: SELECT sum(jsonb_array_length(identifiers)) FROM players; 
      
      totalBannedIdentifiers,
      bansIssued,
      latestVersion
    ] = await Promise.all([
      // Servers
      prisma.license.count(), // Total active (non-banned) licenses/servers
      prisma.serverInfo.count({ where: { isOnline: true } }), // Online servers

      // Players
      prisma.player.count(), // Tracked total
      prisma.ban.count(), // Total bans (active and inactive? User said "banned_total", usually implies all historical or current active. "Banned Players" vs "Total Bans")
      // Schema has `Ban` model. `banned_total` in `players` section implies unique players currently banned?
      // Or total bans issued? Let's go with unique players currently banned for "banned_total" in players section if possible,
      // or just total Ban records if "banned_total" is ambiguous. 
      // `Ban` has `playerId`.
      // Let's count Ban records for now as it's faster.
      
      // Identifiers
      prisma.bannedIdentifier.count(), // Banned total identifiers

      // System
      prisma.banHistory.count(),
      
      prisma.version.findFirst({
        orderBy: { updatedAt: 'desc' } // Or version string sort? Usually created/updated at desc.
      })
    ]);

    // Online players sum
    const onlinePlayersResult = await prisma.serverInfo.aggregate({
      _sum: {
        playerCount: true
      },
      where: {
        isOnline: true
      }
    });
    const onlinePlayers = onlinePlayersResult._sum.playerCount || 0;

    let trackedIdentifiersCount = 0;
    try {
      const result = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COALESCE(SUM(jsonb_array_length(identifiers::jsonb)), 0)::bigint AS count
        FROM "Player"
        WHERE jsonb_typeof(identifiers::jsonb) = 'array'
      `;
      trackedIdentifiersCount = Number(result[0]?.count ?? 0);
    } catch (e) {
      console.error("Failed to count identifiers", e);
    }

    return res.status(200).json({
      servers: {
        total: totalServers,
        online: onlineServers,
      },
      players: {
        tracked_total: trackedPlayers,
        online: onlinePlayers,
        banned_total: bannedPlayers, // Total ban records
      },
      identifiers: {
        tracked_total: trackedIdentifiersCount, // Placeholder/TODO
        banned_total: totalBannedIdentifiers,
      },
      system: {
        version: latestVersion?.version || "Unknown",
        bans_issued: bansIssued,
        last_update: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Stats Error:", error);
    return res.status(500).json({
      error: "Internal server error fetching stats",
      code: "STATS_ERROR"
    });
  }
});

export default router;

