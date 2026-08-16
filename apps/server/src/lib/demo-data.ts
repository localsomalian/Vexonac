import { type PlayerData, PlayerStatus } from "@vexonac/types";
import { Permission } from "@vexonac/database";
import { addDays, subDays, subHours, subMinutes, format } from "date-fns";
import { z } from "zod";
import defaultConfig from "@vexonac/config";

// Demo server ID constant
export const DEMO_SERVER_ID = "demo";

// Mock user data
const DEMO_USER_ID = "demo-user-123456789";

// Static mock player data - always returns the same 256 players
const STATIC_DEMO_PLAYERS: PlayerData[] = Array.from({ length: 256 }, (_, i) => {
  const names = [
    "xXDarkLord123Xx", "GamerGirl2024", "NoobSlayer69", "ProHacker_420", "SilentAssassin",
    "RedBullAddict", "MommasBoy", "TwitchStreamer", "YTInfluencer", "DiscordMod",
    "MinecraftSteve", "Fortnite_Kid", "CallOfDutyPro", "ApexLegend", "ValorantAce",
    "CSGOGlobal", "RocketLeague", "OverwatchHero", "LeagueChamp", "DotaKing",
    "HearthstoneMage", "WoWPaladin", "FFXIVBard", "GuildWars2", "DestinyGuardian",
    "HaloSpartan", "GearOfWarCog", "MassEffectN7", "Witcher3Geralt", "CyberPunk2077",
    "GrandTheftAuto", "RedDeadCowboy", "AssassinsCreed", "WatchDogsHacker", "FarCryHunter",
    "Battlefield", "PUBG_Winner", "WarzoneDrop", "FallGuysBean", "AmongUsCrewmate",
    "PhasmophobiaGhost", "DeadByDaylight", "RustSurvivor", "MinecraftBuilder", "TerrariaDigger",
    "StardewFarmer", "AnimalCrossing", "PokemonMaster", "ZeldaHero", "MarioPlumber",
    "SonicSpeed", "CrashBandicoot", "SpyroTheDragon", "RatchetClank", "SlyCooper"
  ];

  const nameIndex = i % names.length;
  const nameVariant = Math.floor(i / names.length);
  const name = names[nameIndex] + (nameVariant > 0 ? `_${nameVariant}` : "");
  
  // Use deterministic "random" based on index for consistent data
  const seed = i + 1;
  const playTime = Math.floor(Math.random() * 1000) + 1;
  const ping = Math.floor(Math.random() * 150) + 1;
  // Better coordinate distribution around the map
  const coords = {
    x: Math.floor(Math.random() * 10000) - 4000, // -5000 to 5000 with variation
    y: Math.floor(Math.random() * 10000) - 4000, // -5000 to 5000 with variation
  };
  
  const statuses = [PlayerStatus.ON_FOOT, PlayerStatus.IN_VEHICLE, PlayerStatus.SWIMMING, PlayerStatus.ARMED, PlayerStatus.DEAD];
  const status = statuses[seed % statuses.length];
  
  return {
    id: i + 1,
    license: `license:demo${i.toString().padStart(3, '0')}abcdef`,
    name,
    ping,
    health: ((seed * 11) % 100) + 1,
    admin: seed % 20 === 0, // Every 20th player is admin
    timeOnline: Math.floor(Math.random() * 100) + 1,
    playTime,
    threatScore: (seed * 31) % 100,
    status,
    coords,
  };
});

// Generate mock player data - now returns static data
const generateMockPlayers = (count: number = 256): PlayerData[] => {
  return STATIC_DEMO_PLAYERS.slice(0, count);
};

