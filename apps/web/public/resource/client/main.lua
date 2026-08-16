-- ============================================================
--  VexonAC | resource/client/main.lua
--  Client-side detection engine — 2.0
-- ============================================================

-- ── State ─────────────────────────────────────────────────────
local ready            = false
local spawnedAt        = 0
local lastPos          = nil
local noclipLastPos    = nil
local noclipHits       = 0
local wasOnGround      = true
local groundZ          = nil
local jumpPeakZ        = nil
local healTracker      = { lowAt = 0 }
local freezeTicks      = 0
local wepBlacklisted   = {}
local ammoSamples      = {}
local firingTicks      = {}
local reportCooldowns  = {}

-- ── Helpers ───────────────────────────────────────────────────

local function Ped()  return PlayerPedId() end
local function Me()   return PlayerId()    end

local function Ready()
    local p = Ped()
    return DoesEntityExist(p)
        and not IsEntityDead(p)
        and NetworkIsPlayerActive(Me())
end

local function Vec3(c) return vector3(c.x, c.y, c.z) end

-- Send a detection to the server (with per-code cooldown).
local function Report(code, evidence, overridePts)
    local now = GetGameTimer()
    if reportCooldowns[code] and (now - reportCooldowns[code]) < 12000 then
        return
    end
    reportCooldowns[code] = now

    local det = VexonAC.Det[code]
    if not det then return end

    TriggerServerEvent("vexonac:detection", {
        code     = code,
        pts      = overridePts or det.pts,
        sev      = det.sev,
        evidence = evidence or {},
    })
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Invincible flag
-- ════════════════════════════════════════════════════════════
local invincibleTicks = 0
local function CheckInvincible()
    -- GTA sets invincibility during the spawn sequence; ignore the first 20s after resource start.
    if GetGameTimer() - spawnedAt < 20000 then invincibleTicks = 0; return end
    if GetPlayerInvincible(Me()) then
        invincibleTicks = invincibleTicks + 1
        if invincibleTicks >= 8 then  -- 8 × 500ms = 4s sustained invincibility
            Report("INVINCIBLE", {
                health = GetEntityHealth(Ped()),
                armor  = GetPedArmour(Ped()),
            })
            invincibleTicks = 0
        end
    else
        invincibleTicks = 0
    end
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: God mode (rapid health restore)
-- ════════════════════════════════════════════════════════════
local function CheckGodMode()
    local p      = Ped()
    local hp     = GetEntityHealth(p)
    local maxHP  = GetEntityMaxHealth(p)
    local pct    = hp / maxHP

    if pct < 0.25 then
        healTracker.lowAt = GetGameTimer()
    end

    if hp >= maxHP - 2 and healTracker.lowAt > 0 then
        local elapsed = GetGameTimer() - healTracker.lowAt
        -- Full heal from <25% in under 600ms is physically impossible
        if elapsed < 600 then
            Report("GODMODE", {
                fromPct   = 25,
                toHP      = hp,
                msElapsed = elapsed,
            })
            healTracker.lowAt = 0
        end
    end
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Speed hack
-- ════════════════════════════════════════════════════════════
local speedViolations = 0
local function CheckSpeed()
    local p    = Ped()
    local spd  = GetEntitySpeed(p)
    local inV  = IsPedInAnyVehicle(p, false)
    local swim = IsPedSwimming(p)
    local para = IsPedInParachuteFreeFall(p)

    -- Skip when falling / ragdoll — map fall-through causes false positives
    if not inV and (IsPedFalling(p) or IsPedRagdoll(p) or IsEntityInAir(p)) then
        speedViolations = math.max(0, speedViolations - 1)
        return
    end

    local limit
    if inV then
        local veh   = GetVehiclePedIsIn(p, false)
        local cls   = GetVehicleClass(veh)
        if cls == 15 or cls == 16 then  -- heli / plane
            limit = VexonAC.MaxSpeed.aircraft
        elseif cls == 14 then           -- boat
            limit = VexonAC.MaxSpeed.boat
        else
            limit = VexonAC.MaxSpeed.vehicle
        end
    elseif swim then
        limit = VexonAC.MaxSpeed.swimming
    elseif para then
        limit = VexonAC.MaxSpeed.parachute
    else
        limit = VexonAC.MaxSpeed.onFoot
    end

    -- 30% buffer for physics spikes / lag
    if spd > limit * 1.3 then
        speedViolations = speedViolations + 1
        if speedViolations >= 3 then
            Report("SPEED_HACK", {
                speed    = math.floor(spd * 10) / 10,
                limit    = limit,
                inVehicle = inV,
            })
            speedViolations = 0
        end
    else
        speedViolations = math.max(0, speedViolations - 1)
    end
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Teleportation
-- ════════════════════════════════════════════════════════════
local function CheckTeleport()
    local p = Ped()
    local c = GetEntityCoords(p)
    if GetGameTimer() - spawnedAt < VexonAC.TeleportGracePeriod then
        lastPos = c; return
    end

    -- Skip while falling/ragdoll/dead — map fall-through + respawn looks like teleport
    if IsPedFalling(p) or IsPedRagdoll(p) or IsEntityDead(p) then
        lastPos = c; return
    end

    if lastPos then
        local dist = #(Vec3(c) - Vec3(lastPos))
        if dist > VexonAC.TeleportThreshold then
            -- Ignore if the previous position was far below the map (void fall)
            -- and the new position is at normal elevation: this is a respawn
            local zDelta = c.z - lastPos.z
            if zDelta > 50 and lastPos.z < -50 then
                -- Respawn after void fall — not a cheat
                lastPos = c; return
            end
            Report("TELEPORT", {
                from = { x = lastPos.x, y = lastPos.y, z = lastPos.z },
                to   = { x = c.x, y = c.y, z = c.z },
                dist = math.floor(dist),
            })
        end
    end
    lastPos = c
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Noclip
--  Ray-cast the movement path; repeated geometry penetration = noclip.
-- ════════════════════════════════════════════════════════════
local function CheckNoclip()
    local p = Ped()
    local c = GetEntityCoords(p)

    if noclipLastPos and not IsPedInAnyVehicle(p, false) and not IsPedSwimming(p) then
        local delta = Vec3(c) - Vec3(noclipLastPos)
        local dist  = #delta

        if dist > 0.4 then
            local ray = StartShapeTestCapsule(
                noclipLastPos.x, noclipLastPos.y, noclipLastPos.z,
                c.x, c.y, c.z,
                0.25, 1 | 16, p, 7
            )
            local _, hit = GetShapeTestResult(ray)

            if hit then
                noclipHits = noclipHits + 1
                if noclipHits >= 4 then
                    Report("NOCLIP", {
                        pos       = { x = c.x, y = c.y, z = c.z },
                        moveDist  = math.floor(dist * 10) / 10,
                        ticks     = noclipHits,
                    })
                    noclipHits = 0
                end
            else
                noclipHits = math.max(0, noclipHits - 1)
            end
        end
    end

    noclipLastPos = c
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Super jump
-- ════════════════════════════════════════════════════════════
local function CheckSuperJump()
    local p        = Ped()
    local inV      = IsPedInAnyVehicle(p, false)
    local onGround = IsPedOnGround(p) or IsEntityOnGround(p)
    local c        = GetEntityCoords(p)

    if inV then wasOnGround = true; jumpPeakZ = nil; groundZ = nil; return end

    if wasOnGround and not onGround then
        groundZ   = c.z
        jumpPeakZ = c.z
    end

    if not onGround and jumpPeakZ then
        if c.z > jumpPeakZ then jumpPeakZ = c.z end
    end

    if not wasOnGround and onGround and groundZ and jumpPeakZ then
        local height = jumpPeakZ - groundZ
        if height > VexonAC.MaxJumpHeight then
            Report("SUPER_JUMP", {
                height    = math.floor(height * 10) / 10,
                maxAllowed = VexonAC.MaxJumpHeight,
                pos        = { x = c.x, y = c.y, z = c.z },
            })
        end
        jumpPeakZ = nil; groundZ = nil
    end

    wasOnGround = onGround
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Invisible player
-- ════════════════════════════════════════════════════════════
local invisiTicks = 0
local function CheckInvisible()
    if GetGameTimer() - spawnedAt < 20000 then invisiTicks = 0; return end
    local p = Ped()
    if not IsEntityVisible(p) then
        invisiTicks = invisiTicks + 1
        if invisiTicks >= 8 then
            Report("INVISIBLE", { pos = GetEntityCoords(p) })
            invisiTicks = 0
        end
    else
        invisiTicks = 0
    end
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Blacklisted weapons
-- ════════════════════════════════════════════════════════════
local function CheckBlacklistedWeapons()
    local p = Ped()
    for name, hash in pairs(VexonAC.BlacklistedWeapons) do
        if HasPedGotWeapon(p, hash, false) then
            if not wepBlacklisted[hash] then
                wepBlacklisted[hash] = true
                Report("BLACKLIST_WEP", { weapon = name, hash = hash })
            end
        else
            wepBlacklisted[hash] = nil
        end
    end
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Infinite ammo
--  Ammo count unchanged across multiple firing ticks.
-- ════════════════════════════════════════════════════════════
local function CheckInfiniteAmmo()
    local p = Ped()
    if not IsPedShooting(p) then firingTicks = {}; return end

    local _, wep = GetCurrentPedWeapon(p, true)
    if wep == 0xA2719263 then return end  -- unarmed

    local ammo = GetAmmoInPedWeapon(p, wep)
    local prev  = ammoSamples[wep]

    if prev ~= nil then
        if ammo >= prev and prev > 0 then
            firingTicks[wep] = (firingTicks[wep] or 0) + 1
            if firingTicks[wep] >= 6 then
                Report("INFINITE_AMMO", { weapon = wep, ammo = ammo, ticks = firingTicks[wep] })
                firingTicks[wep] = 0
            end
        else
            firingTicks[wep] = 0
        end
    end

    ammoSamples[wep] = ammo
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Freeze hack (suspended mid-air with zero velocity)
-- ════════════════════════════════════════════════════════════
local function CheckFreeze()
    local p = Ped()
    if IsPedInAnyVehicle(p, false) or IsPedInParachuteFreeFall(p) then
        freezeTicks = 0; return
    end

    local vel   = GetEntityVelocity(p)
    local speed = math.sqrt(vel.x^2 + vel.y^2 + vel.z^2)
    local inAir = IsEntityInAir(p)

    if inAir and speed < 0.08 then
        freezeTicks = freezeTicks + 1
        if freezeTicks >= 5 then
            Report("FREEZE_HACK", {
                pos   = GetEntityCoords(p),
                speed = speed,
                ticks = freezeTicks,
            })
            freezeTicks = 0
        end
    else
        freezeTicks = math.max(0, freezeTicks - 1)
    end
