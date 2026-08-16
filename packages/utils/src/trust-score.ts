import type { PrismaClient } from "@vexonac/database";

interface PlayerData {
  id: string;
  playerName: string;
  playerLicense: string;
  identifiers: any;
  oldIdentifiers: any;
  firstJoin: Date;
  lastJoin: Date;
  playTime: number;
  licenseId: string;
}

interface TrustScoreFactors {
  crossServerBans: number;
  accountAge: number;
  playTime: number;
  identifierStability: number;
  identifierAgeScore: number;
  serverHistory: number;
  recentActivity: number;
  suspiciousPatterns: number;
}

export interface TrustScoreResult {
  score: number; // 0-100 (0 = perfect trust, 100 = maximum risk)
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  warnings: string[];
}

/**
 * Convert Discord snowflake ID to creation date
 */
function discordSnowflakeToDate(snowflake: string | bigint): Date {
  const DISCORD_EPOCH = 1420070400000n; // Discord epoch: Jan 1, 2015 UTC

  // Convert to BigInt if string
  const snowflakeBigInt =
    typeof snowflake === "string" ? BigInt(snowflake) : snowflake;

  // Extract timestamp from the snowflake (42 most significant bits)
  const timestamp = (snowflakeBigInt >> 22n) + DISCORD_EPOCH;

  // Convert to JavaScript Date
  return new Date(Number(timestamp));
}

/**
 * Filter identifiers to remove sensitive or unreliable ones (IP, FID, SID)
 */
export function filterIdentifiers(identifiers: string[] | any, oldIdentifiers: string[] | any, includeSensitive: boolean = false) {
  const current = Array.isArray(identifiers) ? (identifiers as string[]) : [];
  const old = Array.isArray(oldIdentifiers) ? (oldIdentifiers as string[]) : [];

  const all = [...new Set([...current, ...old])];

  if (includeSensitive) {
    return { all, filtered: all };
  }

  const filtered = all.filter(
    (id) => !id.startsWith("ip:") && !id.startsWith("fid:") && !id.startsWith("sid2:")
  );

  return { all, filtered };
}

/**
 * Find alt accounts sharing identifiers with the player
 */
export async function findAltAccounts(
  db: PrismaClient,
  playerId: string,
  filteredIdentifiers: string[],
  limit: number = 50
) {
  if (filteredIdentifiers.length === 0) return [];

  // OPTIMIZED: Find alt accounts using more efficient JSONB operators
  // âš¡ This replaces the slow jsonb_array_elements_text with ?| operator
  return (await db.$queryRaw`
    SELECT 
      p.id, 
      p."playerName", 
      p."playerLicense", 
      p.identifiers, 
      p."oldIdentifiers", 
      p."firstJoin", 
      p."lastJoin", 
      p."playTime",
      p."licenseId",
      l.id as "license_id",
      l."serverName" as "license_serverName"
    FROM "players" p
    JOIN "licenses" l ON p."licenseId" = l.id
    WHERE p.id != ${playerId}
    AND (
      p.identifiers ?| ${filteredIdentifiers}::text[]
      OR p."oldIdentifiers" ?| ${filteredIdentifiers}::text[]
    )
    ORDER BY p."lastJoin" DESC
    LIMIT ${limit}
  `) as any[];
}

/**
 * Find direct bans for a player
 */
export async function findPlayerBans(db: PrismaClient, playerId: string) {
  return db.ban.findMany({
    where: {
      playerId: playerId,
    },
    include: {
      license: {
        select: {
          id: true,
          serverName: true,
        },
      },
      identifiers: {
        select: {
          type: true,
          value: true,
        },
      },
    },
    orderBy: {
      bannedAt: "desc",
    },
  });
}

/**
 * Find bans on alt accounts on the same server
 */
