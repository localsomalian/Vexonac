-- ============================================================
--  VexonAC | resource/server/events.lua
--  Server-side event validation, damage hooks, framework hooks
-- ============================================================

local INGRESS_URL = GetConvar("vexonac_ingress_url", "https://ingress.vexonac.com")
local INGRESS_KEY = GetConvar("vexonac_ingress_key", "")

-- ── Per-player event rate tracking ───────────────────────────

local eventRates   = {}
local damageStats  = {}    -- [src] = { hits, headshots, kills, damageTotal }
local shadowBanned = {}    -- [src] = true  (ghost mode)

local RATE_LIMITS = {
    ["default"]              = { limit = 25,  window = 1000 },
    ["explosionEvent"]       = { limit = 3,   window = 1000 },
    ["weaponDamageEvent"]    = { limit = 60,  window = 1000 },
    ["entityCreated"]        = { limit = 10,  window = 1000 },
    ["gameEventTriggered"]   = { limit = 100, window = 1000 },
}

-- ── Rate limit checker ────────────────────────────────────────

local function RateLimit(src, eventName)
    if not eventRates[src] then eventRates[src] = {} end
    local cfg = RATE_LIMITS[eventName] or RATE_LIMITS["default"]
    local now = GetGameTimer()

    if not eventRates[src][eventName] then
        eventRates[src][eventName] = { count = 0, window = now }
    end

    local r = eventRates[src][eventName]
    if (now - r.window) > cfg.window then
        r.count = 0; r.window = now
    end

    r.count = r.count + 1
    if r.count > cfg.limit then
        Score(src, "NET_FLOOD", VexonAC.Det.NET_FLOOD.pts, {
            event  = eventName,
            rate   = r.count,
            limit  = cfg.limit,
        })
        r.count = 0
        return true  -- exceeded
    end
    return false
end

-- ── Shadow ban (ghost mode) ───────────────────────────────────
-- Isolates cheater: they think they're playing but their
-- actions are silently dropped. Collects more evidence.

function VexonAC.ShadowBan(src)
    if shadowBanned[src] then return end
    shadowBanned[src] = true

    -- Notify client silently (invisible flag on their end)
    TriggerClientEvent("vexonac:shadow", src)

    -- Tell panel
    local INGRESS_KEY_local = INGRESS_KEY
    if INGRESS_KEY_local ~= "" then
        PerformHttpRequest(INGRESS_URL .. "/fivem/shadow", function() end, "POST",
            json.encode({
                serverId    = src,
                playerName  = GetPlayerName(src),
                identifiers = VexonAC.GetIds(src),
                ts          = os.time(),
            }), {
                ["Content-Type"] = "application/json",
                ["X-API-Key"]    = INGRESS_KEY_local,
                ["User-Agent"]   = "AYZNNNISTHEBEST",
            }
        )
    end

    print(("[VexonAC] SHADOW BAN: %s — collecting additional evidence"):format(GetPlayerName(src)))

    -- Auto-ban after 2 minutes of shadow observation
    Citizen.SetTimeout(120000, function()
        if GetPlayerName(src) then  -- still connected
            VexonAC.IssueBan(src, "VexonAC Auto-Ban (shadow confirmed)", nil, "Shadow System")
        end
    end)
end

function VexonAC.IsShadowBanned(src)
    return shadowBanned[src] == true
end

-- ── CEventNetworkEntityDamage (damage hook) ───────────────────
-- Most valuable server-side hook. Contains attacker, victim,
-- weapon, damage amount, and hit bone.

local HEAD_BONES = { 31086, 31085, 31084 }  -- head, jaw, skull
local function IsHeadBone(bone)
    for _, b in ipairs(HEAD_BONES) do
        if bone == b then return true end
    end
    return false
end

-- Max legitimate damage per weapon type (weapon class → damage cap)
-- These are generous caps — any single hit exceeding them = modified damage
local WEAPON_DAMAGE_CAPS = {
    ["PISTOL"]       = 165,
    ["SMG"]          = 120,
    ["SHOTGUN"]      = 360,  -- buckshot spread
    ["RIFLE"]        = 300,
    ["SNIPER"]       = 500,
    ["LMG"]          = 150,
    ["MELEE"]        = 200,
    ["EXPLOSIVE"]    = 3000, -- high but rockets are big
    ["DEFAULT"]      = 400,
}