// Static mock ban data
const STATIC_DEMO_BANS = (() => {
  const reasons = [
    "Overlay Detected", "VexonAC Stop Detected", "Illegal Native Execution", "AimBot Detected", "Silent Aim Detected",
    "Invincibility Detected", "Illegal Explosion Spawn", "Illegal Ped Spawn", "Illegal Weapon Spawn", "Illegal Vehicle Spawn", "Illegal Object Spawn",
    "Illegal Server Event Triggered", "Illegal Client Event Triggered", "Spoofer Detected", "Spoofed Bullets Detected"
  ];

  const evidences = [
    undefined,
    "https://r2.vexonac.com/videos/1752783546242-641b8960-0c74-4f06-935e-6c4b59a507c9.webm",
    "https://r2.vexonac.com/videos/1752781729160-58757eda-9cf0-4c89-8971-8ecc7a5b06a7.webm",
    "https://r2.vexonac.com/videos/1752772935407-212a4a65-6069-4b28-83cf-2baa51dc6009.webm",
    "https://r2.vexonac.com/videos/1752769195013-fe5333a1-e114-4108-a5a6-2b01630f3b7b.webm",
    "https://r2.vexonac.com/videos/1752767481425-60154001-75ca-4a6a-93b3-bb69c5366ad8.webm",
    "https://r2.vexonac.com/videos/1752765102866-f29ca74b-2286-4a20-adfc-d276836c372e.webm",
    "https://r2.vexonac.com/videos/1752866521099-0f43c8ad-50b8-4029-8e04-64cb7ebc35e7.webm",
    "https://r2.vexonac.com/videos/1752865209811-1a676347-f79f-49b9-b278-ff6ed5d84ac7.webm",
  ];

  const playerNames = [
    "CheatMaster2024", "ToxicPlayer123", "HackerBot", "ExploiterKid", "RuleBreaker",
    "BadRoleplay", "CombatLogger", "SpammerGuy", "AltAccount1", "BanEvader"
  ];

  return Array.from({ length: 15 }, (_, i) => {
    const isActive = true; // All bans are active (expired ones are auto-deleted)
    const seed = i + 1;
    const bannedAt = subDays(new Date(), (seed * 2) % 15); // More recent bans
    const expiresAt = addDays(bannedAt, (seed * 3) % 30 + 7); // All have future expiry dates
    const playerName = playerNames[i % playerNames.length] + (i >= playerNames.length ? `_${Math.floor(i / playerNames.length)}` : "");
    const license = `license:ban${i.toString().padStart(3, '0')}xyz`;
    const steam = `steam:ban${i.toString().padStart(3, '0')}abc`;
    const discord = i % 2 === 0 ? `discord:${123456789000000000 + i}` : null;
    
    return {
      id: `ban_${i + 1}`,
      banId: Math.floor(Math.random() * 1000000),
      licenseId: DEMO_SERVER_ID,
      playerId: `player_${i + 1}`,
      reason: reasons[seed % reasons.length],
      details: null,
      evidenceUrl: evidences[seed % evidences.length],
      bannedBy: undefined,
      bannedAt,
      expiresAt: Math.random() > 0.5 ? expiresAt : null,
      isActive,
      updatedAt: bannedAt,
      player: {
        id: `player_${i + 1}`,
        playerName,
        playerLicense: license,
        identifiers: [steam, license, discord].filter(Boolean),
        oldIdentifiers: [],
        firstJoin: subDays(new Date(), (seed * 7) % 365),
        lastJoin: subDays(new Date(), (seed * 2) % 7),
        playTime: (seed * 13) % 5000 + 100,
      },
      identifiers: [
        {
          id: `ident_${i * 3 + 1}`,
          type: "steam" as const,
          value: steam,
        },
        {
          id: `ident_${i * 3 + 2}`,
          type: "license" as const,
          value: license,
        },
        ...(discord ? [{
          id: `ident_${i * 3 + 3}`,
          type: "discord" as const,
          value: discord,
        }] : []),
      ],
    };
  });
})();

// Generate mock ban data - now returns static data
const generateMockBans = () => {
  return STATIC_DEMO_BANS;
};

