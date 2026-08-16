import { explosionsList } from "./constants";
import { type VexonACConfig } from "./index";

export const defaultConfig: VexonACConfig = {
  Main: {
    E1: {
      value: true,
      label: "Executor Detection #1",
      tooltip: "Standard detection for executors.",
      type: "boolean",
    },
    E2: {
      value: true,
      label: "Executor Detection #2",
      tooltip:
        "Advanced detection for executors and LUA menus using behavioral analysis.",
      type: "boolean",
    },
    E3: {
      value: true,
      label: "Executor Detection #3",
      tooltip: "Advanced detection for executors.",
      type: "boolean",
    },
    E4: {
      value: true,
      label: "Executor Detection #4",
      tooltip: "Advanced detection for executors.",
      type: "boolean",
    },
    E5: {
      value: true,
      label: "Executor Detection #5",
      tooltip: "Advanced detection for executors.",
      type: "boolean",
    },
    E6: {
      value: false,
      label: "Executor Detection #6 (Not Recommended)",
      tooltip:
        "Detects many executors. Use with caution as it may produce occasional false positives.",
      type: "boolean",
    },
    AntiLuaMenu: {
      value: true,
      label: "Anti LUA Menu",
      tooltip:
        "Identifies and blocks most LUA-based mod menus by analyzing execution patterns.",
      type: "boolean",
    },
    AntiTeleport: {
      value: true,
      label: "Anti Teleport",
      tooltip:
        "Detects unnatural player movement, such as instantaneous long-distance travel.",
      type: "boolean",
    },
    AntiNoClip: {
      value: true,
      label: "Anti NoClip",
      tooltip:
        "Identifies players bypassing collision detection to move through objects.",
      type: "boolean",
    },
    AntiFreeCam: {
      value: true,
      label: "Anti FreeCam",
      tooltip:
        "Detects players using unauthorized camera modes to gain unfair advantages.",
      type: "boolean",
    },
    AntiSpeedHack: {
      value: true,
      label: "Anti Speed Hack",
      tooltip:
        "Identifies players moving at speeds exceeding normal game limitations.",
      type: "boolean",
    },
    AntiNoRagdoll: {
      value: false,
      label: "Anti No-Ragdoll",
      tooltip:
        "Detects players who have disabled the ragdoll physics effect to gain advantages.",
      type: "boolean",
    },
    AntiSpectate: {
      value: true,
      label: "Anti Spectate",
      tooltip:
        "Prevents unauthorized spectating of other players through cheat methods.",
      type: "boolean",
    },
    AntiInvisible: {
      value: false,
      label: "Anti Invisibility",
      tooltip:
        "Identifies players who have made themselves invisible through exploits.",
      type: "boolean",
    },
    AntiSuperJump: {
      value: true,
      label: "Anti Super Jump",
      tooltip:
        "Detects players using enhanced jump abilities beyond normal game mechanics.",
      type: "boolean",
    },
    AntiInfiniteStamina: {
      value: true,
      label: "Anti Infinite Stamina",
      tooltip:
        "Identifies players with unlimited stamina through gameplay modifications.",
      type: "boolean",
    },
    AntiPedModelChange: {
      value: true,
      label: "Anti Model Change",
      tooltip: "Detects unauthorized changes to player character models.",
      type: "boolean",
    },
    AntiNightVisions: {
      value: true,
      label: "Anti Night Vision",
      tooltip:
        "Identifies players using unauthorized night vision capabilities.",
      type: "boolean",
    },
    AntiAFKBypass: {
      value: true,
      label: "Anti AFK Bypass",
      tooltip:
        "Detects players using scripts to appear active while actually AFK.",
      type: "boolean",
    },
    AntiInputBox: {
      value: true,
      label: "Anti LUA Input",
      tooltip:
        "Secondary detection method for LUA mod menus by monitoring input methods.",
      type: "boolean",
    },
    AntiInfiniteRefill: {
      value: true,
      label: "Anti Health Regeneration",
      tooltip:
        'Detects abnormal health regeneration rates associated with "Semi God Mode" cheats.',
      type: "boolean",
    },
    ClientReviveEvent: {
      value: "esx_ambulancejob:revive",
      label: "Revive Event Name (Client)",
      tooltip:
        "Specify your server's revive event name to restore players killed by cheaters.",
      type: "string",
      placeholder: "esx_ambulancejob:revive",
    },
    AntiOverrideHealthStats: {
      value: true,
      label: "Anti Health Stat Modification",
      tooltip:
        "Identifies modifications to maximum health values beyond server limitations.",
      type: "boolean",
    },
    AntiInvincible: {
      value: true,
      label: "Anti Invincibility",
      tooltip: "Detects players who have enabled invincibility through cheats.",
      type: "boolean",
    },
    AntiNoCombatDamages: {
      value: true,
      label: "Anti Damage Immunity",
      tooltip:
        "Identifies players immune to normal weapon damage through exploits.",
      type: "boolean",
    },
    AntiTriggerServerEventAI: {
      value: true,
      label: "AI Server Event Protection",
      tooltip:
        "Protection for all server events. Automatically secures your server against event exploitation.",
      type: "boolean",
    },
    AntiTriggerClientEventAI: {
      value: true,
      label: "AI Client Event Protection",
      tooltip:
        "Protection for all client events. Automatically secures your server against event exploitation.",
      type: "boolean",
    },
    AntiTriggerExportAI: {
      value: true,
      label: "AI Export Protection",
      tooltip:
        "Protection for all client exports. Automatically secures your server against client export exploitation.",
      type: "boolean",
    },
    AntiResourceStop: {
      value: true,
      label: "Anti Resource Stop",
      tooltip:
        "Detects attempts to stop VexonAC or any other server resource through script exploitation or command injection.",
      type: "boolean",
    },
    AntiResourceInjection: {
      value: true,
      label: "Anti Resource Injection",
      tooltip:
        "Identifies unauthorized resource injection attempts used to execute malicious code on your server.",
      type: "boolean",
    },
    AntiClearTasks: {
      value: true,
      label: "Anti Clear Tasks",
      tooltip:
        "Prevents cheaters from using clearTasks on other players, which can disrupt animations, movement, and game actions.",
      type: "boolean",
    },
    AntiDevTools: {
      value: true,
      label: "Anti Dev Tools",
      tooltip: "Detects players that use the nui dev tools.",
      type: "boolean",
    },
    AntiSpoofer: {
      value: true,
      label: "Anti Spoofer",
      tooltip: "Detects players that used a spoofer to bypass bans.",
      type: "boolean",
    },
    AntiVoiceExploits: {
      value: true,
      label: "Anti Voice Exploits",
      tooltip:
        "Detects players that use voice exploits such as increasing the range of their voice.",
      type: "boolean",
    },
    IgnoredEvents: {
      value: [],
      label: "Event Protection Exceptions",
      tooltip:
        "List of Client/server events to exclude from protection. Add events that are incompatible with protection or don't require it. Glob patterns are supported.",
      type: "list",
      placeholder: "esx:eventName, ...",
    },
  },

  Weapons: {
    AntiAimBot: {
      value: true,
      label: "Anti Aimbot",
      tooltip:
        "Advanced detection for aimbots that identifies unnaturally perfect tracking and target acquisition.",
      type: "boolean",
    },
    AntiWeaponSpawner: {
      value: true,
      label: "Anti Weapon Spawn",
      tooltip:
        "Detects unauthorized weapons spawned by cheaters or through RPF modifications not listed in your weapon whitelist.",
      type: "boolean",
    },
    AddonWeapons: {
      value: [],
      label: "Add-On Weapons",
      tooltip:
        "List of custom add-on weapons that should be protected on your server.",
      type: "list",
      placeholder: "weapon_plasmap, weapon_glock17, ...",
    },
    AntiGiveWeapons: {
      value: true,
      label: "Anti Give Weapons",
      tooltip:
        "Detects cheaters attempting to give weapons to other players through unauthorized methods.",
      type: "boolean",
    },
    AntiRemoveWeapons: {
      value: true,
      label: "Anti Remove Weapons",
      tooltip:
        "Detects cheaters attempting to remove weapons from other players through script exploitation.",
      type: "boolean",
    },
    AntiSpoofedBullets: {
      value: true,
      label: "Anti Spoofed Bullets",
      tooltip:
        "Detects players firing bullets or using weapons they don't actually possess in their inventory.",
      type: "boolean",
    },
    AntiKill: {
      value: true,
      label: "Anti Kill Exploits",
      tooltip:
        "Detects and blocks cheaters attempting to instantly kill other players through various exploitation methods.",
      type: "boolean",
    },
    EnableWeaponsBlackList: {
      value: true,
      label: "Enable Weapons Blacklist",
      tooltip:
        "Activates the weapon blacklist system. Note that Anti Weapon Spawn already detects all unauthorized weapons.",
      type: "boolean",
    },
    BlackListedWeapons: {
      value: [
        "weapon_raypistol",
        "weapon_raycarbine",
        "weapon_railgun",
        "weapon_rpg",
        "weapon_grenadelauncher_smoke",
        "weapon_grenadelauncher",
        "weapon_minigun",
        "weapon_firework",
        "weapon_hominglauncher",
        "weapon_compactlauncher",
        "weapon_rayminigun",
        "weapon_grenade",
        "weapon_molotov",
        "weapon_stickybomb",
        "weapon_proxmine",
        "weapon_pipebomb",
        "weapon_emplauncher",
        "weapon_railgunxm3",
      ],
      label: "Blacklisted Weapons",
      tooltip:
        "List of weapons that are never allowed on your server, even when obtained through legitimate means.",
      type: "list",
      placeholder: "weapon_rpg, weapon_grenade, ...",
    },
    AntiWeaponComponentModifier: {
      value: true,
      label: "Anti Weapon Component Modifier",
      tooltip:
        "Detects unauthorized modifications to weapon components, attachments, or properties through RPF edits.",
      type: "boolean",
    },
    AntiWeaponDamagesModifier: {
      value: true,
      label: "Anti Weapon Damage Modifier",
      tooltip:
        "Identifies modifications to weapon damage values through RPF edits or runtime memory manipulation.",
      type: "boolean",
    },
    AntiAmmoCheating: {
      value: true,
      label: "Anti Ammo Cheats",
      tooltip:
        "Detects players with abnormal ammunition amounts or ammo-related modifications.",
      type: "boolean",
    },
    AntiInfiniteAmmo: {
      value: true,
      label: "Anti Infinite Ammo",
      tooltip:
        "Identifies players using infinite ammunition through memory manipulation or script exploits.",
      type: "boolean",
    },
    AntiNoReload: {
      value: true,
      label: "Anti No Reload",
      tooltip:
        "Detects players bypassing weapon reload mechanics to fire continuously without reloading.",
      type: "boolean",
    },
    AntiExplosiveBullets: {
      value: true,
      label: "Anti Explosive Bullets",
      tooltip:
        "Identifies players using modified ammunition types to create explosions on impact.",
      type: "boolean",
    },
    AntiSuperPunch: {
      value: true,
      label: "Anti Super Punch",
      tooltip:
        "Detects players using enhanced melee damage to instantly kill others or destroy vehicles with punches.",
      type: "boolean",
    },
    AntiHitboxModifier: {
      value: true,
      label: "Anti Hitbox Modifier",
      tooltip:
        "Identifies RPF modifications that alter player hitboxes to make hitting targets easier.",
      type: "boolean",
    },
    AntiNoRecoil: {
      value: true,
      label: "Anti No Recoil",
      tooltip:
        "Identifies players who have eliminated weapon recoil through RPF modifications.",
      type: "boolean",
    },
    EnableProjectilesWhiteList: {
      value: true,
      label: "Enable Projectiles Whitelist",
      tooltip:
        "Activates the projectile whitelist system. Any projectile not in the whitelist will trigger a ban.",
      type: "boolean",
    },
    WhiteListedProjectiles: {
      value: ["weapon_bzgas", "weapon_snowball", "weapon_smokegrenade"],
      label: "Whitelisted Projectiles",
      tooltip:
        "List of projectile weapons that are allowed on your server. All others will be blocked if whitelist is enabled.",
      type: "list",
      placeholder: "weapon_bzgas, weapon_snowball, weapon_smokegrenade, ...",
    },
    EnableProjectilesLimiter: {
      value: true,
      label: "Enable Projectiles Limiter",
      tooltip:
        "Activates rate limiting for projectile spawning to prevent spam attacks.",
      type: "boolean",
    },
    ProjectilesLimitIn5Seconds: {
      value: 8,
      label: "Projectiles Spawn Limit",
      tooltip:
        "Maximum number of projectiles a player can spawn within a 5-second window before triggering detection.",
      type: "number",
    },
    LogProjectileSpawnsToConsole: {
      value: true,
      label: "Log Projectile Spawns (Console)",
      tooltip:
        "Records all projectile spawns to the server console for monitoring and debugging purposes.",
      type: "boolean",
    },
  },

  Entities: {
    EnableVehiclesAI: {
      value: true,
      label: "AI Anti Vehicle Spawn",
      tooltip:
        "Advanced detection system for unauthorized vehicle spawns without requiring manual blacklist configuration.",
      type: "boolean",
    },
    EnableVehiclesAIv2: {
      value: true,
      label: "Anti AI Vehicle Spawn",
      tooltip: "Detects spawning of NPC/AI vehicles by cheaters.",
      type: "boolean",
    },
    AntiSpawnIsolatedVehicles: {
      value: true,
      label: "Anti Isolated Vehicle Spawn",
      tooltip:
        "Detects vehicles spawned in isolated environments often used by cheat menus to hide spawning activity.",
      type: "boolean",
    },
    EnableVehiclesBlackList: {
      value: true,
      label: "Enable Vehicle Blacklist",
      tooltip:
        "Activates the vehicle blacklist system. Any vehicle in the blacklist will trigger detection if spawned.",
      type: "boolean",
    },
    EnableObjectsBlackList: {
      value: true,
      label: "Enable Object Blacklist",
      tooltip:
        "Activates the object blacklist system. Any object in the blacklist will trigger detection if spawned.",
      type: "boolean",
    },
    EnablePedsBlackList: {
      value: true,
      label: "Enable Ped Blacklist",
      tooltip:
        "Activates the ped blacklist system. Any ped in the blacklist will trigger detection if spawned.",
      type: "boolean",
    },
    BlackListedPeds: {
      value: [],
      label: "Blacklisted Peds",
      tooltip:
        "List of peds that are never allowed on your server. Can use model names or hash values.",
      type: "list",
      placeholder: "a_c_chimp, -1469565163, ...",
    },
    BlackListedObjects: {
      value: [],
      label: "Blacklisted Objects",
      tooltip:
        "List of objects that are never allowed on your server. Can use model names or hash values.",
      type: "list",
      placeholder: "stt_prop_stunt_track_dwslope30, -145066854, ...",
    },
    BlackListedVehicles: {
      value: [
        "submersible",
        "submersible2",
        "tug",
        "avisa",
        "dinghy5",
        "kosatka",
        "raiju",
        "conada2",
        "patrolboat",
        "cerberus",
        "cerberus2",
        "cerberus3",
        "hauler",
        "hauler2",
        "phantom2",
        "stockade3",
        "terbyte",
        "issi6",
        "issi5",
        "issi4",
        "riot2",
        "akula",
        "annihilator",
        "annihilator2",
        "buzzard",
        "cargobob",
        "cargobob2",
        "cargobob3",
        "cargobob4",
        "hunter",
        "savage",
        "skylift",
        "valkyrie",
        "valkyrie2",
        "bulldozer",
        "cutter",
        "dump",
        "handler",
        "apc",
        "barrage",
        "chernobog",
        "halftrack",
        "khanjali",
        "minitank",
        "rhino",
        "scarab",
        "scarab2",
        "scarab3",
        "thruster",
        "trailersmall2",
        "deathbike",
        "deathbike2",
        "deathbike3",
        "oppressor",
        "oppressor2",
        "blazer5",
        "bruiser",
        "bruiser2",
        "bruiser3",
        "brutus",
        "brutus2",
        "brutus3",
        "dune2",
        "dune3",
        "dune4",
        "dune5",
        "insurgent",
        "insurgent2",
        "insurgent3",
        "marshall",
        "monster",
        "monster3",
        "monster4",
        "monster5",
        "menacer",
        "nightshark",
        "technical",
        "technical2",
        "technical3",
        "zhaba",
        "avenger",
        "avenger2",
        "besra",
        "blimp",
        "blimp2",
        "blimp3",
        "bombushka",
        "cargoplane",
        "hydra",
        "jet",
        "lazer",
        "molotok",
        "nokota",
        "pyro",
        "rogue",
        "starling",
        "strikeforce",
        "titan",
        "volatol",
        "alkonost",
        "baller6",
        "squaddie",
        "brickade",
        "pbus2",
        "rallytruck",
        "tourbus",
        "wastelander",
        "zr380",
        "zr3802",
        "zr3803",
        "toreador",
        "vigilante",
        "armytanker",
        "armytrailer",
        "armytrailer2",
        "baletrailer",
        "boattrailer",
        "cablecar",
        "docktrailer",
        "freighttrailer",
        "graintrailer",
        "proptrailer",
        "raketrailer",
        "tr2",
        "tr3",
        "tr4",
        "trflat",
        "tvtrailer",
        "tanker",
        "tanker2",
        "trailerlarge",
        "trailerlogs",
        "trailersmall",
        "trailers",
        "trailers2",
        "trailers3",
        "trailers4",
        "freight",
        "freightcar",
        "freightcont1",
        "freightcont2",
        "freightgrain",
        "metrotrain",
        "tankercar",
        "voltic2",
        "boxville5",
      ],
      label: "Blacklisted Vehicles",
      tooltip:
        "List of vehicles that are never allowed on your server. Can use model names or hash values.",
      type: "list",
      placeholder: "submersible, 837858166, ...",
    },
    EnableVehiclesWhiteList: {
      value: false,
      label: "Enable Vehicle Whitelist",
      tooltip:
        "Activates the vehicle whitelist system. Any vehicle not in the whitelist will trigger detection if spawned.",
      type: "boolean",
    },
    WhiteListedVehicles: {
      value: [],
      label: "Whitelisted Vehicles",
      tooltip:
        "List of vehicles that are allowed on your server. Can use model names or hash values.",
      type: "list",
      placeholder: "sultan, blista, 970598228, ...",
    },
    DeleteVehicleOnDestroy: {
      value: true,
      label: "Auto-Delete Destroyed Vehicles",
      tooltip:
        "Automatically removes vehicles that are destroyed, exploded, or burning to reduce server load.",
      type: "boolean",
    },
    AntiThrowVehicles: {
      value: true,
      label: "Anti Vehicle Throwing",
      tooltip:
        "Detects cheaters applying excessive force to vehicles to throw them at players or buildings.",
      type: "boolean",
    },
    EnableVehiclesLimiter: {
      value: true,
      label: "Enable Vehicle Spawn Limiter",
      tooltip:
        "Activates rate limiting for vehicle spawning to prevent mass spawn attacks.",
      type: "boolean",
    },
    AntiDeleteVehicles: {
      value: true,
      label: "Anti Vehicle Deletion",
      tooltip:
        "Prevents cheaters from deleting vehicles owned or occupied by other players.",
      type: "boolean",
    },
    VehiclesLimitIn5Seconds: {
      value: 10,
      label: "Vehicle Spawn Limit",
      tooltip:
        "Maximum number of vehicles a player can spawn within a 5-second window before triggering detection.",
      type: "number",
    },
    LogVehicleSpawnsToConsole: {
      value: true,
      label: "Log Vehicle Spawns (Console)",
      tooltip:
        "Records all vehicle spawns to the server console for monitoring and debugging purposes.",
      type: "boolean",
    },
    NoCarKill: {
      value: true,
      label: "Disable Vehicle Damage to Players",
      tooltip:
        "Prevents players from taking damage when hit by vehicles, countering vehicle ramming attacks.",
      type: "boolean",
    },
    AntiTeleportInVehicle: {
      value: true,
      label: "Anti Vehicle Hijacking",
      tooltip:
        "Prevents cheaters from warping/hijacking/teleporting into vehicles owned by other players.",
      type: "boolean",
    },
    AntiSpeedModifier: {
      value: true,
      label: "Anti Vehicle Speed Modifier",
      tooltip:
        "Detects modifications to vehicle speed properties beyond normal tuning capabilities.",
      type: "boolean",
    },
    AntiHandlingModifier: {
      value: true,
      label: "Anti Vehicle Handling Modifier",
      tooltip:
        "Identifies unauthorized changes to vehicle handling data like grip, acceleration, or braking.",
      type: "boolean",
    },
    EnablePedsAI: {
      value: true,
      label: "AI Anti Ped Spawn",
      tooltip:
        "Advanced detection system for unauthorized ped spawns without requiring manual whitelist configuration.",
      type: "boolean",
    },
    EnablePedsAIv2: {
      value: true,
      label: "Anti AI Ped Spawn",
      tooltip: "Detects spawning of NPC/AI peds by cheaters.",
      type: "boolean",
    },
    DisableNPCPopulation: {
      value: false,
      label: "Disable NPC Population",
      tooltip:
        "Completely disables NPC spawning on your server. Highly recommended if your server doesn't use NPCs as it improves detection accuracy.",
      type: "boolean",
    },
    EnablePedsWhiteList: {
      value: false,
      label: "Enable Ped Whitelist",
      tooltip:
        "Activates the ped whitelist system. Any ped not in the whitelist will trigger detection if spawned.",
      type: "boolean",
    },
    WhiteListedPeds: {
      value: [],
      label: "Whitelisted Peds",
      tooltip:
        "List of peds that are allowed on your server. Can use model names or hash values.",
      type: "list",
      placeholder: "a_f_m_beach_01, a_f_m_bevhills_01, 1413662315, ...",
    },
    EnablePedsLimiter: {
      value: true,
      label: "Enable Ped Spawn Limiter",
      tooltip:
        "Activates rate limiting for ped spawning to prevent mass spawn attacks.",
      type: "boolean",
    },
    PedsLimitIn5Seconds: {
      value: 10,
      label: "Ped Spawn Limit",
      tooltip:
        "Maximum number of peds a player can spawn within a 5-second window before triggering detection.",
      type: "number",
    },
    LogPedSpawnsToConsole: {
      value: true,
      label: "Log Ped Spawns (Console)",
      tooltip:
        "Records all ped spawns to the server console for monitoring and debugging purposes.",
      type: "boolean",
    },
    AntiVehiclePlateChanger: {
      value: true,
      label: "Anti Vehicle Plate Changer",
      tooltip:
        "Detects unauthorized license plate modifications used to bypass identification systems.",
      type: "boolean",
    },
    EnableObjectsAI: {
      value: true,
      label: "AI Anti Object Spawn",
      tooltip:
        "Advanced detection system for unauthorized object spawns without requiring manual whitelist or blacklist configuration.",
      type: "boolean",
    },
    EnableObjectsWhiteList: {
      value: false,
      label: "Enable Object Whitelist",
      tooltip:
        "Activates the object whitelist system. Any object not in the whitelist will trigger detection if spawned.",
      type: "boolean",
    },
    WhiteListedObjects: {
      value: [],
      label: "Whitelisted Objects",
      tooltip:
        "List of objects that are allowed on your server. Can use model names or hash values.",
      type: "list",
      placeholder: "apa_mp_h_yacht_sofa_02, 1224329141, ...",
    },
    AntiPickupSpawn: {
      value: true,
      label: "Anti Pickup Spawn",
      tooltip:
        "Prevents spawning of pickups (health, armor, weapons, ammo) that can disrupt server economy or gameplay.",
      type: "boolean",
    },
    EnableObjectsLimiter: {
      value: true,
      label: "Enable Object Spawn Limiter",
      tooltip:
        "Activates rate limiting for object spawning to prevent mass spawn attacks.",
      type: "boolean",
    },
    ObjectsLimitIn5Seconds: {
      value: 15,
      label: "Object Spawn Limit",
      tooltip:
        "Maximum number of objects a player can spawn within a 5-second window before triggering detection.",
      type: "number",
    },
    LogObjectSpawnsToConsole: {
      value: true,
      label: "Log Object Spawns (Console)",
      tooltip:
        "Records all object spawns to the server console for monitoring and debugging purposes.",
      type: "boolean",
    },
  },

  Explosions: {
    EnableExplosionsAI: {
      value: true,
      label: "AI Anti Explosion",
      tooltip:
        "Advanced detection system for unauthorized explosions without requiring manual blacklist configuration.",
      type: "boolean",
    },
    EnableParticlesAI: {
      value: true,
      label: "AI Anti Particle",
      tooltip:
        "Advanced detection system for unauthorized particles without requiring manual whitelist configuration.",
      type: "boolean",
    },
    EnableExplosionsBlackList: {
      value: false,
      label: "Enable Explosion Blacklist",
      tooltip:
        "Activates the explosion blacklist system. Any explosion type in the blacklist will trigger detection.",
      type: "boolean",
    },
    BlackListedExplosions: {
      value: [
        0, 1, 2, 3, 4, 5, 18, 19, 20, 21, 25, 26, 29, 32, 33, 35, 36, 37, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
        59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
        77, 80, 81, 82,
      ],
      label: "Blacklisted Explosions",
      tooltip: "Select explosion types that should be blocked on your server.",
      type: "transferlist",
      values: explosionsList,
    },
    DetectInvisibleExplosions: {
      value: true,
      label: "Anti Invisible Explosions",
      tooltip:
        "Detects explosions with no visible effects used by cheaters to damage players or vehicles silently.",
      type: "boolean",
    },
    DetectInaudibleExplosions: {
      value: true,
      label: "Anti Inaudible Explosions",
      tooltip:
        "Identifies explosions with no sound effects used by cheaters for stealth attacks.",
      type: "boolean",
    },
    EnableExplosionsLimiter: {
      value: true,
      label: "Enable Explosion Limiter",
      tooltip:
        "Activates rate limiting for explosions to prevent mass explosion attacks.",
      type: "boolean",
    },
    ExplosionsLimitIn5Seconds: {
      value: 5,
      label: "Explosion Limit",
      tooltip:
        "Maximum number of explosions a player can create within a 5-second window before triggering detection.",
      type: "number",
    },
    CancelAllExplosions: {
      value: true,
      label: "Cancel All Explosions",
      tooltip:
        "Completely prevents all explosions on the server. Players will not see or be affected by any explosions.",
      type: "boolean",
    },
    CancelAllFires: {
      value: true,
      label: "Cancel All Fires",
      tooltip:
        "Completely prevents all fire effects on the server. Players will not see or be affected by any fires.",
      type: "boolean",
    },
    LogExplosionSpawnsToConsole: {
      value: true,
      label: "Log Explosion Spawns (Console)",
      tooltip:
        "Records all explosion events to the server console for monitoring and debugging purposes.",
      type: "boolean",
    },
    EnableParticlesWhiteList: {
      value: false,
      label: "Enable Particle Whitelist",
      tooltip:
        "Activates the particle whitelist system. Any particle not in the whitelist will trigger detection if spawned.",
      type: "boolean",
    },
    WhiteListedParticles: {
      value: [],
      label: "Whitelisted Particles",
      tooltip: "List of particle effects that are allowed on your server.",
      type: "list",
      placeholder: "veh_backfire, ...",
    },
    DetectParticlesAttachedToEntity: {
      value: true,
      label: "Anti Attached Particles",
      tooltip:
        "Detects particle effects attached to entities, often used for visual trolling or harassment.",
      type: "boolean",
    },
    MaxParticleScale: {
      value: 10,
      label: "Particle Scale Limit",
      tooltip:
        "Maximum allowed scale for particle effects. Larger particles are often used to obscure vision or cause lag.",
      type: "number",
    },
    LogParticleSpawnsToConsole: {
      value: true,
      label: "Log Particle Spawns (Console)",
      tooltip:
        "Records all particle spawns to the server console for monitoring and debugging purposes.",
      type: "boolean",
    },
  },

  Premium: {
    AntiRequestControl: {
      value: true,
      label: "Anti Vehicle Control Request",
      tooltip:
        "Prevents unauthorized network requests for control of vehicles owned by other players, blocking various vehicle exploits.",
      type: "boolean",
    },
    AntiSoundExploits: {
      value: true,
      label: "Anti Sound Exploits",
      tooltip:
        "Blocks malicious sound manipulations including ear rape attacks and unauthorized global sound broadcasts.",
      type: "boolean",
    },
    AntiRagdollExploit: {
      value: true,
      label: "Anti Forced Ragdoll",
      tooltip:
        "Prevents cheaters from forcing other players into ragdoll state, a common trolling tactic.",
      type: "boolean",
    },
    AntiBombVehicles: {
      value: true,
      label: "Anti Vehicle Bombing",
      tooltip:
        "Blocks new exploit methods that allow cheaters to remotely detonate or destroy all vehicles on the server.",
      type: "boolean",
    },
  },

  Beta: {
    AntiUnisolatedInjection: {
      value: true,
      label: "Anti Unisolated Injection",
      tooltip:
        "Detects specific code injection patterns based on the executor type and method used.",
      type: "boolean",
    },
    IgnoredExecutionPatterns: {
      value: [],
      label: "Execution Patterns Exceptions",
      tooltip:
        "List of execution patterns hash to exclude from protection. Add patterns that are incompatible with protection.",
      type: "list",
      placeholder: "4fbfcfcca3240291462f156c74a5783c, ...",
    },
    AntiMagneto: {
      value: true,
      label: "Anti Magneto",
      tooltip:
        'Detects cheaters using "magneto" cheats to apply force to vehicles without physical contact.',
      type: "boolean",
    },
    AntiAttachVehicles: {
      value: true,
      label: "Anti Vehicle Attachment",
      tooltip:
        "Prevents cheaters from attaching vehicles to players, a common method of harassment and trolling.",
      type: "boolean",
    },
    AntiSilentAim: {
      value: true,
      label: "Anti Silent Aim",
      tooltip:
        "Identifies silent aim cheats that manipulate bullet trajectory or hit registration to hit targets regardless of actual aim.",
      type: "boolean",
    },
  },

  Settings: {
    EnableDiscordLogs: {
      value: true,
      label: "Enable Discord Logging",
      tooltip:
        "Activates the Discord webhook logging system for all VexonAC detections and events.",
      type: "boolean",
    },
    ShowIpAddress: {
      value: true,
      label: "Show IP Addresses in Logs",
      tooltip:
        "Includes player IP addresses in Discord logs. Disable if you have privacy concerns or legal restrictions.",
      type: "boolean",
    },
    MainWebhook: {
      value: "",
      label: "Main Webhook URL",
      tooltip:
        "Discord webhook URL where ban logs will be sent. This is the primary notification channel.",
      type: "string",
    },
    EntitiesWebhook: {
      value: "",
      label: "Entities Webhook URL",
      tooltip:
        "Discord webhook URL where entity spawn logs (vehicles, peds, objects) will be sent.",
      type: "string",
    },
    ExplosionsWebhook: {
      value: "",
      label: "Explosions Webhook URL",
      tooltip:
        "Discord webhook URL where explosion detection logs will be sent.",
      type: "string",
    },
    WeaponsWebhook: {
      value: "",
      label: "Weapons Webhook URL",
      tooltip:
        "Discord webhook URL where weapon-related detection logs will be sent.",
      type: "string",
    },
    UnbansWebhook: {
      value: "",
      label: "Unbans Webhook URL",
      tooltip:
        "Discord webhook URL where player unban notifications will be sent.",
      type: "string",
    },
    ConnectionsWebhook: {
      value: "",
      label: "Connections Webhook URL",
      tooltip:
        "Discord webhook URL where player connection and disconnection logs will be sent.",
      type: "string",
    },
    CommunityLogsWebhook: {
      value: "",
      label: "Public Logs Webhook URL",
      tooltip:
        "Discord webhook URL for simplified ban logs suitable for public channels, showing only reason and evidence.",
      type: "string",
    },
    GlobalBanWebhook: {
      value: "",
      label: "Global Ban Webhook URL",
      tooltip:
        "Discord webhook URL that receives every ban regardless of detection category. Use this for a dedicated bans channel.",
      type: "string",
    },
    ScreenshotsWebhook: {
      value: "",
      label: "Screenshots Webhook URL",
      tooltip:
        "Discord webhook URL where screenshot and gameplay recording evidence is uploaded. Falls back to Main Webhook if not set.",
      type: "string",
    },
    EnableBans: {
      value: true,
      label: "Enable Ban System",
      tooltip:
        "Activates the ban system. When disabled, detected cheaters will only be kicked instead of banned.",
      type: "boolean",
    },
    EnableScreenShots: {
      value: true,
      label: "Enable Screenshot System",
      tooltip: "Takes a screenshot when a player is banned.",
      type: "boolean",
    },
    EnableGameplayRecord: {
      value: true,
      label: "Enable Gameplay Recording",
      tooltip:
        "Captures a 10-second gameplay recording when a player is banned, providing additional evidence.",
      type: "boolean",
    },
    BanDuration: {
      value: -1,
      label: "Ban Duration (seconds)",
      tooltip:
        "Duration of bans in seconds. Set to 31536000 for 1 year, -1 for permanent bans.",
      type: "number",
    },
    BanIpAddress: {
      value: true,
      label: "Ban IP Address",
      tooltip:
        "Also bans the player's IP address in addition to their identifiers, making ban evasion more difficult.",
      type: "boolean",
    },
    BanMessage: {
      value: "You have been banned by VexonAC for cheating.",
      label: "Ban Message",
      tooltip:
        "Message shown to players when they are banned and disconnected from the server.",
      type: "string",
    },
    LogUnbansToDiscord: {
      value: true,
      label: "Log Unbans to Discord",
      tooltip:
        "Sends a notification to Discord when a player is unbanned from the server.",
      type: "boolean",
    },
    LogConnectionsToDiscord: {
      value: true,
      label: "Log Connections to Discord",
      tooltip:
        "Sends player connection and disconnection events to your Discord webhook.",
      type: "boolean",
    },
    LogConnectionsToConsole: {
      value: true,
      label: "Log Connections to Console",
      tooltip:
        "Records player connection and disconnection events to the server console.",
      type: "boolean",
    },
    LogOnConnect: {
      value: true,
      label: "Enable Connect Logs",
      tooltip: "Activates logging when players connect to the server.",
      type: "boolean",
    },
    LogOnDisconnect: {
      value: true,
      label: "Enable Disconnect Logs",
      tooltip: "Activates logging when players disconnect from the server.",
      type: "boolean",
    },
    AntiVPN: {
      value: false,
      label: "Anti VPN",
      tooltip:
        "Detects and blocks players connecting through VPNs or proxy services.",
      type: "boolean",
    },
    AntiXSSInjections: {
      value: true,
      label: "Anti XSS Injection",
      tooltip:
        "Blocks cross-site scripting attempts that load external scripts through NUI exploits.",
      type: "boolean",
    },
    AntiConnectionDupe: {
      value: true,
      label: "Anti Connection Duplication",
      tooltip:
        "Prevents players from connecting to your server with multiple FiveM clients simultaneously.",
      type: "boolean",
    },
    RequireDiscord: {
      value: false,
      label: "Require Discord Linked",
      tooltip:
        "Requires players to have their Discord account linked to FiveM to join your server.",
      type: "boolean",
    },
    RequireAlphanumericName: {
      value: false,
      label: "Require Alphanumeric Name",
      tooltip:
        "Restricts player names to alphanumeric characters only, blocking special characters that could cause issues.",
      type: "boolean",
    },
    EnableAntiBackdoors: {
      value: true,
      label: "Anti Backdoor",
      tooltip:
        "Scans your server resources for potential backdoors or malicious code and reports them.",
      type: "boolean",
    },
    StopServerWhenDetected: {
      value: false,
      label: "Stop Server on Backdoor",
      tooltip:
        "Automatically stops the server if a backdoor is detected to prevent exploitation.",
      type: "boolean",
    },
    CommandPrefix: {
      value: "vexonac",
      label: "Command Prefix",
      tooltip: "Sets the prefix for all VexonAC commands.",
      type: "string",
    },
    IgnoredScripts: {
      value: [],
      label: "Ignored Scripts",
      tooltip:
        "List of scripts where VexonAC should not be installed. Only add scripts that are incompatible with VexonAC.",
      type: "list",
      placeholder: "advanced_vehicles, ...",
    },
    MaxThreatScore: {
      value: 90,
      label: "Max Threat Score",
      tooltip:
        "The maximum threat score a player can have. If a player's threat score exceeds this value, they won't be able to join the server. Threat score is based on player historical data and more across the VexonAC network.",
      type: "number",
    },
  },
};

