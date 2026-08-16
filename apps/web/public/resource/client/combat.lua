-- ============================================================
--  VexonAC | resource/client/combat.lua
--  Combat & weapon detection module
-- ============================================================

-- ── Aimbot Detection ──────────────────────────────────────────
-- Detects inhuman aim snapping (>65° heading change per 100ms tick while shooting)

local lastCamRot    = nil
local aimbotSamples = {}
local aimbotSnaps   = 0

local function CheckAimbot()
    local ped = PlayerPedId()
    if not IsPedShooting(ped) then
        lastCamRot = nil
        aimbotSnaps = math.max(0, aimbotSnaps - 1)
        return
    end

    local rot = GetGameplayCamRot(2)
    if lastCamRot then
        local dz = math.abs(rot.z - lastCamRot.z)
        if dz > 180 then dz = 360 - dz end
        local dy = math.abs(rot.y - lastCamRot.y)

        -- Flag: >65° horizontal snap while actively shooting
        if dz > 65 then
            aimbotSnaps = aimbotSnaps + 1
            table.insert(aimbotSamples, { dz = dz, dy = dy })
            if #aimbotSamples > 10 then table.remove(aimbotSamples, 1) end

            if aimbotSnaps >= 3 then
                local avgSnap = 0
                for _, s in ipairs(aimbotSamples) do avgSnap = avgSnap + s.dz end
                avgSnap = math.floor(avgSnap / #aimbotSamples)

                Report("AIMBOT", {
                    avgSnapDeg  = avgSnap,
                    snapCount   = aimbotSnaps,
                    maxSnap     = math.floor(dz),
                })
                aimbotSnaps = 0
            end
        else
            aimbotSnaps = math.max(0, aimbotSnaps - 1)
        end
    end

    lastCamRot = rot
end

-- ── Lock-on / Target Tracking ─────────────────────────────────
-- Aimbot often locks perfectly to another player's head every frame.
-- We measure deviation from closest player head — near-zero deviation = lock-on.

local lockonTicks = 0

local function CheckLockOn()
    local ped = PlayerPedId()
    if not IsPedShooting(ped) then lockonTicks = 0; return end

    local camCoord = GetFinalRenderedCamCoord()
    local camRot   = GetFinalRenderedCamRot(2)

    -- Direction vector of camera
    local radZ = math.rad(camRot.z)
    local radX = math.rad(camRot.x)
    local dx = -math.sin(radZ) * math.abs(math.cos(radX))
    local dy =  math.cos(radZ) * math.abs(math.cos(radX))
    local dz =  math.sin(radX)
    local forward = vector3(dx, dy, dz)

    -- Find closest player to camera aim line
    local minAngle = 360.0
    for _, pid in ipairs(GetActivePlayers()) do
        if pid ~= PlayerId() then
            local tPed = GetPlayerPed(pid)
            if DoesEntityExist(tPed) and not IsEntityDead(tPed) then
                local headPos = GetPedBoneCoords(tPed, 31086, 0, 0, 0)
                local toHead  = vector3(headPos.x - camCoord.x, headPos.y - camCoord.y, headPos.z - camCoord.z)
                local dist    = #toHead

                if dist < 200 then
                    -- Angle between camera forward and direction to head
                    local dot   = (forward.x*toHead.x + forward.y*toHead.y + forward.z*toHead.z) / dist
                    dot = math.max(-1.0, math.min(1.0, dot))
                    local angle = math.deg(math.acos(dot))

                    if angle < minAngle then minAngle = angle end
                end
            end
        end
    end

    -- If camera is pointed within 0.5° of a player's head for multiple ticks = lock-on
    if minAngle < 0.5 then
        lockonTicks = lockonTicks + 1
        if lockonTicks >= 5 then
            Report("AIMBOT", {
                type      = "lockon",
                angleDev  = math.floor(minAngle * 100) / 100,
                ticks     = lockonTicks,
            }, 60)  -- higher pts for confirmed lock-on
            lockonTicks = 0
        end
    else
        lockonTicks = math.max(0, lockonTicks - 1)
    end
end

-- ── Trigger Bot ───────────────────────────────────────────────
-- Trigger bot fires the moment crosshair is on a player.
-- We detect: shooting immediately every time crosshair aligns with a player.

local triggerHistory = {}  -- { wasAimed, didShoot }

local function CheckTriggerBot()
    local ped = PlayerPedId()
    local _, wep = GetCurrentPedWeapon(ped, true)
    if wep == 0xA2719263 then return end  -- unarmed

    local shooting = IsPedShooting(ped)
    local camCoord = GetFinalRenderedCamCoord()
    local camRot   = GetFinalRenderedCamRot(2)
    local radZ     = math.rad(camRot.z)
    local radX     = math.rad(camRot.x)
    local fwd      = vector3(-math.sin(radZ)*math.abs(math.cos(radX)),
                              math.cos(radZ)*math.abs(math.cos(radX)),
                              math.sin(radX))

    local aimed = false
    for _, pid in ipairs(GetActivePlayers()) do
        if pid ~= PlayerId() then
            local tPed = GetPlayerPed(pid)
            if DoesEntityExist(tPed) and not IsEntityDead(tPed) then
                local tPos  = GetEntityCoords(tPed)
                local toT   = vector3(tPos.x-camCoord.x, tPos.y-camCoord.y, tPos.z-camCoord.z)
                local dist  = #toT
                if dist < 120 then
                    local dot   = (fwd.x*toT.x + fwd.y*toT.y + fwd.z*toT.z) / dist
                    dot = math.max(-1.0, math.min(1.0, dot))
                    if math.deg(math.acos(dot)) < 3.0 then aimed = true end
                end
            end
        end
    end

    table.insert(triggerHistory, { aimed = aimed, shot = shooting })
    if #triggerHistory > 20 then table.remove(triggerHistory, 1) end

    if #triggerHistory == 20 then
        local aimedAndShot, aimedOnly = 0, 0
        for _, h in ipairs(triggerHistory) do
            if h.aimed then
                if h.shot then aimedAndShot = aimedAndShot + 1
                else aimedOnly = aimedOnly + 1 end
            end
        end
        -- If they shoot near-100% of the time they're aimed at a player
        if aimedOnly + aimedAndShot > 5 then
            local ratio = aimedAndShot / (aimedOnly + aimedAndShot)
            if ratio > 0.95 then
                Report("AIMBOT", { type = "triggerbot", fireRatio = math.floor(ratio * 100) })
                triggerHistory = {}
            end
        end
    end
end

-- ── Vehicle Godmode ───────────────────────────────────────────
-- Vehicle health should decrease when taking damage.
-- If it never drops from max while under fire = god vehicle.

local vehHealth    = nil
local vehGodTicks  = 0

local function CheckVehicleGodmode()
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then
        vehHealth   = nil
        vehGodTicks = 0
        return
    end

    local veh = GetVehiclePedIsIn(ped, false)
    local hp  = GetVehicleBodyHealth(veh)
    local isBeingShot = false

    -- Check if any other player has this vehicle as target
    for _, pid in ipairs(GetActivePlayers()) do
        if pid ~= PlayerId() then
            local tPed = GetPlayerPed(pid)
            if IsPedShooting(tPed) then
                local tCoords = GetEntityCoords(tPed)
                local vCoords = GetEntityCoords(veh)
                if #(tCoords - vCoords) < 50 then isBeingShot = true end
            end
        end
    end

    if vehHealth == nil then
        vehHealth = hp
    end

    if isBeingShot and hp >= vehHealth and hp >= 900 then
        vehGodTicks = vehGodTicks + 1
        if vehGodTicks >= 6 then
            Report("GODMODE", { type = "vehicle", health = hp, ticks = vehGodTicks })
            vehGodTicks = 0
        end
    else
        vehHealth   = hp
        vehGodTicks = math.max(0, vehGodTicks - 1)
    end
end

-- ── Weapon Acquisition Rate ───────────────────────────────────
-- Legitimate players acquire weapons slowly. Rapid weapon gain = spawner.

local knownWeapons   = {}
local newWepInWindow = 0
local wepWindowStart = 0

local function CheckWeaponAcquisition()
    local ped = PlayerPedId()
    local now = GetGameTimer()

    if (now - wepWindowStart) > 30000 then
        newWepInWindow = 0
        wepWindowStart = now
    end

    -- Check all weapon slots
    local slots = {
        0x93E220BE, -- pistols
        0x416A3CC2, -- SMGs
        0x5EF9FEC4, -- shotguns
        0xDDBF37AA, -- assault rifles
        0xFCBF4A7B, -- LMGs
        0x7F8A4F2D, -- sniper rifles
        0xFCBF4A7B, -- heavy weapons
    }

    -- Iterate all player weapons via common hashes
    local allWeapons = {
        453432689, 584646201, 741586613, 2132975508, 496339155, 1318413779,
        2634544996, 2726580491, 2461879995, 2548980716, 1627465347, 2484171525,
        911657153, 100416529, 135514528, 2105793587, 125959754, 487013001,
        1119849093, 2756526909, 171789620, 3220176059, 1672152130, 324215364,
        2017895192, 3675956304, 3220176059, 2227010557, 128892152, 4160058428,
    }

    for _, hash in ipairs(allWeapons) do
        if HasPedGotWeapon(ped, hash, false) and not knownWeapons[hash] then
            knownWeapons[hash] = true
            newWepInWindow = newWepInWindow + 1

            if newWepInWindow >= 5 then
                Report("BLACKLIST_WEP", {
                    type       = "rapid_acquisition",
                    count      = newWepInWindow,
                    windowSec  = 30,
                    hash       = hash,
                })
                newWepInWindow = 0
                wepWindowStart = now
            end
        end
    end
end

-- ── Super Bullet (one-shot kill detection) ────────────────────
-- Monitor if local player kills opponents with a single bullet.
-- Only flag if health goes from full to dead in one tick.

local targetHealthMap = {}

local function CheckSuperBullet()
    local ped = PlayerPedId()
    if not IsPedShooting(ped) then targetHealthMap = {}; return end

    for _, pid in ipairs(GetActivePlayers()) do
        if pid ~= PlayerId() then
            local tPed = GetPlayerPed(pid)
            if DoesEntityExist(tPed) then
                local hp   = GetEntityHealth(tPed)
                local prev = targetHealthMap[pid]

                if prev ~= nil and prev >= 150 and IsEntityDead(tPed) then
                    -- Target went from >150hp to dead in one tick while we were shooting
                    local camCoord = GetFinalRenderedCamCoord()
                    local tCoords  = GetEntityCoords(tPed)
                    if #(camCoord - tCoords) < 200 then
                        Report("SUPER_DAMAGE", {
                            prevHP = prev,
                            dist   = math.floor(#(camCoord - tCoords)),
                        })
                    end
                end

                targetHealthMap[pid] = hp
            end
        end
    end
end

-- ── Thread ────────────────────────────────────────────────────

CreateThread(function()
    Citizen.Wait(5000)

    while true do
        Citizen.Wait(100)  -- Combat checks need faster tick rate

        if not (DoesEntityExist(PlayerPedId()) and NetworkIsPlayerActive(PlayerId())) then
            goto next
        end

        pcall(CheckAimbot)
        pcall(CheckLockOn)
        pcall(CheckTriggerBot)
        pcall(CheckVehicleGodmode)
        pcall(CheckSuperBullet)

        ::next::
    end
end)

-- Slower weapon acquisition check
CreateThread(function()
    Citizen.Wait(5000)
    while true do
        Citizen.Wait(3000)
        if not (DoesEntityExist(PlayerPedId()) and NetworkIsPlayerActive(PlayerId())) then
            goto next
        end
        pcall(CheckWeaponAcquisition)
        ::next::
    end
end)