// Static analytics data - generate once when the module loads to avoid changing timestamps
const generateStaticAnalyticsData = () => {
  const now = new Date();
  return {
    today: Array.from({ length: 24 }, (_, i) => {
      const players = Math.floor(((i + 1) * 17) % 100) + 150; // 200-250 range, peaks at 256
      const bans = Math.floor(((i + 1) * 3) % 15) + 10; // 2-16 range, much lower than players
      return {
        time: `${i.toString().padStart(2, '0')}:00`,
        players,
        bans,
        detections: Math.floor(((i + 1) * 7) % 8),
        date: subHours(now, 23 - i).toISOString(),
      };
    }),
    week: Array.from({ length: 7 }, (_, i) => {
      const players = Math.floor(((i + 1) * 23) % 30) + 226; // 226-256 range
      const bans = Math.floor(((i + 1) * 5) % 18) + 3; // 3-20 range, lower than players
      return {
        time: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        players,
        bans,
        detections: Math.floor(((i + 1) * 11) % 20) + 8,
        date: subDays(now, 6 - i).toISOString(),
      };
    }),
    month: Array.from({ length: 4 }, (_, i) => {
      const players = Math.floor(((i + 1) * 31) % 20) + 236; // 236-256 range
      const bans = Math.floor(((i + 1) * 7) % 16) + 5; // 5-20 range, lower than players
      return {
        time: `Week ${i + 1}`,
        players,
        bans,
        detections: Math.floor(((i + 1) * 13) % 40) + 30,
        date: subDays(now, (3 - i) * 7).toISOString(),
      };
    }),
  };
};

const STATIC_ANALYTICS_DATA = generateStaticAnalyticsData();

// Generate analytics data - now returns static data
const generateAnalyticsData = (timeRange: "today" | "week" | "month") => {
  return STATIC_ANALYTICS_DATA[timeRange];
};

// Demo data exports
export const getDemoServerData = () => ({
  id: DEMO_SERVER_ID,
  serverName: "Demo Server",
  displayName: "Demo Server",
  bannerUrl: null,
  expiresAt: addDays(new Date(), 30),
  serverIp: "8.8.8.8",
  licenseKey: "demo-xxxxxxxx-xxxx-xxxx",
  discordId: DEMO_USER_ID,
  isOwner: true,
  isMember: false,
  isBanned: false,
  permissions: [],
  serverInfo: {
    version: "4.5.0",
    isOnline: true,
    playerCount: 256,
    banCount: 15,
    maxSlots: 300,
  },
  _count: {
    bans: 15,
  },
  members: [],
});

