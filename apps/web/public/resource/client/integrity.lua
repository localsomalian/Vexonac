-- ============================================================
--  VexonAC | resource/client/integrity.lua
--  Resource integrity, signature scanning, anti-bypass
-- ============================================================

-- ── Known cheat-injected globals ─────────────────────────────
-- Mod menus often expose global Lua tables or functions.
-- These should never exist in a clean client.

local CHEAT_GLOBALS = {
    -- 2take1
    "menu", "menu_v", "takemenu",
    -- Eulen
    "eulen", "eulen_menu",
    -- Cherax
    "cherax", "cherax_native",
    -- Stand
    "stand", "stand_menu", "stand_api",
    -- Kiddion
    "kiddion", "modest", "kiddion_menu",
    -- Generic executor
    "executor", "lua_executor", "script_executor",
    -- Hammafia / Nexus
    "hammafia", "nexus_menu",
    -- Common executor globals
    "getgenv", "getrenv", "getrawmetatable",
    "hookfunction", "hookmetamethod", "decompile",
    "readfile", "writefile", "appendfile", "listfiles",
    "getscripts", "getloadedmodules",
}

local function CheckCheatGlobals()
    for _, gname in ipairs(CHEAT_GLOBALS) do
        if _G[gname] ~= nil then
            Report("MENU_DETECTED", {
                global  = gname,
                type    = type(_G[gname]),
            })
            return  -- one report per tick is enough
        end
    end
end

-- ── Native function integrity ─────────────────────────────────
-- Cheats commonly hook/replace FiveM natives to bypass checks.
-- We verify critical natives are not returning impossible values.

local function CheckNativeIntegrity()
    local ped = PlayerPedId()

    -- GetPlayerInvincible should never return true for a clean client
    -- unless the server explicitly set it (admin tools, cutscene, etc.)
    -- We also check if entity invincibility and GetPlayerInvincible disagree
    local playerInvinc = GetPlayerInvincible(PlayerId())
    local entityInvinc = GetEntityInvincible(ped)

    -- Disagreement between entity and player invincibility = hook suspected
    if entityInvinc and not playerInvinc then
        Report("MENU_DETECTED", {
            type    = "native_spoof",
            detail  = "entity_invincible_mismatch",
        })
    end

    -- GetEntityHealth should never return >500 for on-foot player (max is 200+100 armor)
    local hp = GetEntityHealth(ped)
    if hp > 500 then
        Report("GODMODE", {
            type   = "impossible_health",
            health = hp,
        })
    end
end

-- ── Resource count monitoring ─────────────────────────────────
-- Track when new resources appear mid-session (injection vector)

local resourceSnapshot = nil

local function TakeResourceSnapshot()
    local snap = {}
    for i = 0, GetNumResources() - 1 do
        local name = GetResourceByFindIndex(i)
        if name then snap[name] = true end
    end
    return snap
end

local function CheckNewResources()
    if not resourceSnapshot then
        resourceSnapshot = TakeResourceSnapshot()
        return
    end

    local current = TakeResourceSnapshot()

    for name, _ in pairs(current) do
        if not resourceSnapshot[name] then
            -- New resource appeared mid-session
            local lower = name:lower()
            local matched = nil
            for _, keyword in ipairs(VexonAC.KnownMenuResources) do
                if lower:find(keyword, 1, true) then matched = keyword end
            end

            if matched then
                Report("RESOURCE_INJECT", {
                    resource = name,
                    matched  = matched,
                    injected = true,  -- appeared mid-session
                })
            else
                -- Unknown new resource — lower severity but still flag
                Report("RESOURCE_INJECT", {
                    resource = name,
                    matched  = "unknown_new_resource",
                    pts      = 20,
                })
            end
        end
    end

    resourceSnapshot = current
end

-- ── Freecam / Spectator detection ────────────────────────────
-- Legitimate gameplay keeps camera near the player ped.
-- Freecam tools place the render camera far away.

local freecamTicks = 0

local function CheckFreecam()
    local ped      = PlayerPedId()
    local pedCoord = GetEntityCoords(ped)
    local camCoord = GetFinalRenderedCamCoord()

    local dist = #(vector3(pedCoord.x, pedCoord.y, pedCoord.z) -
                   vector3(camCoord.x, camCoord.y, camCoord.z))

    -- Camera >60m from ped without being in a vehicle or ragdoll
    if dist > 60 and not IsPedInAnyVehicle(ped, false)
        and not IsPedRagdoll(ped) and not IsPlayerDead(PlayerId()) then
        freecamTicks = freecamTicks + 1
        if freecamTicks >= 3 then
            Report("SPECTATOR_ABUSE", {
                camDist = math.floor(dist),
                pedPos  = pedCoord,
                camPos  = camCoord,
                ticks   = freecamTicks,
            })
            freecamTicks = 0
        end
    else
        freecamTicks = math.max(0, freecamTicks - 1)
    end