end

-- ════════════════════════════════════════════════════════════
--  DETECTION: Resource injection (known mod menus)
-- ════════════════════════════════════════════════════════════
local injectionChecked = false
local function CheckResourceInjection()
    if injectionChecked then return end
    for i = 0, GetNumResources() - 1 do
        local name = GetResourceByFindIndex(i) or ""
        local lower = name:lower()
        for _, keyword in ipairs(VexonAC.KnownMenuResources) do
            if lower:find(keyword, 1, true) and lower ~= GetCurrentResourceName() then
                Report("RESOURCE_INJECT", { resource = name, matched = keyword })
                -- Don't mark checked — keep scanning as new resources can inject
                return
            end
        end
    end
    injectionChecked = true  -- Only suppress once everything is clean
end

-- ════════════════════════════════════════════════════════════
--  Heartbeat — sends position/health to server for validation
-- ════════════════════════════════════════════════════════════
local function Heartbeat()
    local p = Ped()
    TriggerServerEvent("vexonac:heartbeat", {
        pos    = GetEntityCoords(p),
        health = GetEntityHealth(p),
        armor  = GetPedArmour(p),
        speed  = GetEntitySpeed(p),
    })
end

-- ════════════════════════════════════════════════════════════
--  Threads
-- ════════════════════════════════════════════════════════════