local function GetWeaponClass(wepHash)
    -- Rough weapon class from hash groups
    local pistols  = { 453432689, 584646201, 741586613, 2932268823, 2578778090 }
    local rifles   = { 2210333304, 3220176059, 2105793587, 2228681469, -1023367789 }
    local snipers  = { 100416529, 2634544996, 100416529, 205991906, 3523564046 }
    local shotguns = { 487013001, 2017895192, 1432025498, 3800352039 }
    local smgs     = { 324215364, 736523883, 2024373456, 171789620 }
    local lmgs     = { 2461879995, 1627465347, 3169388707 }

    for _, h in ipairs(pistols)  do if wepHash == h then return "PISTOL"  end end
    for _, h in ipairs(rifles)   do if wepHash == h then return "RIFLE"   end end
    for _, h in ipairs(snipers)  do if wepHash == h then return "SNIPER"  end end
    for _, h in ipairs(shotguns) do if wepHash == h then return "SHOTGUN" end end
    for _, h in ipairs(smgs)     do if wepHash == h then return "SMG"     end end
    for _, h in ipairs(lmgs)     do if wepHash == h then return "LMG"     end end
    return "DEFAULT"
end

AddEventHandler("gameEventTriggered", function(name, args)
    local src = source
    if not src or src == 0 then return end

    if RateLimit(src, "gameEventTriggered") then return end

    -- ── Damage event ─────────────────────────────────────────
    if name == "CEventNetworkEntityDamage" then
        local victimEnt   = args[1]
        local attackerEnt = args[2]
        local weaponHash  = args[5]
        local damage      = args[6]
        local isKill      = args[8]
        local bone        = args[11]

        if not damage or not attackerEnt then return end

        -- Only process damage from real players
        local attackerPlayer = NetworkGetEntityOwner(attackerEnt)
        if not attackerPlayer or attackerPlayer == 0 then return end
        attackerPlayer = GetPlayerFromEntity(attackerEnt)

        -- Shadow ban: silently drop damage from ghost players
        if VexonAC.IsShadowBanned(attackerPlayer) then
            CancelEvent()
            return
        end

        -- ── Damage validation ─────────────────────────────────
        local wClass  = GetWeaponClass(weaponHash or 0)
        local cap     = WEAPON_DAMAGE_CAPS[wClass] or WEAPON_DAMAGE_CAPS["DEFAULT"]

        if damage > cap then
            Score(attackerPlayer, "DAMAGE_MOD", VexonAC.Det.DAMAGE_MOD.pts, {
                damage  = damage,
                cap     = cap,
                weapon  = weaponHash,
                class   = wClass,
            })
            CancelEvent()
        end

        -- ── Headshot ratio tracking ───────────────────────────
        if not damageStats[attackerPlayer] then
            damageStats[attackerPlayer] = { hits = 0, headshots = 0, kills = 0 }
        end
        local ds = damageStats[attackerPlayer]
        ds.hits = ds.hits + 1
        if bone and IsHeadBone(bone) then ds.headshots = ds.headshots + 1 end
        if isKill then ds.kills = ds.kills + 1 end

        -- Evaluate headshot ratio after enough samples
        if ds.hits >= 30 then
            local hsRatio = ds.headshots / ds.hits
            -- >65% headshots on 30+ hits is statistically near-impossible for humans
            if hsRatio > 0.65 then
                Score(attackerPlayer, "AIMBOT", VexonAC.Det.AIMBOT and VexonAC.Det.AIMBOT.pts or 60, {
                    type      = "headshot_ratio",
                    ratio     = math.floor(hsRatio * 100),
                    hits      = ds.hits,
                    headshots = ds.headshots,
                })
            end
            -- Reset window
            damageStats[attackerPlayer] = { hits = 0, headshots = 0, kills = 0 }
        end
    end

    -- ── Explosion event validation ────────────────────────────
    if name == "CEventExplosion" then
        if RateLimit(src, "explosionEvent") then CancelEvent() end
    end
end)

-- ── Weapon damage event ───────────────────────────────────────

AddEventHandler("weaponDamageEvent", function(sender, ev)
    if not ev then return end
    if RateLimit(sender, "weaponDamageEvent") then CancelEvent(); return end

    local damage = ev.weaponDamage or 0
    if damage > 5000 then
        Score(sender, "DAMAGE_MOD", VexonAC.Det.DAMAGE_MOD.pts, {
            damage = damage,
            weapon = ev.weaponType,
            source = "weaponDamageEvent",
        })
        CancelEvent()
    end
end)

-- ── Explosion event ───────────────────────────────────────────

local explosionCounts = {}

