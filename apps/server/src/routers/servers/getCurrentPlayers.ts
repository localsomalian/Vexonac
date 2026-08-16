import { type PlayerData, PlayerStatus } from "@vexonac/types";
import { z } from "zod";
import { getPlayersForServer } from "../../lib/socket";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoPlayers, serverIdSchema } from "../../lib/demo-data";

const generateMockPlayers = (count: number = 50): PlayerData[] => {
  const names = [
    "xXDarkLord123Xx",
    "GamerGirl2024",
    "NoobSlayer69",
    "ProHacker_420",
    "SilentAssassin",
    "RedBullAddict",
    "MommasBoy",
    "TwitchStreamer",
    "YTInfluencer",
    "DiscordMod",
    "MinecraftSteve",
    "Fortnite_Kid",
    "CallOfDutyPro",
    "ApexLegend",
    "ValorantAce",
    "CSGOGlobal",
    "RocketLeague",
    "OverwatchHero",
    "LeagueChamp",
    "DotaKing",
    "HearthstoneMage",
    "WoWPaladin",
    "FFXIVBard",
    "GuildWars2",
    "DestinyGuardian",
    "HaloSpartan",
    "GearOfWarCog",
    "MassEffectN7",
    "Witcher3Geralt",
    "CyberPunk2077",
    "GrandTheftAuto",
    "RedDeadCowboy",
    "AssassinsCreed",
    "WatchDogsHacker",
    "FarCryHunter",
    "Battlefield",
    "PUBG_Winner",
    "WarzoneDrop",
    "FallGuysBean",
    "AmongUsCrewmate",
    "PhasmophobiaGhost",
    "DeadByDaylight",
    "RustSurvivor",
    "ARKTamer",
    "MinecraftBuilder",
    "RobloxNoob",
    "FortniteBuild",
    "ApexPredator",
    "ValorantRadiant",
    "CSGOFaceit",
  ];

  const licenses = [
    "license:abc123def456",
    "license:xyz789uvw012",
    "license:qwe456rty789",
    "license:asd123fgh456",
    "license:zxc789bnm012",
    "license:iop456lkj789",
    "license:uyt123cvb456",
    "license:hjk789nml012",
    "license:poi456rew789",
    "license:tre123yui456",
    "license:dfg789hjk012",
    "license:vbn456mko789",
    "license:qaz123wsx456",
    "license:edc789rfv012",
    "license:tgb456yhn789",
    "license:ujm123ik456",
    "license:ol789p012",
    "license:ws456xz789",
    "license:cv123bn456",
    "license:gh789jk012",
    "license:ty456ui789",
    "license:re123qw456",
    "license:as789df012",
    "license:zx456cv789",
    "license:bn123mk456",
    "license:lp789qw012",
    "license:er456ty789",
    "license:ui123op456",
    "license:sd789fg012",
    "license:hj456kl789",
    "license:za123sx456",
    "license:dc789fv012",
    "license:gb456nh789",
    "license:yt123uj456",
    "license:ik789ol012",
    "license:pl456qw789",
    "license:aq123sw456",
    "license:de789fr012",
    "license:gt456hy789",
    "license:ju123lo456",
    "license:mn789bv012",
    "license:xc456zs789",
    "license:we123rt456",
    "license:ty789ui012",
    "license:op456as789",
    "license:df123gh456",
    "license:jk789lm012",
    "license:vb456nc789",
    "license:qw123er456",
    "license:as789df012",
    "license:zx456cv789",
    "license:bn123mk456",
  ];

  const statuses = Object.values(PlayerStatus);

  return Array.from({ length: count }, (_, index) => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomLicense = licenses[Math.floor(Math.random() * licenses.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: index + 1,
      license: randomLicense,
      name: `${randomName}_${Math.floor(Math.random() * 9999)}`,
      ping: Math.floor(Math.random() * 200) + 10, // 10-210ms ping
      health: Math.floor(Math.random() * 100) + 1, // 1-100 health
      admin: Math.random() < 0.1, // 10% chance of being admin
      timeOnline: Math.floor(Math.random() * 200), // 0-2 hours in milliseconds
      playTime: Math.floor(Math.random() * 200), // 0-30 days in milliseconds
      threatScore: Math.floor(Math.random() * 100), // 0-999 threat score
      status: randomStatus,
      coords: {
        x: Math.random() * 8000 - 4000, // -4000 to 4000 (typical GTA map bounds)
        y: Math.random() * 8000 - 4000, // -4000 to 4000
      },
    };
  });
};

export const getCurrentPlayers = protectedProcedure
  .input(z.object({ serverId: serverIdSchema }))
  .query(async ({ input }) => {
    const serverId = input.serverId as string;
    
    // Check if this is a demo server request
    if (isDemoServer(serverId)) {
      const demoData = getDemoPlayers(1, 256); // Get all 256 demo players
      return demoData.players;
    }

    const players = await getPlayersForServer(serverId);
    return players;
  });

