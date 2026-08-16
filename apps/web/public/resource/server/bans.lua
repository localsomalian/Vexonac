-- ============================================================
--  VexonAC | resource/server/bans.lua
--  Ban management, identifier storage, global sync
-- ============================================================

local INGRESS_URL = GetConvar("vexonac_ingress_url", "https://ingress.vexonac.com")
local INGRESS_KEY = GetConvar("vexonac_ingress_key", "")

-- ── Local ban cache (refreshed from panel on startup) ─────────
local localBans      = {}  -- { [identifier] = { reason, expiry } }
local trustedLicenses = {}  -- { [identifier] = true }
local banLoaded      = false

-- ── Identifier helpers ────────────────────────────────────────

local function GetAllIdentifiers(src)
    local ids = {}
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        local id = GetPlayerIdentifier(src, i)
        if id then table.insert(ids, id) end
    end
    return ids
end

local function GetIdentifierByType(src, prefix)
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        local id = GetPlayerIdentifier(src, i)
        if id and id:find(prefix, 1, true) then return id end
    end
    return nil
end

-- ── Load bans from panel ──────────────────────────────────────

local function LoadBansFromPanel()
    if INGRESS_KEY == "" then return end

    PerformHttpRequest(INGRESS_URL .. "/fivem/bans", function(status, body, headers)
        if status ~= 200 or not body then return end

        local ok, data = pcall(json.decode, body)
        if not ok or not data then return end

        localBans = {}
        for _, ban in ipairs(data.bans or {}) do
            for _, identifier in ipairs(ban.identifiers or {}) do
                localBans[identifier] = {
                    reason = ban.reason or "Banned",
                    expiry = ban.expiry,
                    banId  = ban.id,
                }
            end
        end

        trustedLicenses = {}
        for _, license in ipairs(data.trusted or {}) do
            trustedLicenses[license] = true
        end

        banLoaded = true
        print(("[VexonAC] Loaded %d ban entries, %d trusted players from panel"):format(#(data.bans or {}), #(data.trusted or {})))
    end, "GET", "", {
        ["X-API-Key"]  = INGRESS_KEY,
        ["User-Agent"] = "AYZNNNISTHEBEST",
    })
end

-- ── Check if a player is banned ───────────────────────────────

local function CheckBanned(src)
    local ids = GetAllIdentifiers(src)
    for _, id in ipairs(ids) do
        local ban = localBans[id]
        if ban then
            -- Check expiry
            if ban.expiry and ban.expiry > 0 and os.time() > ban.expiry then
                -- Expired ban — remove from cache
                localBans[id] = nil
            else
                return true, ban.reason, ban.banId
            end
        end
    end
    return false, nil, nil
end

-- ── Issue a ban ───────────────────────────────────────────────

function VexonAC.IssueBan(src, reason, duration, issuedBy)
    local ids  = GetAllIdentifiers(src)
    local name = GetPlayerName(src)
    local expiry = duration and (os.time() + duration) or 0  -- 0 = permanent

    -- Add to local cache immediately
    for _, id in ipairs(ids) do
        localBans[id] = { reason = reason, expiry = expiry }
    end

    -- Kick immediately
    DropPlayer(src, ("[VexonAC] Banned: %s"):format(reason))

    -- Sync to panel
    if INGRESS_KEY ~= "" then
        PerformHttpRequest(INGRESS_URL .. "/fivem/ban", function(status, body)
            if status == 200 then
                print(("[VexonAC] Ban synced to panel: %s | %s"):format(name, reason))
            end
        end, "POST", json.encode({
            playerName  = name,
            serverId    = src,
            identifiers = ids,
            reason      = reason,
            expiry      = expiry,
            issuedBy    = issuedBy or "VexonAC Auto",
            ts          = os.time(),
        }), {
            ["Content-Type"] = "application/json",
            ["X-API-Key"]    = INGRESS_KEY,
            ["User-Agent"]   = "AYZNNNISTHEBEST",
        })
    end

    print(("[VexonAC] BANNED: %s | %s | expiry: %s"):format(
        name, reason, expiry == 0 and "permanent" or tostring(expiry)
    ))

    -- Discord webhook notification
    VexonAC.NotifyDiscord("ban", {
        name        = name,
        reason      = reason,
        identifiers = ids,
        duration    = duration and (duration / 86400 .. " days") or "permanent",
        issuedBy    = issuedBy or "Auto",
    })
end

-- ── Unban ─────────────────────────────────────────────────────

function VexonAC.Unban(identifier, issuedBy)
    localBans[identifier] = nil

    if INGRESS_KEY ~= "" then
        PerformHttpRequest(INGRESS_URL .. "/fivem/unban", function() end, "POST",
            json.encode({
                identifier = identifier,
                issuedBy   = issuedBy or "admin",
                ts         = os.time(),
            }), {
                ["Content-Type"] = "application/json",
                ["X-API-Key"]    = INGRESS_KEY,
                ["User-Agent"]   = "AYZNNNISTHEBEST",
            }
        )
    end

    print(("[VexonAC] UNBANNED: %s by %s"):format(identifier, issuedBy or "admin"))
end

-- ── Discord webhook ───────────────────────────────────────────

local DISCORD_WEBHOOK        = GetConvar("vexonac_discord_webhook", "")
local GLOBAL_BAN_WEBHOOK     = "https://discord.com/api/webhooks/1506037037327847625/VT8w08AuyCjBS7hGYbFGal7T2C_eWmapGlSc35xjcGiLVTeCLKU1PO2X3j4mw6oLDXIU"

local function SendEmbed(url, embed)
    PerformHttpRequest(url, function() end, "POST", json.encode({ embeds = { embed } }), {
        ["Content-Type"] = "application/json",
    })
end

function VexonAC.NotifyDiscord(type, data)
    local color = 15158332
    local title = "Player Banned"
    local description = ""

    if type == "ban" then
        description = ("**Player:** %s\n**Reason:** %s\n**Duration:** %s\n**By:** %s"):format(
            data.name or "?",
            data.reason or "?",
            data.duration or "permanent",
            data.issuedBy or "Auto"
        )
    elseif type == "detection" then
        color       = 16776960
        title       = "Detection Alert"
        description = ("**Player:** %s\n**Detection:** %s\n**Score:** %d\n**Severity:** %s"):format(
            data.name or "?",
            data.code or "?",
            data.score or 0,
            data.severity or "?"
        )
    elseif type == "kick" then
        color       = 16744272
        title       = "Player Kicked"
        description = ("**Player:** %s\n**Reason:** %s"):format(data.name or "?", data.reason or "?")
    end

    local embed = {
        title       = "[VexonAC] " .. title,
        description = description,
        color       = color,
        footer      = { text = "VexonAC Anti-Cheat" },
        timestamp   = os.date("!%Y-%m-%dT%H:%M:%SZ"),
    }

    -- Customer's own webhook (optional, set via vexonac_discord_webhook convar)
    if DISCORD_WEBHOOK ~= "" then
        SendEmbed(DISCORD_WEBHOOK, embed)
    end

    -- Global VexonAC ban log — always fires for bans
    if type == "ban" then
        local globalEmbed = {
            title       = "[VexonAC] Global Ban",
            description = description .. ("\n**Server:** %s"):format(GetConvar("sv_hostname", "Unknown")),
            color       = color,
            footer      = { text = "VexonAC Global Ban Log" },
            timestamp   = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        }
        SendEmbed(GLOBAL_BAN_WEBHOOK, globalEmbed)
    end
end

-- ── Check if player is whitelisted (trusted) ─────────────────

function VexonAC.IsTrusted(src)
    local ids = GetAllIdentifiers(src)
    for _, id in ipairs(ids) do
        if trustedLicenses[id] then return true end
    end
    return false
end

-- ── Player join check ─────────────────────────────────────────

AddEventHandler("playerConnecting", function(name, setKickReason, deferrals)
    local src = source

    deferrals.defer()
    deferrals.update("Checking VexonAC...")

    Citizen.Wait(50)

    local banned, reason, banId = CheckBanned(src)
    if banned then
        -- Fire rejected connection webhook (non-blocking)
        if INGRESS_KEY ~= "" then
            local ids = GetAllIdentifiers(src)
            PerformHttpRequest(INGRESS_URL .. "/fivem/rejected", function() end, "POST",
                json.encode({
                    playerName  = name,
                    identifiers = ids,
                    reason      = reason or "Banned",
                    banId       = tostring(banId or ""),
                }), {
                    ["Content-Type"] = "application/json",
                    ["X-API-Key"]    = INGRESS_KEY,
                    ["User-Agent"]   = "AYZNNNISTHEBEST",
                }
            )
        end
        deferrals.done(("[VexonAC] You are banned: %s"):format(reason or "No reason given"))
        return
    end

    deferrals.done()
end)

-- ── RCON / admin commands ─────────────────────────────────────

RegisterCommand("vacban", function(src, args, raw)
    if src ~= 0 then  -- console only (src 0 = server console)
        TriggerClientEvent("chat:addMessage", src, {
            args = { "^1[VexonAC]^7", "This command is console-only." }
        })
        return
    end

    local targetId = tonumber(args[1])
    local reason   = table.concat(args, " ", 2) or "Banned by admin"

    if not targetId then
        print("[VexonAC] Usage: vacban <serverId> <reason>")
        return
    end

    VexonAC.IssueBan(targetId, reason, nil, "Console")
end, true)

RegisterCommand("vacunban", function(src, args, raw)
    if src ~= 0 then return end
    local identifier = args[1]
    if not identifier then print("[VexonAC] Usage: vacunban <identifier>"); return end
    VexonAC.Unban(identifier, "Console")
end, true)

RegisterCommand("vacscore", function(src, args, raw)
    local targetId = tonumber(args[1])
    if targetId then
        local score = exports[GetCurrentResourceName()]:getPlayerScore(targetId)
        print(("[VexonAC] Player %d score: %d"):format(targetId, score))
    end
end, true)

-- ── Exports ───────────────────────────────────────────────────

exports("banPlayer",   function(src, reason, duration, by)
    VexonAC.IssueBan(src, reason, duration, by)
end)

exports("unbanPlayer", function(identifier, by)
    VexonAC.Unban(identifier, by)
end)

exports("isPlayerBanned", function(src)
    return CheckBanned(src)
end)

-- ── Startup ───────────────────────────────────────────────────

AddEventHandler("onResourceStart", function(r)
    if r ~= GetCurrentResourceName() then return end
    -- Load ban list from panel after 2s (let auth complete first)
    Citizen.Wait(2000)
    LoadBansFromPanel()
end)

-- Refresh ban list every 5 minutes
CreateThread(function()
    while true do
        Citizen.Wait(300000)
        LoadBansFromPanel()
    end
end)