AddEventHandler("explosionEvent", function(sender, ev)
    if sender == 0 then return end  -- NPC / world

    if RateLimit(sender, "explosionEvent") then
        Score(sender, "EXPLOSION_SPAM", VexonAC.Det.EXPLOSION_SPAM.pts, {
            count  = RATE_LIMITS["explosionEvent"].limit,
            type   = ev and ev.explosionType,
        })
        CancelEvent()
        return
    end

    -- Blacklisted explosion types (not normally player-accessible)
    local BLACKLISTED_EXP_TYPES = { 59, 63, 64, 65, 66, 67, 68 }
    if ev and ev.explosionType then
        for _, t in ipairs(BLACKLISTED_EXP_TYPES) do
            if ev.explosionType == t then
                Score(sender, "EXPLOSION_SPAM", VexonAC.Det.EXPLOSION_SPAM.pts + 20, {
                    type   = ev.explosionType,
                    reason = "blacklisted_explosion_type",
                })
                CancelEvent()
                return
            end
        end
    end

    -- Shadow ban: cancel their explosions
    if VexonAC.IsShadowBanned(sender) then CancelEvent() end
end)

-- ── Entity created ────────────────────────────────────────────

local entityCounts = {}

AddEventHandler("entityCreated", function(entity)
    local src = source
    if not src or src == 0 then return end
    if RateLimit(src, "entityCreated") then
        Score(src, "ENTITY_SPAM", VexonAC.Det.ENTITY_SPAM.pts, {
            rate = RATE_LIMITS["entityCreated"].limit,
        })
        -- Delete the entity
        if DoesEntityExist(entity) then DeleteEntity(entity) end
    end
end)

-- ── Framework event hooking ───────────────────────────────────
-- Hook common economy/inventory events to prevent exploitation.
-- Works with ESX, QBCore, or custom frameworks.

-- List of known economy event names that should be server-authoritative only
local PROTECTED_ECONOMY_EVENTS = {
    "esx:addMoney", "esx:removeMoney", "esx:setMoney",
    "esx:addInventoryItem", "esx:removeInventoryItem",
    "esx:setAccountMoney", "esx:addAccountMoney",
    "QBCore:Server:AddMoney", "QBCore:Server:RemoveMoney",
    "QBCore:Server:AddItem", "QBCore:Server:RemoveItem",
    "vRP:giveMoney", "vRP:setMoney",
    "ox_inventory:addItem", "ox_inventory:removeItem",
}

for _, evName in ipairs(PROTECTED_ECONOMY_EVENTS) do
    AddEventHandler(evName, function(...)
        local src = source
        if not src or src == 0 then return end

        -- These events should be triggered by the server (src == -1 internal)
        -- If triggered by a client directly = exploit attempt
        if src > 0 then  -- client-triggered
            Score(src, "NET_FLOOD", 60, {
                event   = evName,
                reason  = "client_triggered_server_event",
            })
            CancelEvent()
        end
    end)
end

-- ── HWID / fingerprint receipt ────────────────────────────────

RegisterNetEvent("vexonac:hwid")
AddEventHandler("vexonac:hwid", function(token)
    local src = source
    if not src or src == 0 then return end

    -- Store the HWID token linked to this player's session
    local name = GetPlayerName(src)
    local ids  = VexonAC.GetIds and VexonAC.GetIds(src) or {}

    -- Forward to panel for ban checking / storage
    if INGRESS_KEY ~= "" then
        PerformHttpRequest(INGRESS_URL .. "/fivem/hwid", function(status, body)
            if status == 200 and body then
                local ok, data = pcall(json.decode, body)
                if ok and data and data.banned then
                    VexonAC.IssueBan(src,
                        "VexonAC HWID Ban: " .. (data.reason or "Hardware ban"),
                        nil, "HWID System"
                    )
                end
            end
        end, "POST", json.encode({
            token       = token,
            playerName  = name,
            identifiers = ids,
            ts          = os.time(),
        }), {
            ["Content-Type"] = "application/json",
            ["X-API-Key"]    = INGRESS_KEY,
            ["User-Agent"]   = "AYZNNNISTHEBEST",
        })
    end
end)

-- ── Screenshot received ───────────────────────────────────────

RegisterNetEvent("vexonac:screenshot")
AddEventHandler("vexonac:screenshot", function(data)
    local src = source
    print(("[VexonAC] Screenshot received from %s | detection: %s"):format(
        GetPlayerName(src), data and data.id or "?"
    ))
    -- URL was uploaded directly from client to ingress — just log receipt
end)

-- ── Cleanup ───────────────────────────────────────────────────

AddEventHandler("playerDropped", function()
    local src = source
    eventRates[src]   = nil
    damageStats[src]  = nil
    shadowBanned[src] = nil
    explosionCounts[src] = nil
    entityCounts[src]    = nil
end)

-- ── Add AIMBOT to detection registry (not in include.lua yet) ─
VexonAC.Det.AIMBOT = { pts = 75, sev = "HIGH", autoBan = false }