export async function findSameServerAltBans(
  db: PrismaClient,
  allIdentifiers: string[],
  serverId: string,
  playerId: string
) {
  if (allIdentifiers.length === 0) return [];

  const sameServerAltBans = await db.bannedIdentifier.findMany({
    where: {
      value: { in: allIdentifiers },
      ban: {
        licenseId: serverId,
        playerId: { not: playerId }, // Exclude the current player's direct bans
      },
    },
    include: {
      ban: {
        include: {
          license: {
            select: {
              id: true,
              serverName: true,
            },
          },
          player: {
            select: {
              id: true,
              playerName: true,
              playTime: true,
            },
          },
          identifiers: {
            select: {
              type: true,
              value: true,
            },
          },
        },
      },
    },
  });

  // Group same server alt bans by ban ID and count matching identifiers
  const sameServerAltBansMap = new Map();
  sameServerAltBans.forEach((bannedIdentifier) => {
    const banId = bannedIdentifier.ban.id;
    if (!sameServerAltBansMap.has(banId)) {
      sameServerAltBansMap.set(banId, {
        ban: bannedIdentifier.ban,
        matchingIdentifiers: [],
      });
    }
    sameServerAltBansMap.get(banId).matchingIdentifiers.push({
      type: bannedIdentifier.type,
      value: bannedIdentifier.value,
    });
  });

  return Array.from(sameServerAltBansMap.values());
}

/**
 * Find bans history for a player
 */