end

-- ── Noclip velocity signature ─────────────────────────────────
-- Standard noclip moves the player horizontally through walls
-- with no vertical velocity change from gravity. Combined with
-- zero on-ground state = high confidence noclip.

local noclipSig = 0

local function CheckNoclipSignature()
    local ped    = PlayerPedId()
    local inV    = IsPedInAnyVehicle(ped, false)
    local inAir  = IsEntityInAir(ped)
    local onG    = IsPedOnGround(ped) or IsEntityOnGround(ped)
    if inV or onG then noclipSig = 0; return end

    local vel  = GetEntityVelocity(ped)
    local spd  = math.sqrt(vel.x^2 + vel.y^2 + vel.z^2)
    local hspd = math.sqrt(vel.x^2 + vel.y^2)  -- horizontal speed

    -- Moving fast horizontally while in air with near-zero vertical velocity
    -- and not parachuting or falling = noclip horizontal flight
    if hspd > 3.0 and math.abs(vel.z) < 0.5 and inAir and not IsPedFalling(ped) then
        noclipSig = noclipSig + 1
        if noclipSig >= 5 then
            Report("NOCLIP", {
                type   = "velocity_signature",
                hspd   = math.floor(hspd * 10) / 10,
                vspd   = math.floor(math.abs(vel.z) * 100) / 100,
                ticks  = noclipSig,
            })
            noclipSig = 0
        end
    else
        noclipSig = math.max(0, noclipSig - 1)
    end
end

-- ── Screenshot capture ────────────────────────────────────────
-- Auto-capture when detection score crosses threshold.
-- Uses screenshot-basic if available, otherwise skips silently.

local screenshotCooldown = 0

local function TakeScreenshot(reason, detId)
    local now = GetGameTimer()
    if (now - screenshotCooldown) < 20000 then return end  -- max 1 screenshot per 20s
    screenshotCooldown = now

    if GetResourceState("screenshot-basic") ~= "started" then return end

    local ok, err = pcall(function()
        exports["screenshot-basic"]:requestScreenshotUpload(
            "https://ingress.vexonac.com/fivem/screenshot",
            "screenshot",
            {
                headers = {
                    ["X-Detection-Id"] = tostring(detId or 0),
                    ["X-Reason"]       = reason or "detection",
                },
            },
            function(data)
                TriggerServerEvent("vexonac:screenshot", {
                    id     = detId,
                    url    = data,
                    reason = reason,
                })
            end
        )
    end)
end

RegisterNetEvent("vexonac:requestScreenshot")
AddEventHandler("vexonac:requestScreenshot", function(detId, reason)
    TakeScreenshot(reason or "detection", detId)
end)

-- ── Anti-tempban bypass ───────────────────────────────────────
-- Some cheaters clear their identifiers via HWID spoofing.
-- We can detect common spoofer signatures through native checks.

local function CheckIdentifierConsistency()
    -- FiveM license should always be present
    local licenseFound = false
    local steamFound   = false
    local ipFound      = false

    -- We can't read identifiers client-side, but we can verify
    -- the local player's token is consistent
    local token = GetPlayerToken(PlayerId(), 0)
    if not token or token == "" then
        Report("MENU_DETECTED", {
            type   = "missing_token",
            detail = "player token unavailable (identifier spoofer?)",
        })
    end
end

-- ── Threads ───────────────────────────────────────────────────

-- Fast integrity (1s)
CreateThread(function()
    Citizen.Wait(6000)
    while true do
        Citizen.Wait(1000)
        if not (DoesEntityExist(PlayerPedId()) and NetworkIsPlayerActive(PlayerId())) then
            goto next
        end
        pcall(CheckCheatGlobals)
        pcall(CheckNativeIntegrity)
        pcall(CheckFreecam)
        pcall(CheckNoclipSignature)
        ::next::
    end
end)

-- Medium integrity (10s)
CreateThread(function()
    Citizen.Wait(6000)
    while true do
        Citizen.Wait(10000)
        if not (DoesEntityExist(PlayerPedId()) and NetworkIsPlayerActive(PlayerId())) then
            goto next
        end
        pcall(CheckNewResources)
        pcall(CheckIdentifierConsistency)
        ::next::
    end
end)
