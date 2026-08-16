-- ============================================================
--  VexonAC | resource/server/exports.lua
--  Detection engine, scoring, config fetch, panel reporting
-- ============================================================

local scores      = {}   -- [src] = { score, dets, rates, kicked }
local explosions  = {}   -- [src] = { count, reset }
local entities    = {}   -- [src] = { count, reset }
local heartbeats  = {}   -- [src] = { pos, health, speed, ts }
local eventRates  = {}   -- [src][event] = { count, window }
local joinTimes   = {}   -- [src] = GetGameTimer()  (for playtime tracking)

local INGRESS_URL = GetConvar("vexonac_ingress_url", "https://ingress.vexonac.com")
local INGRESS_KEY = GetConvar("vexonac_ingress_key", "")

-- ── Panel HTTP ────────────────────────────────────────────────

local function PostToPanel(path, body)
    if INGRESS_KEY == "" then return end
    PerformHttpRequest(INGRESS_URL .. path, function() end, "POST",
        json.encode(body),
        {
            ["Content-Type"] = "application/json",
            ["X-API-Key"]    = INGRESS_KEY,
            ["User-Agent"]   = "AYZNNNISTHEBEST",
        }
    )
end

local function GetToPanel(path, cb)
    if INGRESS_KEY == "" then return end
    PerformHttpRequest(INGRESS_URL .. path, function(status, body)
        if status == 200 and body then
            local ok, data = pcall(json.decode, body)
            if ok and data then cb(data) end
        end
    end, "GET", "", { ["Content-Type"] = "application/json", ["User-Agent"] = "AYZNNNISTHEBEST" })
end

local function GetIdentifiers(src)
    local ids = {}
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        table.insert(ids, GetPlayerIdentifier(src, i))
    end
    return ids
end

-- ── Apply panel configuration ────────────────────────────────

local function ApplyConfig(cfg)
    if not cfg then return end

    local main = cfg.Main or {}
    local sets = cfg.Settings or {}

    -- Speed limits
    if cfg.Premium and cfg.Premium.CustomSpeedLimits then
        if cfg.Premium.FootSpeedLimit  and cfg.Premium.FootSpeedLimit  > 0 then VexonAC.MaxSpeed.onFoot  = cfg.Premium.FootSpeedLimit  end
        if cfg.Premium.VehicleSpeedLimit and cfg.Premium.VehicleSpeedLimit > 0 then VexonAC.MaxSpeed.vehicle = cfg.Premium.VehicleSpeedLimit end
    end

    -- Thresholds
    if sets.KickScore       then VexonAC.Thresholds.KICK      = sets.KickScore      end
    if sets.TempBanScore    then VexonAC.Thresholds.TEMP_BAN  = sets.TempBanScore   end
    if sets.PermBanScore    then VexonAC.Thresholds.PERM_BAN  = sets.PermBanScore   end
    if sets.ScreenshotScore then VexonAC.Thresholds.SCREENSHOT = sets.ScreenshotScore end

    -- Ban system: if disabled, push perm-ban score to infinity so it never fires
    if sets.EnableBans == false then
        VexonAC.Thresholds.PERM_BAN = 999999
        VexonAC.Thresholds.TEMP_BAN = 999999
    end

    -- Ban duration (seconds, -1 = permanent)
    if sets.BanDuration then VexonAC.BanDuration = sets.BanDuration end

    -- Detection gates: disable specific checks based on config flags
    if main.AntiTeleport  == false then VexonAC.Det.TELEPORT.pts   = 0 end
    if main.AntiNoClip    == false then VexonAC.Det.NOCLIP.pts     = 0 end
    if main.AntiSpeedHack == false then VexonAC.Det.SPEED_HACK.pts = 0 end
    if main.AntiFreeCam   == false then VexonAC.Det.FREECAM.pts    = 0 end
    if main.AntiGodMode   == false then VexonAC.Det.GODMODE.pts    = 0 end
    if main.AntiAimbot    == false then VexonAC.Det.AIMBOT.pts     = 0 end

    print("[VexonAC] Config applied from panel")
end

-- ── Fetch config from panel ───────────────────────────────────

local function FetchConfig()
    if INGRESS_KEY == "" then return end
    GetToPanel("/api/license/" .. INGRESS_KEY .. "/config", function(data)
        if data and data.configuration then
            ApplyConfig(data.configuration)
        end
    end)
end

-- ── Player score state ────────────────────────────────────────

local function GetState(src)
    if not scores[src] then
        scores[src] = {
            score  = 0,
            dets   = {},
            rates  = {},
            kicked = false,
        }
    end
    return scores[src]
end

-- ── Score a detection ─────────────────────────────────────────