export async function findBansHistory(
  db: PrismaClient,
  playerIds: string[]
) {
  if (playerIds.length === 0) return [];

  const bansHistory = await db.banHistory.findMany({
    where: {
      playerId: { in: playerIds },
    },
    include: {
      license: { select: { serverName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return bansHistory;
}

/**
 * Find cross-server bans matching the identifiers
 */
export async function findCrossServerBans(
  db: PrismaClient,
  filteredIdentifiers: string[],
  serverId: string
) {
  if (filteredIdentifiers.length === 0) return [];

  const crossServerBansRaw = await db.bannedIdentifier.findMany({
    where: {
      value: { in: filteredIdentifiers },
      ban: {
        licenseId: { not: serverId },
      },
    },
    include: {
      ban: {
        include: {
          license: {
            select: {
              id: true,
              serverName: true,
            },
          },
          player: {
            select: {
              id: true,
              playerName: true,
              playTime: true,
            },
          },
          identifiers: {
            select: {
              type: true,
              value: true,
            },
          },
        },
      },
    },
  });

  // Group by ban ID and count matching identifiers
  const crossServerBansMap = new Map();
  crossServerBansRaw.forEach((bannedIdentifier) => {
    const banId = bannedIdentifier.ban.id;
    if (!crossServerBansMap.has(banId)) {
      crossServerBansMap.set(banId, {
        ban: bannedIdentifier.ban,
        matchingIdentifiers: [],
      });
    }
    crossServerBansMap.get(banId).matchingIdentifiers.push({
      type: bannedIdentifier.type,
      value: bannedIdentifier.value,
    });
  });

  return Array.from(crossServerBansMap.values());
}

/**
 * Calculate trust score for a player based on multiple factors
 * Starts at 50 (neutral) and adds/subtracts points based on risk factors
 * Final score: 0 = perfect trust, 100 = maximum risk
 */
export async function calculateTrustScore(
  db: PrismaClient,
  player: PlayerData,
  serverId: string
): Promise<TrustScoreResult> {
  const warnings: string[] = [];
  let totalScore = 50; // Start at neutral (50)

  // Get all identifiers
  const { filtered: filteredIdentifiers, all: allIdentifiers } = filterIdentifiers(
    player.identifiers,
    player.oldIdentifiers
  );

  // 1. Cross-server bans (+0 to +40 points) - MAJOR risk factor
  const crossServerBansResult = await db.bannedIdentifier.findMany({
    where: {
      value: { in: filteredIdentifiers },
      ban: {
        licenseId: { not: serverId },
      },
    },
    select: {
      banId: true,
    },
    distinct: ["banId"],
  });

  const crossServerBansCount = crossServerBansResult.length;
  let crossServerBans = 0;

  if (crossServerBansCount > 0) {
    crossServerBans = Math.min(40, crossServerBansCount * 20); // Each ban adds 20 points (up to 40)
    warnings.push(`Player has ${crossServerBansCount} ban(s) on other servers`);
  }

  // 2. Account age (-10 to +15 points) - Based on Discord account age
  const discordIdentifier = filteredIdentifiers.find((id) =>
    id.startsWith("discord:")
  );

  let accountAge = 0; // Neutral for unknown age

  let identifierAgeScore = 0;
  if (filteredIdentifiers.length > 0) {
    const identifierFirstSeen = (await db.$queryRaw`
      SELECT "firstJoin"
      FROM "players"
      WHERE (
        identifiers ?| ${filteredIdentifiers}::text[]
        OR "oldIdentifiers" ?| ${filteredIdentifiers}::text[]
      )
      ORDER BY "firstJoin" ASC
      LIMIT 1
    `) as any[];

    if (identifierFirstSeen.length > 0) {
      const daysSinceFirstSeen = Math.floor(
        (Date.now() - identifierFirstSeen[0].firstJoin.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (daysSinceFirstSeen < 1) {
        identifierAgeScore = 15; // Very new = high risk
        warnings.push("Player identifiers are very new (less than 7 days)");
      } else if (daysSinceFirstSeen < 30) {
        identifierAgeScore = 5; // Relatively new = medium risk
        warnings.push(
          "Player identifiers are relatively new (less than 30 days)"
        );
      } else {
        identifierAgeScore = -10; // Old = low risk
      }
    } else {
      identifierAgeScore = 15; // No record = high risk
      warnings.push("No previous record of these identifiers found");
    }
  }

  if (discordIdentifier) {
    try {
      const discordId = discordIdentifier.split(":")[1];
      if (discordId) {
        const discordCreationDate = discordSnowflakeToDate(discordId);
        const daysSinceDiscordCreation = Math.floor(
          (Date.now() - discordCreationDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDiscordCreation >= 30) {
          // 1+ month = somewhat new
          accountAge = 0;
        } else if (daysSinceDiscordCreation >= 7) {
          // 1+ week = new
          accountAge = 5;
        } else {
          // Less than 1 week = very new (suspicious)
          accountAge = 10;
          warnings.push("Very new Discord account (less than a week)");
        }
      }
    } catch (error) {
      // Discord parsing failed, neutral score
      accountAge = 0;
    }
  }

  // 3. Play time (-15 to +10 points) - More play time = more trust
  let playTime = 0;

  if (player.playTime >= 4320) {
    // 72+ hours = very trusted
    playTime = -15;
  } else if (player.playTime >= 2880) {
    // 48+ hours = trusted
    playTime = -10;
  } else if (player.playTime >= 1440) {
    // 24+ hours = somewhat trusted
    playTime = -5;
  } else if (player.playTime >= 720) {
    // 12+ hours = neutral to slightly trusted
    playTime = -2;
  } else if (player.playTime >= 300) {
    // 5+ hours = neutral
    playTime = 0;
  } else if (player.playTime >= 60) {
    // 1+ hour = slightly suspicious for new account
    playTime = 2;
  } else {
    // Less than 1 hour = suspicious
    playTime = 10;
    warnings.push("Very low play time (less than 1 hour)");
  }

  // 4. Identifier stability (+0 to +20 points) - Frequent changes = suspicious
  let identifierStability = Math.min(20, player.oldIdentifiers.length * 4);
  if (player.oldIdentifiers.length > 3) {
    warnings.push("Player has changed identifiers frequently");
  }

  // 5. Server history (-10 to +5 points) - More servers = more legitimate
  const serverHistoryResult = (await db.$queryRaw`
    SELECT COUNT(DISTINCT "licenseId") as count
    FROM "players"
    WHERE (
      identifiers ?| ${filteredIdentifiers}::text[]
      OR "oldIdentifiers" ?| ${filteredIdentifiers}::text[]
    )
  `) as any[];

  const serverHistoryCount = parseInt(serverHistoryResult[0]?.count || "1");
  let serverHistory = 0;

  if (serverHistoryCount >= 5) {
    serverHistory = -10; // 5+ servers = very trusted
  } else if (serverHistoryCount >= 3) {
    serverHistory = -5; // 3-4 servers = trusted
  } else if (serverHistoryCount >= 2) {
    serverHistory = -2; // 2 servers = slightly trusted
  } else {
    serverHistory = 5; // Only 1 server = slightly suspicious
    warnings.push("Player only found on this server");
  }

  // 6. Recent activity (-5 to +5 points) - Recent activity shows legitimacy
  const daysSinceLastJoin = Math.floor(
    (Date.now() - player.lastJoin.getTime()) / (1000 * 60 * 60 * 24)
  );

  let recentActivity = 0;
  if (daysSinceLastJoin <= 1) {
    recentActivity = -5; // Very recent = good sign
  } else if (daysSinceLastJoin <= 7) {
    recentActivity = -2; // Recent = good sign
  } else if (daysSinceLastJoin <= 30) {
    recentActivity = 0; // Neutral
  } else {
    recentActivity = 5; // Inactive = slightly suspicious
  }

  // 7. Suspicious patterns (+0 to +25 points) - Specific red flags
  let suspiciousPatterns = 0;

  // Pattern 1: New account + very low play time + identifier changes
  if (
    identifierAgeScore >= 10 &&
    player.playTime < 120 &&
    player.oldIdentifiers.length > 1
  ) {
    suspiciousPatterns += 20;
    warnings.push(
      "New account with low play time and identifier changes - possible ban evasion"
    );
  }

  // Pattern 2: Multiple bans + new account
  if (crossServerBansCount >= 2 && identifierAgeScore >= 5) {
    suspiciousPatterns += 15;
    warnings.push("Multiple bans with relatively new account");
  }

  // Pattern 3: Many identifier changes in short time
  if (player.oldIdentifiers.length >= 5 && player.playTime < 1440) {
    suspiciousPatterns += 10;
    warnings.push("Excessive identifier changes for play time");
  }

  // Calculate final score
  totalScore += crossServerBans;
  totalScore += accountAge;
  totalScore += playTime;
  totalScore += identifierStability;
  totalScore += identifierAgeScore;
  totalScore += serverHistory;
  totalScore += recentActivity;
  totalScore += suspiciousPatterns;

  // Ensure score stays within 0-100 range
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  if (totalScore <= 25) {
    riskLevel = "LOW"; // Very trusted
  } else if (totalScore <= 45) {
    riskLevel = "MEDIUM"; // Somewhat trusted/neutral
  } else if (totalScore <= 70) {
    riskLevel = "HIGH"; // Risky
  } else {
    riskLevel = "CRITICAL"; // Very risky
    warnings.push("Player represents a critical risk, please review carefully");
  }

  // Force critical risk for extreme cases
  if (crossServerBansCount >= 3) {
    riskLevel = "CRITICAL";
    totalScore = Math.max(totalScore, 85);
    warnings.push("Multiple cross-server bans detected");
  }

  return {
    score: Math.round(totalScore),
    riskLevel,
    warnings,
  };
}

/**
 * Perform a full analysis of a player, including alts, bans, and trust score
 */
export async function performPlayerAnalysis(
  db: PrismaClient,
  player: PlayerData,
  contextServerId: string = "00000000-0000-0000-0000-000000000000",
  options: {
    showIpIdentifiers?: boolean;
    showIdentifiers?: boolean;
  }
) {
  const { showIpIdentifiers = false, showIdentifiers = true } = options;

  // Get identifier lists
  const { filtered: filteredIdentifiers, all: allIdentifiers } =
    filterIdentifiers(player.identifiers, player.oldIdentifiers);

  // Find alt accounts
  const altAccounts = await findAltAccounts(
    db,
    player.id,
    filteredIdentifiers
  );

  // Format alt accounts
  const formattedAltAccounts = altAccounts
    .map((alt: any) => {
      const { all: altAllIdentifiers } = filterIdentifiers(
        alt.identifiers,
        alt.oldIdentifiers,
        true // include sensitive to get full list for matching
      );

      // Find matching identifiers
      const matchingIdentifiers = altAllIdentifiers.filter((id: string) =>
        filteredIdentifiers.some((originalId: string) => id === originalId)
      );

      // For privacy, only show identifiers if they're from the same server
      const showFullIdentifiers = alt.licenseId === contextServerId;

      return {
        playerName: alt.playerName,
        playerLicense: (showIdentifiers || showFullIdentifiers)
          ? alt.playerLicense
          : "***HIDDEN***",
        firstJoin: alt.firstJoin,
        lastJoin: alt.lastJoin,
        playTime: alt.playTime,
        server: {
          name: alt.license_serverName,
          isCurrentServer: alt.licenseId === contextServerId,
        },
        matchingIdentifiers: (showIdentifiers || showFullIdentifiers) ? matchingIdentifiers
          : matchingIdentifiers.map(() => "***HIDDEN***"),
        identifiersCount: matchingIdentifiers.length,
      };
    })
    .sort((a: any, b: any) => {
      // Sort by current server first, then by last join date
      if (a.server.isCurrentServer && !b.server.isCurrentServer) return -1;
      if (!a.server.isCurrentServer && b.server.isCurrentServer) return 1;
      // If both are from same server type, sort by last join date (most recent first)
      return (
        new Date(b.lastJoin).getTime() - new Date(a.lastJoin).getTime()
      );
    });

  // Get bans for this player across all servers
  const playerBans = await findPlayerBans(db, player.id);

  // Get bans for alt accounts on the same server (using identifiers)
  const sameServerAltBansArray = await findSameServerAltBans(
    db,
    allIdentifiers,
    contextServerId,
    player.id
  );

  // Get cross-server bans using identifiers
  const crossServerBans = await findCrossServerBans(
    db,
    filteredIdentifiers,
    contextServerId
  );

  // Collect all player IDs (main + alts)
  // We cast alt.id to string to be safe, though it should be string from DB
  const relatedPlayerIds = [player.id, ...altAccounts.map((alt: any) => alt.id)];

  // Get bans history
  const bansHistory = await findBansHistory(db, relatedPlayerIds);

  // Format bans
  const formattedPlayerBans = playerBans.map((ban) => ({
    id: ban.id,
    banId: ban.banId,
    reason: ban.reason,
    details: ban.details,
    evidenceUrl: ban.evidenceUrl,
    bannedAt: ban.bannedAt,
    expiresAt: ban.expiresAt,
    bannedBy: ban.bannedBy,
    server: {
      id: ban.license.id,
      name: ban.license.serverName,
      isCurrentServer: ban.licenseId === contextServerId,
    },
    identifiers: showIdentifiers ? ban.identifiers : [],
    isDirectBan: true,
  }));

  // Format same server alt account bans
  const formattedSameServerAltBans = sameServerAltBansArray.map(
    (banData: any) => ({
      id: banData.ban.id,
      banId: banData.ban.banId,
      reason: banData.ban.reason,
      details: banData.ban.details,
      evidenceUrl: banData.ban.evidenceUrl,
      bannedAt: banData.ban.bannedAt,
      expiresAt: banData.ban.expiresAt,
      bannedBy: banData.ban.bannedBy,
      server: {
        id: banData.ban.license.id,
        name: banData.ban.license.serverName,
        isCurrentServer: true,
      },
      matchingIdentifiers: showIdentifiers ? banData.matchingIdentifiers : [],
      matchingIdentifiersCount: banData.matchingIdentifiers.length,
      player: banData.ban.player,
      isDirectBan: false,
      isAltAccountBan: true,
    })
  );

  const formattedCrossServerBans = crossServerBans.map((banData: any) => ({
    id: banData.ban.id,
    banId: banData.ban.banId,
    reason: banData.ban.reason,
    details: banData.ban.details,
    evidenceUrl: banData.ban.evidenceUrl,
    bannedAt: banData.ban.bannedAt,
    expiresAt: banData.ban.expiresAt,
    bannedBy: banData.ban.bannedBy,
    server: {
      id: banData.ban.license.id,
      name: banData.ban.license.serverName,
      isCurrentServer: false,
    },
    matchingIdentifiers: showIdentifiers ? banData.matchingIdentifiers : [],
    matchingIdentifiersCount: banData.matchingIdentifiers.length,
    player: banData.ban.player,
  }));

  // Calculate trust score
  const threatScore = await calculateTrustScore(
    db,
    player,
    contextServerId
  );

  const currentIdentifiers = Array.isArray(player.identifiers)
    ? (player.identifiers as string[])
    : [];
  const oldIdentifiers = Array.isArray(player.oldIdentifiers)
    ? (player.oldIdentifiers as string[])
    : [];

  return {
    player: {
      playerName: player.playerName,
      playerLicense: player.playerLicense,
      identifiers: showIdentifiers
        ? (showIpIdentifiers
          ? currentIdentifiers
          : currentIdentifiers.filter((id) => !id.startsWith("ip:")))
        : [],
      oldIdentifiers: showIdentifiers
        ? (showIpIdentifiers
          ? oldIdentifiers
          : oldIdentifiers.filter((id) => !id.startsWith("ip:")))
        : [],
      firstJoin: player.firstJoin,
      lastJoin: player.lastJoin,
      playTime: player.playTime,
    },
    altAccounts: formattedAltAccounts,
    ...(contextServerId !== "00000000-0000-0000-0000-000000000000" ? { playerBans: formattedPlayerBans } : {}),
    ...(contextServerId !== "00000000-0000-0000-0000-000000000000" ? { sameServerAltBans: formattedSameServerAltBans } : {}),
    crossServerBans: formattedCrossServerBans,
    bansHistory: bansHistory.map((h) => ({
      server: h.license.serverName,
      reason: h.reason,
      details: h.details,
      evidenceUrl: h.evidenceUrl,
      bannedAt: h.createdAt,
    })),
    threatScore,
  };
}