AddEventHandler("onClientResourceStart", function(r)
    if r == GetCurrentResourceName() then spawnedAt = GetGameTimer() end
end)

-- Fast checks (500ms)
CreateThread(function()
    Citizen.Wait(4000)
    ready = true
    while true do
        Citizen.Wait(500)
        if not Ready() then goto next end
        pcall(CheckInvincible)
        pcall(CheckGodMode)
        pcall(CheckSpeed)
        pcall(CheckInvisible)
        pcall(CheckInfiniteAmmo)
        pcall(CheckFreeze)
        ::next::
    end
end)

-- Medium checks (1s)
CreateThread(function()
    Citizen.Wait(4000)
    while true do
        Citizen.Wait(1000)
        if not Ready() then goto next end
        pcall(CheckTeleport)
        pcall(CheckNoclip)
        pcall(CheckSuperJump)
        pcall(CheckBlacklistedWeapons)
        ::next::
    end
end)

-- Slow checks (30s)
CreateThread(function()
    Citizen.Wait(8000)
    while true do
        Citizen.Wait(30000)
        if not Ready() then goto next end
        pcall(CheckResourceInjection)
        pcall(Heartbeat)
        -- Reset injection flag so new resources are rescanned
        injectionChecked = false
        ::next::
    end
end)

-- ── Receive server-triggered screenshot request ───────────────
RegisterNetEvent("vexonac:requestScreenshot")
AddEventHandler("vexonac:requestScreenshot", function(detectionId)
    -- Uses screenshot-basic if available
    if exports["screenshot-basic"] then
        exports["screenshot-basic"]:requestScreenshotUpload(
            "https://ingress.vexonac.com/fivem/screenshot",
            "screenshot",
            { headers = { ["X-Detection-Id"] = tostring(detectionId) } },
            function(data)
                TriggerServerEvent("vexonac:screenshotUploaded", detectionId, data)
            end
        )
    end
end)