function Score(src, code, pts, evidence)
    if pts == 0 then return end  -- detection disabled by config
    if not GetPlayerName(src) then return end  -- player already disconnected
    if VexonAC.IsTrusted and VexonAC.IsTrusted(src) then return end  -- trusted player bypass

    local state = GetState(src)
    local now   = GetGameTimer()

    local r = state.rates[code] or { count = 0, window = now }
    if (now - r.window) > 60000 then
        r.count = 1; r.window = now
    else
        r.count = r.count + 1
        if r.count > 3 then pts = math.max(1, math.floor(pts * 0.5)) end
    end
    state.rates[code] = r

    state.score = state.score + pts

    local det = {
        code       = code,
        pts        = pts,
        evidence   = evidence or {},
        ts         = os.time(),
        totalScore = state.score,
    }
    table.insert(state.dets, det)
    if #state.dets > 100 then table.remove(state.dets, 1) end

    local name = GetPlayerName(src)
    print(("[VexonAC] %s | %s +%d pts | total: %d"):format(name, code, pts, state.score))

    PostToPanel("/fivem/detection", {
        playerName  = name,
        identifiers = GetIdentifiers(src),
        detection   = det,
    })

    if state.score >= VexonAC.Thresholds.SCREENSHOT then
        TriggerClientEvent("vexonac:requestScreenshot", src, os.time())
    end

    local det_info = VexonAC.Det[code]
    if det_info and det_info.autoBan then
        VexonAC.BanPlayer(src, "[VexonAC] Auto-ban: " .. code)
        return
    end

    if state.score >= VexonAC.Thresholds.PERM_BAN then
        VexonAC.BanPlayer(src, "[VexonAC] Score " .. state.score .. " — permanent ban")
    elseif state.score >= VexonAC.Thresholds.TEMP_BAN then
        VexonAC.BanPlayer(src, "[VexonAC] Score " .. state.score .. " — removed from server")
    elseif state.score >= VexonAC.Thresholds.KICK and not state.kicked then
        state.kicked = true
        DropPlayer(src, "[VexonAC] Suspicious activity detected. Score: " .. state.score)
    end
end

-- ── Ban helper ────────────────────────────────────────────────

function VexonAC.BanPlayer(src, reason)
    -- Clear score state immediately so in-flight events don't re-trigger bans.
    scores[src] = nil

    -- Delegate to IssueBan (defined in bans.lua) so the player is added to
    -- localBans right away — preventing immediate reconnect while the panel
    -- processes the ban asynchronously.
    VexonAC.IssueBan(src, reason, nil, "VexonAC Auto")
end

-- ── Save playtime + fire leave webhook on disconnect ──────────

AddEventHandler("playerDropped", function(reason)
    local src = source
    if not src or src == 0 then return end

    -- Calculate time online in minutes
    local joinTime = joinTimes[src]
    if joinTime and INGRESS_KEY ~= "" then
        local license = GetPlayerIdentifier(src, 0) or ""
        local elapsed = math.floor((GetGameTimer() - joinTime) / 60000)
        if elapsed > 0 and license ~= "" then
            PerformHttpRequest(
                INGRESS_URL .. "/api/license/" .. INGRESS_KEY .. "/savePlayTime",
                function() end,
                "POST",
                json.encode({ playerLicense = license, timeOnline = elapsed }),
                {
                    ["Content-Type"]     = "application/json",
                    ["User-Agent"]       = "FXServer",
                }
            )
        end
    end

    -- Fire leave notification via panel
    local name    = GetPlayerName(src) or "Unknown"
    local license = GetPlayerIdentifier(src, 0) or ""
    if license ~= "" then
        PostToPanel("/fivem/leave", {
            playerName    = name,
            playerLicense = license,
            identifiers   = GetIdentifiers(src),
        })
    end

    -- Cleanup state
    scores[src]     = nil
    explosions[src] = nil
    entities[src]   = nil
    heartbeats[src] = nil
    eventRates[src] = nil
    joinTimes[src]  = nil
end)

-- ── Track join time + fire join webhook ───────────────────────

AddEventHandler("playerJoining", function()
    local src = source
    if not src or src == 0 then return end
    joinTimes[src] = GetGameTimer()
    -- Send join notification to panel for Discord webhook
    Citizen.SetTimeout(3000, function()
        local pName    = GetPlayerName(src) or "Unknown"
        local license  = GetPlayerIdentifier(src, 0) or ""
        local ids      = GetIdentifiers(src)
        if license ~= "" then
            PostToPanel("/fivem/join", {
                playerName    = pName,
                playerLicense = license,
                identifiers   = ids,
            })
        end
    end)
end)

-- ── Client detection event ────────────────────────────────────

RegisterNetEvent("vexonac:detection")
AddEventHandler("vexonac:detection", function(data)
    local src = source
    if not src or src == 0 then return end

    local code = data and data.code
    if not code or not VexonAC.Det[code] then return end

    local det = VexonAC.Det[code]
    Score(src, code, data.pts or det.pts, data.evidence)
end)

-- ── Heartbeat + server-side validation ───────────────────────

