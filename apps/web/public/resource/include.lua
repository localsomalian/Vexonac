-- ============================================================
--  VexonAC | resource/include.lua
--  Shared configuration — loaded on both client and server
-- ============================================================

VexonAC = VexonAC or {}
VexonAC.Version = "2.1.0"

-- ── Shared identifier helper (server) ────────────────────────
function VexonAC.GetIds(src)
    local ids = {}
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        local id = GetPlayerIdentifier(src, i)
        if id then table.insert(ids, id) end
    end
    return ids
end

-- ── Detection point values ────────────────────────────────────
VexonAC.Points = {
    LOW      = 10,
    MEDIUM   = 25,
    HIGH     = 50,
    CRITICAL = 100,
}

-- ── Cumulative score thresholds ───────────────────────────────
VexonAC.Thresholds = {
    SCREENSHOT = 40,
    KICK       = 80,
    TEMP_BAN   = 120,
    PERM_BAN   = 200,
}

-- ── Detection registry  [code] = { pts, sev, autoBan } ───────
VexonAC.Det = {
    INVINCIBLE      = { pts = 100, sev = "CRITICAL", autoBan = true  },
    GODMODE         = { pts =  50, sev = "HIGH",     autoBan = false },
    NOCLIP          = { pts =  60, sev = "HIGH",     autoBan = false },
    SPEED_HACK      = { pts =  50, sev = "HIGH",     autoBan = false },
    SUPER_JUMP      = { pts =  25, sev = "MEDIUM",   autoBan = false },
    TELEPORT        = { pts =  50, sev = "HIGH",     autoBan = false },
    EXPLOSION_SPAM  = { pts =  30, sev = "HIGH",     autoBan = false },
    BLACKLIST_WEP   = { pts =  35, sev = "MEDIUM",   autoBan = false },
    BLACKLIST_VEH   = { pts =  15, sev = "LOW",      autoBan = false },
    ENTITY_SPAM     = { pts =  50, sev = "HIGH",     autoBan = false },
    INFINITE_AMMO   = { pts =  30, sev = "MEDIUM",   autoBan = false },
    RAPID_HEAL      = { pts =  40, sev = "HIGH",     autoBan = false },
    INVISIBLE       = { pts =  50, sev = "HIGH",     autoBan = false },
    RESOURCE_INJECT = { pts = 100, sev = "CRITICAL", autoBan = true  },
    FREEZE_HACK     = { pts =  25, sev = "MEDIUM",   autoBan = false },
    DAMAGE_MOD      = { pts =  60, sev = "HIGH",     autoBan = false },
    MENU_DETECTED   = { pts = 100, sev = "CRITICAL", autoBan = true  },
    NET_FLOOD       = { pts =  40, sev = "HIGH",     autoBan = false },
    VEHICLE_SPAWN   = { pts =  20, sev = "LOW",      autoBan = false },
    SUPER_DAMAGE    = { pts =  60, sev = "HIGH",     autoBan = false },
    OBJ_SPAM        = { pts =  40, sev = "HIGH",     autoBan = false },
    SPECTATOR_ABUSE = { pts =  20, sev = "MEDIUM",   autoBan = false },
    AIMBOT          = { pts =  75, sev = "HIGH",     autoBan = false },
    FREECAM         = { pts =  20, sev = "MEDIUM",   autoBan = false },
    HWID_BAN        = { pts = 100, sev = "CRITICAL", autoBan = true  },
    ECONOMY_EXPLOIT = { pts =  80, sev = "HIGH",     autoBan = false },
}

-- ── Speed limits (m/s) ────────────────────────────────────────
VexonAC.MaxSpeed = {
    onFoot    = 14,    -- ~50 km/h (sprinting)
    vehicle   = 110,   -- ~396 km/h (hypercar peak)
    aircraft  = 160,   -- jets / helis
    boat      = 30,
    swimming  = 4,
    parachute = 75,
}

-- ── Physics / movement ────────────────────────────────────────
VexonAC.MaxJumpHeight       = 4.5    -- metres above launch point
VexonAC.TeleportThreshold   = 280    -- metres per tick to flag
VexonAC.TeleportGracePeriod = 8000   -- ms after spawn before checking

-- ── Server-side rate limits ───────────────────────────────────
VexonAC.MaxExplosionsPerMin = 8
VexonAC.MaxEntitiesPerMin   = 35
VexonAC.MaxNetEventsPerSec  = 25

-- ── Blacklisted weapon hashes ─────────────────────────────────
VexonAC.BlacklistedWeapons = {
    -- Alien / seasonal weapons (almost always spawned via cheat)
    ["RAYPISTOL"]     = -1357824103,
    ["RAYCARBINE"]    = 1752584910,
    ["RAYMINIGUN"]    = -1063057011,
    -- Exploit-prone
    ["FERTILIZERCAN"] = -584798583,
    ["HAZARDCAN"]     = 118223561,
    -- Military-only
    ["MINIGUN"]       = 1119849093,
    -- Special
    ["TRANQUILIZER"]  = 911657153,
    ["STUNGUN_MP"]    = 2018111900,
    ["HEAVYRIFLE"]    = -1123641424,
    ["MILITARYRIFLE"] = 2228681469,
}

-- ── Known injected mod-menu resource names ────────────────────
VexonAC.KnownMenuResources = {
    "eulen", "2take1", "cherax", "stand", "ozark",
    "phantom", "kiddion", "modest", "trainer", "executor",
    "inject", "dumped", "nexus", "hammafia", "redengine",
    "bigbase", "goose", "impulse", "lunarclient", "eclipse",
    "skulk", "vanillaunix", "midnight",
}

-- ── Blacklisted vehicle models ────────────────────────────────
-- Servers can clear / extend this table
VexonAC.BlacklistedVehicles = {
    -- Modded / non-DLC obtainable
}