export const getDemoPlayers = (page: number = 1, limit: number = 20, search?: string) => {
  let players = generateMockPlayers();
  
  if (search) {
    players = players.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toString().includes(search)
    );
  }
  
  const totalCount = players.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const paginatedPlayers = players.slice(offset, offset + limit);
  
  return {
    players: paginatedPlayers,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const getDemoBans = (page: number = 1, limit: number = 20, search?: string, sortBy: string = "bannedAt", sortOrder: "asc" | "desc" = "desc") => {
  let bans = generateMockBans();
  
  if (search) {
    bans = bans.filter(ban => 
      ban.player.playerName.toLowerCase().includes(search.toLowerCase()) ||
      ban.reason.toLowerCase().includes(search.toLowerCase()) ||
      ban.banId.toString().toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Sort bans
  bans.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "bannedAt":
        comparison = new Date(a.bannedAt).getTime() - new Date(b.bannedAt).getTime();
        break;
      case "expiresAt":
        const aExpires = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        const bExpires = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        comparison = aExpires - bExpires;
        break;
      case "playTime":
        comparison = a.player.playTime - b.player.playTime;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === "desc" ? -comparison : comparison;
  });
  
  const totalCount = bans.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const paginatedBans = bans.slice(offset, offset + limit);
  
  return {
    bans: paginatedBans,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const getDemoAnalytics = (timeRange: "today" | "week" | "month") => {
  const chartData = generateAnalyticsData(timeRange);
  const playerCounts = chartData.map(d => d.players);
  
  return {
    chartData,
    peakPlayers: Math.max(...playerCounts),
    avgPlayers: Math.round(playerCounts.reduce((sum, count) => sum + count, 0) / playerCounts.length),
  };
};

export const getDemoPlayerLookupDetails = (identifier: string) => {
  const players = generateMockPlayers();
  const foundPlayer = players.find(p => 
    p.name.toLowerCase().includes(identifier.toLowerCase()) ||
    p.license === identifier ||
    p.id.toString() === identifier
  ) || players[0];

  const seed = foundPlayer.id;
  
  // Create player object matching the real API structure
  const player = {
    id: foundPlayer.id.toString(),
    playerName: foundPlayer.name,
    playerLicense: foundPlayer.license,
    identifiers: [
      foundPlayer.license,
      `steam:demo${seed.toString().padStart(3, '0')}abc`,
      ...(seed % 2 === 0 ? [`discord:${123456789000000000 + seed}`] : []),
      ...(seed % 3 === 0 ? [`xbox:demo${seed.toString().padStart(3, '0')}xyz`] : []),
      ...(seed % 4 === 0 ? [`live:demo${seed.toString().padStart(3, '0')}live`] : []),
      `fivem:${100000000 + seed}`,
    ],
    oldIdentifiers: [], // Demo data - no old identifiers
    firstJoin: subDays(new Date(), (seed * 7) % 365),
    lastJoin: subMinutes(new Date(), (seed * 11) % 1440),
    playTime: (seed * 13) % 100000 + 5000,
  };

  // Create demo ban data
  const playerBans = seed % 10 === 0 ? [{
    id: `ban_${seed}`,
    reason: "Demo violation",
    evidenceUrl: "https://example.com/demo-evidence.jpg",
    bannedAt: subDays(new Date(), seed % 30),
    bannedBy: "Demo Admin",
    isActive: false,
    expiresAt: subDays(new Date(), (seed % 30) - 10),
    player: {
      playerName: foundPlayer.name,
      playerLicense: foundPlayer.license,
    },
  }] : [];

  // Generate demo alt accounts
  const altAccounts = seed % 5 === 0 ? [{
    id: `alt_${seed}`,
    playerName: `${foundPlayer.name}_Alt`,
    playerLicense: `license:demo_alt_${seed}`,
    identifiers: [`license:demo_alt_${seed}`],
    firstJoin: subDays(new Date(), (seed * 5) % 200),
    lastJoin: subDays(new Date(), (seed * 3) % 100),
    playTime: (seed * 7) % 50000,
  }] : [];

  return {
    player,
    altAccounts,
    playerBans,
    bansHistory: [], // Add bansHistory
    sameServerAltBans: [],
    crossServerBans: [],
    threatScore: {
      score: (seed * 11) % 100,
      riskLevel: (seed * 11) % 100 > 80 ? "HIGH" : (seed * 11) % 100 > 60 ? "MEDIUM" : "LOW",
      warnings: seed % 3 === 0 ? [
        "Multiple identifiers detected",
        "Recent account activity"
      ] : [],
    },
    server: {
      id: DEMO_SERVER_ID,
      name: "VexonAC Demo Server",
    },
  };
};

export const getDemoConfig = () => {
  return defaultConfig;
};

export const getDemoServerMembers = () => [
  {
    id: "member_1",
    discordId: DEMO_USER_ID,
    permissions: [Permission.MANAGE_BANS, Permission.CONFIGURATION, Permission.PLAYERS_LOOKUP, Permission.MANAGE_ADMINS],
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 30).toISOString(),
    user: {
      discordId: DEMO_USER_ID,
      name: "Demo Admin",
      username: "demoadmin",
      image: null as string | null,
    },
  },
  {
    id: "member_2", 
    discordId: "demo-moderator-123456789",
    permissions: [Permission.MANAGE_BANS, Permission.PLAYERS_LOOKUP],
    createdAt: subDays(new Date(), 15).toISOString(),
    updatedAt: subDays(new Date(), 15).toISOString(),
    user: {
      discordId: "demo-moderator-123456789",
      name: "Demo Moderator",
      username: "demomoderator",
      image: null as string | null,
    },
  },
];

// Demo logs data
export const getDemoLogs = (page: number = 1, limit: number = 20, search?: string, systemTypes?: string[], serverTypes?: string[], dateFrom?: string, dateTo?: string) => {
  // Generate static demo logs with better variety
  const allLogs = Array.from({ length: 500 }, (_, i) => {
    const seed = i + 1;
    const logTypes = {
      system: ["SERVER_START", "SERVER_RENAME", "MEMBER_ADD", "MEMBER_REMOVE", "CONFIG_UPDATE", "DOWNLOAD"],
      server: ["PLAYER_JOIN", "PLAYER_LEAVE", "BAN_PLAYER", "UNBAN_PLAYER", "KICK_PLAYER", "ENTITY_CREATE", "KILL", "EXPLOSION"]
    };
    
    const isSystem = seed % 4 === 0; // Changed from 3 to 4 to get more server logs
    const type = isSystem 
      ? logTypes.system[seed % logTypes.system.length]
      : logTypes.server[seed % logTypes.server.length];
    
    const playerNames = [
      "xXDarkLord123Xx", "GamerGirl2024", "NoobSlayer69", "ProHacker_420", "SilentAssassin",
      "RedBullAddict", "MommasBoy", "TwitchStreamer", "YTInfluencer", "DiscordMod",
      "MinecraftSteve", "Fortnite_Kid", "CallOfDutyPro", "ApexLegend", "ValorantAce"
    ];
    const memberNames = ["demo-user-123456789", "member-987654321", "admin-555444333"];
    
    // Generate realistic details based on log type
    let details = {};
    if (isSystem) {
      switch (type) {
        case "CONFIG_UPDATE":
          break;
        case "MEMBER_ADD":
          details = { username: playerNames[seed % playerNames.length], discordId: "123456789" };
          break;
        case "MEMBER_REMOVE":
          details = { username: playerNames[seed % playerNames.length], discordId: "123456789" };
          break;
        case "MEMBER_UPDATE":
          details = { username: playerNames[seed % playerNames.length], discordId: "123456789" };
          break;
        case "DOWNLOAD":
          break;
      }
    } else {
      switch (type) {
        case "PLAYER_JOIN":
          break;
        case "BAN_PLAYER":
          details = { reason: "AimBot Detected" };
          break;
        case "EXPLOSION":
          details = { 
            explosionType: "7" 
          };
          break;
        case "KILL":
          details = { weaponType: "4024951519", victimName: playerNames[(seed + 1) % playerNames.length] };
          break;
        case "ENTITY_CREATE":
          details = { entityModel: "1283517198" };
          break;
        case "UNBAN_PLAYER":
          details = { banId: "123456789" };
          break;
        case "KICK_PLAYER":
          details = { reason: "AimBot Detected" };
          break;
        default:
      }
    }
    
    return {
      id: `log_${seed}`,
      licenseId: DEMO_SERVER_ID,
      systemType: isSystem ? type : null,
      serverType: !isSystem ? type : null,
      memberId: isSystem && seed % 4 === 0 ? memberNames[seed % memberNames.length] : null,
      playerId: !isSystem ? `player_${(seed % 50) + 1}` : null,
      playerLicense: !isSystem ? `license:demo${((seed % 50) + 1).toString().padStart(3, '0')}abcdef` : null,
      playerName: !isSystem ? playerNames[seed % playerNames.length] : undefined,
      details,
      createdAt: subMinutes(new Date(), seed * 5),
      license: {
        serverName: "Demo Server"
      }
    };
  });

  // Apply filters
  let filteredLogs = allLogs;
  
  // Date range filter
  if (dateFrom || dateTo) {
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      if (dateFrom && logDate < new Date(dateFrom)) return false;
      if (dateTo && logDate > new Date(dateTo)) return false;
      return true;
    });
  }
  
  // Search filter (including details)
  if (search) {
    filteredLogs = filteredLogs.filter(log => {
      // Search in player info
      if (log.playerName?.toLowerCase().includes(search.toLowerCase()) ||
          log.playerId?.includes(search) ||
          log.playerLicense?.includes(search)) {
        return true;
      }
      
      // Search in details values
      if (log.details && typeof log.details === 'object') {
        const detailsString = Object.values(log.details).join(' ').toLowerCase();
        if (detailsString.includes(search.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  // Type filters
  if (systemTypes?.length || serverTypes?.length) {
    filteredLogs = filteredLogs.filter(log => {
      if (systemTypes?.length && log.systemType && systemTypes.includes(log.systemType)) return true;
      if (serverTypes?.length && log.serverType && serverTypes.includes(log.serverType)) return true;
      return false;
    });
  }
  
  const totalCount = filteredLogs.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const paginatedLogs = filteredLogs.slice(offset, offset + limit);
  
  return {
    logs: paginatedLogs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  };
};

export const getDemoLogsAnalytics = (timeRange: "today" | "week" | "month") => {
  const now = new Date();
  let chartData: any[] = [];
  
  // All server event types that should appear in the chart
  const serverTypes = ["PLAYER_JOIN", "PLAYER_LEAVE", "BAN_PLAYER", "UNBAN_PLAYER", "KICK_PLAYER", "ENTITY_CREATE", "KILL", "EXPLOSION"];
  
  switch (timeRange) {
    case "today":
      chartData = Array.from({ length: 24 }, (_, i) => {
        const dataPoint: any = {
          time: `${i.toString().padStart(2, '0')}:00`,
          date: subHours(now, 23 - i).toISOString(),
        };
        
        // Add each server event type as a direct property
        serverTypes.forEach(type => {
          dataPoint[type] = Math.floor(Math.random() * 30) + 5; // 5-35 events per hour
        });
        
        return dataPoint;
      });
      break;
    case "week":
      chartData = Array.from({ length: 7 }, (_, i) => {
        const dayDate = subDays(now, 6 - i);
        const dataPoint: any = {
          time: format(dayDate, "EEE"),
          date: dayDate.toISOString(),
        };
        
        // Add each server event type as a direct property
        serverTypes.forEach(type => {
          dataPoint[type] = Math.floor(Math.random() * 200) + 50; // 50-250 events per day
        });
        
        return dataPoint;
      });
      break;
    case "month":
      chartData = Array.from({ length: 4 }, (_, i) => {
        const dataPoint: any = {
          time: `Week ${i + 1}`,
          date: subDays(now, (3 - i) * 7).toISOString(),
        };
        
        // Add each server event type as a direct property
        serverTypes.forEach(type => {
          dataPoint[type] = Math.floor(Math.random() * 800) + 200; // 200-1000 events per week
        });
        
        return dataPoint;
      });
      break;
  }
  
  return {
    chartData,
    totalLogs: chartData.reduce((sum, data) => {
      const total = serverTypes.reduce((typeSum, type) => typeSum + (data[type] || 0), 0);
      return sum + total;
    }, 0),
  };
};

// Demo console data
export const getDemoConsoleOutput = () => {
  const currentTime = new Date();
  const messages = [
    "^2[INFO] ^7Server started successfully",
    "^3[WARN] ^7Resource 'VexonAC' loaded",
    "^2[INFO] ^7Player ^5GamerGirl2024^7 joined the server",
    "^2[INFO] ^7Player ^5xXDarkLord123Xx^7 joined the server",
    "^6[CHAT] ^5GamerGirl2024^7: Hey everyone!",
    "^6[CHAT] ^5xXDarkLord123Xx^7: What's up?",
    "^3[WARN] ^7High player count detected: 256/300",
    "^2[INFO] ^7Player ^5NoobSlayer69^7 joined the server",
    "^1[ERROR] ^7Player ^5ProHacker_420^7 disconnected (timeout)",
    "^5[ANTICHEAT] ^7VexonAC: Monitoring 256 players",
    "^6[CHAT] ^5NoobSlayer69^7: Anyone want to race?",
    "^2[INFO] ^7Player ^5SilentAssassin^7 joined the server",
    "^3[WARN] ^7Resource usage: CPU 45%, Memory 2.1GB",
    "^6[CHAT] ^5GamerGirl2024^7: Sure! Meet at the airport",
    "^5[ANTICHEAT] ^7Detection: Suspicious activity from player ID 142",
    "^1[BAN] ^7Player ^5CheatMaster2024^7 banned for AimBot Detected",
    "^2[INFO] ^7Player ^5RedBullAddict^7 joined the server",
    "^6[CHAT] ^5xXDarkLord123Xx^7: Nice car bro",
    "^3[WARN] ^7Network lag detected: 150ms average",
    "^2[INFO] ^7Auto-save completed successfully",
    "^6[CHAT] ^5TwitchStreamer^7: Thanks for watching my stream!",
    "^5[ANTICHEAT] ^7VexonAC: Threat assessment complete",
    "^2[INFO] ^7Player ^5YTInfluencer^7 joined the server",
    "^6[CHAT] ^5DiscordMod^7: Remember to follow the rules",
    "^3[WARN] ^7Database connection latency: 25ms",
    "^1[KICK] ^7Player ^5ToxicPlayer123^7 kicked for rule violation",
    "^2[INFO] ^7Player ^5MinecraftSteve^7 joined the server",
    "^6[CHAT] ^5Fortnite_Kid^7: This server is awesome!",
    "^5[ANTICHEAT] ^7Vehicle spawn check: All clear",
    "^2[INFO] ^7Server uptime: 4h 32m 15s"
  ];

  return messages.map((message, index) => ({
    id: `demo-log-${index}`,
    serverId: DEMO_SERVER_ID,
    output: message,
    timestamp: currentTime.getTime() - (messages.length - index) * 5000, // 5 seconds apart
  }));
};

export const getDemoCommandResult = (command: string) => {
  const responses: Record<string, string> = {
    "help": "^2Available commands: ^7players, kick, ban, unban, restart, say, weather, time",
    "players": "^2Online players: ^7256/300",
    "status": "^2Server Status: ^7Online | Uptime: 4h 32m | Players: 256/300",
    "restart": "^3[WARN] ^7Server restart scheduled in 5 minutes",
    "weather": "^2Current weather: ^7CLEAR",
    "time": "^2Current time: ^715:30",
    "say": "^6[ADMIN] ^7Hello everyone from the console!",
    "resources": "^2Loaded resources: ^7342 | Running: 298 | Stopped: 44",
    "memory": "^2Memory usage: ^72.1GB / 8.0GB (26%)",
    "cpu": "^2CPU usage: ^745%",
    "network": "^2Network: ^7In: 2.5MB/s | Out: 1.8MB/s",
    "version": "^2FXServer version: ^76683 | VexonAC: 4.5.0"
  };

  const commandLower = command.toLowerCase().trim();
  const commandBase = commandLower.split(' ')[0];
  
  if (responses[commandBase]) {
    return responses[commandBase];
  }
  
  // Handle dynamic commands
  if (commandLower.startsWith('kick ')) {
    const playerName = command.split(' ').slice(1).join(' ');
    return `^3[KICK] ^7Player ^5${playerName}^7 has been kicked from the server`;
  }
  
  if (commandLower.startsWith('ban ')) {
    const playerName = command.split(' ').slice(1).join(' ');
    return `^1[BAN] ^7Player ^5${playerName}^7 has been banned from the server`;
  }
  
  if (commandLower.startsWith('say ')) {
    const message = command.split(' ').slice(1).join(' ');
    return `^6[ADMIN] ^7${message}`;
  }
  
  if (commandLower.startsWith('weather ')) {
    const weather = command.split(' ')[1];
    return `^2Weather changed to: ^7${weather.toUpperCase()}`;
  }
  
  if (commandLower.startsWith('time ')) {
    const time = command.split(' ')[1];
    return `^2Time changed to: ^7${time}`;
  }
  
  // Default response for unknown commands
  return `^1[ERROR] ^7Unknown command: ^5${command}^7. Type 'help' for available commands.`;
};

// Utility to check if serverId is demo
export const isDemoServer = (serverId: string): boolean => {
  return serverId === DEMO_SERVER_ID;
};

// Schema helper for serverId that accepts UUID or "demo"
export const serverIdSchema = z.string().refine(
  (val: string) => val === DEMO_SERVER_ID || z.string().uuid().safeParse(val).success,
  {
    message: "Must be a valid UUID or 'demo'",
  }
);