RegisterNetEvent("vexonac:heartbeat")
AddEventHandler("vexonac:heartbeat", function(data)
    local src = source
    if not src or src == 0 or not data then return end

    local prev = heartbeats[src]
    heartbeats[src] = { pos = data.pos, health = data.health, speed = data.speed, ts = os.time() }

    if not prev then return end

    local spd = data.speed or 0
    if spd > VexonAC.MaxSpeed.aircraft * 1.5 then
        Score(src, "SPEED_HACK", VexonAC.Det.SPEED_HACK.pts, { speed = spd, source = "heartbeat" })
    end

    if prev.pos and data.pos then
        local d = math.sqrt(
            (data.pos.x - prev.pos.x)^2 +
            (data.pos.y - prev.pos.y)^2 +
            (data.pos.z - prev.pos.z)^2
        )
        if d > 5000 then
            Score(src, "TELEPORT", VexonAC.Det.TELEPORT.pts, { dist = math.floor(d), source = "heartbeat" })
        end
    end
end)

-- ── Explosion monitoring ──────────────────────────────────────

AddEventHandler("explosionEvent", function(sender, ev)
    if sender == 0 then return end

    if not explosions[sender] then
        explosions[sender] = { count = 0, reset = GetGameTimer() }
    end
    local e = explosions[sender]

    if (GetGameTimer() - e.reset) > 60000 then e.count = 0; e.reset = GetGameTimer() end
    e.count = e.count + 1

    if e.count > VexonAC.MaxExplosionsPerMin then
        Score(sender, "EXPLOSION_SPAM", VexonAC.Det.EXPLOSION_SPAM.pts, {
            count = e.count,
            type  = ev.explosionType,
            pos   = ev.posX and { x = ev.posX, y = ev.posY, z = ev.posZ },
        })
        e.count = 0
    end
end)

-- ── Entity spam ───────────────────────────────────────────────

AddEventHandler("entityCreating", function(handle)
    local src = source
    if not src or src == 0 then return end

    if not entities[src] then entities[src] = { count = 0, reset = GetGameTimer() } end
    local e = entities[src]

    if (GetGameTimer() - e.reset) > 60000 then e.count = 0; e.reset = GetGameTimer() end
    e.count = e.count + 1

    if e.count > VexonAC.MaxEntitiesPerMin then
        Score(src, "ENTITY_SPAM", VexonAC.Det.ENTITY_SPAM.pts, { count = e.count })
        e.count = 0
    end
end)

-- ── Weapon damage validation ──────────────────────────────────

AddEventHandler("weaponDamageEvent", function(sender, ev)
    if not ev or not ev.weaponDamage then return end
    if ev.weaponDamage > 5000 then
        Score(sender, "DAMAGE_MOD", VexonAC.Det.DAMAGE_MOD.pts, {
            damage = ev.weaponDamage,
            weapon = ev.weaponType,
        })
        CancelEvent()
    end
end)

-- ── Net event rate limiting ───────────────────────────────────

local function TrackNetEvent(src, eventName)
    if not eventRates[src] then eventRates[src] = {} end
    local rates = eventRates[src]
    local now   = GetGameTimer()

    if not rates[eventName] then rates[eventName] = { count = 0, window = now } end
    local r = rates[eventName]

    if (now - r.window) > 1000 then r.count = 0; r.window = now end
    r.count = r.count + 1

    if r.count > VexonAC.MaxNetEventsPerSec then
        Score(src, "NET_FLOOD", VexonAC.Det.NET_FLOOD.pts, { event = eventName, rate = r.count })
        return true
    end
    return false
end

for _, evName in ipairs({ "explosionEvent", "entityCreating", "weaponDamageEvent" }) do
    AddEventHandler(evName, function()
        TrackNetEvent(source, evName)
    end)
end

-- ── Reload config on panel update ────────────────────────────

AddEventHandler("vexonac:configUpdate", function()
    FetchConfig()
end)

-- ── Public exports ────────────────────────────────────────────

exports("getPlayerScore",      function(src) local s = scores[src]; return s and s.score or 0 end)
exports("getPlayerDetections", function(src) local s = scores[src]; return s and s.dets  or {} end)
exports("banPlayer",           function(src, reason) VexonAC.BanPlayer(src, reason or "Banned by server") end)

-- ── Periodic config refresh (every 5 minutes) ────────────────

CreateThread(function()
    Wait(5000)  -- initial delay
    while true do
        FetchConfig()
        Wait(300000)  -- 5 minutes
    end
end)

-- ── Startup ───────────────────────────────────────────────────

AddEventHandler("onResourceStart", function(r)
    if r ~= GetCurrentResourceName() then return end
    print(("[VexonAC] Detection engine v%s started | Ingress: %s"):format(VexonAC.Version, INGRESS_URL))
    if INGRESS_KEY == "" then
        print("[VexonAC] WARNING: vexonac_ingress_key not set — panel reporting disabled")
    end
end)
