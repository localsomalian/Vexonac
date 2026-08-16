if not LPH_OBFUSCATED then
-- ZiBtIGE=
    LPH_JIT = function(...) return ... end
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
    LPH_JIT_MAX = function(...) return ... end
    LPH_JIT_ULTRA = function(...) return ... end
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
    LPH_NO_VIRTUALIZE = function(...) return ... end
    LPH_NO_UPVALUES = function(f) return(function(...) return f(...) end) end
    LPH_ENCFUNC = function(...) return ... end
    LPH_FUNCENC = function(...) return ... end
    LPH_ENCSTR = function(...) return ... end
    LPH_STRENC = function(...) return ... end
    LPH_ENCNUM = function(...) return ... end
    LPH_NUMENC = function(...) return ... end
    LPH_HOOK_FIX = function(...) return ... end
    LPH_CRASH = function() return print(debug.traceback()) end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
end;

﻿local VexonAC = {
    resourceName = GetCurrentResourceName(),
    playerSpawned = false,
    HeartbeatEventToken = GlobalState.HeartbeatEventToken,
    Config = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""],
    StateBagsToken = GlobalState.StateBagsToken,
    serverId = GetPlayerServerId(PlayerId()),
    tonumber = tonumber,
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
    tostring = tostring,
    assert = assert,
    type = type,
    msgpack = msgpack.pack,
    print = function(...)
        local args = {...}
        local message = ""
        
        for i = 1, #args do
            if i > 1 then
                message = message .. "\t"
            end
            message = message .. tostring(args[i])
        end
        
        return Citizen.Trace("^7" .. message .. "^7\n")
    end,
    Wait = Wait,
    CreateThread = CreateThread,
    TriggerServerEvent = TriggerServerEvent,
    TriggerEvent = TriggerEvent,
    SendNUIMessage = SendNUIMessage,
    LoadResourceFile = LoadResourceFile,

    Native = {},
    Lua = {},

    lastActorLoopTime = 0,

    debug = {
        getinfo = debug.getinfo,
        executions = false,
        short_executions = false
    }
}

local clientResources = GlobalState.VexonAC_ClientResources and json.decode(GlobalState.VexonAC_ClientResources) or {}
local serverResources = GlobalState.VexonAC_ServerResources and json.decode(GlobalState.VexonAC_ServerResources) or {}

local protectedCfxNatives = {
    "PlayerPedId",
    "PlayerId",
    "GetPlayerPed",
    "GetPlayerServerId",
    "GetPlayerName",
    "GetCurrentPedWeapon",
    "GetSelectedPedWeapon",
    "GetBestPedWeapon",
    "IsPedArmed",
    "GetWeaponObjectFromPed",
    "IsAimCamActive",
    "HasPedGotWeapon",
    "GetEntityHeightAboveGround",
    "GetEntityCoords",
    "GetGroundZFor_3dCoord",
    "IsPedInAnyVehicle",
    "IsPedFalling",
    "IsGameplayCamRendering",
    "GetEntityModel",
    "IsEntityDead",
    "GetEntityHealth",
    "GetPedArmour",
    "IsPedSprinting",
    "IsPedWalking",
    "IsPedOnFoot",
    "GetEntitySpeed",
    "DoesEntityExist",
    "GetVehiclePedIsUsing",
    "GetPedInVehicleSeat",
    "IsPedDeadOrDying",
    "IsNuiFocused",
    "GetVehiclePedIsIn",
    "GetGameTimer",
    "IsDisabledControlPressed",
    "IsPauseMenuActive",
    "IsPedAPlayer",
    "IsPedSwimmingUnderWater",
    "IsPedSwimming",
    "GetPlayerSprintStaminaRemaining",
    "GetEntityAttachedTo",
    "GetGamePool",
    "IsPedOnVehicle",
    "IsPedJumping",
    "GetEntityMaxHealth",
    "GetPlayerInvincible",
    "GetPlayerInvincible_2",
    "GetEntityCanBeDamaged",
    "GetPedType",
    "IsPlayerFreeForAmbientTask",
    "IsPedRunningRagdollTask",
    "IsPedJumpingOutOfVehicle",
    "IsPedRunningMeleeTask",
    "IsPedDiving",
    "GetPedConfigFlag",
    "IsPedClimbing",
    "IsEntityInAir",
    "IsPedFalling",
    "NetworkIsInSpectatorMode",
    "GetVehicleTopSpeedModifier",
    "GetVehicleCheatPowerIncrease",
    "GetVehicleGravityAmount",
    "GetStateBagValue",
    "SetStateBagValue",
    "GetGameplayCamCoord",
    "GetGameplayCamRot",
    "GetHashKey",
}

local protectedLuaNatives = {
    "pairs",
    "ipairs",
    "next",
    "type",
    "tonumber",
    "tostring",
    "print",
    "pcall",
    "assert",
}

for k, native in pairs(protectedCfxNatives) do
    VexonAC.Native[native] = _G[native]
end

for k, native in pairs(protectedLuaNatives) do
    VexonAC.Lua[native] = _G[native]
end

VexonAC.CreateThread(function()
    if VexonAC.resourceName ~= "VexonAC" then while true do end end
    if VexonAC.HeartbeatEventToken == nil then while true do end end
    if VexonAC.Config == nil then while true do end end
    if GlobalState.BanEventToken == nil then while true do end end
    if GlobalState.VexonAC_ClientResources == nil then while true do end end
    if GlobalState.HHct1C6gobnW3DkIQUxiXk9Q == nil then while true do end end
    if GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q == nil then while true do end end
    VexonAC.Config = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q]

    SetVehicleModelIsSuppressed(GetHashKey("BLIMP"), true)
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    SetVehicleModelIsSuppressed(GetHashKey("BLIMP2"), true)
    SetVehicleModelIsSuppressed(GetHashKey("BLIMP3"), true)
    SetScenarioGroupEnabled(2017590552, false)
    SetScenarioGroupEnabled(2141866469, false)
    SetScenarioGroupEnabled(1409640232, false)
    SetScenarioGroupEnabled("ng_planes", false)
    SetScenarioGroupEnabled("BLIMP", false)
end)

local playerBagName = ("player:%d"):format(VexonAC.serverId)

local SafeGetLocalPlayerState = function(key)
    return VexonAC.Native.GetStateBagValue(playerBagName, key)
end

local SafeSetLocalPlayerState = function(key, value, replicated)
    local payload = VexonAC.msgpack(value)
    return VexonAC.Native.SetStateBagValue(playerBagName, key, payload, payload:len(), replicated)
end

local DetectPlayer <const> = function(detection, details, action, duration)
    if detection == "FAKE" then return VexonAC.Native.GetGameTimer() end
    
    if VexonAC.debug.short_executions then
        VexonAC.print("Ban Triggered")
        VexonAC.print("Token:", GlobalState.BanEventToken)
        VexonAC.print("Detection:", json.encode(detection))
        VexonAC.print("Details:", json.encode(details))
        VexonAC.print("Action:", action)
        VexonAC.print("Duration:", duration)
    end

    if not detection or (VexonAC.type(detection) ~= "string" and VexonAC.type(detection) ~= "table") then detection = "Unknown Reason" end

    VexonAC.assert(VexonAC.TypeCheck.isTable(detection) or VexonAC.TypeCheck.isString(detection), "detection: table or string")
    VexonAC.assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isTable)(details), "details?: table")
    VexonAC.assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isNumber)(action), "action?: number")
    VexonAC.assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isNumber)(duration), "duration?: number")
    
    local BanEventToken = VexonAC.EncryptString(GlobalState.BanEventToken, VexonAC.Substitution)

    if VexonAC.type(detection) == "string" then
        detection = VexonAC.EncryptString(detection, VexonAC.Substitution)
    end

    VexonAC.CreateThread(function()
        VexonAC.Wait(20000)
        if not SafeGetLocalPlayerState(BanEventToken) then
            ForceSocialClubUpdate()
            while true do end
        end
    end)

    VexonAC.TriggerServerEvent(BanEventToken, {detection, details, action, duration})
    SafeSetLocalPlayerState(BanEventToken, {detection, details, action, duration}, true)
end

VexonAC.DetectPlayer = function(detection, details, action, duration)
    return DetectPlayer(detection, details, action, duration)
end

exports("banPlayer",function(message, details, duration)
    VexonAC.DetectPlayer(message, details, VexonAC.Actions.BAN.id, duration)
end)

exports("kickPlayer",function(message, details, duration)
    VexonAC.DetectPlayer(message, details, VexonAC.Actions.KICK.id, duration)
end)

local function randomString(count)
    math.randomseed(VexonAC.Native.GetGameTimer() + math.random(11111, 99999))
    local chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz123456789"
    local rndmString = ""
    for i = 0,count do
        local rndm = math.random(1,#chars)
        local char = string.sub(chars,rndm,rndm)
        rndmString = rndmString..char
    end
    return rndmString
end

RegisterNUICallback("tokens", function(data, cb)
    local tokens = data.tokens
    local hwid, storageId, spooferDetected, timeZone, nuiSystemLanguages = tokens.a, tokens.b, tokens.c
    local uidKvp = GetResourceKvpString("__WS_KVP_UID")
    if not uidKvp then
        uidKvp = ("sid2:%s"):format(randomString(64))
        SetResourceKvp("__WS_KVP_UID", uidKvp)
    end

    if VexonAC.debug.short_executions then
        VexonAC.print("HWID:", hwid)
        VexonAC.print("Storage UID:", storageId)
        VexonAC.print("KVP UID:", uidKvp)
        VexonAC.print("Spoofer Detected:", spooferDetected)
    end

    if spooferDetected and VexonAC.Config.Main.AntiSpoofer then
        VexonAC.DetectPlayer("Spoofer Detected")
    else
        VexonAC.TriggerServerEvent("__VexonAC:checkExtraIdentifiers", uidKvp, storageId, hwid)
    end

    cb({})
end)

RegisterNUICallback("devtools", function(data, cb)
    if not VexonAC.Config.Main.AntiDevTools then 
        cb({})
        return
    end

    VexonAC.DetectPlayer("NUI DevTools Detected")
    cb({})
end)


﻿local NumberToBoolean <const> = LPH_NO_VIRTUALIZE(function(number)
    if number == true then
        return true
    elseif number == false then
        return false
    elseif number == 1 then
        return true
    elseif number == 0 then
        return false
    elseif VexonAC.type(number) ~= "number" then
        return false
    else
        return true
    end
end)

local signedToUnsigned <const> = LPH_NO_VIRTUALIZE(function(num)
    if not num or VexonAC.type(num) ~= "number" then return end

    if num >= 0 then
        return num
    end
    local complement = 4294967296 + num
    return complement
end)

VexonAC.TypeCheck = {
    isNumber = function(value) return VexonAC.type(value) == "number" end,
    isString = function(value) return VexonAC.type(value) == "string" end,
    isTable = function(value) return VexonAC.type(value) == "table" end,
    isOptional = function(typeCheck)
        return function(value)
            return value == nil or typeCheck(value)
        end
    end
}

VexonAC.Actions = {
    BAN = { id = 0, message = "You have been banned by VexonAC for cheating." },
    KICK = { id = 1, message = "You have been kicked by VexonAC for possible cheating." },
    LOG = { id = 2 },
}

VexonAC.Categories = {
    MAIN = "Main",
    VEHICLES = "Vehicles",
    ENTITIES = "Entities",
    WEAPONS = "Weapons",
    EXPLOSIONS = "Explosions",
    UNBANS = "Unbans",
    CONNECTIONS = "Connections",
    SCREENSHOTS = "Screenshots",
    COMMUNITY = "Community",
}

VexonAC.Detections = {
    -- Main category detections
    ANTI_OVERLAY = { name = "E1", message = "Overlay Detected", category = VexonAC.Categories.MAIN },
    ANTI_TELEPORT = { name = "AntiTeleport", message = "Teleportation Detected", category = VexonAC.Categories.MAIN },
    ANTI_LUA_MENU = { name = "AntiLuaMenu", message = "Lua Menu Detected", category = VexonAC.Categories.MAIN },
    ANTI_NO_CLIP = { name = "AntiNoClip", message = "NoClip Detected", category = VexonAC.Categories.MAIN },
    ANTI_FREE_CAM = { name = "AntiFreeCam", message = "FreeCam Detected", category = VexonAC.Categories.MAIN },
    ANTI_SPEED_HACK = { name = "AntiSpeedHack", message = "SpeedHack Detected", category = VexonAC.Categories.MAIN },
    ANTI_NO_RAGDOLL = { name = "AntiNoRagdoll", message = "NoRagdoll Detected", category = VexonAC.Categories.MAIN },
    ANTI_SPECTATE = { name = "AntiSpectate", message = "Spectate Detected", category = VexonAC.Categories.MAIN },
    ANTI_INVISIBLE = { name = "AntiInvisible", message = "Invisible Player Detected", category = VexonAC.Categories.MAIN },
    ANTI_SUPER_JUMP = { name = "AntiSuperJump", message = "SuperJump Detected", category = VexonAC.Categories.MAIN },
    ANTI_INFINITE_STAMINA = { name = "AntiInfiniteStamina", message = "Infinite Stamina Detected", category = VexonAC.Categories.MAIN },
    ANTI_PED_MODEL_CHANGE = { name = "AntiPedModelChange", message = "Ped Model Change Detected", category = VexonAC.Categories.MAIN },
    ANTI_NIGHT_VISIONS = { name = "AntiNightVisions", message = "Night Vision Detected", category = VexonAC.Categories.MAIN },
    ANTI_AFK_BYPASS = { name = "AntiAFKBypass", message = "AFK Bypass Detected", category = VexonAC.Categories.MAIN },
    ANTI_INPUT_BOX = { name = "AntiInputBox", message = "Input Box Detected", category = VexonAC.Categories.MAIN },
    ANTI_INFINITE_REFILL = { name = "AntiInfiniteRefill", message = "Infinite Health Refill Detected", category = VexonAC.Categories.MAIN },
    ANTI_OVERRIDE_HEALTH_STATS = { name = "AntiOverrideHealthStats", message = "Health Stats Override Detected", category = VexonAC.Categories.MAIN },
    ANTI_INVINCIBLE = { name = "AntiInvincible", message = "Invincibility Detected", category = VexonAC.Categories.MAIN },
    ANTI_NO_COMBAT_DAMAGES = { name = "AntiNoCombatDamages", message = "No Combat Damages Detected", category = VexonAC.Categories.MAIN },
    ANTI_TRIGGER_CLIENT_EVENT = { name = "AntiTriggerClientEvent", message = "Illegal Client Event Triggerd", category = VexonAC.Categories.MAIN },
    ANTI_TRIGGER_SERVER_EVENT = { name = "AntiTriggerServerEvent", message = "Illegal Server Event Triggerd", category = VexonAC.Categories.MAIN },
    ANTI_RESOURCE_STOP = { name = "AntiResourceStop", message = "Resource Stop Detected", category = VexonAC.Categories.MAIN },
    ANTI_RESOURCE_INJECTION = { name = "AntiResourceInjection", message = "Resource Injection Detected", category = VexonAC.Categories.MAIN },
    ANTI_CLEAR_TASKS = { name = "AntiClearTasks", message = "Clear Tasks Detected", category = VexonAC.Categories.MAIN },
    ANTI_DEV_TOOLS = { name = "AntiDevTools", message = "Dev Tools Detected", category = VexonAC.Categories.MAIN },
    ANTI_VOICE_EXPLOITS = { name = "AntiVoiceExploits", message = "Voice Exploits Detected", category = VexonAC.Categories.MAIN },

    -- Weapons category detections
    ANTI_AIM_BOT = { name = "AntiAimBot", message = "AimBot Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_WEAPON_SPAWNER = { name = "AntiWeaponSpawner", message = "Illegal Weapon Spawn Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_WEAPON_SPOOF = { name = "AntiWeaponSpawner", message = "Spoofed Weapon Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_GIVE_WEAPONS = { name = "AntiGiveWeapons", message = "Illegal Weapon Give Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_REMOVE_WEAPONS = { name = "AntiRemoveWeapons", message = "Illegal Weapon Remove Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_SPOOFED_BULLETS = { name = "AntiSpoofedBullets", message = "Spoofed Bullets Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_KILL = { name = "AntiKill", message = "Illegal Kill Detected", category = VexonAC.Categories.WEAPONS },
    WEAPON_BLACKLIST = { name = "EnableWeaponsBlackList", message = "Blacklisted Weapon Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_WEAPON_COMPONENT_MODIFIER = { name = "AntiWeaponComponentModifier", message = "Weapon Component Modification Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_WEAPON_DAMAGES_MODIFIER = { name = "AntiWeaponDamagesModifier", message = "Weapon Damage Modification Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_AMMO_CHEATING = { name = "AntiAmmoCheating", message = "Ammo Cheats Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_INFINITE_AMMO = { name = "AntiInfiniteAmmo", message = "Infinite Ammo Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_NO_RELOAD = { name = "AntiNoReload", message = "No Reload Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_EXPLOSIVE_BULLETS = { name = "AntiExplosiveBullets", message = "Explosive Bullets Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_SUPER_PUNCH = { name = "AntiSuperPunch", message = "Super Punch Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_HITBOX_MODIFIER = { name = "AntiHitboxModifier", message = "Hitbox Modification Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_NO_RECOIL = { name = "AntiNoRecoil", message = "No Recoil Detected", category = VexonAC.Categories.WEAPONS },
    PROJECTILE_WHITELIST = { name = "EnableProjectilesWhiteList", message = "Blacklisted Projectile Detected", category = VexonAC.Categories.WEAPONS },
    PROJECTILE_LIMIT = { name = "EnableProjectilesLimiter", message = "Exceeded Projectile Spawn Rate", category = VexonAC.Categories.WEAPONS },

    -- Vehicles category detections
    ANTI_SPAWN_VEHICLES = { name = "EnableVehiclesAI", message = "Illegal Vehicle Spawn Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_AI_SPAWN_VEHICLES = { name = "EnableVehiclesAIv2", message = "Illegal NPC Vehicle Spawn Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_SPAWN_ISOLATED_VEHICLES = { name = "AntiSpawnIsolatedVehicles", message = "Isolated Vehicle Spawn Detected", category = VexonAC.Categories.ENTITIES },
    VEHICLE_BLACKLIST = { name = "EnableVehiclesBlackList", message = "Blacklisted Vehicle Detected", category = VexonAC.Categories.ENTITIES },
    VEHICLE_WHITELIST = { name = "EnableVehiclesWhiteList", message = "Blacklisted Vehicle Detected", category = VexonAC.Categories.ENTITIES },
    VEHICLE_LIMIT = { name = "EnableVehiclesLimiter", message = "Exceeded Vehicle Spawn Rate", category = VexonAC.Categories.ENTITIES },
    ANTI_DELETE_VEHICLES = { name = "AntiDeleteVehicles", message = "Vehicle Deletion Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_THROW_VEHICLES = { name = "AntiThrowVehicles", message = "Vehicle Throwing Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_TELEPORT_IN_VEHICLE = { name = "AntiTeleportInVehicle", message = "Vehicle Warp Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_SPEED_MODIFIER = { name = "AntiSpeedModifier", message = "Vehicle Speed Modification Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_HANDLING_MODIFIER = { name = "AntiHandlingModifier", message = "Vehicle Handling Modification Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_VEHICLE_PLATE_CHANGER = { name = "AntiVehiclePlateChanger", message = "Vehicle Plate Change Detected", category = VexonAC.Categories.ENTITIES },

    -- Peds category detections
    ANTI_SPAWN_PEDS = { name = "EnablePedsAI", message = "Illegal Ped Spawn Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_AI_SPAWN_PEDS = { name = "EnablePedsAIv2", message = "Illegal NPC Ped Spawn Detected", category = VexonAC.Categories.ENTITIES },
    PED_BLACKLIST = { name = "EnablePedsBlackList", message = "Blacklisted Ped Detected", category = VexonAC.Categories.ENTITIES },
    PED_WHITELIST = { name = "EnablePedsWhiteList", message = "Blacklisted Ped Detected", category = VexonAC.Categories.ENTITIES },
    PED_LIMIT = { name = "EnablePedsLimiter", message = "Exceeded Ped Spawn Rate", category = VexonAC.Categories.ENTITIES },

    -- Objects category detections
    ANTI_SPAWN_OBJECTS = { name = "EnableObjectsAI", message = "Illegal Object Spawn Detected", category = VexonAC.Categories.ENTITIES },
    OBJECT_BLACKLIST = { name = "EnableObjectsBlackList", message = "Blacklisted Object Detected", category = VexonAC.Categories.ENTITIES },
    OBJECT_WHITELIST = { name = "EnableObjectsWhiteList", message = "Blacklisted Object Detected", category = VexonAC.Categories.ENTITIES },
    OBJECT_LIMIT = { name = "EnableObjectsLimiter", message = "Exceeded Object Spawn Rate", category = VexonAC.Categories.ENTITIES },
    ANTI_PICKUP_SPAWN = { name = "AntiPickupSpawn", message = "Pickup Spawn Detected", category = VexonAC.Categories.ENTITIES },

    -- Explosions category detections
    ANTI_SPAWN_EXPLOSION = { name = "EnableExplosionsAI", message = "Illegal Explosion Spawn Detected", category = VexonAC.Categories.EXPLOSIONS },
    EXPLOSION_BLACKLIST = { name = "EnableExplosionsBlackList", message = "Blacklisted Explosion Detected", category = VexonAC.Categories.EXPLOSIONS },
    EXPLOSION_LIMIT = { name = "EnableExplosionsLimiter", message = "Exceeded Explosion Spawn Rate", category = VexonAC.Categories.EXPLOSIONS },
    DETECT_INVISIBLE_EXPLOSIONS = { name = "DetectInvisibleExplosions", message = "Invisible Explosion Detected", category = VexonAC.Categories.EXPLOSIONS },
    DETECT_INAUDIBLE_EXPLOSIONS = { name = "DetectInaudibleExplosions", message = "Inaudible Explosion Detected", category = VexonAC.Categories.EXPLOSIONS },

    -- Particles category detections
    ANTI_SPAWN_PARTICLE = { name = "EnableParticlesAI", message = "Illegal Particle Spawn Detected", category = VexonAC.Categories.EXPLOSIONS },
    PARTICLE_WHITELIST = { name = "EnableParticlesWhiteList", message = "Blacklisted Particle Detected", category = VexonAC.Categories.EXPLOSIONS },
    PARTICLE_SCALE = { name = "MaxParticleScale", message = "Exceeded Particle Scale Limit", category = VexonAC.Categories.EXPLOSIONS },
    ANTI_PARTICLE_ATTACHED_TO_ENTITY = { name = "DetectParticlesAttachedToEntity", message = "Entity-Attached Particles Detected", category = VexonAC.Categories.EXPLOSIONS },

    ANTI_REQUEST_CONTROL = { name = "AntiRequestControl", message = "Entity Control Attempt Detected", category = VexonAC.Categories.ENTITIES },

    -- Beta category detections
    ANTI_UNISOLATED_INJECTION = { name = "AntiUnisolatedInjection", message = "Illegal Function Execution", category = VexonAC.Categories.MAIN },
    ANTI_MAGNETO = { name = "AntiMagneto", message = "Magneto Detected", category = VexonAC.Categories.MAIN },
    ANTI_ATTACH_VEHICLES = { name = "AntiAttachVehicles", message = "Vehicle Attachment Detected", category = VexonAC.Categories.ENTITIES },
    ANTI_SILENT_AIM = { name = "AntiSilentAim", message = "Silent Aim Detected", category = VexonAC.Categories.WEAPONS },
    ANTI_MAGIC_BULLETS = { name = "AntiSilentAim", message = "Magic Bullets Detected", category = VexonAC.Categories.WEAPONS },
}

VexonAC.StrikesSystem = {}

-- Internal storage for strikes and first strike times
local playerStrikes = {}
local firstStrikeTimes = {}

--[[
    Creates a strike system for a specific detection
    @param detectionName string - Unique name for the detection
    @param strikesNeeded number - Number of strikes needed to trigger the flag
    @param onFlag function - Function to call when strikes threshold is reached (receives playerId, strikes, detectionName)
    @param timeWindowMs number - Optional time window in ms to get strikes within (nil = no time limit)
    @return function - Strike function that takes playerId as parameter
]]
function VexonAC.StrikesSystem.createStrikeSystem(detectionName, strikesNeeded, onFlag, timeWindowMs)
    -- Validate parameters
    if not VexonAC.TypeCheck.isString(detectionName) then
        error("detectionName must be a string")
    end
    if not VexonAC.TypeCheck.isNumber(strikesNeeded) or strikesNeeded <= 0 then
        error("strikesNeeded must be a positive number")
    end
    if VexonAC.type(onFlag) ~= "function" then
        error("onFlag must be a function")
    end

    -- Validate time window parameters if provided
    if timeWindowMs ~= nil then
        if not VexonAC.TypeCheck.isNumber(timeWindowMs) or timeWindowMs <= 0 then
            error("timeWindowMs must be a positive number or nil")
        end
    end

    -- Initialize storage for this detection if not exists
    if not playerStrikes[detectionName] then
        playerStrikes[detectionName] = {}
    end
    if not firstStrikeTimes[detectionName] then
        firstStrikeTimes[detectionName] = {}
    end

    -- Return the strike function
    return function(playerId, ...)
        -- Auto-detect player ID if not provided and on client side
        if playerId == nil then
            if not IsDuplicityVersion() then
                -- Client side - use local player's server ID
                playerId = VexonAC.serverId
            else
                -- Server side - player ID is required
                error("playerId is required on server side")
            end
        end

        local currentTime = GetGameTimer()
        playerId = tonumber(playerId)

        if not VexonAC.TypeCheck.isNumber(playerId) then
            error("playerId must be a number")
        end

        -- Initialize player data if not exists
        if not playerStrikes[detectionName][playerId] then
            playerStrikes[detectionName][playerId] = 0
        end

        -- Check if we need to reset strikes based on time window
        if timeWindowMs and playerStrikes[detectionName][playerId] > 0 then
            local timeSinceFirstStrike = currentTime - firstStrikeTimes[detectionName][playerId]
            if timeSinceFirstStrike >= timeWindowMs then
                -- Time window expired, reset strikes and start new window
                playerStrikes[detectionName][playerId] = 0
                firstStrikeTimes[detectionName][playerId] = nil
            end
        end

        -- Set first strike time if this is the first strike
        if playerStrikes[detectionName][playerId] == 0 then
            firstStrikeTimes[detectionName][playerId] = currentTime
        end

        -- Add the new strike
        playerStrikes[detectionName][playerId] = playerStrikes[detectionName][playerId] + 1
        local currentStrikes = playerStrikes[detectionName][playerId]

        -- Check if strikes threshold reached
        if currentStrikes >= strikesNeeded then
            -- Reset strikes after flagging
            playerStrikes[detectionName][playerId] = 0
            firstStrikeTimes[detectionName][playerId] = nil
            -- Call the flag function
            onFlag(playerId, ...)
        end

        return currentStrikes
    end
end

--[[
    Gets current strikes for a player and detection
    @param detectionName string - Name of the detection
    @param playerId number - Player ID (optional on client side)
    @return number - Current strike count
]]
function VexonAC.StrikesSystem.getStrikes(detectionName, playerId)
    -- Auto-detect player ID if not provided and on client side
    if playerId == nil then
        if not IsDuplicityVersion() then
            playerId = VexonAC.serverId
        else
            error("playerId is required on server side")
        end
    end

    if not playerStrikes[detectionName] or not playerStrikes[detectionName][playerId] then
        return 0
    end
    return playerStrikes[detectionName][playerId]
end

--[[
    Resets strikes for a player and detection
    @param detectionName string - Name of the detection
    @param playerId number - Player ID (optional on client side)
]]
function VexonAC.StrikesSystem.resetStrikes(detectionName, playerId)
    -- Auto-detect player ID if not provided and on client side
    if playerId == nil then
        if not IsDuplicityVersion() then
            playerId = VexonAC.serverId
        else
            error("playerId is required on server side")
        end
    end

    if playerStrikes[detectionName] and playerStrikes[detectionName][playerId] then
        playerStrikes[detectionName][playerId] = 0
    end
    if firstStrikeTimes[detectionName] and firstStrikeTimes[detectionName][playerId] then
        firstStrikeTimes[detectionName][playerId] = nil
    end
end

--[[
    Clears all strikes and timeouts for a player (useful when player disconnects)
    @param playerId number - Player ID
]]
function VexonAC.StrikesSystem.clearPlayerStrikes(playerId)
    for detectionName, _ in pairs(playerStrikes) do
        if playerStrikes[detectionName][playerId] then
            playerStrikes[detectionName][playerId] = nil
        end
        if firstStrikeTimes[detectionName] and firstStrikeTimes[detectionName][playerId] then
            firstStrikeTimes[detectionName][playerId] = nil
        end
    end
end

if IsDuplicityVersion() then
    AddEventHandler("playerDropped", function(reason)
        local source = source
        VexonAC.StrikesSystem.clearPlayerStrikes(source)
    end)
end

VexonAC.WEAPON_DATA = LPH_NO_VIRTUALIZE(function()
    local weaponList = {
        { "WEAPON_UNARMED",               0.0 },
        { "WEAPON_KNIFE",                 0.0 },
        { "WEAPON_NIGHTSTICK",            0.0 },
        { "WEAPON_HAMMER",                0.0 },
        { "WEAPON_BAT",                   0.0 },
        { "WEAPON_GOLFCLUB",              0.0 },
        { "WEAPON_CROWBAR",               0.0 },
        { "WEAPON_PISTOL",                26.0 },
        { "WEAPON_COMBATPISTOL",          27.0 },
        { "WEAPON_APPISTOL",              25.0 },
        { "WEAPON_PISTOL50",              51.0 },
        { "WEAPON_MICROSMG",              21.0 },
        { "WEAPON_SMG",                   22.0 },
        { "WEAPON_ASSAULTSMG",            23.0 },
        { "WEAPON_ASSAULTRIFLE",          30.0 },
        { "WEAPON_CARBINERIFLE",          32.0 },
        { "WEAPON_ADVANCEDRIFLE",         34.0 },
        { "WEAPON_MG",                    40.0 },
        { "WEAPON_COMBATMG",              45.0 },
        { "WEAPON_PUMPSHOTGUN",           29.0 },
        { "WEAPON_SAWNOFFSHOTGUN",        40.0 },
        { "WEAPON_ASSAULTSHOTGUN",        32.0 },
        { "WEAPON_BULLPUPSHOTGUN",        14.0 },
        { "WEAPON_STUNGUN",               1.0 },
        { "WEAPON_SNIPERRIFLE",           101.0 },
        { "WEAPON_HEAVYSNIPER",           216.0 },
        { "WEAPON_REMOTESNIPER",          101.0 },
        { "WEAPON_GRENADELAUNCHER",       0.0 },
        { "WEAPON_GRENADELAUNCHER_SMOKE", 0.0 },
        { "WEAPON_RPG",                   0.0 },
        { "WEAPON_MINIGUN",               30.0 },
        { "WEAPON_GRENADE",               0.0 },
        { "WEAPON_STICKYBOMB",            0.0 },
        { "WEAPON_SMOKEGRENADE",          0.0 },
        { "WEAPON_BZGAS",                 0.0 },
        { "WEAPON_MOLOTOV",               0.0 },
        { "WEAPON_FIREEXTINGUISHER",      0.0 },
        { "WEAPON_PETROLCAN",             0.0 },
        { "WEAPON_BALL",                  0.0 },
        { "WEAPON_FLARE",                 0.0 },
        { "WEAPON_BOTTLE",                0.0 },
        { "WEAPON_SNSPISTOL",             28.0 },
        { "WEAPON_HEAVYPISTOL",           40.0 },
        { "WEAPON_BULLPUPRIFLE",          32.0 },
        { "WEAPON_SPECIALCARBINE",        32.0 },
        { "WEAPON_SNSPISTOL_MK2",         30.0 },
        { "WEAPON_SPECIALCARBINE_MK2",    32.5 },
        { "WEAPON_PUMPSHOTGUN_MK2",       32.0 },
        { "WEAPON_BULLPUPRIFLE_MK2",      33.0 },
        { "WEAPON_MARKSMANRIFLE_MK2",     75.0 },
        { "WEAPON_CANDYCANE",             0.0 },
        { "WEAPON_PISTOLXM3",             35.0 },
        { "WEAPON_RAILGUNXM3",            25.0 },
        { "WEAPON_ACIDPACKAGE",           0.0 },
        { "WEAPON_HOMINGLAUNCHER",        0.0 },
        { "WEAPON_PROXMINE",              0.0 },
        { "WEAPON_SNOWBALL",              0.0 },
        { "WEAPON_DOUBLEACTION",          81.0 },
        { "WEAPON_REVOLVER_MK2",          200.0 },
        { "WEAPON_RAYPISTOL",             10.0 },
        { "WEAPON_RAYCARBINE",            45.0 },
        { "WEAPON_RAYMINIGUN",            30.0 },
        { "WEAPON_GUSENBERG",             34.0 },
        { "WEAPON_DAGGER",                0.0 },
        { "WEAPON_VINTAGEPISTOL",         34.0 },
        { "WEAPON_FIREWORK",              0.0 },
        { "WEAPON_MUSKET",                165.0 },
        { "WEAPON_HATCHET",               0.0 },
        { "WEAPON_RAILGUN",               30.0 },
        { "WEAPON_MARKSMANRIFLE",         65.0 },
        { "WEAPON_HEAVYSHOTGUN",          117.0 },
        { "WEAPON_CERAMICPISTOL",         32.0 },
        { "WEAPON_MILITARYRIFLE",         37.5 },
        { "WEAPON_GADGETPISTOL",          195.0 },
        { "WEAPON_HAZARDCAN",             0.0 },
        { "WEAPON_COMBATSHOTGUN",         31.0 },
        { "WEAPON_NAVYREVOLVER",          160.0 },
        { "WEAPON_FLAREGUN",              10.0 },
        { "WEAPON_KNUCKLE",               0.0 },
        { "WEAPON_COMBATPDW",             28.0 },
        { "WEAPON_MARKSMANPISTOL",        220.0 },
        { "WEAPON_DBSHOTGUN",             30.0 },
        { "WEAPON_COMPACTRIFLE",          34.0 },
        { "WEAPON_MACHINEPISTOL",         27.0 },
        { "WEAPON_MACHETE",               0.0 },
        { "WEAPON_FLASHLIGHT",            0.0 },
        { "WEAPON_SWITCHBLADE",           0.0 },
        { "WEAPON_REVOLVER",              160.0 },
        { "WEAPON_WRENCH",                0.0 },
        { "WEAPON_POOLCUE",               0.0 },
        { "WEAPON_MINISMG",               22.0 },
        { "WEAPON_BATTLEAXE",             0.0 },
        { "WEAPON_AUTOSHOTGUN",           27.0 },
        { "WEAPON_COMPACTLAUNCHER",       0.0 },
        { "WEAPON_PIPEBOMB",              0.0 },
        { "WEAPON_SMG_MK2",               25.0 },
        { "WEAPON_COMBATMG_MK2",          47.0 },
        { "WEAPON_CARBINERIFLE_MK2",      33.0 },
        { "WEAPON_ASSAULTRIFLE_MK2",      40.0 },
        { "WEAPON_HEAVYSNIPER_MK2",       230.0 },
        { "WEAPON_PISTOL_MK2",            32.0 },
        { "WEAPON_STONE_HATCHET",         0.0 },
        { "WEAPON_TACTICALRIFLE",         34.75 },
        { "WEAPON_PRECISIONRIFLE",        101.0 },
        { "WEAPON_HEAVYRIFLE",            34.0 },
        { "WEAPON_FERTILIZERCAN",         0.0 },
        { "WEAPON_EMPLAUNCHER",           0.0 },
        { "WEAPON_STUNGUN_MP",            20.0 },
        { "WEAPON_TECPISTOL",             25.0 },
        { "WEAPON_SNOWLAUNCHER",          0.0 },
        { "WEAPON_HACKINGDEVICE",         0.0 },
        { "WEAPON_BATTLERIFLE",           38.0 },
        { "WEAPON_STUNROD",               0.0 },
        { "WEAPON_STRICKLER",             0.0 },
        { "WEAPON_BRIEFCASE_03",          0.0 },
    }

    local weaponData = {}

    for i = 1, #weaponList do
        local name = weaponList[i][1]
        local damage = weaponList[i][2]
        local hash = GetHashKey(name)
        local unsignedHash = signedToUnsigned(hash)

        weaponData[i] = {
            weaponName = name,
            weaponHash = hash,
            weaponUnsignedHash = unsignedHash,
            weaponDamages = damage
        }

        weaponData[hash] = weaponData[i]
        weaponData[unsignedHash] = weaponData[i]
        weaponData[name] = weaponData[i]
    end

    return weaponData
end)()

VexonAC.VEHICLE_DATA = LPH_NO_VIRTUALIZE(function()
    local vehicleList = {
        "adder",
        "airbus",
        "airtug",
        "akula",
        "akuma",
        "aleutian",
        "alkonost",
        "alpha",
        "alphaz1",
        "ambulance",
        "annihilator",
        "annihilator2",
        "apc",
        "arbitergt",
        "ardent",
        "armytanker",
        "armytrailer",
        "armytrailer2",
        "asbo",
        "asea",
        "asea2",
        "asterope",
        "asterope2",
        "astron",
        "astron2",
        "autarch",
        "avarus",
        "avenger",
        "avenger2",
        "avenger3",
        "avenger4",
        "avisa",
        "bagger",
        "baletrailer",
        "baller",
        "baller2",
        "baller3",
        "baller4",
        "baller5",
        "baller6",
        "baller7",
        "baller8",
        "banshee",
        "banshee2",
        "banshee3",
        "barracks",
        "barracks2",
        "barracks3",
        "barrage",
        "bati",
        "bati2",
        "benson",
        "benson2",
        "besra",
        "bestiagts",
        "bf400",
        "bfinjection",
        "biff",
        "bifta",
        "bison",
        "bison2",
        "bison3",
        "bjxl",
        "blade",
        "blazer",
        "blazer2",
        "blazer3",
        "blazer4",
        "blazer5",
        "blimp",
        "blimp2",
        "blimp3",
        "blista",
        "blista2",
        "blista3",
        "bmx",
        "boattrailer",
        "bobcatxl",
        "bodhi2",
        "bombushka",
        "boor",
        "boxville",
        "boxville2",
        "boxville3",
        "boxville4",
        "boxville5",
        "boxville6",
        "brawler",
        "brickade",
        "brickade2",
        "brigham",
        "brioso",
        "brioso2",
        "brioso3",
        "broadway",
        "bruiser",
        "bruiser2",
        "bruiser3",
        "brutus",
        "brutus2",
        "brutus3",
        "btype",
        "btype2",
        "btype3",
        "buccaneer",
        "buccaneer2",
        "buffalo",
        "buffalo2",
        "buffalo3",
        "buffalo4",
        "buffalo5",
        "bulldozer",
        "bullet",
        "burrito",
        "burrito2",
        "burrito3",
        "burrito4",
        "burrito5",
        "bus",
        "buzzard",
        "buzzard2",
        "cablecar",
        "caddy",
        "caddy2",
        "caddy3",
        "calico",
        "camper",
        "caracara",
        "caracara2",
        "carbonizzare",
        "carbonrs",
        "cargobob",
        "cargobob2",
        "cargobob3",
        "cargobob4",
        "cargobob5",
        "cargoplane",
        "cargoplane2",
        "casco",
        "castigator",
        "cavalcade",
        "cavalcade2",
        "cavalcade3",
        "cerberus",
        "cerberus2",
        "cerberus3",
        "champion",
        "chavosv6",
        "cheburek",
        "cheetah",
        "cheetah2",
        "cheetah3",
        "chernobog",
        "chimera",
        "chino",
        "chino2",
        "cinquemila",
        "cliffhanger",
        "clique",
        "clique2",
        "club",
        "coach",
        "cog55",
        "cog552",
        "cogcabrio",
        "cognoscenti",
        "cognoscenti2",
        "comet2",
        "comet3",
        "comet4",
        "comet5",
        "comet6",
        "comet7",
        "conada",
        "conada2",
        "contender",
        "coquette",
        "coquette2",
        "coquette3",
        "coquette4",
        "coquette5",
        "coquette6",
        "corsita",
        "coureur",
        "cruiser",
        "crusader",
        "cuban800",
        "cutter",
        "cyclone",
        "cyclone2",
        "cypher",
        "daemon",
        "daemon2",
        "deathbike",
        "deathbike2",
        "deathbike3",
        "defiler",
        "deity",
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
        "deluxo",
        "deveste",
        "deviant",
        "diablous",
        "diablous2",
        "dilettante",
        "dilettante2",
        "dinghy",
        "dinghy2",
        "dinghy3",
        "dinghy4",
        "dinghy5",
        "dloader",
        "docktrailer",
        "docktug",
        "dodo",
        "dominator",
        "dominator10",
        "dominator2",
        "dominator3",
        "dominator4",
        "dominator5",
        "dominator6",
        "dominator7",
        "dominator8",
        "dominator9",
        "dorado",
        "double",
        "drafter",
        "draugur",
        "driftchavosv6",
        "driftcheburek",
        "driftcypher",
        "driftdominator10",
        "drifteuros",
        "driftfr36",
        "driftfuto",
        "driftfuto2",
        "driftgauntlet4",
        "drifthardy",
        "driftjester",
        "driftjester3",
        "driftl352",
        "driftnebula",
        "driftremus",
        "driftsentinel",
        "drifttampa",
        "driftvorschlag",
        "driftyosemite",
        "driftzr350",
        "dubsta",
        "dubsta2",
        "dubsta3",
        "dukes",
        "dukes2",
        "dukes3",
        "dump",
        "dune",
        "dune2",
        "dune3",
        "dune4",
        "dune5",
        "duster",
        "duster2",
        "dynasty",
        "elegy",
        "elegy2",
        "ellie",
        "emerus",
        "emperor",
        "emperor2",
        "emperor3",
        "enduro",
        "entity2",
        "entity3",
        "entityxf",
        "envisage",
        "esskey",
        "eudora",
        "euros",
        "eurosx32",
        "everon",
        "everon2",
        "everon3",
        "exemplar",
        "f620",
        "faction",
        "faction2",
        "faction3",
        "fagaloa",
        "faggio",
        "faggio2",
        "faggio3",
        "fbi",
        "fbi2",
        "fcr",
        "fcr2",
        "felon",
        "felon2",
        "feltzer2",
        "feltzer3",
        "firebolt",
        "firetruk",
        "fixter",
        "flashgt",
        "flatbed",
        "flatbed2",
        "fmj",
        "forklift",
        "formula",
        "formula2",
        "fq2",
        "fr36",
        "freecrawler",
        "freight",
        "freight2",
        "freightcar",
        "freightcar2",
        "freightcar3",
        "freightcont1",
        "freightcont2",
        "freightgrain",
        "freighttrailer",
        "frogger",
        "frogger2",
        "fugitive",
        "furia",
        "furoregt",
        "fusilade",
        "futo",
        "futo2",
        "gargoyle",
        "gauntlet",
        "gauntlet2",
        "gauntlet3",
        "gauntlet4",
        "gauntlet5",
        "gauntlet6",
        "gb200",
        "gburrito",
        "gburrito2",
        "glendale",
        "glendale2",
        "gp1",
        "graintrailer",
        "granger",
        "granger2",
        "greenwood",
        "gresley",
        "growler",
        "gt500",
        "guardian",
        "habanero",
        "hakuchou",
        "hakuchou2",
        "halftrack",
        "handler",
        "hardy",
        "hauler",
        "hauler2",
        "havok",
        "hellion",
        "hermes",
        "hexer",
        "hotknife",
        "hotring",
        "howard",
        "hunter",
        "huntley",
        "hustler",
        "hydra",
        "ignus",
        "ignus2",
        "imorgon",
        "impaler",
        "impaler2",
        "impaler3",
        "impaler4",
        "impaler5",
        "impaler6",
        "imperator",
        "imperator2",
        "imperator3",
        "inductor",
        "inductor2",
        "infernus",
        "infernus2",
        "ingot",
        "innovation",
        "insurgent",
        "insurgent2",
        "insurgent3",
        "intruder",
        "issi2",
        "issi3",
        "issi4",
        "issi5",
        "issi6",
        "issi7",
        "issi8",
        "italigtb",
        "italigtb2",
        "italigto",
        "italirsx",
        "iwagen",
        "jackal",
        "jb700",
        "jb7002",
        "jester",
        "jester2",
        "jester3",
        "jester4",
        "jester5",
        "jet",
        "jetmax",
        "journey",
        "journey2",
        "jubilee",
        "jugular",
        "kalahari",
        "kamacho",
        "kanjo",
        "kanjosj",
        "khamelion",
        "khanjali",
        "komoda",
        "kosatka",
        "krieger",
        "kuruma",
        "kuruma2",
        "l35",
        "l352",
        "landstalker",
        "landstalker2",
        "lazer",
        "le7b",
        "lectro",
        "lguard",
        "limo2",
        "lm87",
        "locust",
        "longfin",
        "lurcher",
        "luxor",
        "luxor2",
        "lynx",
        "mamba",
        "mammatus",
        "manana",
        "manana2",
        "manchez",
        "manchez2",
        "manchez3",
        "marquis",
        "marshall",
        "massacro",
        "massacro2",
        "maverick",
        "maverick2",
        "menacer",
        "mesa",
        "mesa2",
        "mesa3",
        "metrotrain",
        "michelli",
        "microlight",
        "miljet",
        "minimus",
        "minitank",
        "minivan",
        "minivan2",
        "mixer",
        "mixer2",
        "mogul",
        "molotok",
        "monroe",
        "monster",
        "monster3",
        "monster4",
        "monster5",
        "monstrociti",
        "moonbeam",
        "moonbeam2",
        "mower",
        "mule",
        "mule2",
        "mule3",
        "mule4",
        "mule5",
        "nebula",
        "nemesis",
        "neo",
        "neon",
        "nero",
        "nero2",
        "nightblade",
        "nightshade",
        "nightshark",
        "nimbus",
        "ninef",
        "ninef2",
        "niobe",
        "nokota",
        "novak",
        "omnis",
        "omnisegt",
        "openwheel1",
        "openwheel2",
        "oppressor",
        "oppressor2",
        "oracle",
        "oracle2",
        "osiris",
        "outlaw",
        "packer",
        "panthere",
        "panto",
        "paradise",
        "paragon",
        "paragon2",
        "paragon3",
        "pariah",
        "patriot",
        "patriot2",
        "patriot3",
        "patrolboat",
        "pbus",
        "pbus2",
        "pcj",
        "penetrator",
        "penumbra",
        "penumbra2",
        "peyote",
        "peyote2",
        "peyote3",
        "pfister811",
        "phantom",
        "phantom2",
        "phantom3",
        "phantom4",
        "phoenix",
        "picador",
        "pigalle",
        "pipistrello",
        "pizzaboy",
        "polcaracara",
        "polcoquette4",
        "poldominator10",
        "poldorado",
        "polfaction2",
        "polgauntlet",
        "polgreenwood",
        "police",
        "police2",
        "police3",
        "police4",
        "police5",
        "policeb",
        "policeb2",
        "policeold1",
        "policeold2",
        "policet",
        "policet3",
        "polimpaler5",
        "polimpaler6",
        "polmav",
        "polterminus",
        "pony",
        "pony2",
        "postlude",
        "pounder",
        "pounder2",
        "powersurge",
        "prairie",
        "pranger",
        "predator",
        "premier",
        "previon",
        "primo",
        "primo2",
        "proptrailer",
        "prototipo",
        "pyro",
        "r300",
        "radi",
        "raiden",
        "raiju",
        "raketrailer",
        "rallytruck",
        "rancherxl",
        "rancherxl2",
        "rapidgt",
        "rapidgt2",
        "rapidgt3",
        "rapidgt4",
        "raptor",
        "ratbike",
        "ratel",
        "ratloader",
        "ratloader2",
        "rcbandito",
        "reaper",
        "rebel",
        "rebel2",
        "rebla",
        "reever",
        "regina",
        "remus",
        "rentalbus",
        "retinue",
        "retinue2",
        "revolter",
        "rhapsody",
        "rhinehart",
        "rhino",
        "riata",
        "riot",
        "riot2",
        "ripley",
        "rocoto",
        "rogue",
        "romero",
        "rrocket",
        "rt3000",
        "rubble",
        "ruffian",
        "ruiner",
        "ruiner2",
        "ruiner3",
        "ruiner4",
        "rumpo",
        "rumpo2",
        "rumpo3",
        "ruston",
        "s80",
        "s95",
        "sabregt",
        "sabregt2",
        "sadler",
        "sadler2",
        "sanchez",
        "sanchez2",
        "sanctus",
        "sandking",
        "sandking2",
        "savage",
        "savestra",
        "sc1",
        "scarab",
        "scarab2",
        "scarab3",
        "schafter2",
        "schafter3",
        "schafter4",
        "schafter5",
        "schafter6",
        "schlagen",
        "schwarzer",
        "scorcher",
        "scramjet",
        "scrap",
        "seabreeze",
        "seashark",
        "seashark2",
        "seashark3",
        "seasparrow",
        "seasparrow2",
        "seasparrow3",
        "seminole",
        "seminole2",
        "sentinel",
        "sentinel2",
        "sentinel3",
        "sentinel4",
        "sentinel5",
        "serrano",
        "seven70",
        "shamal",
        "sheava",
        "sheriff",
        "sheriff2",
        "shinobi",
        "shotaro",
        "skylift",
        "slamtruck",
        "slamvan",
        "slamvan2",
        "slamvan3",
        "slamvan4",
        "slamvan5",
        "slamvan6",
        "sm722",
        "sovereign",
        "specter",
        "specter2",
        "speeder",
        "speeder2",
        "speedo",
        "speedo2",
        "speedo4",
        "speedo5",
        "squaddie",
        "squalo",
        "stafford",
        "stalion",
        "stalion2",
        "stanier",
        "starling",
        "stinger",
        "stingergt",
        "stingertt",
        "stockade",
        "stockade3",
        "stockade4",
        "stratum",
        "streamer216",
        "streiter",
        "stretch",
        "strikeforce",
        "stromberg",
        "stryder",
        "stunt",
        "submersible",
        "submersible2",
        "sugoi",
        "sultan",
        "sultan2",
        "sultan3",
        "sultanrs",
        "suntrap",
        "superd",
        "supervolito",
        "supervolito2",
        "surano",
        "surfer",
        "surfer2",
        "surfer3",
        "surge",
        "suzume",
        "swift",
        "swift2",
        "swinger",
        "t20",
        "taco",
        "tahoma",
        "tailgater",
        "tailgater2",
-- ZGlzY29yZC5nZy9mbWE=
        "taipan",
        "tampa",
        "tampa2",
        "tampa3",
        "tampa4",
        "tanker",
        "tanker2",
        "tankercar",
        "taxi",
        "technical",
        "technical2",
        "technical3",
        "tempesta",
        "tenf",
        "tenf2",
        "terbyte",
        "terminus",
        "tezeract",
        "thrax",
        "thrust",
        "thruster",
        "tigon",
        "tiptruck",
        "tiptruck2",
        "titan",
        "titan2",
        "toreador",
        "torero",
        "torero2",
        "tornado",
        "tornado2",
        "tornado3",
        "tornado4",
        "tornado5",
        "tornado6",
        "toro",
        "toro2",
        "toros",
        "tourbus",
        "towtruck",
        "towtruck2",
        "towtruck3",
        "towtruck4",
        "tr2",
        "tr3",
        "tr4",
        "tractor",
        "tractor2",
        "tractor3",
        "trailerlarge",
        "trailerlogs",
        "trailers",
        "trailers2",
        "trailers3",
        "trailers4",
        "trailersmall",
        "trailersmall2",
        "trash",
        "trash2",
        "trflat",
        "tribike",
        "tribike2",
        "tribike3",
        "trophytruck",
        "trophytruck2",
        "tropic",
        "tropic2",
        "tropos",
        "tug",
        "tula",
        "tulip",
        "tulip2",
        "turismo2",
        "turismo3",
        "turismor",
        "tvtrailer",
        "tyrant",
        "tyrus",
        "uranus",
        "utillitruck",
        "utillitruck2",
        "utillitruck3",
        "vacca",
        "vader",
        "vagner",
        "vagrant",
        "valkyrie",
        "valkyrie2",
        "vamos",
        "vectre",
        "velum",
        "velum2",
        "verlierer2",
        "verus",
        "vestra",
        "vetir",
        "veto",
        "veto2",
        "vigero",
        "vigero2",
        "vigero3",
        "vigilante",
        "vindicator",
        "virgo",
        "virgo2",
        "virgo3",
        "virtue",
        "viseris",
        "visione",
        "vivanite",
        "volatol",
        "volatus",
        "voltic",
        "voltic2",
        "voodoo",
        "voodoo2",
        "vorschlaghammer",
        "vortex",
        "vstr",
        "warrener",
        "warrener2",
        "washington",
        "wastelander",
        "weevil",
        "weevil2",
        "windsor",
        "windsor2",
        "winky",
        "wolfsbane",
        "woodlander",
        "xa21",
        "xls",
        "xls2",
        "yosemite",
        "yosemite1500",
        "yosemite2",
        "yosemite3",
        "youga",
        "youga2",
        "youga3",
        "youga4",
        "youga5",
        "z190",
        "zeno",
        "zentorno",
        "zhaba",
        "zion",
        "zion2",
        "zion3",
        "zombiea",
        "zombieb",
        "zorrusso",
        "zr350",
        "zr380",
        "zr3802",
        "zr3803",
        "ztype",
    }

    local vehicleData = {}

    for i = 1, #vehicleList do
        local name = vehicleList[i]
        local hash = GetHashKey(name)

        vehicleData[i] = {
            vehicleName = name,
            vehicleHash = hash,
        }

        vehicleData[hash] = vehicleData[i]
        vehicleData[name] = vehicleData[i]
    end

    return vehicleData
end)()

VexonAC.EXPLOSION_DATA = LPH_NO_VIRTUALIZE(function()
    local explosionList = {
        "Grenade",
        "Grenade Launcher",
        "Sticky Bomb",
        "Molotov",
        "Rocket",
        "TankShell",
        "Hi_Octane",
        "Car",
        "Plane",
        "PetrolPump",
        "Bike",
        "Dir_Steam",
        "Dir_Flame",
        "Dir_Water_Hydrant",
        "Dir_Gas_Canister",
        "Boat",
        "Ship_Destroy",
        "Truck",
        "Bullet",
        "SmokeGrenadeLauncher",
        "SmokeGrenade",
        "BZGAS",
        "Flare",
        "Gas_Canister",
        "Extinguisher",
        "Programmablear",
        "Train",
        "Barrel",
        "PROPANE",
        "Blimp",
        "Dir_Flame_Explode",
        "Tanker",
        "PlaneRocket",
        "VehicleBullet",
        "Gas_Tank",
        "EXP_TAG_BIRD_CRAP",
        "EXP_TAG_RAILGUN",
        "EXP_TAG_BLIMP2",
        "EXP_TAG_FIREWORK",
        "EXP_TAG_SNOWBALL",
        "EXP_TAG_PROXMINE",
        "EXP_TAG_VALKYRIE_CANNON",
        "EXP_TAG_AIR_DEFENCE",
        "EXP_TAG_PIPEBOMB",
        "EXP_TAG_VEHICLEMINE",
        "EXP_TAG_EXPLOSIVEAMMO",
        "EXP_TAG_APCSHELL",
        "EXP_TAG_BOMB_CLUSTER",
        "EXP_TAG_BOMB_GAS",
        "EXP_TAG_BOMB_INCENDIARY",
        "EXP_TAG_BOMB_STANDARD",
        "EXP_TAG_TORPEDO",
        "EXP_TAG_TORPEDO_UNDERWATER",
        "EXP_TAG_BOMBUSHKA_CANNON",
        "EXP_TAG_BOMB_CLUSTER_SECONDARY",
        "EXP_TAG_HUNTER_BARRAGE",
        "EXP_TAG_HUNTER_CANNON",
        "EXP_TAG_ROGUE_CANNON",
        "EXP_TAG_MINE_UNDERWATER",
        "EXP_TAG_ORBITAL_CANNON",
        "EXP_TAG_BOMB_STANDARD_WIDE",
        "EXP_TAG_EXPLOSIVEAMMO_SHOTGUN",
        "EXP_TAG_OPPRESSOR2_CANNON",
        "EXP_TAG_MORTAR_KINETIC",
        "EXP_TAG_VEHICLEMINE_KINETIC",
        "EXP_TAG_VEHICLEMINE_EMP",
        "EXP_TAG_VEHICLEMINE_SPIKE",
        "EXP_TAG_VEHICLEMINE_SLICK",
        "EXP_TAG_VEHICLEMINE_TAR",
        "EXP_TAG_SCRIPT_DRONE",
        "EXP_TAG_RAYGUN",
        "EXP_TAG_BURIEDMINE",
        "EXP_TAG_SCRIPT_MISSILE",
        "EXP_TAG_RCTANK_ROCKET",
        "EXP_TAG_BOMB_WATER",
        "EXP_TAG_BOMB_WATER_SECONDARY",
        "_0xF728C4A9",
        "_0xBAEC056F",
        "EXP_TAG_FLASHGRENADE",
        "EXP_TAG_STUNGRENADE",
        "_0x763D3B3B",
        "EXP_TAG_SCRIPT_MISSILE_LARGE",
        "EXP_TAG_SUBMARINE_BIG",
        "EMPLAUNCHER_EMP",
    }

    local explosionData = {}

    for i = 1, #explosionList do
        local name = explosionList[i]
        local index = i - 1

        explosionData[index] = {
            explosionName = name,
            explosionType = index,
        }

        explosionData[name] = explosionData[index]
    end

    return explosionData
end)()

VexonAC.GetExplosionName = LPH_NO_VIRTUALIZE(function(explosionType)
    local explosionData = VexonAC.EXPLOSION_DATA[explosionType]
    return explosionData and explosionData.explosionName or explosionType
end)

VexonAC.GetVehicleName = LPH_NO_VIRTUALIZE(function(vehicleIndex)
    local vehicleData = VexonAC.VEHICLE_DATA[vehicleIndex]
    return vehicleData and vehicleData.vehicleName or vehicleIndex
end)

VexonAC.GetWeaponName = LPH_NO_VIRTUALIZE(function(weaponIndex)
    local weaponData = VexonAC.WEAPON_DATA[weaponIndex]
    return weaponData and weaponData.weaponName or weaponIndex
end)



﻿VexonAC.GenerateSubstitution = LPH_JIT_MAX(function(key)
    local blacklist = {
        ["^"] = true,
        [" "] = true,
        ["\\"] = true
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
    }
    local alphabet = ""
    for i = 32, 126 do
        local char = string.char(i)
        if not blacklist or not blacklist[char] then
            alphabet = alphabet .. char
        end
    end

    local substitution = {}
    local inverseSubstitution = {}

    local shuffledAlphabet = {}
    for i = 1, #alphabet do
        shuffledAlphabet[i] = alphabet:sub(i, i)
    end

    local function hashKey(key)
        local hash = 0
        for i = 1, #key do
            hash = (hash * 31 + key:byte(i)) % 2 ^ 32
        end
        return hash
    end

    local hash = hashKey(key)

    -- Permutation dÃ©terministe de l'alphabet en fonction du hachage
    for i = 1, #shuffledAlphabet do
        local j = (hash % (#shuffledAlphabet - i + 1)) + i
        shuffledAlphabet[i], shuffledAlphabet[j] = shuffledAlphabet[j], shuffledAlphabet[i]
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
        hash = hash + i
    end

    -- GÃ©nÃ©rer les tables de substitution
    for i = 1, #alphabet do
        substitution[alphabet:sub(i, i)] = shuffledAlphabet[i]
        inverseSubstitution[shuffledAlphabet[i]] = alphabet:sub(i, i)
    end

    return substitution, inverseSubstitution
end)

VexonAC.EncryptString = LPH_JIT_MAX(function(chaine, substitution)
    chaine = tostring(chaine)
    local result = ""

    for i = 1, #chaine do
        local char = chaine:sub(i, i)
        result = result .. (substitution[char] or char)
    end

    return result
end)

VexonAC.DecryptString = LPH_JIT_MAX(function(chaine, inverseSubstitution)
    chaine = tostring(chaine)
    local result = ""

    for i = 1, #chaine do
        local char = chaine:sub(i, i)
        result = result .. (inverseSubstitution[char] or char)
    end

    return result
end)

VexonAC.ConvertEvent = LPH_JIT_MAX(function(eventName)
    return VexonAC.EncryptString("_WS:" .. tostring(eventName), VexonAC.Substitution)
end)

VexonAC.SHA256 = LPH_NO_VIRTUALIZE(function(s)
    local h = 0x811c9dc5
    local len = #s
    
    for i = 1, len do
        h = ((h ~ s:byte(i)) * 0x01000193) & 0xffffffff
    end
    
    local h2 = 0x9e3779b1
    for i = 1, len do
        h2 = (h2 + s:byte(i) * i) & 0xffffffff
    end
    
    h = (h ~ h2) & 0xffffffff
    
    h = (h ~ (h >> 16)) & 0xffffffff
    h = (h * 0x85ebca77) & 0xffffffff
    h = (h ~ (h >> 13)) & 0xffffffff
    h = (h * 0xc2b2ae35) & 0xffffffff
    
    local h1 = h
    local h2 = (h ~ 0x12345678) & 0xffffffff
    local h3 = ((h << 7) ~ (h >> 25)) & 0xffffffff  
    local h4 = (h * 0x27d4eb2f) & 0xffffffff
    
    return string.format("%08x%08x%08x%08x", h1, h2, h3, h4)
end)

if IsDuplicityVersion() then
    VexonAC.CreateThread(function()
        while not GlobalState.HHct1C6gobnW3DkIQUxiXk9Q do
            VexonAC.Wait(10)
        end

        VexonAC.SubstitutionKey = GlobalState.HHct1C6gobnW3DkIQUxiXk9Q
        VexonAC.Substitution, VexonAC.InverseSubstitution = VexonAC.GenerateSubstitution(GetConvar(VexonAC.SubstitutionKey, "weaponDamageEvent"))

        VexonAC.IsEventTokenizationReady = true
    end)

    VexonAC.SetSecuredStateBag = LPH_JIT_MAX(function(source, bagName, value)
        while not VexonAC.IsEventTokenizationReady do
            VexonAC.Wait(10)
        end

-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
        Player(source).state:set(VexonAC.ConvertEvent("SetSecuredStateBag"), {
            b = VexonAC.EncryptString(bagName, VexonAC.Substitution),
            t = VexonAC.EncryptString(GlobalState.StateBagsToken, VexonAC.Substitution),
            v = value
        }, true)
    end)
else
    VexonAC.SubstitutionKey = GlobalState.HHct1C6gobnW3DkIQUxiXk9Q
    VexonAC.Substitution, VexonAC.InverseSubstitution = VexonAC.GenerateSubstitution(GetConvar(VexonAC.SubstitutionKey, "weaponDamageEvent"))

    VexonAC.IsEventTokenizationReady = true

    VexonAC.SecuredStateBags = {
        ["_WS:LastTeleportedTimer"] = {
            func = nil,
            value = nil
        }
    }
-- ZGlzY29yZC5nZy9mbWE=

    VexonAC.SetSecuredStateBag = LPH_JIT_MAX(function(bagName, value, replicated)
        if not replicated then
            while not VexonAC.IsEventTokenizationReady do
                VexonAC.Wait(10)
            end

            SafeSetLocalPlayerState(VexonAC.ConvertEvent("SetSecuredStateBag"), {
                b = VexonAC.EncryptString(bagName, VexonAC.Substitution),
                t = VexonAC.EncryptString(GlobalState.StateBagsToken, VexonAC.Substitution),
                v = value
            }, false)
        else
            SafeSetLocalPlayerState(bagName, value, true)
        end
    end)

-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
    VexonAC.GetSecuredStateBag = LPH_JIT_MAX(function(bagName)
        local stateBag = VexonAC.SecuredStateBags[bagName]
        return stateBag and stateBag.value
    end)

    VexonAC.GetSecuredStateBagName = LPH_JIT_MAX(function(bagName)
        while not VexonAC.IsEventTokenizationReady do
            VexonAC.Wait(10)
        end

        local decryptedBagName = VexonAC.DecryptString(bagName, VexonAC.InverseSubstitution)
        return decryptedBagName
    end)

    AddStateBagChangeHandler(VexonAC.ConvertEvent("SetSecuredStateBag"), ('player:%s'):format(VexonAC.serverId), LPH_JIT_MAX(function(_bagName, key, _value, reserved, replicated)
        while not VexonAC.IsEventTokenizationReady do
            VexonAC.Wait(10)
        end

        local bagName, token, value = _value.b, _value.t, _value.v
        if type(bagName) ~= "string" or type(token) ~= "string" or not value then
            return print("while true do end")
        end

        local decryptedBagName = VexonAC.DecryptString(bagName, VexonAC.InverseSubstitution)
        local decryptedToken = VexonAC.DecryptString(token, VexonAC.InverseSubstitution)
        if type(decryptedBagName) ~= "string" or type(decryptedToken) ~= "string" then
            return print("while true do end")
        end

        if decryptedToken ~= tostring(GlobalState.StateBagsToken) then
            return print("while true do end")
        end

        if not VexonAC.SecuredStateBags[decryptedBagName] then
            VexonAC.SecuredStateBags[decryptedBagName] = {}
        end
        VexonAC.SecuredStateBags[decryptedBagName].value = value

        local securedStateBag = VexonAC.SecuredStateBags[decryptedBagName]
        if type(securedStateBag.func) == "function" then
            securedStateBag.func(bagName, key, value, reserved, replicated)
        end
    end))

    VexonAC.AddSecuredStateBagHandler = function(bagName, func)
        VexonAC.SecuredStateBags[bagName] = func
    end
end



﻿local debugStateBagName = VexonAC.EncryptString("ws_debug", VexonAC.Substitution)
local debugEventName = VexonAC.EncryptString("__VexonAC:debug", VexonAC.Substitution)
local debugEventName2 = VexonAC.EncryptString("__VexonAC:debug_executions", VexonAC.Substitution)

-- RegisterCommand("+zzzadazzze", function()
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
--     VexonAC.debug.short_executions = not VexonAC.debug.short_executions
--     VexonAC.debug.executions = VexonAC.debug.short_executions
--     VexonAC.print(("DEBUG: %s"):format(VexonAC.debug.short_executions))
--     SafeSetLocalPlayerState(debugStateBagName, VexonAC.debug.short_executions, true)
-- end)

RegisterCommand("+ws_debug", function()
    VexonAC.debug.short_executions = not VexonAC.debug.short_executions
    VexonAC.print(("DEBUG: %s"):format(VexonAC.debug.short_executions))
    SafeSetLocalPlayerState(debugStateBagName, VexonAC.debug.short_executions, true)
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
end)

RegisterCommand("+zombie_mode", function()
    VexonAC.debug.stuff = not VexonAC.debug.stuff
    VexonAC.print(("DEBUG 2: %s"):format(VexonAC.debug.stuff))
end)

RegisterCommand("+ws_debug_executions", function()
    VexonAC.debug.executions = not VexonAC.debug.executions
end)

RegisterNetEvent(debugEventName, function()
    VexonAC.debug.short_executions = not VexonAC.debug.short_executions
    VexonAC.print(("DEBUG: %s"):format(VexonAC.debug.short_executions))
    SafeSetLocalPlayerState(debugStateBagName, VexonAC.debug.short_executions, true)
end)

RegisterNetEvent(debugEventName2, function()
    VexonAC.debug.executions = not VexonAC.debug.executions
end)-- Zm1hLnd0Zg==



﻿VexonAC.DetectionRegistry = {
    checks = {},
    intervals = {},
    lastRun = {},
    enabled = true
}

VexonAC.RegisterDetection = function(name, checkFunction, interval)
    VexonAC.DetectionRegistry.checks[name] = checkFunction
    VexonAC.DetectionRegistry.intervals[name] = interval or 1000
    VexonAC.DetectionRegistry.lastRun[name] = 0
end

VexonAC.isSpectating = false
VexonAC.isVisible = false
VexonAC.canPedRagdoll = false
VexonAC.hasChangedPedModel = false
VexonAC.playerRevived = false
VexonAC.proofsEnabled = false
VexonAC.healthRefilled = false
VexonAC.isInvincible = false
VexonAC.canBeDamaged = false
VexonAC.hasTeleported = false

local updateInfos = LPH_NO_VIRTUALIZE(function()
    local Native = VexonAC.Native
    
    local playerPed = Native.PlayerPedId()
    local playerId = Native.PlayerId()
    
    VexonAC.playerPed = playerPed
    VexonAC.playerId = playerId
    VexonAC.playerModel = Native.GetEntityModel(playerPed)
    VexonAC.playerCoords = Native.GetEntityCoords(playerPed, false)
    VexonAC.playerHeight = Native.GetEntityHeightAboveGround(playerPed)
    VexonAC.isPlayerDead = Native.IsPedDeadOrDying(playerPed, true)
    VexonAC.playerHealth = Native.GetEntityHealth(playerPed)
    VexonAC.playerMaxHealth = Native.GetEntityMaxHealth(playerPed)
    VexonAC.playerArmour = Native.GetPedArmour(playerPed)
    VexonAC.isPlayerSprinting = Native.IsPedSprinting(playerPed)
    VexonAC.isPlayerWalking = Native.IsPedWalking(playerPed)
    VexonAC.isPlayerOnFoot = Native.IsPedOnFoot(playerPed)
    VexonAC.playerStamina = Native.GetPlayerSprintStaminaRemaining(playerId)
    VexonAC.isPlayerSwimming = Native.IsPedSwimming(playerPed)
    VexonAC.isPlayerUnderWater = Native.IsPedSwimmingUnderWater(playerPed)
    VexonAC.playerSpeed = Native.GetEntitySpeed(playerPed)
    VexonAC.isGamePlayCamRendering = Native.IsGameplayCamRendering()
    VexonAC.isAttachedToAPlayer = Native.IsPedAPlayer(Native.GetEntityAttachedTo(playerPed))
    
    VexonAC.playerInvincible = Native.GetPlayerInvincible(playerId)
    VexonAC.playerInvincible2 = Native.GetPlayerInvincible_2(playerId)
    VexonAC.entityCanBeDamaged = Native.GetEntityCanBeDamaged(playerPed)
    VexonAC.pedType = Native.GetPedType(playerPed)
    VexonAC.isPlayerFreeForAmbientTask = Native.IsPlayerFreeForAmbientTask(playerId)
    VexonAC.isEntityInAir = Native.IsEntityInAir(playerPed)
    VexonAC.isPedFalling = Native.IsPedFalling(playerPed)
    VexonAC.isPedClimbing = Native.IsPedClimbing(playerPed)
    VexonAC.isPedJumping = Native.IsPedJumping(playerPed)
    VexonAC.isPedOnVehicle = Native.IsPedOnVehicle(playerPed)
    VexonAC.isPedRunningRagdollTask = Native.IsPedRunningRagdollTask(playerPed)
    VexonAC.isPedJumpingOutOfVehicle = Native.IsPedJumpingOutOfVehicle(playerPed)
    VexonAC.isPedRunningMeleeTask = Native.IsPedRunningMeleeTask(playerPed)
    VexonAC.isPedDiving = Native.IsPedDiving(playerPed)
    
    VexonAC.isNetworkInSpectatorMode = Native.NetworkIsInSpectatorMode()

    VexonAC.isHoldingWeapon, VexonAC.currentWeapon = Native.GetCurrentPedWeapon(playerPed, true)
    VexonAC.selectedWeapon = Native.GetSelectedPedWeapon(playerPed)
    VexonAC.bestWeapon = Native.GetBestPedWeapon(playerPed, true)
    VexonAC.isPedArmed = Native.IsPedArmed(playerPed, 4)

    local tonumber = VexonAC.tonumber
    if not VexonAC.isPlayerDead and Native.IsPedInAnyVehicle(playerPed, false) then
        local currentVehicle = Native.GetVehiclePedIsIn(playerPed, false)
        
        VexonAC.isPlayerInVehicle = true
        VexonAC.playerCurrentVehicle = currentVehicle
        VexonAC.isPlayerDriver = Native.GetPedInVehicleSeat(currentVehicle, -1) == playerPed
        VexonAC.vehicleSpeed = Native.GetEntitySpeed(currentVehicle)
        
        if currentVehicle ~= 0 then
            VexonAC.vehicleModel = Native.GetEntityModel(currentVehicle)
            VexonAC.vehicleTopSpeedModifier = tonumber(string.format("%.1f", Native.GetVehicleTopSpeedModifier(currentVehicle)))
            VexonAC.vehicleCheatPowerIncrease = tonumber(string.format("%.1f", Native.GetVehicleCheatPowerIncrease(currentVehicle)))
            VexonAC.vehicleGravityAmount = tonumber(string.format("%.1f", Native.GetVehicleGravityAmount(currentVehicle)))
        end
    else
        VexonAC.isPlayerInVehicle = false
        VexonAC.playerCurrentVehicle = 0
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        VexonAC.isPlayerDriver = false
        VexonAC.vehicleSpeed = 0
        VexonAC.vehicleModel = 0
        VexonAC.vehicleTopSpeedModifier = 0
        VexonAC.vehicleCheatPowerIncrease = 0
        VexonAC.vehicleGravityAmount = 0
    end
end)

local runDetectionChecks = function(currentTime)
    if not VexonAC.DetectionRegistry.enabled or not VexonAC.playerSpawned or not VexonAC.Config then 
        return 
    end
    
    if VexonAC.debug.stuff then
        VexonAC.TriggerServerEvent("nullevent", ("Loop: %s"):format(currentTime))
    end
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=

    for name, checkFunction in VexonAC.Lua.pairs(VexonAC.DetectionRegistry.checks) do
        local interval = VexonAC.DetectionRegistry.intervals[name]
        local lastRun = VexonAC.DetectionRegistry.lastRun[name]
        
        if currentTime - lastRun >= interval then
            VexonAC.DetectionRegistry.lastRun[name] = currentTime
            checkFunction()
        end
    end
end

VexonAC.CreateThread(function()
    while true do
        local success2, currentTime = false, VexonAC.Native.GetGameTimer()
        local success, errorString = VexonAC.Lua.pcall(function()
            updateInfos()
            runDetectionChecks(currentTime)
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
            success2 = true
        end)

        if not success or not success2 or errorString then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                reason = "Error in main loop",
                error = VexonAC.tostring(errorString) or "pcall manipulation",
            })
        end

        VexonAC.lastActorLoopTime = currentTime
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=

        VexonAC.Wait(1000)
    end
end)


﻿local function IsPlayerUnderground()
    local pCoords = VexonAC and VexonAC.playerCoords ~= nil and VexonAC.playerCoords or GetEntityCoords(VexonAC.playerPed)
    local ground, posZ = VexonAC.Native.GetGroundZFor_3dCoord(pCoords.x, pCoords.y, pCoords.z + 1.0, false)
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    if not ground then
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
        ground, posZ = VexonAC.Native.GetGroundZFor_3dCoord(pCoords.x, pCoords.y, pCoords.z + 999.0, false)
    end
    if ground then
        local distFromGround = pCoords.z - posZ
        return distFromGround < 0, math.abs(distFromGround)
    end
    return false
end

local function HasPlayerSpawned()
    local model = VexonAC.Native.GetEntityModel(VexonAC.playerPed)
    local coords = VexonAC.Native.GetEntityCoords(VexonAC.playerPed)

    if model == 0 then return false end
    if model == GetHashKey("player_zero") then return false end
    if model == GetHashKey("player_one") then return false end
    if model == GetHashKey("player_two") then return false end
    if #(vector3(0.0,0.0,0.0) - coords) < 10 then return false end
    if IsScreenFadingOut() or IsScreenFadingIn() then return false end
    if #(VexonAC.Native.GetGameplayCamCoord() - coords) > 10 then return false end
    if not NetworkIsSessionActive() or not NetworkIsSessionStarted() then return false end
    if IsNuiFocused() then return false end
    if not HasCollisionLoadedAroundEntity(VexonAC.playerPed) then return false end
    if IsPlayerSwitchInProgress() then return false end
-- Zm1hLnd0Zg==
    if not IsEntityOnScreen(VexonAC.playerPed) then return false end
    if IsPlayerUnderground() then return false end
    if not IsEntityVisibleToScript(VexonAC.playerPed) then return false end
    if not IsEntityVisible(VexonAC.playerPed) then return false end
    return true
-- Zm1hLnd0ZiBldmVyeXdoZXJl
end
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B

VexonAC.CreateThread(function()
    while not VexonAC.playerPed do VexonAC.Wait(100) end
    
    while not HasPlayerSpawned() do
        VexonAC.Wait(500)
    end
    VexonAC.Wait(5000)
    VexonAC.playerSpawned = true
end)



﻿AddStateBagChangeHandler("VexonACConfiguration", 'global', function()
    VexonAC.DetectPlayer("Bypass Attempt Detected", {
        reason = "#ICU"
    })
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
end)

AddStateBagChangeHandler(GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q, 'global', function(bagName, key, value, reserved, replicated)
    if (replicated == true) then
        VexonAC.DetectPlayer("Bypass Attempt Detected", {
            reason = "Unauthorized configuration update"
        })
        return
    end

    if (not value or VexonAC.type(value) ~= "table") then
        VexonAC.DetectPlayer("Bypass Attempt Detected", {
            reason = "Invalid configuration type"
        })
        return
    end

    if not value.Main or not value.Entities or not value.Weapons or not value.Beta or not value.Premium then return end

    local token = value.Token
    local decryptedToken = VexonAC.DecryptString(token, VexonAC.InverseSubstitution)
    if not token or not decryptedToken or VexonAC.type(decryptedToken) ~= "string" or not VexonAC.tonumber(decryptedToken) then
        VexonAC.DetectPlayer("Bypass Attempt Detected", {
            reason = "Invalid configuration token"
        })
        return
    end

    local tokenTime = VexonAC.tonumber(decryptedToken)
    local networkTime = GetNetworkTimeAccurate()
    local timeDifference = math.abs(networkTime - tokenTime)
    if timeDifference > 120000 then
        VexonAC.DetectPlayer("Bypass Attempt Detected", {
            reason = "Invalid configuration timestamp",
            timeDifference = timeDifference
        })
        return
    end

    if timeDifference > 10000 then
        return
    end

    VexonAC.Config = value
end)


﻿exports("screenshot",function(webhookUrl)
    VexonAC.assert(VexonAC.TypeCheck.isString(webhookUrl), "webhookUrl: string")

    local screenShotTimedOut = false
    local oldScreenShot = SafeGetLocalPlayerState("ScreenShotURL")

    VexonAC.SendNUIMessage({
        command = "TAKE_SCREENSHOT",
        uploadWebhook = webhookUrl
    })

    Citizen.SetTimeout(5000, function()
        screenShotTimedOut = true
    end)

    while oldScreenShot == SafeGetLocalPlayerState("ScreenShotURL") and not screenShotTimedOut do
        VexonAC.Wait(100)
    end

    if oldScreenShot ~= SafeGetLocalPlayerState("ScreenShotURL") then
        return SafeGetLocalPlayerState("ScreenShotURL")
    else
        VexonAC.print('Unable to create screenshot, timed out.')
        return
    end
end)

-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
exports("captureLastSeconds",function(webhookUrl)
    VexonAC.assert(VexonAC.TypeCheck.isString(webhookUrl), "webhookUrl: string")
    
    local videoTimedOut = false
    local oldVideo = SafeGetLocalPlayerState("GameplayCaptureURL")

    VexonAC.SendNUIMessage({
        command = "SEND_LAST_RECORDING",
        uploadWebhook = webhookUrl
    })

    Citizen.SetTimeout(5000, function()
        videoTimedOut = true
    end)

    while oldVideo == SafeGetLocalPlayerState("GameplayCaptureURL") and not videoTimedOut do
        VexonAC.Wait(100)
    end

    if oldVideo ~= SafeGetLocalPlayerState("GameplayCaptureURL") then
        return SafeGetLocalPlayerState("GameplayCaptureURL")
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    else
        VexonAC.print('Unable to capture gameplay, timed out.')
        return
    end
end)

RegisterNetEvent("__VexonAC:takeScreenShot")
AddEventHandler("__VexonAC:takeScreenShot",function(webhookUrl)
    VexonAC.assert(VexonAC.TypeCheck.isString(webhookUrl), "webhookUrl: string")
    VexonAC.SendNUIMessage({
        command = "TAKE_SCREENSHOT",
        uploadWebhook = webhookUrl
    })
end)

RegisterNetEvent("__VexonAC:uploadCapturedGameplay")
AddEventHandler("__VexonAC:uploadCapturedGameplay",function(webhookUrl)
    VexonAC.assert(VexonAC.TypeCheck.isString(webhookUrl), "webhookUrl: string")
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
    VexonAC.SendNUIMessage({
        command = "SEND_LAST_RECORDING",
        uploadWebhook = webhookUrl
    })
end)

RegisterNUICallback("screenshotSaved", function(data, cb)
    if data and data.screenshotUrl then
-- Zm1hLnd0Zg==
        SafeSetLocalPlayerState('ScreenShotURL', data.screenshotUrl, true)
    end

    cb({})
end)

RegisterNUICallback("saveVideoData", function(data, cb)
    if data and data.videoUrl then
        SafeSetLocalPlayerState('GameplayCaptureURL', data.videoUrl, true)
    end

    cb({})
end)

VexonAC.CreateThread(function()
    VexonAC.Wait(5000)

    VexonAC.SendNUIMessage({
        command = "GET_TOKENS"
    })

    -- Always start the capture canvas so screenshots work regardless of gameplay recording setting.
    -- Recordings are only uploaded when captureLastSeconds is explicitly called.
    VexonAC.SendNUIMessage({
        command = "START_RECORDING"
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    })
end)


﻿-- VexonAC WebRTC Streaming Client
local streamingSessions = {}
local isStreamingEnabled = false

-- Register NUI callback for WebRTC events from browser
RegisterNUICallback('webrtc_event', function(data, cb)
    local eventType = data.eventType
    local eventData = data.data
        
    if eventType == 'ice_candidate' then
        -- Send ICE candidate to server (TypeScript WebRTC service)
        VexonAC.TriggerServerEvent('_WS:webrtc:ice_candidate', {
            candidate = eventData.candidate,
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
            streamId = eventData.streamId
        })
    elseif eventType == 'webrtc_answer' then
        -- Send WebRTC answer to server (TypeScript WebRTC service)
        VexonAC.TriggerServerEvent('_WS:webrtc:answer', {
            answer = eventData.answer,
            streamId = eventData.streamId
        })
    elseif eventType == 'stream_started' then
        isStreamingEnabled = true
        
        -- Notify TypeScript WebRTC service that streaming started
        VexonAC.TriggerServerEvent('_WS:webrtc:stream_started', {
            streamId = eventData.streamId
-- ZiBtIGE=
        })
    elseif eventType == 'stream_stopped' then
        isStreamingEnabled = false
        
        -- Notify TypeScript WebRTC service that streaming stopped
        VexonAC.TriggerServerEvent('_WS:webrtc:stream_stopped', {
            reason = eventData.reason or 'User stopped'
        })
    end
    
    cb({ success = true })
end)

-- Handle incoming WebRTC offers from web app (via TypeScript WebRTC service)
RegisterNetEvent('_WS:webrtc:offer', function(data)    
    -- Send offer to NUI
    VexonAC.SendNUIMessage({
        type = 'webrtc_offer',
        data = data,    
    })
end)

-- Handle incoming ICE candidates from web app (via TypeScript WebRTC service)
RegisterNetEvent('_WS:webrtc:ice_candidate', function(data)    
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
    -- Send ICE candidate to NUI
    VexonAC.SendNUIMessage({
        type = 'webrtc_ice_candidate',
        data = data
    })
end)

-- Handle start stream request from web app (via TypeScript WebRTC service)
RegisterNetEvent('_WS:webrtc:start_stream_request', function(data)    
    local streamId = data.streamId
    local iceServers = data.iceServers
        
    VexonAC.SendNUIMessage({
        type = "start_stream",
        data = {
            streamId = streamId,
            iceServers = iceServers
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        }
    })
end)

-- Handle stop stream request from web app (via TypeScript WebRTC service)
RegisterNetEvent('_WS:webrtc:stop_stream', function(data)    
    -- Send stop stream request to NUI
    VexonAC.SendNUIMessage({
        type = 'stop_stream'
    })
end)


﻿local protectedEvents = {}

exports("IsEventProtected", LPH_NO_VIRTUALIZE(function(eventName)
  local resourceName = GetInvokingResource()
  if not resourceName then return end
  
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
  local isExport = eventName:find("__cfx_export_")
  if isExport then
    return protectedEvents[eventName] ~= nil
  end

-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
  return protectedEvents[eventName..":"..resourceName] ~= nil
end))
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=

AddEventHandler("__VexonAC_internal:protectEvent", LPH_NO_VIRTUALIZE(function(eventName)
  local resourceName = GetInvokingResource()
  if not resourceName then return end

  local isExport = eventName:find("__cfx_export_")
  if isExport then
    protectedEvents[eventName] = true
    return
  end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
  
  protectedEvents[eventName..":"..resourceName] = true
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
end))


﻿local resourceNumber = 0

local IsAntiResourceStopDisabled = false
local resourceStopDisableTimeout = 0
local restartingResources = {}
local function tempDisableAntiResourceStop()
    resourceStopDisableTimeout = VexonAC.Native.GetGameTimer() + 30000
    if not IsAntiResourceStopDisabled then
        IsAntiResourceStopDisabled = true
        VexonAC.CreateThread(function()
            while VexonAC.Native.GetGameTimer() < resourceStopDisableTimeout do
                VexonAC.Wait(100)
            end
            IsAntiResourceStopDisabled = false
            resourceStopDisableTimeout = 0
            restartingResources = {}
        end)
    end
end
RegisterNetEvent("__VexonAC:NewResourcesData", function(resourceName, cRs, sRs)
    if GetInvokingResource() ~= nil then return end
    clientResources = json.decode(cRs)
    serverResources = json.decode(sRs)
    restartingResources[resourceName] = true
    tempDisableAntiResourceStop()
end)

AddStateBagChangeHandler('VexonAC_ClientResources', 'global', function(bagName, key, value, reserved, replicated)
    clientResources = json.decode(value)
end)

AddStateBagChangeHandler('VexonAC_ServerResources', 'global', function(bagName, key, value, reserved, replicated)
    serverResources = json.decode(value)
-- ZGlzY29yZC5nZy9mbWE=
end)

AddEventHandler("onClientResourceStart", function(resourceName)
    VexonAC.Wait(5000)
    if VexonAC.Config.Main.AntiResourceInjection and not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] and not serverResources[resourceName] then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_INJECTION, {
            event = "onClientResourceStart",
            resource = resourceName,
        })
    end
    resourceNumber = GetNumResources()
end)

AddEventHandler('onResourceStart', function(resourceName)
    if GetInvokingResource() ~= nil then return end
    
    VexonAC.Wait(5000)
    if VexonAC.Config.Main.AntiResourceInjection and not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] and not serverResources[resourceName] then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_INJECTION, {
            event = "onResourceStart",
            resource = resourceName,
        })
    end
    resourceNumber = GetNumResources()
end)

AddEventHandler('onResourceStarting', function(resourceName)
    if GetInvokingResource() ~= nil then return end
    
    VexonAC.Wait(5000)
    if VexonAC.Config.Main.AntiResourceInjection and not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] and not serverResources[resourceName] then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_INJECTION, {
            event = "onResourceStarting",
            resource = resourceName,
        })
    end
    resourceNumber = GetNumResources()
end)

AddEventHandler("onResourceStop", function(resourceName)
    if GetInvokingResource() ~= nil then return end

    VexonAC.Wait(5000)
    if VexonAC.Config.Main.AntiResourceStop and not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] and serverResources[resourceName] then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_STOP, {
            event = "onResourceStop",
            resource = resourceName,
        })
    end
    resourceNumber = GetNumResources()
end)

AddEventHandler('onClientResourceStop', function (resourceName)
    if GetInvokingResource() ~= nil then return end
    
    VexonAC.Wait(5000)
    if VexonAC.Config.Main.AntiResourceStop and not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] and serverResources[resourceName] then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_STOP, {
            event = "onClientResourceStop",
            resource = resourceName,
        })
    end
    resourceNumber = GetNumResources()
end)

VexonAC.CreateThread(function()
    resourceNumber = GetNumResources()

    while true do
        VexonAC.Wait(10000)

        if VexonAC.Config.Main.AntiResourceInjection then
            if resourceNumber ~= GetNumResources() then
                for i = 0, GetNumResources() - 1 do
                    local resourceName = GetResourceByFindIndex(i)
                    if not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] and not serverResources[resourceName] then
                        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_INJECTION, {
                            resource = resourceName,
                        })
                        return
                    end
                end
            end
        end

        if VexonAC.Config.Main.AntiResourceStop then
            local resourceCount = 0
            for resourceName, v in VexonAC.Lua.pairs(clientResources) do
                if v == true and resourceName ~= "_cfx_internal" then
                    if not GlobalState.IsAntiResourceStopDisabled and not restartingResources[resourceName] then
                        local isAlive, lastHeartbeat = false, 0
                        local _,err = VexonAC.Lua.pcall(function()
                            isAlive, lastHeartbeat = exports[resourceName]:IsAlive()
                        end)
                        if err or not isAlive then
                            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_STOP, {
                                reason = "Resource is not running",
                                resourceName = resourceName,
                            })
                        elseif isAlive then
                            if VexonAC.type(lastHeartbeat) ~= "number" or lastHeartbeat <= 0 or (VexonAC.Native.GetGameTimer() - lastHeartbeat > 5000) then
                                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_RESOURCE_STOP, {
                                    reason = "Suspended",
                                    resourceName = resourceName,
                                })
                                return
                            end
                        end
                    end
                end
                
                resourceCount = resourceCount + 1
                if resourceCount % 5 == 0 then
                    VexonAC.Wait(10)
                end
            end
        end
    end
end)



﻿-- ============================================================================
-- OPTIMIZED IsValidExecution Module
-- Performance-focused refactor with all detections preserved
-- ============================================================================

-- ============================================================================
-- CACHES AND LOOKUP TABLES
-- ============================================================================

-- Main execution cache (validated execution patterns)
local executionCache = {}
local activeLinesCache = {}
local lastInjectedCode = 0

-- File content cache with timestamps for invalidation
local fileContentCache = {}
local fileLinesCache = {}
local FILE_CACHE_MAX_SIZE = 100
local fileCacheOrder = {}

-- Source validation caches
local whitelistedSources = {}
local blacklistedSources = {
    ["[string \"\"]"] = true,
}

-- Pre-computed scheduler execution patterns (frozen table for faster lookup)
local schedulerExecution <const> = {
    ["citizen:/scripting/lua/scheduler.lua"] = {
        ["getupvalue:213"] = true,
        ["getupvalue:225"] = true,
        ["xpcall:483"] = true,
        ["pcall:718"] = true,
        ["TriggerEvent:708"] = true,
        ["ref:484"] = true,
        ["nil:484"] = true,
        ["handler:172"] = true,
        ["nil:172"] = true,
        ["nil:67"] = true,
        ["fn:67"] = true,
        ["wrap:71"] = true,
        ["nil:574"] = true,
        ["nil:576"] = true,
        ["cbHandler:784"] = true,
        ["cbHandler:797"] = true,
        ["error:713"] = true,
    },
    ["citizen:/scripting/lua/deferred.lua"] = {
        ["pcall:40"] = true,
        ["pcall:75"] = true,
        ["pcall:77"] = true,
        ["pcall:93"] = true,
        ["pcall:130"] = true,
        ["promise:65"] = true,
        ["promise:96"] = true,
        ["nonpromisecb:56"] = true,
        ["fire:111"] = true,
        ["nil:21"] = true,
        ["nil:75"] = true,
        ["nil:23"] = true,
        ["nil:142"] = true,
        ["nil:144"] = true,
        ["finish:101"] = true,
    },
    ["citizen:/scripting/lua/graph.lua"] = {},
    ["citizen:/scripting/lua/natives_loader.lua"] = {},
    ["citizen:/scripting/lua/json.lua"] = {},
    ["citizen:/scripting/lua/MessagePack.lua"] = {},
}

-- Pre-computed patterns for function start detection
local functionStartTerms <const> = { "function", "CreateThread", "SetTimeout", "AddEventHandler" }

-- Citizen source prefix (avoid repeated substring)
local CITIZEN_PREFIX <const> = "citizen:/scripting/lua/"
local CITIZEN_PREFIX_LEN <const> = 23

-- ============================================================================
-- UTILITY FUNCTIONS (OPTIMIZED)
-- ============================================================================

-- Fast string builder for cache keys (avoids string.format overhead)
local cacheKeyBuffer = {}
local function buildCacheKey(...)
    local args = {...}
    local n = #args
    for i = 1, n do
        local v = args[i]
        cacheKeyBuffer[i] = v ~= nil and tostring(v) or "nil"
    end
    -- Clear extra slots from previous calls
    for i = n + 1, #cacheKeyBuffer do
        cacheKeyBuffer[i] = nil
    end
    return table.concat(cacheKeyBuffer, "|")
end

-- Fast numeric hash for cache keys (when string key not needed)
local function hashCacheKey(s1, s2, s3, n1, n2, n3)
    local h = 5381
    if s1 then for i = 1, #s1 do h = ((h * 33) + string.byte(s1, i)) % 2147483647 end end
    if s2 then for i = 1, #s2 do h = ((h * 33) + string.byte(s2, i)) % 2147483647 end end
    if s3 then for i = 1, #s3 do h = ((h * 33) + string.byte(s3, i)) % 2147483647 end end
    h = ((h * 33) + (n1 or 0)) % 2147483647
    h = ((h * 33) + (n2 or 0)) % 2147483647
    h = ((h * 33) + (n3 or 0)) % 2147483647
    return h
end

-- Extract resource and filename from source path (optimized)
local function getResourceAndFileNamesOfSource(source)
    if not source then return nil, nil, true end
    
    local firstChar = source:sub(1, 1)
    
    -- Quick checks for invalid sources
    if source:find("%[string \"", 1, false) then return nil, nil, true end
    if firstChar ~= "@" then return nil, nil, true end
    if source:sub(1, 3) == "..." or source:sub(1, 4) == "@..." then return nil, nil, true end
    
    -- Extract resource and filename
    local slashPos = source:find("/", 2, true)
    if not slashPos then return nil, nil, true end
    
    local resourceName = source:sub(2, slashPos - 1)
    local fileName = source:sub(slashPos + 1)
    
    return resourceName, fileName, false
end

-- Get cached file content with LRU eviction
local function getCachedFileContent(resourceName, fileName)
    local cacheKey = resourceName .. "/" .. fileName
    local cached = fileContentCache[cacheKey]
    
    if cached then
        return cached
    end
    
    local content = VexonAC.LoadResourceFile(resourceName, fileName)
    if not content then return nil end
    
    -- Normalize line endings once
    content = content:gsub("\r\n", "\n"):gsub("\r", "\n")
    
    -- LRU eviction if cache is full
    if #fileCacheOrder >= FILE_CACHE_MAX_SIZE then
        local oldest = table.remove(fileCacheOrder, 1)
        fileContentCache[oldest] = nil
        fileLinesCache[oldest] = nil
-- Zm1hLnd0ZiBldmVyeXdoZXJl
    end
    
    fileContentCache[cacheKey] = content
    table.insert(fileCacheOrder, cacheKey)
    
    return content
end

-- Get cached parsed lines from file
local function getCachedFileLines(resourceName, fileName)
    local cacheKey = resourceName .. "/" .. fileName
    local cached = fileLinesCache[cacheKey]
    
    if cached then
        return cached.lines, cached.hasComments
    end
    
    local content = getCachedFileContent(resourceName, fileName)
    if not content then return nil, false end
    
    local lines = {}
    local hasComments = false
    local lineNum = 1
    local start = 1
    local contentLen = #content
    
    for i = 1, contentLen do
        if content:sub(i, i) == "\n" then
            local line = content:sub(start, i - 1)
            lines[lineNum] = line
            
            -- Check for block comments (only if not found yet)
            if not hasComments then
                local trimmed = line:match("^%s*(.-)%s*$") or ""
                if not trimmed:match("^%-%-") and trimmed:find("/*", 1, true) then
                    hasComments = true
                end
            end
            
            lineNum = lineNum + 1
            start = i + 1
        end
    end
    
    -- Handle last line without newline
    if start <= contentLen then
        lines[lineNum] = content:sub(start)
    end
    
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    fileLinesCache[cacheKey] = { lines = lines, hasComments = hasComments }
    return lines, hasComments
end

-- Clear cache entries for a specific resource (called on resource restart)
-- Track which resources own which cache entries (for efficient invalidation)
local executionCacheByResource = {}
local activeLinesCacheByResource = {}

local function clearResourceCache(resourceName)
    if not resourceName then return end
    
    -- Clear execution cache entries for this resource
    local resourceExecutionKeys = executionCacheByResource[resourceName]
    if resourceExecutionKeys then
        for key in pairs(resourceExecutionKeys) do
            executionCache[key] = nil
        end
        executionCacheByResource[resourceName] = nil
    end
    
    -- Clear active lines cache entries for this resource
    local resourceActiveLinesKeys = activeLinesCacheByResource[resourceName]
    if resourceActiveLinesKeys then
        for key in pairs(resourceActiveLinesKeys) do
            activeLinesCache[key] = nil
        end
        activeLinesCacheByResource[resourceName] = nil
    end
    
    -- Clear file caches for this resource
    local prefix = resourceName .. "/"
    for i = #fileCacheOrder, 1, -1 do
        local key = fileCacheOrder[i]
        if key:sub(1, #prefix) == prefix then
            fileContentCache[key] = nil
            fileLinesCache[key] = nil
            table.remove(fileCacheOrder, i)
        end
    end
end

-- Helper to register cache entry ownership
local function trackCacheEntry(cacheType, resourceName, cacheKey)
    if not resourceName then return end
    
    if cacheType == "execution" then
        if not executionCacheByResource[resourceName] then
            executionCacheByResource[resourceName] = {}
        end
        executionCacheByResource[resourceName][cacheKey] = true
    elseif cacheType == "activelines" then
        if not activeLinesCacheByResource[resourceName] then
            activeLinesCacheByResource[resourceName] = {}
        end
        activeLinesCacheByResource[resourceName][cacheKey] = true
    end
end

-- Listen for resource restart events
AddEventHandler('onClientResourceStart', function(resourceName)
    clearResourceCache(resourceName)
end)

AddEventHandler('onClientResourceStop', function(resourceName)
    clearResourceCache(resourceName)
end)

-- ============================================================================
-- LINE VALIDATION (OPTIMIZED)
-- ============================================================================

-- Check if a specific line contains a string (with block comment support)
-- Important: Uses three separate if blocks (not if-else) to handle lines that
-- both end a comment AND contain code (e.g., "*/ local x = 1")
local function doesLineContainString(resourceName, fileName, lineNumber, stringToFind)
    if not resourceName or not fileName or type(lineNumber) ~= "number" or lineNumber <= 0 then
        return "INVALID_LINE_1", false
    end
    
    local lines, hasComments = getCachedFileLines(resourceName, fileName)
    if not lines then
        return "INVALID_LINE_1", false
    end
    
    if lineNumber > #lines then
        return "INVALID_LINE_2", false
    end
    
    -- Fast path: no block comments
    if not hasComments then
        local targetLine = lines[lineNumber]
        return targetLine, targetLine:find(stringToFind, 1, true) ~= nil, lineNumber
    end
    
    -- Slow path: handle C-style block comments (/* */)
    -- debug.getinfo doesn't count lines inside block comments, so we must
    -- map the reported line number to the actual file line
    local codeLineCount = 0
    local inComment = false
    
    for i, line in VexonAC.Lua.ipairs(lines) do
        local trimmedLine = line:match("^%s*(.-)%s*$") or ""
        
        -- Check if entering a comment block
        if not inComment then
            if trimmedLine:sub(1, 2) == "/*" then
                inComment = true
            end
        end
        
        -- Check if exiting a comment block
        if inComment then
            if trimmedLine:match("%*/$") then
                inComment = false
            end
        end
        
        -- Count non-comment lines (runs AFTER comment exit check,
        -- so lines ending with */ can still be counted if they contain code)
        if not inComment then
            codeLineCount = codeLineCount + 1
            if codeLineCount == lineNumber then
                return line, line:find(stringToFind, 1, true) ~= nil, i
            end
        end
    end
    
    return "INVALID_LINE_3", false
end

-- ============================================================================
-- ACTIVE LINES VALIDATION (OPTIMIZED)
-- ============================================================================

local function ValidateActiveLines(resourceName, info)
    -- Build cache key using hash for speed
    local cacheKey = hashCacheKey(
        resourceName,
        info.short_src,
        info.name or "",
        info.currentline or -100,
        info.linedefined or -100,
        info.lastlinedefined or -100
    )
    
    local cached = activeLinesCache[cacheKey]
    if cached then
        -- Quick hash comparison of active lines
        local activeLinesHash = 0
        for line, active in VexonAC.Lua.pairs(info.activelines or {}) do
            if active then
                activeLinesHash = activeLinesHash + line
            end
        end
        
        if cached.hash == activeLinesHash then
            return cached.isValid
        end
    end
    
    local resource, fileName = getResourceAndFileNamesOfSource(info.short_src)
    if not resource or not fileName then
        return true -- Can't validate, assume valid
    end
    
    local lines, hasComments = getCachedFileLines(resource, fileName)
    if not lines or hasComments then
        -- Can't reliably validate with block comments, cache as valid
        activeLinesCache[cacheKey] = { isValid = true, hash = 0 }
        trackCacheEntry("activelines", resource, cacheKey)
        return true
    end
    
    local isValid = true
    local activeLinesHash = 0
    
    for lineNum = info.linedefined, info.lastlinedefined do
        local line = lines[lineNum]
        if line then
            local trimmedLine = line:match("^%s*(.-)%s*$") or ""
            local isActive = info.activelines and info.activelines[lineNum] or false
            
            if isActive then
                activeLinesHash = activeLinesHash + lineNum
            end
            
            -- Check if line should NOT be active
            local isEmpty = trimmedLine == ""
            local isComment = trimmedLine:match("^%-%-[^%[]") or trimmedLine == "--"
            
            if (isEmpty or isComment) and isActive then
                if VexonAC.debug.short_executions then
                    VexonAC.print("LINE SHOULD NOT BE ACTIVE BUT IS:", lineNum, "'" .. trimmedLine .. "'")
                end
                isValid = false
                break
            end
            
            -- Check if line MUST be active (not for first line)
            if lineNum ~= info.linedefined then
                local mustBeActive = (lineNum == info.currentline or lineNum == info.lastlinedefined)
                if mustBeActive and not isActive then
                    if VexonAC.debug.short_executions then
                        VexonAC.print("LINE MUST BE ACTIVE BUT ISN'T:", lineNum, "'" .. trimmedLine .. "'")
                    end
                    isValid = false
                    break
                end
            end
        end
    end
    
    -- Special case: anonymous function definition
    if not isValid and lines[info.linedefined] then
        if lines[info.linedefined]:match("^%s*function%s*%(") then
            isValid = true
        end
    end
    
    activeLinesCache[cacheKey] = { isValid = isValid, hash = activeLinesHash }
    trackCacheEntry("activelines", resource, cacheKey)
    return isValid
end

-- ============================================================================
-- CORE VALIDATION FUNCTIONS (OPTIMIZED)
-- ============================================================================

local function CheckIsValidExecution(resourceName, info4, fullSource, source, currentLine, funcName, nativeName)
    -- Fast cache key using hash
    local cacheKey = hashCacheKey(resourceName, source, funcName, currentLine, 0, 0)
    
    local cached = executionCache[cacheKey]
    if cached ~= nil then
        return cached
    end
    
    -- Early exit: load function with specific conditions
    if nativeName == "load" and info4 and (info4.name == "load" or info4.namewhat == "") then
        executionCache[cacheKey] = true
        trackCacheEntry("execution", resourceName, cacheKey)
        return true
    end
    
    -- Early exit: citizen scripting paths
    if source:sub(1, CITIZEN_PREFIX_LEN) == CITIZEN_PREFIX then
        executionCache[cacheKey] = true
        trackCacheEntry("execution", resourceName, cacheKey)
        return true
    end
    
    local resource, fileName, loadCall = getResourceAndFileNamesOfSource(source)
    
    -- Whitelisted or load call sources
    if loadCall or whitelistedSources[fullSource] then
        if VexonAC.debug.short_executions then
            VexonAC.print("allowing execution", resource, fileName, loadCall, fullSource, source, currentLine, funcName)
        end
        executionCache[cacheKey] = true
        trackCacheEntry("execution", resource or resourceName, cacheKey)
        return true
    end
    
    -- Invalid resource check
    if not resource or not fileName or GetResourceState(resource) == "missing" then
        if VexonAC.debug.short_executions then
            VexonAC.print("Invalid resource", resource, fileName, source, currentLine, funcName)
        end
        return false
    end
    
    if VexonAC.debug.short_executions then
        VexonAC.print(("A11AXXX %s - %s - %s - %s"):format(funcName, source, resource, fileName))
    end
    
    -- Check line content
    local currentLineString, stringMatch = doesLineContainString(resource, fileName, currentLine, funcName)
    
    if VexonAC.debug.short_executions then
        VexonAC.print(("NEWDBG %s - %s -> %s"):format(funcName, source, currentLineString))
    end
    
    if not stringMatch then
        -- Obfuscator detection
        if type(currentLineString) == "string" and #currentLineString > 1000 then
            if currentLineString:find("getfenv", 1, true) or currentLineString:find("_ENV", 1, true) then
                executionCache[cacheKey] = true
                trackCacheEntry("execution", resource, cacheKey)
                return true
            end
        end
        
        if VexonAC.debug.short_executions then
            VexonAC.print("UNISOLATED INJECTION OMG MDR")
        end
        return false
    end
    
    executionCache[cacheKey] = true
    trackCacheEntry("execution", resource, cacheKey)
    return true
end

-- ============================================================================
-- STACK SEARCH UTILITY (OPTIMIZED)
-- ============================================================================

local function searchInStacksDesc(stacks, targetSrc, lineDef, lastLineDef, currLine, targetName)
    for i = #stacks, 1, -1 do
        local info = stacks[i]
        if info and
           info.short_src == targetSrc and
           info.linedefined == lineDef and
           info.lastlinedefined == lastLineDef and
           info.currentline == currLine and
           info.name == targetName then
            return i, info
        end
    end
    return nil, nil
end

-- ============================================================================
-- MAIN VALIDATION FUNCTION (OPTIMIZED)
-- ============================================================================

local IsValidExecution <const> = function(funcName, resourceName, stacks, additionalStacks, isFXAP, disableMachoDetection)
    additionalStacks = additionalStacks or 0
    
    local info2 = stacks[2 + additionalStacks] or {}
    local info = stacks[3 + additionalStacks] or {}
    local info4 = stacks[4 + additionalStacks] or {}
    local info5 = stacks[5 + additionalStacks] or {}
    
    if VexonAC.debug.short_executions then
        VexonAC.print(("Executed ^3%s^7 from ^3%s^7 in ^3%s^7 at line ^3%s^7"):format(
            funcName, resourceName, info.short_src, info.currentline))
    end

    if VexonAC.debug.stuff then
        VexonAC.TriggerServerEvent("nullevent", ("Executed ^3%s^7 from ^3%s^7 in ^3%s^7 at line ^3%s^7"):format(
            funcName, resourceName, info.short_src, info.currentline))
    end
    
    if VexonAC.debug.executions then
        for i, stackInfo in VexonAC.Lua.ipairs(stacks) do
            if stackInfo then
                VexonAC.print(("DEBUG %s: %s - %s"):format(funcName, i, json.encode(stackInfo, { indent = true })))
            end
        end
    end

    if VexonAC.debug.stuff then
        for i, stackInfo in VexonAC.Lua.ipairs(stacks) do
            if stackInfo then
                VexonAC.TriggerServerEvent("nullevent", ("DEBUG %s: %s - %s"):format(funcName, i, json.encode(stackInfo, { indent = true })))
            end
        end
    end
    
    local functionToCheck = (info2.name and info2.name ~= "?" and info2.name ~= "") and info2.name or funcName
    
    -- ========================================================================
    -- DETECTION #8: Illegal VexonAC include.lua manipulation
    -- ========================================================================
    for i, stackInfo in VexonAC.Lua.ipairs(stacks) do
        if stackInfo then
            local underLevel = stacks[i - 1] or {}
            local isInfo3 = (i == 3 + additionalStacks)
            
            if LPH_OBFUSCATED and stackInfo.short_src == "@VexonAC/resource/include.lua" then
                if stackInfo.currentline ~= 3 or stackInfo.linedefined ~= 3 or stackInfo.lastlinedefined ~= 3 or
                   (isInfo3 and underLevel.name ~= "integer index") then
                    return false, "Illegal Native Execution #8", {
                        ["function"] = funcName,
                        pattern = ("%s:%s:%s:%s:%s:%s"):format(i, stackInfo.short_src, stackInfo.name,
                            stackInfo.linedefined, stackInfo.currentline, stackInfo.lastlinedefined),
                    }
                end
            end
            
            -- ================================================================
            -- DETECTION #6: Scheduler execution pattern validation
            -- ================================================================
            local schedulerPatterns = schedulerExecution[stackInfo.short_src]
            if schedulerPatterns and underLevel then
                local patternKey = (underLevel.name or "nil") .. ":" .. stackInfo.currentline
                if not schedulerPatterns[patternKey] then
                    return false, "Illegal Native Execution #6", {
                        ["function"] = funcName,
                        pattern = ("%s:%s:%s:%s:%s"):format(i, stackInfo.short_src, stackInfo.name,
                            underLevel.name, stackInfo.currentline),
                    }
                end
            end
        end
    end
    
    -- ========================================================================
    -- DETECTION #7: Luraph obfuscation bypass attempt
    -- ========================================================================
    if info.source and info.source:find("Luraph", 1, true) then
        if not info.source:match("^Luraph%s+$") or
           info.linedefined ~= 1 or info.currentline ~= 1 or info.lastlinedefined ~= 1 then
            return false, "Illegal Native Execution #7", {
                ["function"] = funcName,
                pattern = ("%s:%s:%s:%s:%s"):format(info.short_src, info.name,
                    info.linedefined, info.currentline, info.lastlinedefined),
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
            }
        end
    end
    
    -- ========================================================================
    -- DETECTION #3: Blacklisted source execution
    -- ========================================================================
    if blacklistedSources[info.short_src] and not whitelistedSources[info.source] then
        return false, "Illegal Native Execution #3", {
            ["function"] = funcName,
            pattern = ("%s:%s:%s:%s:%s"):format(info.short_src, info.name,
                info.linedefined, info.currentline, info.lastlinedefined),
        }
    end
    
    -- ========================================================================
    -- DETECTION #1: Macho injection (unknown source)
    -- ========================================================================
    if info.short_src == "?" and info.source == "=?" and info2.name and not isFXAP then
        if (VexonAC.Native.GetGameTimer() - lastInjectedCode) > 1000 then
            return false, "Illegal Native Execution #1", {
                ["function"] = funcName,
                pattern = ("%s:%s:%s:%s"):format(resourceName, info.name, info.namewhat, info2.name),
            }
        end
    end
    
    -- ========================================================================
    -- DETECTION #1.3, #1.4, #1.5: Macho injection variants
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
    -- ========================================================================
    local level, levelInfo = searchInStacksDesc(stacks,
        "citizen:/scripting/lua/scheduler.lua", 64, 69, 67, "wrap")
    
    if level and levelInfo then
        local underInfo = stacks[level - 1]
        local under2Info = stacks[level - 2]
        
        -- Detection #1.3
        if not disableMachoDetection and not isFXAP and underInfo then
            if underInfo.source == "=?" and underInfo.what == "main" and
               underInfo.name == "fn" and underInfo.namewhat == "upvalue" and
               underInfo.linedefined == 0 and underInfo.lastlinedefined == 0 then
                if info.namewhat ~= "metamethod" or
                   info.short_src ~= "citizen:/scripting/lua/scheduler.lua" or
                   info.currentline ~= 708 then
                    return false, "Illegal Native Execution #1.3", {
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
                        ["function"] = funcName,
                        pattern = ("%s:%s:%s"):format(resourceName, underInfo.source, underInfo.currentline),
                    }
                end
            end
        end
        
        -- Detection #1.4
        if underInfo and underInfo.name == "fn" and underInfo.namewhat == "upvalue" then
            if under2Info and under2Info.name == "Wait" then
                return false, "Illegal Native Execution #1.4", {
                    ["function"] = funcName,
                    pattern = ("%s:%s:%s:%s:%s"):format(resourceName, underInfo.short_src,
                        underInfo.linedefined, under2Info.currentline, underInfo.lastlinedefined),
                }
            end
        end
        
        -- Detection #1.5
        if underInfo and underInfo.short_src and underInfo.short_src:find("%[string \"") then
            if underInfo.what == "Lua" and underInfo.name == "fn" then
                if under2Info and under2Info.short_src and under2Info.short_src:find("%[string \"") then
                    if under2Info.what == "main" then
                        return false, "Illegal Native Execution #1.5", {
                            ["function"] = funcName,
                            pattern = ("%s:%s:%s:%s:%s"):format(resourceName, underInfo.short_src,
                                underInfo.linedefined, under2Info.currentline, underInfo.lastlinedefined),
                        }
                    end
                end
            end
        end

        -- Detection #1.6 (Susano NO_THREAD - inject in native loading)
        if underInfo and underInfo.name == "fn" and underInfo.namewhat == "upvalue" then
            if under2Info and under2Info.source == ("@%s.lua"):format(under2Info.name) then
                return false, "Illegal Native Execution #1.6", {
                    ["function"] = funcName,
                    pattern = ("%s:%s:%s:%s:%s:%s"):format(underInfo.short_src, funcName, under2Info.name,
                        underInfo.linedefined, underInfo.currentline, underInfo.lastlinedefined),
                }
            end
        end
    end
    
    -- ========================================================================
    -- EARLY EXIT: Citizen or unknown sources
    -- ========================================================================
    if info.short_src == "?" or info.short_src:sub(1, CITIZEN_PREFIX_LEN) == CITIZEN_PREFIX then
        return true
    end
    
    -- ========================================================================
    -- FUNCTION BOUNDARY VALIDATION
    -- ========================================================================
    if info.what == "Lua" and info.namewhat ~= "metamethod" and info2.namewhat ~= "" and
       info.linedefined > 0 and info.lastlinedefined > 0 and
       info.short_src and info.short_src ~= "?" and
       (funcName ~= "pcall" or info4.name ~= "require") then
        
        local instantFlag = false
        
        -- Validate active lines
        local isValidActiveLines = ValidateActiveLines(resourceName, info)
        
        -- Validate function end (must contain "end")
        local isValidFunctionEnd = CheckIsValidExecution(
            resourceName, info4, info.source, info.short_src,
            info.lastlinedefined, "end", funcName)
        
        -- Validate function start
        local isValidFunctionStart = false
        for _, term in VexonAC.Lua.ipairs(functionStartTerms) do
            isValidFunctionStart = CheckIsValidExecution(
                resourceName, info4, info.source, info.short_src,
                info.linedefined, term, funcName)
            
            if term == "AddEventHandler" and isValidFunctionStart then
                instantFlag = true
                break
            end
            if isValidFunctionStart then break end
        end
        
        -- Validate function name on current line
        local isValidFunctionName = CheckIsValidExecution(
            resourceName, info4, info.source, info.short_src,
            info.currentline, functionToCheck, funcName)
        
        -- Validate nested calls
        local isValidNested = true
        if info4 and info4.what == "Lua" and info4.namewhat == "upvalue" and
           info.name and info.name ~= "?" and info.name ~= "" and info4.short_src ~= "?" then
            isValidNested = CheckIsValidExecution(
                resourceName, info4, info4.source, info4.short_src,
                info4.currentline, info.name, funcName)
        end
        
        -- Final validation check
        if not isValidActiveLines or not isValidFunctionStart or not isValidFunctionEnd or
           instantFlag or not isValidNested or not isValidFunctionName then
            if VexonAC.debug.short_executions then
                VexonAC.print("11DEBUG 1", funcName, isValidActiveLines, isValidFunctionStart,
                    isValidFunctionEnd, not instantFlag, isValidNested, isValidFunctionName)
                VexonAC.print("11DEBUG 2", funcName, json.encode(info2, { indent = true }))
                VexonAC.print("11DEBUG 3", funcName, json.encode(info, { indent = true }))
                VexonAC.print("11DEBUG 4", funcName, json.encode(info4, { indent = true }))
            end
            
            return false, "Illegal Native Execution", {
                ["function"] = funcName,
                pattern = ("%s:%s:%s:%s:%s"):format(info.short_src, info.name,
                    info.linedefined, info.currentline, info.lastlinedefined),
            }
        end
    end
    
    -- ========================================================================
    -- DETECTION #4: Tailcall optimization exploitation
    -- ========================================================================
    if not info2.name and info2.namewhat == "" then
        if VexonAC.debug.short_executions then
            VexonAC.print("invalid name", funcName, info.namewhat, info.name,
                info.linedefined, info.lastlinedefined, info.short_src,
                json.encode(info2, { indent = true }))
        end
        
        local isValidFunctionCall = CheckIsValidExecution(
            resourceName, info4, info.source, info.short_src,
            info.currentline, "(", funcName)
        
        if (not isValidFunctionCall and info4.name ~= "ref" and info4.name ~= "wrap") or
           resourceName == "VexonAC" or
           (LPH_OBFUSCATED and info.short_src == "@VexonAC/resource/include.lua" and info.currentline ~= 3) then
            return false, "Illegal Native Execution #4", {
                ["function"] = funcName,
                pattern = ("%s:%s:%s:%s"):format(info.short_src, info.name, info.namewhat, info.currentline),
            }
        end
        
        return true
    end
    
    -- ========================================================================
    -- DETECTION #2: Main chunk injection
    -- ========================================================================
    if info.what == "main" and
       (info.namewhat == "upvalue" or (not info.name and info.namewhat == "")) and
       info.linedefined == 0 and info.lastlinedefined == 0 and info.currentline > 0 then
        
        local short_src = info.short_src
        if not short_src:find("@", 1, true) then
            short_src = "@" .. short_src
        end
        
        local isValid = CheckIsValidExecution(
            resourceName, info4, info.source, short_src,
            info.currentline, functionToCheck, funcName)
        
        if not isValid then
            return false, "Illegal Native Execution #2", {
                ["function"] = funcName,
                pattern = ("%s:%s:%s"):format(info.short_src, info2.name, info.currentline),
            }
        end
    end
    
    return true
end

-- ============================================================================
-- EXPORTED FUNCTION (OPTIMIZED ENTRY POINT)
-- ============================================================================

exports("IsValidExecution", LPH_JIT_MAX(function(functionName, functionName2, stacks, additionalStacks, isFXAP)
    additionalStacks = additionalStacks or 0
    local resourceName = GetInvokingResource()
    
    -- Early exit: Check if anti-injection is disabled
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Beta and not Configuration.Beta.AntiUnisolatedInjection then
        return true
    end
    
    -- Build pattern hash for ignored patterns check
    local callInfo = stacks[3 + additionalStacks] or {}
    local hashPattern = VexonAC.SHA256(("%s:%s:%s:%s:%s:%s"):format(
        callInfo.short_src, callInfo.name, callInfo.namewhat,
        callInfo.linedefined, callInfo.currentline, callInfo.lastlinedefined))
    
    -- Check ignored patterns
    if Configuration and Configuration.Beta and Configuration.Beta.IgnoredExecutionPatterns then
        if Configuration.Beta.IgnoredExecutionPatterns[hashPattern] then
            return true
        end
    end
    
    -- Main validation
    local isValid, banReason, banDetails = IsValidExecution(
        functionName, resourceName, stacks, additionalStacks, isFXAP)
    
    if isValid then
        -- Track load/pcall/xpcall for injection timing
        local short_src = callInfo.short_src
        if (functionName == "load" or functionName == "xpcall" or functionName == "pcall") and
           short_src and not short_src:find("scheduler.lua", 1, true) and
           not short_src:find("Luraph", 1, true) then
            lastInjectedCode = VexonAC.Native.GetGameTimer()
        end
    else
        -- Retry with alternate function name (disable macho detection 1.3)
        if functionName2 then
            isValid, banReason, banDetails = IsValidExecution(
                functionName2, resourceName, stacks, additionalStacks, isFXAP, true)
        end
        
        if not isValid and banReason then
            banDetails.hashPattern = hashPattern
            VexonAC.DetectPlayer(banReason, banDetails)
        end
    end
    
    return isValid or false
end))

exports("AllowSource", function(source)
    if VexonAC.debug.short_executions then
        VexonAC.print("AllowSource", source)
    end
    whitelistedSources[source] = true
end)



﻿local lastHeartbeat = VexonAC.Native.GetGameTimer()

VexonAC.CreateThread(LPH_JIT_MAX(function()
    local i = 0
    while true do
        VexonAC.Wait(1000)
        lastHeartbeat = VexonAC.Native.GetGameTimer()

-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm

        if lastHeartbeat - VexonAC.lastActorLoopTime > 10000 then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                reason = "Actor loop not running",
            })
            return
        end

        if i % 15 == 0 then

            local timer = VexonAC.DetectPlayer("FAKE")
            if not timer or type(timer) ~= "number" or timer - lastHeartbeat > 1000 then
                DetectPlayer("Bypass Attempt Detected", {
                    reason = "Resource Manipulation",
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
                })
                return
            end

            VexonAC.TriggerServerEvent(VexonAC.HeartbeatEventToken, GetNetworkTime())
-- ZiBtIGE=
            i = 0
        end

        i = i + 1
    end
end))

exports("isRunning", LPH_NO_VIRTUALIZE(function()
    return true, lastHeartbeat, VexonAC.lastActorLoopTime
end))


﻿local lastPlayerModel = 0

AddEventHandler("playerSpawned", function()
    lastPlayerModel = GetEntityModel(VexonAC.playerPed)
end)

-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
local checkPedModel = LPH_JIT_MAX(function()
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
    if not VexonAC.Config.Main.AntiPedModelChange then
        return
    end

    if lastPlayerModel ~= 0 and VexonAC.playerModel ~= 0 and VexonAC.playerModel ~= 1885233650 and VexonAC.playerModel ~= -1667301416 and VexonAC.playerModel ~= lastPlayerModel and not VexonAC.hasChangedPedModel and not VexonAC.playerRevived and HasModelLoaded(VexonAC.playerModel) then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_PED_MODEL_CHANGE, {
            lastPlayerModel = lastPlayerModel,
            playerModel = VexonAC.playerModel,
        })
    end

    lastPlayerModel = VexonAC.playerModel
end)

VexonAC.RegisterDetection("pedModel", checkPedModel, 3000)
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=

local expiresPedModelChange = 0
exports("hasChangedPedModel", LPH_NO_VIRTUALIZE(function(model)
    lastPlayerModel = model
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresPedModelChange - 2000 then
        expiresPedModelChange = timer + 5000
        if not VexonAC.hasChangedPedModel then
            VexonAC.hasChangedPedModel = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresPedModelChange do VexonAC.Wait(100) end
                VexonAC.hasChangedPedModel = false
            end)
        end
    end
end))


RegisterNetEvent("__VexonAC:hasChangedPedModel",function(model)
    exports["VexonAC"]:hasChangedPedModel(model)
end)



﻿local AFKTasks = {
    ["CTaskWanderingScenario"] = 100,
    ["CTaskWanderingInRadiusScenario"] = 101,
-- ZiBtIGE=
    ["CTaskCarDriveWander"] = 151,
    ["CTaskWander"] = 221,
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
    ["CTaskWanderInArea"] = 222,
}
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h

local checkAFKTasks = LPH_JIT_MAX(function()
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    if not VexonAC.Config.Main.AntiAFKBypass then
        return
    end

    for taskName,taskId in VexonAC.Lua.pairs(AFKTasks) do
        if GetIsTaskActive(VexonAC.playerPed, taskId) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_AFK_BYPASS, {
                taskName = taskName
            })
            return
        end
    end
end)

-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
VexonAC.RegisterDetection("afkTasks", checkAFKTasks, 10000)



﻿local isUsingMouseInScripts = false
local areControlsDisabled = false
local areCamControlsDisabled = false

local executorFlags = {}
local lastPosX, lastPosY = GetNuiCursorPosition()
local lastGamePlayCamCoords = VexonAC.Native.GetGameplayCamCoord()
local lastTimeMovedMouse = 0
local lastTimePressedInsert = 0
local lastTimePressedPageUP = 0
local lastTimePressedPageDOWN = 0

local expiresAntiExec = 0

local GetControlNormal = GetControlNormal
local GetTimeSinceLastInput = GetTimeSinceLastInput
local GetNuiCursorPosition = GetNuiCursorPosition
local GetActiveScreenResolution = GetActiveScreenResolution
local GetWarningMessageTitleHash = GetWarningMessageTitleHash
local IsWarningMessageActive = IsWarningMessageActive
local IsHudComponentActive = IsHudComponentActive

exports("disableE2", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresAntiExec - 2000 then
        expiresAntiExec = timer + 5000
        if not isUsingMouseInScripts then
            isUsingMouseInScripts = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresAntiExec do VexonAC.Wait(100) end
                isUsingMouseInScripts = false
            end)
        end
    end
end))

local expiresAntiExec2 = 0
exports("disableCamControls", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresAntiExec2 - 2000 then
        expiresAntiExec2 = timer + 5000
        if not areCamControlsDisabled then
            areCamControlsDisabled = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresAntiExec2 do VexonAC.Wait(100) end
                areCamControlsDisabled = false
            end)
        end
    end
end))

local expiresAntiExec3 = 0
exports("disableAllControls", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresAntiExec3 - 2000 then
        expiresAntiExec3 = timer + 5000
        if not areControlsDisabled then
            areControlsDisabled = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresAntiExec3 do VexonAC.Wait(100) end
                areControlsDisabled = false
            end)
        end
    end
end))

local function ResetExecutorFlags(ignoreId)
    if ignoreId then
        for k,v in VexonAC.Lua.pairs(executorFlags) do
            if k ~= ignoreId then
                executorFlags[k] = nil
            end
        end
    else
        executorFlags = {}
    end
end

local function ExecutorFlag(flagId)
    ResetExecutorFlags(flagId)
    executorFlags[flagId] = (executorFlags[flagId] or 0) + 1
    if executorFlags[flagId] >= 3 then
        if VexonAC.tostring(flagId) == "1" then
            if VexonAC.Config.Main.E1 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERLAY, {
                    detection = "E1"
                })
            end
        elseif VexonAC.tostring(flagId) == "2" then
            if VexonAC.Config.Main.E2 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERLAY, {
                    detection = "E2"
                })
            end
        elseif VexonAC.tostring(flagId) == "3" or tostring(flagId) == "HX" then
            if VexonAC.Config.Main.E3 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERLAY, {
                    detection = "E3"
                })
            end
        elseif VexonAC.tostring(flagId) == "4" then
            if VexonAC.Config.Main.E4 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERLAY, {
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
                    detection = "E4"
                })
            end
        elseif VexonAC.tostring(flagId) == "5" or tostring(flagId) == "EULEN" then
            if VexonAC.Config.Main.E5 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERLAY, {
                    detection = "E5"
                })
            end
        elseif VexonAC.tostring(flagId) == "6" then
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
            if VexonAC.Config.Main.E6 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERLAY, {
                    detection = "E6"
                })
            end
        end
    end
end
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B

local function CheckForExecutor(beforeX, beforeY, screenX, screenY)
    SetCursorLocation(0.5, 0.5)
    local afterX, afterY = GetNuiCursorPosition()
    local middleDist = #(vector2(screenX/2, screenY/2) - vector2(afterX, afterY))
    SetCursorLocation(beforeX/screenX,beforeY/screenY)
    return middleDist
end

local function GetTimeSinceLastMouseMovement()
    return VexonAC.Native.GetGameTimer() - lastTimeMovedMouse
end

local isValidAntiExecSituation = LPH_NO_VIRTUALIZE(function(beforeX, beforeY, screenX, screenY, mouseDist)
    if
        (beforeX <= 0)
        or (beforeY <= 0)
        or (beforeX >= screenX)
        or (beforeY >= screenY)
        or (mouseDist < 10)
        or IsNuiFocused()
        --[[or IsFuckingNuiFocused]]
        or IsPauseMenuActive()
        or IsHudComponentActive(19)
        or IsHudComponentActive(16)
        or IsDisabledControlPressed(0, 106)
        or (IsWarningMessageActive() and VexonAC.tonumber(GetWarningMessageTitleHash()) == 1246147334)
        or (GetControlNormal(2, 239) == 0.5)
        or (GetControlNormal(2, 240) == 0.5)
        or isUsingMouseInScripts
        or areControlsDisabled
        or areCamControlsDisabled
        or (not IsPlayerControlOn(VexonAC.playerId))
        or (not IsUsingKeyboard(0))
        or UpdateOnscreenKeyboard() == 0
    then
        return false
    end

    return true
end)

VexonAC.CreateThread(LPH_JIT_MAX(function()
    while not VexonAC.playerSpawned do VexonAC.Wait(100) end
    while true do
        if VexonAC.Config.Main.E1 or VexonAC.Config.Main.E2 or VexonAC.Config.Main.E3 or VexonAC.Config.Main.E4 or VexonAC.Config.Main.E5 or VexonAC.Config.Main.E6 then
            local waitTime = 100

            local isGameMovingMouse = (GetControlNormal(0, 1) ~= 0) or (GetControlNormal(0, 2) ~= 0)
            local timeSinceLastInput = GetTimeSinceLastInput()
            local gamePlayCamCoords = VexonAC.Native.GetGameplayCamCoord()
            local beforeX, beforeY = GetNuiCursorPosition()
            local screenX, screenY = GetActiveScreenResolution()
            local mouseDist = #(vector2(lastPosX, lastPosY) - vector2(beforeX, beforeY))
            local currentGameTimer = VexonAC.Native.GetGameTimer()

            if isGameMovingMouse then lastTimeMovedMouse = currentGameTimer end
            if GetControlNormal(0,121) ~= 0 then lastTimePressedInsert = currentGameTimer end
            if GetControlNormal(0, 10) ~= 0 then lastTimePressedPageUP = currentGameTimer end
            if GetControlNormal(0, 11) ~= 0 then lastTimePressedPageDOWN = currentGameTimer end

            if isValidAntiExecSituation(beforeX, beforeY, screenX, screenY, mouseDist) then
                local middleDist = CheckForExecutor(beforeX, beforeY, screenX, screenY)
                if not isGameMovingMouse then
                    if timeSinceLastInput < 50 then
                        if (middleDist > 100) then
                            --ExecutorFlag("1")
                        elseif (middleDist == 0) and (GetTimeSinceLastMouseMovement() > 1000) and (lastGamePlayCamCoords == gamePlayCamCoords) then
                            if lastTimePressedPageUP > (currentGameTimer - 10000) then
                                ExecutorFlag("HX")
                            elseif lastTimePressedInsert > (currentGameTimer - 10000) then
                                ExecutorFlag("2")
                            elseif lastTimePressedPageDOWN > (currentGameTimer - 10000) then
                                ExecutorFlag("2")
                            end
                        else
                            ResetExecutorFlags()
                        end
                    elseif timeSinceLastInput > 500 then
                        if (middleDist == 0) and (GetTimeSinceLastMouseMovement() > 1000) and (lastGamePlayCamCoords == gamePlayCamCoords) then
                            if lastTimePressedPageUP > (currentGameTimer - 5000) then
                                ExecutorFlag("HX")
                            elseif lastTimePressedInsert > (currentGameTimer - 5000) then
                                ExecutorFlag("4")
                            end
                            -- qd ca start la premiere detection, get gameplay cam coords et faut pas que ca bouge sinon ca reset comme si pas appuye insert, et reset flags
                        elseif middleDist > 100 and (GetTimeSinceLastMouseMovement() > 1000) and (lastGamePlayCamCoords == gamePlayCamCoords) then
                            --if lastTimePressedInsert > (currentGameTimer - 5000) then

                            --ExecutorFlag("EULEN")

                            --end
                        end
                    end

                elseif isGameMovingMouse and timeSinceLastInput < 50 then
                    if middleDist == 0 and (lastGamePlayCamCoords ~= VexonAC.Native.GetGameplayCamCoord()) then
                        if lastTimePressedInsert > (currentGameTimer - 2500) then
                            ExecutorFlag("6")
                        end
                    end
                else
                    ResetExecutorFlags()
                    --if timeSinceLastInput > 500 then
                    --    waitTime = 200
                    --end
                end
            else
                ResetExecutorFlags()
            end
            lastPosX, lastPosY = beforeX, beforeY
            lastGamePlayCamCoords = gamePlayCamCoords
            --faire que les menus avec souris ca reste au milieu , ptet les detecter
            VexonAC.Wait(waitTime)
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        else
            VexonAC.Wait(10000)
        end
    end
end))


﻿exports("CreateVehicle", function(modelHash)
    modelHash = VexonAC.type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    SafeSetLocalPlayerState('LastSpawnedVehicle', modelHash, true)
end)

exports("CreatePed", function(modelHash)
    modelHash = VexonAC.type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    SafeSetLocalPlayerState('LastSpawnedPed', modelHash, true)
end)

exports("CreateObject", function(modelHash)
    modelHash = VexonAC.type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    SafeSetLocalPlayerState('LastSpawnedObject', modelHash, true)
end)

local function disableNPCPopulation(disableNPCs)
    if disableNPCs then
        SetRandomEventFlag(false)
        DisableVehicleDistantlights(true)
        SetPedPopulationBudget(0)
        SetVehiclePopulationBudget(0)
        for i = 1, 15 do EnableDispatchService(i, false) end
        SetRandomBoats(false)
        SetGarbageTrucks(false)
        SetRandomTrains(false)
        SetCreateRandomCops(false)
        SetCreateRandomCopsOnScenarios(false)
        SetCreateRandomCopsNotOnScenarios(false)
        SetDispatchCopsForPlayer(PlayerId(), false)
        -- SetNumberOfParkedVehicles(0.0)
        DistantCopCarSirens(false)
    else
        DisableVehicleDistantlights(false)
        SetPedPopulationBudget(3)
        SetVehiclePopulationBudget(3)
        --[[ if VexonAC.Config.Entities.EnableVehiclesAIv2 then
            SetNumberOfParkedVehicles(0.0)
            for i, v in VexonAC.Lua.ipairs(parkedScenarios) do SetScenarioTypeEnabled(v, false) end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
        end ]]
    end
end

AddEventHandler('populationPedCreating', function(x, y, z, model, setters)
    if VexonAC.Config.Entities.DisableNPCPopulation then
        CancelEvent()
    end
end)

RegisterNetEvent("__VexonAC:checkPed", function(netId)
    if NetworkDoesEntityExistWithNetworkId(netId) then
        local entity = NetworkGetEntityFromNetworkId(netId)
        if VexonAC.playerSpawned and DoesEntityExist(entity) and not GetPedConfigFlag(entity, 248, true) then
            VexonAC.TriggerServerEvent("__VexonAC:checkPed", netId)
        end
    end
end)

AddEventHandler('CEventShockingVehicleTowed', function(witnesses, vehicleTowed, coords)
    if GetInvokingResource() ~= nil then return end
    local myVehicle = GetVehiclePedIsUsing(VexonAC.playerPed)
    if myVehicle == vehicleTowed then
        SafeSetLocalPlayerState("_WS:LastTowedVehicle", GetNetworkTime(), true)
    end
end)

local ownedVehicles = {}

local function getClosestPed(coords, maxDistance)
    local peds = VexonAC.Native.GetGamePool('CPed')
    local closestPed, closestDistance = nil, maxDistance or 999.0
    
    for i = 1, #peds do
        local ped = peds[i]
        if IsPedAPlayer(ped) and not VexonAC.Native.IsEntityDead(ped) and ped ~= VexonAC.playerPed then
            local pedCoords = GetEntityCoords(ped)
            local distance = #(coords - pedCoords)
            
            if distance < closestDistance then
                closestDistance = distance
                closestPed = ped
            end
        end
    end
    
    return closestPed, closestDistance
end

local function OnVehicleExplosion(entity)
    if not VexonAC.Config.Beta.AntiMagneto and not VexonAC.Config.Entities.DeleteVehicleOnDestroy then return end
	if not DoesEntityExist(entity) or GetEntityType(entity) ~= 2 then return end
    
	local causeOfDestruction = GetVehicleCauseOfDestruction(entity)
	if (NetworkGetEntityOwner(entity) == VexonAC.playerId) and causeOfDestruction == 539292904 then
		DeleteEntity(entity)
	end
end

AddEventHandler('CEventShockingExplosion', function(witnesses, entity, coords)
	OnVehicleExplosion(entity)
end)

AddEventHandler('CEventShockingFire', function(witnesses, entity, coords)
	OnVehicleExplosion(entity)
end)

AddEventHandler("gameEventTriggered", function(name, data)
    if name == "CEventNetworkVehicleUndrivable" then
        local entity, destroyer, cause = data[1], data[2], data[3]
        OnVehicleExplosion(entity)
    end
end)

local checkEntities = LPH_JIT_MAX(function()
    disableNPCPopulation(VexonAC.Config.Entities.DisableNPCPopulation)

    if not VexonAC.Config.Beta.AntiMagneto and not VexonAC.Config.Beta.AntiAttachVehicles and not VexonAC.Config.Entities.AntiSpawnIsolatedVehicles then
        return
    end

    local Pool = VexonAC.Native.GetGamePool("CVehicle")
    local currentTime = VexonAC.Native.GetGameTimer()

    for i = 1, #Pool do
        local entity = Pool[i]
        if DoesEntityExist(entity) then
			local entityOwner = NetworkGetEntityOwner(entity)
            if entityOwner == VexonAC.playerId then
                if not IsVehiclePreviouslyOwnedByPlayer(entity) then --PNJ vehicle
                    if VexonAC.Config.Beta.AntiAttachVehicles then
                        ownedVehicles[entity] = currentTime
                    end

                    if VexonAC.Config.Beta.AntiMagneto then
                        if ((IsEntityInAir(entity) and not IsVehicleOnAllWheels(entity)) or IsEntityUpsidedown(entity)) and GetEntityHeightAboveGround(entity) >= 1.1 then
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
                            DeleteEntity(entity)
                        end
                    end
                end

                if VexonAC.Config.Entities.AntiSpawnIsolatedVehicles then
                    local entityPopulationType = GetEntityPopulationType(entity)
                    if entityPopulationType == 6 or entityPopulationType == 7 then
                        local script = GetEntityScript(entity)
                        if (script ~= nil) and (script ~= "") then
                            if (script == "_cfx_internal" or (not serverResources[script] and not clientResources[script])) then
                                local vehicleModel = VexonAC.Native.GetEntityModel(entity)
                                DeleteVehicle(entity)
                                if script ~= "startup" then
                                    VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPAWN_ISOLATED_VEHICLES, {
                                        vehicleModel = VexonAC.GetVehicleName(vehicleModel),
                                        script = script or "Unknown",
                                    })
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
                                    return
                                end
                            end
                        end
                    end
                end
            end
        end
    end

    if VexonAC.Config.Beta.AntiAttachVehicles then
        for entity, timer in VexonAC.Lua.pairs(ownedVehicles) do
            if DoesEntityExist(entity) or currentTime - timer > 60000 then
                local entityOwner = NetworkGetEntityOwner(entity)
                if entityOwner ~= -1 and entityOwner ~= VexonAC.playerId then
                    ownedVehicles[entity] = nil

                    local entityAttached = GetEntityAttachedTo(entity)
                    if DoesEntityExist(entityAttached) and IsEntityAPed(entityAttached) and IsPedAPlayer(entityAttached) then
                        if entityAttached ~= VexonAC.playerPed then
                            DetachEntity(entity, true, true)
                            DeleteEntity(entity)

-- Zm1hLnd0ZiBldmVyeXdoZXJl
                            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_ATTACH_VEHICLES)
                            return
                        end
                    end
                end
            else
                ownedVehicles[entity] = nil
            end
        end

        local closestPed = getClosestPed(VexonAC.playerCoords, 10.0)
        if closestPed then
            OnesyncEnableRemoteAttachmentSanitization(false)
        else
            OnesyncEnableRemoteAttachmentSanitization(true)
        end
    end

    if VexonAC.Config.Entities.AntiSpawnIsolatedVehicles and VexonAC.isPlayerInVehicle and VexonAC.isPlayerDriver then
        local script = GetEntityScript(VexonAC.playerCurrentVehicle)
        if script and script ~= "" and (script == "_cfx_internal" or (not serverResources[script] and not clientResources[script]) or GetResourceState(script) == "missing") then
            local vehicleModel = VexonAC.Native.GetEntityModel(VexonAC.playerCurrentVehicle)
            DeleteVehicle(VexonAC.playerCurrentVehicle)
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPAWN_ISOLATED_VEHICLES, {
                vehicleModel = VexonAC.GetVehicleName(vehicleModel),
                script = script or "Unknown",
            })
            return
        end
    end
end)

VexonAC.RegisterDetection("entitiesPools", checkEntities, 2500)



﻿local bannableEvents = {
    GetCurrentResourceName().. ".verify",
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
    "HCheat:TempDisableDetection",
    "adminmenu:allowall",
    "antilynx8:crashuser",
    "shilling=yet5",
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
    "antilynxr4:crashuser",
    "shilling=yet7",
    "antilynxr4:crashuser1",
-- Zm1hLnd0ZiBldmVyeXdoZXJl
}

for k,v in VexonAC.Lua.pairs(bannableEvents) do
    RegisterNetEvent(v)
    AddEventHandler(v, function()
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_TRIGGER_CLIENT_EVENT, {
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
            event = v,
        })
    end)
end-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=



﻿local createdCams = {}

local freecamStrike1 = VexonAC.StrikesSystem.createStrikeSystem(
    "Freecam1",
    2,
    function(playerId, distanceFromCam)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_FREE_CAM, {
            distance = math.floor(distanceFromCam)
        })
    end,
    9000
)

local freecamStrike2 = VexonAC.StrikesSystem.createStrikeSystem(
    "Freecam2",
    2,
    function(playerId, distanceFromCam)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_FREE_CAM, {
            distance = math.floor(distanceFromCam)
        })
    end,
    9000
)

local freecamStrike3 = VexonAC.StrikesSystem.createStrikeSystem(
    "Freecam3",
    2,
    function(playerId, distanceFromCam)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_FREE_CAM, {
            distance = math.floor(distanceFromCam)
        })
    end,
    9000
)

local freecamStrike4 = VexonAC.StrikesSystem.createStrikeSystem(
    "Freecam4",
    2,
    function(playerId, distanceFromCam)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_FREE_CAM, {
            distance = math.floor(distanceFromCam)
        })
    end,
    9000
)

local FC_camRot = vector3(0.0, 0.0, 0.0)

local checkFreecam = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiFreeCam then
        return
    end

    local renderingCam = GetRenderingCam()
    local distanceFromCam = #(GetFinalRenderedCamCoord() - VexonAC.playerCoords)
    local myHeadCoords = GetPedBoneCoords(VexonAC.playerPed, 31086, 0.0, 0.0, 0.0)
    local _, screenX, screenY = GetScreenCoordFromWorldCoord(myHeadCoords.x, myHeadCoords.y, myHeadCoords.z)
    local viewModeContext = GetCamActiveViewModeContext()
    local isCamFoot = viewModeContext == 0
    local isCamVehicle = viewModeContext == 1 or viewModeContext == 2
    local isFirstPersonCam = GetFollowPedCamViewMode() == 4
    local isDistanceFromCamLegit = distanceFromCam <= ((isCamVehicle or VexonAC.isPlayerInVehicle) and 50.0 or 25.0)
    local lastCamEaseTime = VexonAC.Native.GetGameTimer() - (VexonAC.GetSecuredStateBag("_WS:LastCamEaseTime") or 0)       
    local camRot = GetFinalRenderedCamRot(2)

    if screenX == 0 and screenY == 0 and IsEntityOnScreen(VexonAC.playerPed) and IsEntityOccluded(VexonAC.playerPed) then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_FREE_CAM, {
            detection = "Phaze"
        })
        return
    end

    if renderingCam ~= -1 and not createdCams[renderingCam] and not IsCinematicCamRendering() and not IsCinematicIdleCamRendering() and not IsPlayerSwitchInProgress() and not IsNuiFocused() and not IsCutscenePlaying() then
        freecamStrike1(nil, distanceFromCam)
        return
-- Zm1hLnd0Zg==
    elseif renderingCam == -1 and not IsEntityOnScreen(VexonAC.playerPed) and not IsCinematicIdleCamRendering() and not NetworkIsInSpectatorMode() and (IsCinematicCamRendering() and (isCamFoot or not isDistanceFromCamLegit)) and not IsCinematicCamInputActive() and (isCamFoot or (isCamVehicle and not isFirstPersonCam)) then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_FREE_CAM, {
            detection = "Bypass #1",
            distance = math.floor(distanceFromCam)
        })
        return
    elseif renderingCam == -1 and isDistanceFromCamLegit and VexonAC.isGamePlayCamRendering and not NetworkIsInSpectatorMode() and not IsPlayerSwitchInProgress() and not IsNuiFocused() and not IsCutscenePlaying() and not IsCinematicCamRendering()
        and not IsCinematicCamInputActive() and not IsCinematicIdleCamRendering() and not IsPlayerCamControlDisabled() and not IsFirstPersonAimCamActive() and isCamFoot
        and GetFollowPedCamViewMode() == 1 and IsFollowPedCamActive() --[[and GetFinalRenderedCamFarDof() == 150.0]] and (screenX == -1.0 and screenY == -1.0) and IsEntityOnScreen(VexonAC.playerPed) and IsEntityOccluded(VexonAC.playerPed)
        and not IsCamInterpolating(renderingCam) and (lastCamEaseTime > 10000) and GetPedMovementClipset(VexonAC.playerPed) ~= VexonAC.Native.GetHashKey("move_ped_crouched") and not VexonAC.Native.IsEntityDead(VexonAC.playerPed) and not IsEntityPositionFrozen(VexonAC.playerPed) and FC_camRot == camRot and IsPlayerFreeForAmbientTask(VexonAC.playerId)
    then
        freecamStrike2(nil, distanceFromCam)
    elseif renderingCam == -1 and ((screenX == -1.0 and screenY == -1.0) or IsEntityOccluded(VexonAC.playerPed)) and not IsEntityOnScreen(VexonAC.playerPed) and not IsCinematicIdleCamRendering() and not IsCinematicCamRendering() and not NetworkIsInSpectatorMode() and not IsPlayerSwitchInProgress() and not IsCutscenePlaying() and isDistanceFromCamLegit and not isFirstPersonCam and (not VexonAC.isPlayerInVehicle or (GetVehicleClass(VexonAC.playerCurrentVehicle) < 10)) and not VexonAC.isPlayerDead and not IsCamInterpolating(renderingCam) and (lastCamEaseTime > 10000) and IsPlayerFreeForAmbientTask(VexonAC.playerId) and GetPedMovementClipset(VexonAC.playerPed) ~= VexonAC.Native.GetHashKey("move_ped_crouched") and not VexonAC.isAttachedToAPlayer and (not (IsEntityAttached(VexonAC.playerPed) and not IsPedInAnyVehicle(VexonAC.playerPed, true) or false)) and GetEntityAlpha(VexonAC.playerPed) == 255 then
        freecamStrike3(nil, distanceFromCam)
    elseif renderingCam == -1 and GetCamActiveViewModeContext() <= 2 and not IsCinematicCamRendering() and not IsCinematicIdleCamRendering() and not IsPlayerSwitchInProgress() and not IsNuiFocused() and not IsCutscenePlaying() and not NetworkIsInSpectatorMode() and not VexonAC.isPlayerDead and not IsPedFalling(VexonAC.playerPed) and (GetGameplayCamFov() >= 50.0 and GetGameplayCamFov() <= 52.0) and not isDistanceFromCamLegit and not VexonAC.hasTeleported and (lastCamEaseTime > 10000) and
        not IsPedOnVehicle(VexonAC.playerPed) and not IsPedInParachuteFreeFall(VexonAC.playerPed) and (GetVehiclePedIsEntering(VexonAC.playerPed) == 0) and not IsPedJumpingOutOfVehicle(VexonAC.playerPed) and not (IsEntityAttached(VexonAC.playerPed) and not IsPedInAnyVehicle(VexonAC.playerPed, true) or false) and not VexonAC.isAttachedToAPlayer and
        ((GetNetworkTime() - (VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer") or 0)) > 10000) then
        freecamStrike4(nil, distanceFromCam)
    end


    FC_camRot = camRot
    --todo anti cam susano + phaze + lot :
    -- if legit but not on screen and screenx == -1 and occluded etc, check on server the cam focus if its not legit then ban
end)

VexonAC.RegisterDetection("freecam", checkFreecam, 3000)

exports("createCam", LPH_NO_VIRTUALIZE(function(cam)
    if VexonAC.debug.short_executions then
        VexonAC.print(("createCam - %s - %s"):format(cam, GetInvokingResource()))
        for i = 0, 5 do
            local tempInfo = VexonAC.debug.getinfo(i, "Snl")
            if tempInfo and tempInfo.short_src then
                VexonAC.print(("createCam dbg %s\n%s"):format(i, json.encode(tempInfo, {
                    indent = true
                })))
            end
        end
    end
    createdCams[cam] = true
end))

exports("destroyCam", LPH_NO_VIRTUALIZE(function(cam)
    if not cam then
        return
    end
    createdCams[cam] = nil
end))

exports("destroyCams", LPH_NO_VIRTUALIZE(function(cam)
    createdCams = {}
end))

RegisterCommand("***wsfc", function()
    local ped = PlayerPedId()
    local id = PlayerId()
    local coords = GetEntityCoords(ped)
    local inVehicle = IsPedInAnyVehicle(ped, false)
    local renderingCam = GetRenderingCam()
    local distanceFromCam = #(GetFinalRenderedCamCoord() - coords)
    local myHeadCoords = GetPedBoneCoords(ped, 31086, 0.0, 0.0, 0.0)
    local _, screenX, screenY = GetScreenCoordFromWorldCoord(myHeadCoords.x, myHeadCoords.y, myHeadCoords.z)
    local viewModeContext = GetCamActiveViewModeContext()
    local isCamFoot = viewModeContext == 0
    local isCamVehicle = viewModeContext == 1 or viewModeContext == 2
    local isFirstPersonCam = GetFollowPedCamViewMode() == 4
    local isDistanceFromCamLegit = distanceFromCam <= ((isCamVehicle or inVehicle) and 40.0 or 20.0)

    VexonAC.print(VexonAC.Config.Main.AntiFreeCam)
    VexonAC.print(coords, inVehicle, renderingCam, distanceFromCam, viewModeContext, GetFollowPedCamViewMode(), IsFollowPedCamActive())
    VexonAC.print(IsCinematicCamRendering(),IsCinematicIdleCamRendering(), IsPlayerSwitchInProgress(), IsNuiFocused(), IsCutscenePlaying())
    VexonAC.print(IsEntityOnScreen(ped), IsGameplayCamRendering(), NetworkIsInSpectatorMode(), IsCinematicCamInputActive(), IsPlayerCamControlDisabled(), IsFirstPersonAimCamActive())
    VexonAC.print(GetFinalRenderedCamFarDof(), screenX, screenY, IsEntityOccluded(ped), IsCamInterpolating(renderingCam))
    VexonAC.print(IsPedInParachuteFreeFall(ped), IsPedOnVehicle(ped), IsPedFalling(ped), GetGameplayCamFov())
    VexonAC.print(IsPlayerFreeForAmbientTask(id))
    VexonAC.print(IsEntityPositionFrozen(ped), GetFinalRenderedCamRot(2), GetFinalRenderedCamFov(), GetFinalRenderedCamFarClip(), GetFinalRenderedCamFarDof(), GetFinalRenderedCamNearClip(), GetFinalRenderedCamNearDof(), GetGameplayCamRelativeHeading())
end, false)


﻿local godModeStrike = VexonAC.StrikesSystem.createStrikeSystem(
    "GodMode",
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INVINCIBLE, {
            type = "Invincible",
        })
    end,
    10000
)

local godModeStrike2 = VexonAC.StrikesSystem.createStrikeSystem(
    "GodMode2",
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INVINCIBLE, {
            type = "Not Damagable",
        })
    end,
    10000
)

local checkGodMode = LPH_JIT_MAX(function()
    if VexonAC.hasChangedPedModel or VexonAC.playerRevived or VexonAC.pedType == 28 then
        return
    end

    if VexonAC.Config.Main.AntiInfiniteRefill then
        local setTo = (VexonAC.playerHealth - 2)
        SetEntityHealth(VexonAC.playerPed, setTo)
        
        SetTimeout(math.random(1, 25), function()
            local afterHealth = GetEntityHealth(VexonAC.playerPed)
            if afterHealth > 0 and afterHealth > setTo and not VexonAC.isPlayerDead and not VexonAC.healthRefilled and not VexonAC.hasChangedPedModel and not VexonAC.playerRevived then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INFINITE_REFILL)
                return
            else
                SetEntityHealth(VexonAC.playerPed, afterHealth + 2)
            end
        end)
    end

    if VexonAC.Config.Main.AntiOverrideHealthStats then
        if VexonAC.playerHealth > 200 then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERRIDE_HEALTH_STATS, {
                health = ("%s/%s HP"):format(VexonAC.playerHealth, VexonAC.playerMaxHealth),
            })
            return
        elseif VexonAC.playerMaxHealth > 200 then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERRIDE_HEALTH_STATS, {
                maxHealth = VexonAC.playerMaxHealth,
            })
            return
        elseif VexonAC.playerArmour > 100 then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_OVERRIDE_HEALTH_STATS, {
                armor = ("%s/%s HP"):format(VexonAC.playerArmour, 100),
            })
            return
        end
    end

    if VexonAC.Config.Main.AntiNoCombatDamages and not VexonAC.proofsEnabled and not VexonAC.isPlayerDead and not VexonAC.hasChangedPedModel then
        local a, bulletProof, b , c , d , meleeProof , e , f , g = GetEntityProofs(VexonAC.playerPed)
        if (bulletProof == 1) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_COMBAT_DAMAGES, {
                type = "Bullet Proof",
            })
            return
        elseif (meleeProof == 1)  then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_COMBAT_DAMAGES, {
                type = "Melee Proof",
            })
            return
        end
    end

    if VexonAC.Config.Main.AntiInvincible and not VexonAC.isPlayerDead and not IsEntityPositionFrozen(VexonAC.playerPed) and not IsPlayerCamControlDisabled(VexonAC.playerPed) and not VexonAC.isPedRunningRagdollTask then
        if not VexonAC.isPlayerDead and not IsEntityPositionFrozen(VexonAC.playerPed) and not IsPlayerCamControlDisabled(VexonAC.playerPed) and not VexonAC.isPedRunningRagdollTask and not VexonAC.isInvincible and (VexonAC.playerInvincible or VexonAC.playerInvincible2) and not VexonAC.hasChangedPedModel then
            godModeStrike()
        end
        if not VexonAC.isPlayerDead and not IsEntityPositionFrozen(VexonAC.playerPed) and not IsPlayerCamControlDisabled(VexonAC.playerPed) and not VexonAC.isPedRunningRagdollTask and not VexonAC.isInvincible and VexonAC.canBeDamaged and not VexonAC.entityCanBeDamaged and not VexonAC.hasChangedPedModel then
            godModeStrike2()
        end

        local hasBulletProofVest = GetPedConfigFlag(VexonAC.playerPed, 6, true)
        if hasBulletProofVest then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INVINCIBLE, {
                type = "Bullet Proof",
            })
            return
        end
    end
end)

VexonAC.RegisterDetection("godMode", checkGodMode, 3000)

local expiresHealthRefill = 0
exports("healthRefilled", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresHealthRefill - 2000 then
        expiresHealthRefill = timer + 5000
        if not VexonAC.healthRefilled then
            VexonAC.healthRefilled = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresHealthRefill do VexonAC.Wait(100) end
                VexonAC.healthRefilled = false
            end)
        end
    end
end))

local expiresPlayerRevived = 0
exports("playerRevived", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresPlayerRevived - 2000 then
        expiresPlayerRevived = timer + 10000
        if not VexonAC.playerRevived then
            VexonAC.playerRevived = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresPlayerRevived do VexonAC.Wait(100) end
                VexonAC.playerRevived = false
            end)
        end
    end
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
end))

exports("proofsEnabled", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.proofsEnabled = NumberToBoolean(toggle)
end))

exports("canBeDamaged", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.canBeDamaged = NumberToBoolean(toggle)
end))

exports("isInvincible", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.isInvincible = NumberToBoolean(toggle)
end))

RegisterNetEvent("__VexonAC:isInvincible",function(toggle)
    VexonAC.isInvincible = toggle
end)

-- local function runImprovedGodmodeTest()
--     if not VexonAC.playerSpawned or VexonAC.isPlayerDead or VexonAC.hasChangedPedModel or VexonAC.playerRevived or not VexonAC.canBeDamaged or VexonAC.isInvincible or VexonAC.proofsEnabled then
--         return false
--     end
    
--     local ped = PlayerPedId()
--     local healthBefore = GetEntityHealth(ped)
--     local armorBefore = GetPedArmour(ped)
--     local totalHealthBefore = healthBefore + armorBefore
--     local chestPos = GetPedBoneCoords(ped, 0, 0.0, 0.0, 0.0)    
--     local startPos = chestPos + vector3(0.0, -0.5, 0.0)
--     local expectedDamage = 30

--     if totalHealthBefore <= 150 then
--         return false
--     end

--     ShootSingleBulletBetweenCoords(
--         startPos,
--         chestPos,
--         expectedDamage,
--         true,
--         GetHashKey("WEAPON_SNSPISTOL"),
--         0,
--         false,
--         true,
--         999.0
--     )
    
--     Wait(5)
    
--     local healthAfter = GetEntityHealth(ped)
--     local armorAfter = GetPedArmour(ped)
--     local totalHealthAfter = healthAfter + armorAfter
--     local damageTaken = totalHealthBefore - totalHealthAfter
    
--     SetEntityHealth(ped, healthBefore)
--     SetPedArmour(ped, armorBefore)
    
--     ClearPedBloodDamage(ped)
--     ClearPedEnvDirt(ped)
--     ClearPedDamageDecalByZone(ped, 10, "ALL")
--     RemoveParticleFxInRange(GetEntityCoords(ped), 1.0)

--     CreateThread(function()
--         for i = 1, 100 do
--             Wait(10)
--             RemoveDecalsInRange(GetEntityCoords(ped), 5.0)
--         end
--     end)
    
--     local result = {
--         healthBefore = healthBefore,
--         healthAfter = healthAfter,
--         armorBefore = armorBefore,
--         armorAfter = armorAfter,
--         damageTaken = damageTaken,
--         expectedDamage = expectedDamage,
--         godModeDetected = false,
--         damageReductionDetected = false
--     }
    
--     if damageTaken <= 0 then
--         result.godModeDetected = true
--     elseif damageTaken < expectedDamage - 2 then
--         result.damageReductionDetected = true
--     end
    
--     return result
-- end

-- VexonAC.CreateThread(function()
--     while not VexonAC.playerSpawned do VexonAC.Wait(100) end
--     while true do
--         VexonAC.Wait(30000)
        
--         if VexonAC.Config.Main.AntiInvincible then

--             local result = runImprovedGodmodeTest()
--             if result and result.godModeDetected then
--                 VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INVINCIBLE, {
--                     type = "Damage Immunity",
--                 })
--             elseif result and result.damageReductionDetected then
--                 VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_COMBAT_DAMAGES, {
--                     type = "Damage Reduction",
--                 })
--             end
--         end
--     end
-- end)


﻿local resettedStamina = false
local ST_oldStateValid = false

local isValidStaminaState = LPH_JIT_MAX(function()
    local _, stamina = StatGetInt(VexonAC.Native.GetHashKey("MP0_STAMINA"), -1)
    return (stamina or 0 <= 90) and
        VexonAC.isPlayerSprinting and
        VexonAC.playerStamina <= 0.06 and
        not VexonAC.isPlayerInVehicle and
        not VexonAC.isPedFalling and
        not IsPedInParachuteFreeFall(VexonAC.playerPed) and
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        not VexonAC.isPedJumpingOutOfVehicle and
        not VexonAC.isPedRunningRagdollTask and
        VexonAC.isPlayerFreeForAmbientTask and
        VexonAC.pedType ~= 28
end)

local checkInfiniteStamina = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiInfiniteStamina then
        return
-- Zm1hLnd0Zg==
    end

    local currentStateValid = isValidStaminaState() 
    if
        not resettedStamina and
        currentStateValid and
        ST_oldStateValid
    then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INFINITE_STAMINA)
    end

    ST_oldStateValid = currentStateValid
end)

VexonAC.RegisterDetection("infiniteStamina", checkInfiniteStamina, 2000)

local expiresResetStamina = 0
exports("resettedStamina", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresResetStamina - 2000 then
        expiresResetStamina = timer + 10000
        if not resettedStamina then
            resettedStamina = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresResetStamina do VexonAC.Wait(100) end
                resettedStamina = false
            end)
        end
    end
end))



﻿local invisibleStrike = VexonAC.StrikesSystem.createStrikeSystem(
    "AntiInvisible",
-- Zm1hLnd0Zg==
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INVISIBLE)
    end,
    15000
)

local checkInvisible = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiInvisible then
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
        return
    end

    if VexonAC.isVisible and not VexonAC.hasChangedPedModel and not VexonAC.playerRevived and not IsEntityVisibleToScript(VexonAC.playerPed) and not IsEntityAttached(VexonAC.playerPed) and ((GetNetworkTime() - (VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer") or 0)) > 10000) then
        invisibleStrike()
    end
end)

VexonAC.RegisterDetection("invisible", checkInvisible, 10000)

exports("isVisible", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.isVisible = NumberToBoolean(toggle)
end))


﻿local checkNightVisions = LPH_JIT_MAX(function()
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    if not VexonAC.Config.Main.AntiNightVisions then
        return
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
    end

-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    if not IsPedInAnyHeli(VexonAC.playerPed) and VexonAC.isGamePlayCamRendering then
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        if GetUsingseethrough() then
            VexonAC.DetectPlayer("Thermal Vision Detected")
            return
        elseif GetUsingnightvision() then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NIGHT_VISIONS)
            return
        end
    end
end)

VexonAC.RegisterDetection("nightVisions", checkNightVisions, 10000)-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B



﻿local TP_oldCoords, TP_oldIsInVehicle, TP_oldStateValid = vector3(0, 0, 0), false, false

local function isValidTeleportState()
    return (not VexonAC.isPlayerInVehicle or (VexonAC.isPlayerDriver and VexonAC.isPlayerInVehicle and VexonAC.vehicleSpeed < 3)) and
        not VexonAC.isPedOnVehicle and
        not VexonAC.isPedFalling and
        not IsPedInParachuteFreeFall(VexonAC.playerPed) and
        not VexonAC.isPedJumpingOutOfVehicle and
        not (IsEntityAttached(VexonAC.playerPed) and not VexonAC.isPlayerInVehicle or false) and
        not VexonAC.isAttachedToAPlayer and
        not IsCutscenePlaying() and
        VexonAC.pedType ~= 28 and
        not VexonAC.isPedRunningRagdollTask and
        (GetPedParachuteState(VexonAC.playerPed) <= 0) and
        not VexonAC.isPlayerUnderWater and
        (VexonAC.playerHeight >= -1) and
-- ZGlzY29yZC5nZy9mbWE=
        not VexonAC.isPlayerDead and
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        (GetVehiclePedIsEntering(VexonAC.playerPed) == 0) and
        not VexonAC.hasTeleported and
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        not VexonAC.playerRevived and
        #(VexonAC.playerCoords - vector3(0, 0, 0)) > 100
end

local checkTeleport = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiTeleport then return end
    
-- ZiBtIGE=
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    local currentStateValid = isValidTeleportState()

    if TP_oldStateValid and currentStateValid and
        TP_oldIsInVehicle == VexonAC.isPlayerInVehicle and
        #(TP_oldCoords - VexonAC.playerCoords) > 50 and
        ((GetNetworkTime() - (VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer") or 0)) > 10000)
    then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_TELEPORT, {
            distance = #(TP_oldCoords - VexonAC.playerCoords),
        })
    end

    TP_oldCoords = VexonAC.playerCoords
    TP_oldIsInVehicle = VexonAC.isPlayerInVehicle
    TP_oldStateValid = currentStateValid
end)

VexonAC.RegisterDetection("teleport", checkTeleport, 1000)

local expiresTP = 0
exports("hasTeleported", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresTP - 2000 then
        expiresTP = timer + 10000
        if not VexonAC.hasTeleported then
            VexonAC.hasTeleported = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresTP do VexonAC.Wait(100) end
                VexonAC.hasTeleported = false
            end)
        end
    end
end))

RegisterNetEvent("__VexonAC:hasTeleported",function()
    VexonAC.hasTeleported = true
    expiresTP = VexonAC.Native.GetGameTimer() + 10000
    VexonAC.CreateThread(function()
        while VexonAC.Native.GetGameTimer() < expiresTP do VexonAC.Wait(100) end
        VexonAC.Wait(2000)
        VexonAC.hasTeleported = false
    end)
end)



﻿local NC_oldCoords, NC_oldSpeed, NC_oldStateValid = vector3(0, 0, 0), 0.0, false

local noclipHeightBypass = VexonAC.StrikesSystem.createStrikeSystem(
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
    "AntiNoClipHeightBypass",
    3,
    function(playerId, diffHeight)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_CLIP, {
            reason = "Bypass #2",
            debug = diffHeight,
        })
    end,
    10000
)

local noclipVehicleBypass = VexonAC.StrikesSystem.createStrikeSystem(
    "AntiNoClipVehicleBypass",
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_CLIP, {
            reason = "Bypass #3",
        })
    end,
    10000
)

local noclipFallBypass = VexonAC.StrikesSystem.createStrikeSystem(
-- ZGlzY29yZC5nZy9mbWE=
    "AntiNoClipFallBypass",
    3,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_CLIP, {
            reason = "Bypass #4",
        })
    end,
    10000
)

local function isValidNoclipState()
    return (not VexonAC.isPlayerInVehicle or (VexonAC.isPlayerDriver and VexonAC.isPlayerInVehicle and not VexonAC.isPlayerDead and VexonAC.vehicleSpeed < 3 and IsVehicleStopped(VexonAC.playerCurrentVehicle) and (not IsVehicleOnAllWheels(VexonAC.playerCurrentVehicle) or IsEntityPositionFrozen(VexonAC.playerCurrentVehicle) or GetEntityCollisionDisabled(VexonAC.playerCurrentVehicle)))) and
        not VexonAC.isPedOnVehicle and
        (not VexonAC.isPedFalling or (VexonAC.isPedFalling and VexonAC.playerSpeed == 0.0)) and
        not (IsEntityAttached(VexonAC.playerPed) and not VexonAC.isPlayerInVehicle or false) and
        not VexonAC.isAttachedToAPlayer and
        not IsCutscenePlaying() and
        VexonAC.pedType ~= 28 and
        (IsEntityPositionFrozen(VexonAC.playerPed) or GetEntityCollisionDisabled(VexonAC.playerPed) or (VexonAC.playerHeight > 4.0 and VexonAC.playerSpeed < 1)) and
        (GetVehiclePedIsEntering(VexonAC.playerPed) == 0) and
        not VexonAC.hasTeleported and
        not IsPedInParachuteFreeFall(VexonAC.playerPed) and
        not VexonAC.isPedJumpingOutOfVehicle and
        #(VexonAC.playerCoords - vector3(0, 0, 0)) > 100
end

local checkNoclip = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiNoClip then return end

    local _, calcHeight = VexonAC.Native.GetGroundZFor_3dCoord(VexonAC.playerCoords.x, VexonAC.playerCoords.y, VexonAC.playerCoords.z, false)
    calcHeight = VexonAC.playerCoords.z - calcHeight
    local diffHeight = math.abs(VexonAC.playerHeight - calcHeight)
    
    local isBypassingHeight = (diffHeight > 0.002) and not VexonAC.isPlayerInVehicle and not VexonAC.isPlayerDead and not VexonAC.isPedOnVehicle and not VexonAC.isAttachedToAPlayer and not VexonAC.isPedJumping and not VexonAC.isPedClimbing
    if isBypassingHeight then
        noclipHeightBypass(nil, diffHeight)
    end

    if VexonAC.isPlayerInVehicle and not DoesEntityExist(VexonAC.playerCurrentVehicle) and not GetPedConfigFlag(VexonAC.playerPed, 62, true) then
        noclipVehicleBypass()
    end

    if VexonAC.isPedFalling and not GetIsTaskActive(VexonAC.playerPed, 423) and (not VexonAC.isPedRunningRagdollTask or not IsPedRagdoll(VexonAC.playerPed)) then
        noclipFallBypass()
    end

    local entityAttached = VexonAC.Native.GetEntityAttachedTo(VexonAC.playerPed)
    if entityAttached > 0 and IsEntityPositionFrozen(VexonAC.playerPed) and (#(VexonAC.playerCoords - VexonAC.Native.GetEntityCoords(entityAttached)) == 0) and (NetworkGetNetworkIdFromEntity(entityAttached) == NetworkGetNetworkIdFromEntity(VexonAC.playerPed)) then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_CLIP, {
            reason = "Bypass #1",
        })
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
        return
    end

    local currentStateValid = isValidNoclipState()
    if NC_oldStateValid and currentStateValid and
        (NC_oldSpeed == VexonAC.playerSpeed or ((VexonAC.playerSpeed < 1.2) and (NC_oldSpeed < 1.2))) and
        #(NC_oldCoords - VexonAC.playerCoords) > 15 and
        ((GetNetworkTime() - (VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer") or 0)) > 10000)
    then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_CLIP)
    end

    NC_oldCoords = VexonAC.playerCoords
    NC_oldSpeed = VexonAC.playerSpeed
    NC_oldStateValid = currentStateValid
end)

VexonAC.RegisterDetection("noclip", checkNoclip, 3000)

RegisterCommand("***wsnc", function()
    local ped = PlayerPedId()
    local id = PlayerId()

    local ogHeight = GetEntityHeightAboveGround(PlayerPedId())
    local coords = GetEntityCoords(PlayerPedId())
    local _, calcHeight = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z, false)
    calcHeight = coords.z - calcHeight
    local diffHeight = math.abs(ogHeight - calcHeight)
    VexonAC.print("Dh", diffHeight)

    local vehicle = GetVehiclePedIsIn(ped, false)

    VexonAC.print(IsEntityPositionFrozen(ped), GetEntityCollisionDisabled(ped))
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
    VexonAC.print(IsEntityPositionFrozen(vehicle), GetEntityCollisionDisabled(vehicle))
    VexonAC.print("oaw", IsVehicleOnAllWheels(vehicle))
    VexonAC.print("st", IsVehicleStopped(vehicle))
    VexonAC.print("rpm", GetVehicleCurrentRpm(vehicle))
    VexonAC.print("er", GetIsVehicleEngineRunning(vehicle))


    local entityAttached = GetEntityAttachedTo(PlayerPedId())
    if entityAttached and (NetworkGetEntityFromNetworkId(entityAttached) == NetworkGetEntityFromNetworkId(PlayerPedId())) and (#(coords - GetEntityCoords(entityAttached)) == 0) then
        VexonAC.print("Attempted to use NoClip.", "Phaze Noclip")
    end

    local entityAttached = GetEntityAttachedTo(PlayerPedId())
    VexonAC.print(VexonAC.Config.Main.AntiNoClip)
    VexonAC.print(entityAttached, GetEntityModel(entityAttached), #(GetEntityCoords(entityAttached) - coords), NetworkGetEntityIsNetworked(entityAttached), NetworkGetNetworkIdFromEntity(entityAttached), NetworkGetNetworkIdFromEntity(PlayerPedId()))
    VexonAC.print(IsPedFalling(PlayerPedId()), GetEntitySpeed(PlayerPedId()), IsPedInAnyVehicle(ped, true), IsEntityAttached(PlayerPedId()), GetEntityAttachedTo(PlayerPedId()))
    VexonAC.print(not (IsEntityAttached(PlayerPedId()) and not IsPedInAnyVehicle(PlayerPedId(), true) or false))
    VexonAC.print(IsPedOnVehicle(PlayerPedId()), (not IsPedFalling(PlayerPedId()) or (IsPedFalling(PlayerPedId()) and GetEntitySpeed(PlayerPedId()) == 0.0)))
    VexonAC.print(GetEntityHeightAboveGround(PlayerPedId()))
    VexonAC.print(not IsPedAPlayer(GetEntityAttachedTo(PlayerPedId())), not IsCutscenePlaying(), (GetPedType(PlayerPedId()) ~= 28), (GetVehiclePedIsEntering(PlayerPedId()) == 0))
    VexonAC.print(GetEntitySpeed(PlayerPedId()), GetEntityCoords(PlayerPedId()))
    VexonAC.print(IsEntityPositionFrozen(PlayerPedId()), GetEntityCollisionDisabled(PlayerPedId()))
    VexonAC.print(VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer"), VexonAC.hasTeleported, expiresTP, VexonAC.Native.GetGameTimer(), GetNetworkTime())
end, false)
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
--todo test noclip vehicle



﻿local noRagdollStrike = VexonAC.StrikesSystem.createStrikeSystem(
    "AntiNoRagdoll",
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_RAGDOLL)
    end,
    15000
)

local checkNoRagdoll = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiNoRagdoll then
        return
    end

    if CanPedRagdoll(VexonAC.playerPed) ~= 1 and
        not VexonAC.isPlayerInVehicle and
        VexonAC.isPlayerFreeForAmbientTask and
        not VexonAC.isPlayerDead and
        not VexonAC.isPedJumpingOutOfVehicle and
        not IsPedJacking(VexonAC.playerPed) and
        not VexonAC.isPedRunningRagdollTask and
        not IsEntityPositionFrozen(VexonAC.playerPed) and
        IsPlayerControlOn(VexonAC.playerId) and
        not IsEntityAttached(VexonAC.playerPed) and
        not VexonAC.hasChangedPedModel and
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        not VexonAC.playerRevived and
        VexonAC.canPedRagdoll
    then
        noRagdollStrike()
    end
end)

VexonAC.RegisterDetection("noRagdoll", checkNoRagdoll, 5000)

exports("canRagdoll", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.canPedRagdoll = NumberToBoolean(toggle)
end))



﻿local checkSpectate = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiSpectate then
        return
    end
    
    if not VexonAC.isSpectating and VexonAC.isNetworkInSpectatorMode then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPECTATE)
    end
end)

VexonAC.RegisterDetection("spectate", checkSpectate, 5000)

exports("setSpectatorMode", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.isSpectating = toggle
end))
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h



﻿-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
local speedHackStrike = VexonAC.StrikesSystem.createStrikeSystem(
    "AntiSpeedHack",
    2,
    function(playerId, action, speed)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPEED_HACK, {
            action = action,
            speed = speed,
        })
    end,
    5000
)

local checkSpeedHack = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiSpeedHack then
        return
    end
    
    if (
            not VexonAC.isPlayerInVehicle and
            not VexonAC.isPedOnVehicle and
            not VexonAC.isPedRunningRagdollTask and
            not VexonAC.isAttachedToAPlayer and
            VexonAC.isPlayerFreeForAmbientTask and
            not IsPlayerUnderground() and
            not VexonAC.isPedJumpingOutOfVehicle and
            not VexonAC.isPedRunningMeleeTask and
            not VexonAC.isPedDiving and
            not VexonAC.Native.GetPedConfigFlag(VexonAC.playerPed, 148, true) and
            not VexonAC.Native.GetPedConfigFlag(VexonAC.playerPed, 147, true) and
            (VexonAC.pedType ~= 28) and
            not VexonAC.isSpectating
        )
            or VexonAC.isPedClimbing
    then
        local maxSpeed = 14.0
        local action = "Default"
        
        if VexonAC.isEntityInAir then
            if VexonAC.isPedFalling or IsPedInParachuteFreeFall(VexonAC.playerPed) or GetPedParachuteState(VexonAC.playerPed) > 0 then
                maxSpeed = 60.0
                action = "Falling"
            end
        else
            if VexonAC.isPlayerUnderWater or VexonAC.isPlayerSwimming then
                maxSpeed = 18.0
                action = "Swimming"
            elseif VexonAC.isPlayerSprinting then
                maxSpeed = 14.0
                action = "Sprinting"
            elseif VexonAC.isPedClimbing then
                maxSpeed = 14.0
                action = "Climbing"
            end
        end

        if VexonAC.playerSpeed > maxSpeed then
            speedHackStrike(nil, action, VexonAC.playerSpeed)
        end
    end
end)

-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
VexonAC.RegisterDetection("speedHack", checkSpeedHack, 2000)



﻿local checkSuperJump = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiSuperJump then
        return
-- Zm1hLnd0ZiBldmVyeXdoZXJl
    end

-- ZiBtIGE=
-- Zm1hLnd0Zg==
    if IsPedDoingBeastJump(VexonAC.playerPed) then
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SUPER_JUMP, {
            reason = "Beast Jump",
        })
        return
    end
end)

VexonAC.RegisterDetection("superJump", checkSuperJump, 2000)


﻿local allowedTextures = {}
local blackListedTextures = {
    "commonmenu",
    "commonmenutu",
    "mpleaderboard",
    "mpinventory",
    "mplobby",
    "shared",

    "__REAPER18__",
    "John",
    "darkside",
    "dopatest",
    "fm",
    "fs12",
    "fs1",
    "fs22",
    "fs32",
    "fs62",
    "hugeware2",
    "hugeware",
    "fs6",
    "fs7",
    "fs72",
    "aafov",
    "wave",
    "VallMenu",
    "meow2",
    "deadline",
    "ISMMENU",
    "MedusaBannerGif",
    "absolute",
    "absolute",
    "absolute",
    "absolute2",
    "absolute2",
    "absolute2",
    "absolute3",
    "absolute3",
    "absolute4",
    "HydroMenu",
    "John",
    "darkside",
    "ISMMENU",
    "dopatest",
    "wave",
    "wave1",
    "meow2",
    "adb831a7fdd83d_Guest_d1e2a309ce7591dff86",
    "hugev_gif_DSGUHSDGISDG",
    "32909fjj2kfk2e",
    "rampage_tr_main",
    "rampage_tr_animated",
    "shopui_title_graphics_franklin",
    "MenyooExtras",
    "kekhack_fivem_premium",
    "burrito_bus",
    "burrito_menu"
}

VexonAC.CreateThread(function()
    for _,texture in VexonAC.Lua.ipairs(blackListedTextures) do
        SetStreamedTextureDictAsNoLongerNeeded(texture)
        if HasStreamedTextureDictLoaded(texture) then
            allowedTextures[texture:lower()] = true
        end
    end
end)

local checkTextures = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiLuaMenu then
        return
    end
    
    for _, v in VexonAC.Lua.pairs(blackListedTextures) do
        local textureDict = v:lower()
        if not allowedTextures[textureDict] and HasStreamedTextureDictLoaded(textureDict) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_LUA_MENU, {
                textureDict = textureDict,
            })
            return
        end
    end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm

    if SafeGetLocalPlayerState("FiveEyeDT") == false or SafeGetLocalPlayerState("bypassNoClip") == true or SafeGetLocalPlayerState("bypassAntiGodMode") == true or SafeGetLocalPlayerState("createdExplosion") == true or SafeGetLocalPlayerState("ShowMenu") ~= nil or SafeGetLocalPlayerState("ayznnnMenu") ~= nil or SafeGetLocalPlayerState("tonperelechauveMenu") ~= nil then
        VexonAC.DetectPlayer("Bypass Attempt Detected", {
            reason = "Blacklisted state",
        })
        return
    end
end)

-- ZGlzY29yZC5nZy9mbWE=
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
VexonAC.RegisterDetection("textures", checkTextures, 10000)

exports("allowTexture", LPH_NO_VIRTUALIZE(function(textureDict)
    if not textureDict then return end
    textureDict = VexonAC.tostring(textureDict):lower()
    allowedTextures[textureDict] = true
end))

AddEventHandler('onResourceStart', function(resourceName)
    --todo le shared en c# + enlever ca
    if resourceName:lower():find('vmenu') then
        allowedTextures["commonmenu"] = true
        allowedTextures["commonmenutu"] = true
        allowedTextures["mpleaderboard"] = true
        allowedTextures["mpinventory"] = true
        allowedTextures["shared"] = true
    end
end)


﻿local isInputBoxDisplayed = false

local checkInputBox = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiInputBox then
        return
    end

    if not isInputBoxDisplayed and UpdateOnscreenKeyboard() == 0 then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INPUT_BOX)
        return
    end
end)

VexonAC.RegisterDetection("inputBox", checkInputBox, 1000)

exports("displayInputBox", LPH_NO_VIRTUALIZE(function()
    isInputBoxDisplayed = true
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    VexonAC.CreateThread(function()
        while true do
-- ZiBtIGE=
            if UpdateOnscreenKeyboard() ~= 0 then
                break
            end
            VexonAC.Wait(100)
-- ZGlzY29yZC5nZy9mbWE=
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        end
        VexonAC.Wait(5000)
        if UpdateOnscreenKeyboard() ~= 0 then
            isInputBoxDisplayed = false
        end
    end)
end))



﻿local checkSpectate = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiSpectate then
        return
    end
    
    if not VexonAC.isSpectating and VexonAC.isNetworkInSpectatorMode then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPECTATE)
    end
end)

VexonAC.RegisterDetection("spectate", checkSpectate, 5000)

exports("setSpectatorMode", LPH_NO_VIRTUALIZE(function(toggle)
    VexonAC.isSpectating = toggle
end))
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h



﻿local lastHijack = 0
local hijackStrike = VexonAC.StrikesSystem.createStrikeSystem(
    "Hijack",
    3,
    function(playerId)
        VexonAC.DetectPlayer("Vehicle Hijack Detected")
    end,
    10000
)

AddEventHandler("gameEventTriggered", LPH_JIT_MAX(function(name, args)
    if not VexonAC.playerSpawned then return end
-- Zm1hLnd0Zg==
    if not VexonAC.Config.Entities.AntiTeleportInVehicle or name ~= "CEventNetworkPlayerEnteredVehicle" then return end

	local ped = VexonAC.playerPed
	local playerId = VexonAC.playerId
	local pedEntering, vehicle = args[1], args[2]
	if pedEntering ~= playerId and pedEntering ~= ped then return end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
	if not DoesEntityExist(vehicle) then return end
    if GetSeatPedIsTryingToEnter(ped) ~= -3 then return end --no tasks
    if VexonAC.hasTeleported or (GetNetworkTime() - (VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer") or 0) > 10000) then return end
	local driver = GetPedInVehicleSeat(vehicle, -1)
    if driver ~= 0 then return end

    local currentTime = VexonAC.Native.GetGameTimer()
    if currentTime - lastHijack < 100 then
        hijackStrike()
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        lastHijack = 0
        return
    end

    lastHijack = currentTime
end))


﻿local scriptGravity = 25.0
local scriptCheatPowerIncrease = 1.1
local scriptTopSpeedModifier = 1.1

local overridedBoosts = {
    [GetHashKey("sanchez")] = 18.0,
    [GetHashKey("sanchez2")] = 18.0,
    [GetHashKey("banshee2")] = 20.0,
}

local checkVehicleSpeed = LPH_JIT_MAX(function()
    if not VexonAC.Config.Entities.AntiSpeedModifier and not VexonAC.Config.Entities.AntiHandlingModifier then
        return
    end

    if not VexonAC.isPlayerInVehicle or not VexonAC.isPlayerDriver then
        return
    end
    
    if VexonAC.Config.Entities.AntiSpeedModifier then
        local override = overridedBoosts[VexonAC.vehicleModel]
        if (override ~= nil and scriptTopSpeedModifier < override and VexonAC.vehicleTopSpeedModifier > override) or (override == nil and VexonAC.vehicleTopSpeedModifier > (scriptTopSpeedModifier + 1)) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPEED_MODIFIER, {
                vehicle = VexonAC.GetVehicleName(VexonAC.vehicleModel),
                speedModifier = VexonAC.vehicleTopSpeedModifier,
                script = scriptTopSpeedModifier,
            })
            return
        end

        if math.floor(VexonAC.vehicleCheatPowerIncrease) > math.floor(scriptCheatPowerIncrease) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPEED_MODIFIER, {
                vehicle = VexonAC.GetVehicleName(VexonAC.vehicleModel),
                torqueModifier = VexonAC.vehicleCheatPowerIncrease,
                script = scriptCheatPowerIncrease,
            })
            return
        end
-- Zm1hLnd0Zg==
    end

    if VexonAC.Config.Entities.AntiHandlingModifier then
        if math.floor(VexonAC.vehicleGravityAmount) > math.floor(scriptGravity) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_HANDLING_MODIFIER, {
                vehicle = VexonAC.GetVehicleName(VexonAC.vehicleModel),
                gravityModifier = VexonAC.vehicleGravityAmount,
                script = scriptGravity,
            })
            return
        end
    end
end)

VexonAC.RegisterDetection("vehicleSpeed", checkVehicleSpeed, 3000)

exports("newGravity", LPH_NO_VIRTUALIZE(function(newGravity)
    if newGravity <= 25.0 then
        scriptGravity = 25.0
    else
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
        scriptGravity = VexonAC.tonumber(string.format("%.1f", newGravity))
    end
end))

exports("newCheatPowerIncrease", LPH_NO_VIRTUALIZE(function(newCheatPowerIncrease)
    if newCheatPowerIncrease <= 1.1 then
        scriptCheatPowerIncrease = 1.1
    else
        scriptCheatPowerIncrease = VexonAC.tonumber(string.format("%.1f", newCheatPowerIncrease))
    end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
end))

exports("newTopSpeedModifier", LPH_NO_VIRTUALIZE(function(newTopSpeedModifier)
    if newTopSpeedModifier <= 1.1 then
        scriptTopSpeedModifier = 1.1
    else
        scriptTopSpeedModifier = VexonAC.tonumber(string.format("%.1f", newTopSpeedModifier))
    end
end))



﻿local lastVehiclePlate, lastVehicle = "", 0

local checkVehiclePlateChanger = LPH_JIT_MAX(function()
    if not VexonAC.Config.Entities.AntiVehiclePlateChanger then
        return
    end
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B

    if not VexonAC.isPlayerInVehicle or not VexonAC.isPlayerDriver then
        lastVehiclePlate, lastVehicle = "", 0
        return
    end

    if VexonAC.Native.GetGameTimer() < (VexonAC.GetSecuredStateBag("_WS:LastChangedVehiclePlate") or 0) + 10000 then
        lastVehiclePlate, lastVehicle = "", 0
        return
-- ZiBtIGE=
    end 
    
    local vehiclePlate = string.gsub(GetVehicleNumberPlateText(VexonAC.playerCurrentVehicle) or "", "%s+", "")

    if DoesEntityExist(VexonAC.playerCurrentVehicle) and VexonAC.playerCurrentVehicle == lastVehicle and vehiclePlate and vehiclePlate ~= lastVehiclePlate then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_VEHICLE_PLATE_CHANGER, {
            oldPlate = lastVehiclePlate,
            newPlate = vehiclePlate,
        })
    end

    lastVehiclePlate = vehiclePlate
    lastVehicle = VexonAC.playerCurrentVehicle
end)

VexonAC.RegisterDetection("vehiclePlateChanger", checkVehiclePlateChanger, 3000)

RegisterNetEvent("__VexonAC:setVehicleNumberPlateText", function(plateText)
    if not plateText then return end
    VexonAC.SetSecuredStateBag("_WS:LastChangedVehiclePlate", VexonAC.Native.GetGameTimer(), false)
end)

exports("ChangeVehiclePlate", LPH_NO_VIRTUALIZE(function(vehicle, plateText)
-- ZGlzY29yZC5nZy9mbWE=
    if not plateText then return end
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    VexonAC.SetSecuredStateBag("_WS:LastChangedVehiclePlate", VexonAC.Native.GetGameTimer(), false)
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
end))



﻿local degreesToRadians = math.pi / 180

local RotationToDirection = LPH_NO_VIRTUALIZE(function(rotation)
	local radiansZ = rotation.z * degreesToRadians
    local radiansX = rotation.x * degreesToRadians
    local num = math.abs(math.cos(radiansX))
    
    return vector3(
        -math.sin(radiansZ) * num,
        math.cos(radiansZ) * num,
        math.sin(radiansX)
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    )
end)

-- =========================================================================== --
-- ================= TRUE SILENT AIM DETECTION SYSTEM ==================== --
-- =========================================================================== --

local silentAimConfig = {
    maxTrajectoryDeviation = 2.0,     -- Max meters between expected hit and actual hit
    maxScreenDeviation = 70,         -- Max pixels between crosshair and hit point (increased)
    
    minDetectionDistance = 4.0,       -- Minimum distance to perform checks
    maxDetectionDistance = 250.0,     -- Maximum distance to check
    
    shotValidityWindow = 50,         -- ms after shot to consider impact valid
    
    minShotsForPattern = 3,           -- Minimum shots to detect patterns
    
    excludedWeaponGroups = {
        [GetHashKey("GROUP_SHOTGUN")] = true,
        [GetHashKey("GROUP_SNIPER")] = true,
        [GetHashKey("GROUP_THROWN")] = true,
        [GetHashKey("GROUP_HEAVY")] = true,
        [GetHashKey("GROUP_MELEE")] = true
    },
}

local silentAimData = {
    lastShotTime = 0,
    shotFired = false,
    shotData = nil, -- Store camera data when shot is fired
    screenCenter = { x = 0, y = 0 },
    
    lastCameraRotation = nil,
    lastMovementTime = 0,
    mouseVelocity = 0,

    recentHits = {},
    totalSuspiciousShots = 0,
}

local function detectRapidMouseMovement(currentRotation)
    local currentTime = VexonAC.Native.GetGameTimer()
    silentAimData.mouseVelocity = 0
    if silentAimData.lastCameraRotation then
        local timeDelta = currentTime - silentAimData.lastMovementTime
        if timeDelta > 0 and timeDelta < 500 then -- Within 500ms
            local rotationDelta = #(currentRotation - silentAimData.lastCameraRotation)
            silentAimData.mouseVelocity = rotationDelta / (timeDelta / 1000) -- degrees per second
        end
    end
    
    silentAimData.lastCameraRotation = currentRotation
    silentAimData.lastMovementTime = currentTime
    
    return silentAimData.mouseVelocity
end


local calculateExpectedHitPoint = LPH_NO_VIRTUALIZE(function(shotData, impactDistance)
    if not shotData or not shotData.cameraCoords or not shotData.cameraDirection then 
        return nil 
    end
    
    return vector3(
        shotData.cameraCoords.x + (shotData.cameraDirection.x * impactDistance),
        shotData.cameraCoords.y + (shotData.cameraDirection.y * impactDistance),
        shotData.cameraCoords.z + (shotData.cameraDirection.z * impactDistance)
    )
end)

-- Main trajectory deviation detection (core of silent aim detection)
local analyzeTrajectoryDeviation = LPH_NO_VIRTUALIZE(function(impactCoords, shotData)
    -- Calculate where bullet should have gone based on camera direction
    local impactDistance = #(shotData.cameraCoords - impactCoords)
    local expectedHitPoint = calculateExpectedHitPoint(shotData, impactDistance)
    
    if not expectedHitPoint then return false, 0 end
    
    -- Calculate 3D deviation between expected hit and actual victim location
    local trajectoryDeviation = #(expectedHitPoint - impactCoords)
    
    -- Use distance-based thresholds
    local threshold = silentAimConfig.maxTrajectoryDeviation
    
    local isSuspicious = trajectoryDeviation > threshold

    return isSuspicious, trajectoryDeviation
end)

-- Screen space analysis - where was crosshair vs where target is
local analyzeScreenDeviation = LPH_NO_VIRTUALIZE(function(impactCoords, shotData)
    if not shotData or not impactCoords then return false, 0 end
    
    -- Use exact impact coordinates for maximum precision
    local onScreen, screenX, screenY = GetScreenCoordFromWorldCoord(impactCoords.x, impactCoords.y, impactCoords.z)
    
    if not onScreen then return false, 0 end
    
    local screenWidth, screenHeight = GetActiveScreenResolution()
    local impactScreenX = screenX * screenWidth
    local impactScreenY = screenY * screenHeight
    silentAimData.screenCenter.x = screenWidth / 2
    silentAimData.screenCenter.y = screenHeight / 2

    -- Calculate distance from crosshair center to exact impact point
    local deltaX = impactScreenX - silentAimData.screenCenter.x
    local deltaY = impactScreenY - silentAimData.screenCenter.y
    local screenDeviation = math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    -- Use distance-based thresholds
    local distanceToImpact = #(shotData.cameraCoords - impactCoords)
    
    local threshold = silentAimConfig.maxScreenDeviation
    
    local isSuspicious = screenDeviation > threshold
    return isSuspicious, screenDeviation
end)

-- Pattern detection for multiple suspicious shots
local updateSuspiciousPatterns = LPH_NO_VIRTUALIZE(function(isSuspicious)
    local currentTime = VexonAC.Native.GetGameTimer()
    
    -- Clean old entries (keep last 30 seconds)
    for i = #silentAimData.recentHits, 1, -1 do
        if currentTime - silentAimData.recentHits[i].time > 30000 then
            table.remove(silentAimData.recentHits, i)
        end
    end
    
    -- Add current shot
    table.insert(silentAimData.recentHits, {
        time = currentTime,
        suspicious = isSuspicious
    })
    
    if isSuspicious then
        silentAimData.totalSuspiciousShots = silentAimData.totalSuspiciousShots + 1
    end
    
    -- Check if we have enough suspicious shots in recent history
    local recentSuspicious = 0
    for _, hit in VexonAC.Lua.ipairs(silentAimData.recentHits) do
        if hit.suspicious then
            recentSuspicious = recentSuspicious + 1
        end
    end
    
    -- If 3+ suspicious shots in recent history, trigger detection
    return recentSuspicious >= silentAimConfig.minShotsForPattern
end)

local shouldMonitorWeapon = LPH_NO_VIRTUALIZE(function(weaponHash)
    if not weaponHash or weaponHash == VexonAC.Native.GetHashKey("WEAPON_UNARMED") then
        return false
    end
    
    local weaponGroup = GetWeapontypeGroup(weaponHash)
    if silentAimConfig.excludedWeaponGroups[weaponGroup] then
        return false
    end
    
    local damageType = GetWeaponDamageType(weaponHash)
    return damageType == 3 -- Bullet damage only
end)

-- Core silent aim detection based on trajectory deviation
local validateShotLegitimacy = LPH_JIT_MAX(function(victim, impactCoords, weaponHash)
    local shooterCoords = GetEntityCoords(VexonAC.playerPed)
    local victimCoords = GetEntityCoords(victim)
    local distanceToVictim = #(shooterCoords - victimCoords)
    
    -- Distance checks
    if distanceToVictim < silentAimConfig.minDetectionDistance then
        return true, "too_close"
    end
    
    if distanceToVictim > silentAimConfig.maxDetectionDistance then
        return true, "too_far"
    end
    
    -- Weapon legitimacy check
    if not shouldMonitorWeapon(weaponHash) then
        return true, "excluded_weapon"
    end

    -- Check for rapid mouse movement (high-sens / flick shots)
    local mouseVelocity = silentAimData.shotData and silentAimData.shotData.mouseVelocity or 0
    
    -- EXCLUDE rapid movements from detection entirely
    if mouseVelocity > 100 then
        return true, "rapid_movement_excluded", {
            mouseVelocity = mouseVelocity,
            reason = "Shot excluded due to rapid mouse movement"
        }
    end
    
    local suspiciousTrajectory, trajectoryDeviation = analyzeTrajectoryDeviation(impactCoords, silentAimData.shotData)
    
    -- SECONDARY CHECK: Screen space analysis (precise impact point)
    local suspiciousScreen, screenDeviation = analyzeScreenDeviation(impactCoords, silentAimData.shotData)
    
    -- Determine if this shot is suspicious based on both methods
    local isSuspicious = suspiciousTrajectory or suspiciousScreen
    
    -- Update pattern tracking
    local hasPattern = updateSuspiciousPatterns(isSuspicious)
    
    -- INSTANT DETECTION for clear violations (normal thresholds)
    if suspiciousTrajectory and trajectoryDeviation > (silentAimConfig.maxTrajectoryDeviation * 1.5) then
        -- Very obvious trajectory deviation = instant detection
        return false, {
            reason = "instant_trajectory_violation",
            trajectoryDeviation = trajectoryDeviation,
            threshold = silentAimConfig.maxTrajectoryDeviation * 1.5,
            distance = distanceToVictim,
            screenDeviation = screenDeviation,
            mouseVelocity = mouseVelocity,
        }
    end
    
    if suspiciousScreen and screenDeviation > (silentAimConfig.maxScreenDeviation * 3.0) then
        -- Very obvious screen deviation = instant detection (adjusted for movement)
        return false, {
            reason = "instant_screen_violation",
            screenDeviation = screenDeviation,
            threshold = silentAimConfig.maxScreenDeviation * 3.0,
            distance = distanceToVictim,
            trajectoryDeviation = trajectoryDeviation,
            mouseVelocity = mouseVelocity,
        }
    end
    
    -- PATTERN DETECTION for legit configs (multiple suspicious shots)
    if hasPattern then
        return false, {
            reason = "pattern_detection",
            suspiciousShots = silentAimData.totalSuspiciousShots,
            recentSuspicious = #silentAimData.recentHits,
            trajectoryDeviation = trajectoryDeviation,
            screenDeviation = screenDeviation,
            distance = distanceToVictim,
            mouseVelocity = mouseVelocity,
        }
    end
    
    -- COMBINED ANALYSIS for borderline cases
    if isSuspicious and distanceToVictim > 30 then
        -- For distant shots, any deviation is more suspicious
        if (trajectoryDeviation and trajectoryDeviation > silentAimConfig.maxTrajectoryDeviation * 0.7) and
           (screenDeviation and screenDeviation > silentAimConfig.maxScreenDeviation * 0.7) then
            return false, {
                reason = "distance_based_violation",
                trajectoryDeviation = trajectoryDeviation,
                screenDeviation = screenDeviation,
                distance = distanceToVictim,
                mouseVelocity = mouseVelocity,
            }
        end
    end
    
    -- Shot appears legitimate
    return true, "legitimate_shot"
end)

local function isPedAWitness(witnesses, ped)
    if not witnesses then return false end
    
    for k, v in VexonAC.Lua.pairs(witnesses) do
        if v == ped or v == 0 then
            return true
        end
    end
    return false
end

-- Enhanced gunshot event handler
AddEventHandler("CEventGunShot", LPH_JIT_MAX(function(witnesses, shooter)
    if shooter ~= VexonAC.playerPed then return end
    if VexonAC.Native.IsEntityDead(shooter) then return end
    --if witnesses and witnesses[1] and not isPedAWitness(witnesses, shooter) then return end
    if GetPedParachuteState(shooter) > 0 then return end
    if GetRenderingCam() ~= -1 then return end

    local timer = VexonAC.Native.GetGameTimer()
    if timer - silentAimData.lastShotTime == 0 then
        return
    end

    local hold, weaponHash = VexonAC.Native.GetCurrentPedWeapon(VexonAC.playerPed, true)
    if not hold and (not VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, weaponHash, false) or weaponHash == -1569615261) and (VexonAC.Native.IsPlayerFreeForAmbientTask(VexonAC.playerId) or not VexonAC.Native.IsAimCamActive()) then
        if VexonAC.Config.Weapons.AntiSpoofedBullets then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SPOOFED_BULLETS, {
                reason = "Invalid Weapon",
                debug = ("%s:%s"):format(hold, weaponHash),
            })
        end
        silentAimData.shotFired = false
        return
    end

    if not VexonAC.Config.Beta.AntiSilentAim then return end
    if not shouldMonitorWeapon(weaponHash) then return end


    -- if not VexonAC.Native.IsAimCamActive() and VexonAC.Native.IsPlayerFreeForAmbientTask(VexonAC.playerId) and not VexonAC.Native.IsPedRunningRagdollTask(VexonAC.playerPed) and not VexonAC.Native.IsPedFalling(VexonAC.playerPed) then
    --     VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SILENT_AIM, {
    --         reason = "Invalid Aim State",
    --     })
    --     silentAimData.shotFired = false
    --     return
    -- end

    silentAimData.lastShotTime = timer
    silentAimData.shotFired = true
    
    -- Store exact camera data at the moment of shooting
    local cameraCoords = VexonAC.Native.GetGameplayCamCoord()
    local cameraRotation = VexonAC.Native.GetGameplayCamRot()
    
    -- Detect if this was a rapid mouse movement / flick shot
    detectRapidMouseMovement(cameraRotation)

    silentAimData.shotData = {
        cameraCoords = cameraCoords,
        cameraRotation = cameraRotation,
        cameraDirection = RotationToDirection(cameraRotation),
        mouseVelocity = silentAimData.mouseVelocity
    }
end))

-- Enhanced bullet impact handler with instant detection
AddEventHandler("CEventGunShotBulletImpact", LPH_JIT_MAX(function(witnesses, shooter)
    if not VexonAC.Config.Beta.AntiSilentAim then return end
    if shooter ~= VexonAC.playerPed then return end
    if not silentAimData.shotFired then return end
    if GetPedParachuteState(shooter) > 0 then return end
    if GetRenderingCam() ~= -1 then return end

    local currentTime = VexonAC.Native.GetGameTimer()
    if currentTime - silentAimData.lastShotTime >= silentAimConfig.shotValidityWindow then 
        silentAimData.shotFired = false
        return 
    end

    if VexonAC.Native.IsPedDeadOrDying(shooter, true) or IsPedRagdoll(shooter) then
        silentAimData.shotFired = false
        return
    end

    -- Verify this was actually a hit
    local hold, weaponHash = VexonAC.Native.GetCurrentPedWeapon(VexonAC.playerPed, true)
    if not hold then
        silentAimData.shotFired = false
        return
    end

    local success, impactCoords = GetPedLastWeaponImpactCoord(shooter)
    if not success then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SILENT_AIM, {
            reason = "Bullet Impact Manipulation",
        })
        silentAimData.shotFired = false
        return
    elseif success and impactCoords == vector3(0.0, 0.0, 0.0) then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SILENT_AIM, {
            reason = "Bullet Impact Manipulation #2",
        })
        silentAimData.shotFired = false
        return
    end

    -- Find victim near impact point
    local victim, victimDistance = getClosestPed(impactCoords, 3.0)
    if not victim or not IsPedAPlayer(victim) or IsPedInAnyVehicle(victim, false) then
        silentAimData.shotFired = false
        return
    end

    -- Check if victim was damaged by our weapon recently
    if not HasEntityBeenDamagedByWeapon(victim, weaponHash, 0) then
        silentAimData.shotFired = false
        return
    end

    local lastDamagedTime = GetTimeOfLastPedWeaponDamage(victim, weaponHash)
    if currentTime - lastDamagedTime > silentAimConfig.shotValidityWindow then 
        silentAimData.shotFired = false
        return
    end

    -- Clear damage markers to prevent duplicate detections
    ClearPedLastWeaponDamage(victim)
    ClearEntityLastWeaponDamage(victim)

    -- if not HasEntityClearLosToEntity(VexonAC.playerPed, victim, 17) and IsEntityOccluded(victim) then
    --     VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SILENT_AIM, {
    --         reason = "magic_bullet",
    --     })
    -- end

    -- Validate shot legitimacy with advanced detection
    local isLegitimate, detectionData = validateShotLegitimacy(victim, impactCoords, weaponHash)

    if not isLegitimate then
        -- INSTANT DETECTION - Enhanced detection for all types of silent aim
        local shooterCoords = GetEntityCoords(shooter)
        local victimCoords = GetEntityCoords(victim)
        local distanceToVictim = #(shooterCoords - victimCoords)
        
        detectionData.distance = distanceToVictim
        
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_SILENT_AIM, detectionData)
    end

    -- Reset shot state
    silentAimData.shotFired = false
end))


VexonAC.CreateThread(LPH_JIT_MAX(function()
    local minDeltaToTrigger = 0.005
    local previousCamRot = VexonAC.Native.GetGameplayCamRot(2)
    local previousCamHeading = GetGameplayCamRelativeHeading()
    local lastFov = GetGameplayCamFov() 
    local lastInput = 0
    local steadyFrames = 0
    local strikeCount = 0
    local lastWeaponBlocked = 0
    local lastInCollision = 0
    local lastChangedWeapon = 0
    local lastWeapon = VexonAC.Native.GetHashKey("WEAPON_UNARMED")

    local aimbotStrike = VexonAC.StrikesSystem.createStrikeSystem(
        "AntiAimBot",
        5,
        function(playerId)
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_AIM_BOT, {
                debug = math.abs(VexonAC.Native.GetGameplayCamRot(2).z - previousCamRot.z),
            })
        end,
        5000
    )

    while true do
        if VexonAC.Config.Weapons.AntiAimBot then
            local weaponHash = VexonAC.Native.GetSelectedPedWeapon(VexonAC.playerPed)
            local wait = 100
            local timer = VexonAC.Native.GetGameTimer()
            
            if VexonAC.Native.IsAimCamActive() and GetPedConfigFlag(VexonAC.playerPed, 78, true) and not IsPedInCover(VexonAC.playerPed, 0) and timer - lastWeaponBlocked > 1000 and timer - lastChangedWeapon > 1000 and timer - lastInCollision > 1000 and
                not (IsGameplayCamShaking() and VexonAC.Native.IsPedInAnyVehicle(VexonAC.playerPed, false)) and
                (not IsGameplayCamShaking() or
-- ZiBtIGE=
                    (GetFollowPedCamViewMode() ~= 4 or
                        not IsPlayerFreeAiming(VexonAC.playerId)
                    )
                ) and IsUsingKeyboard(0) and not IsEntityInAir(VexonAC.playerPed)
            then
                local weaponGroup = GetWeapontypeGroup(weaponHash)
                if weaponGroup ~= -1212426201 and weaponGroup ~= -1569042529 then
                    local camRot = VexonAC.Native.GetGameplayCamRot(2)
                    local camHeading = GetGameplayCamRelativeHeading()
                    local ix = GetDisabledControlNormal(0, 1)
                    local iy = GetDisabledControlNormal(0, 2)
                    local currentFov = GetGameplayCamFov()
                    local fovDiff = math.abs(currentFov - lastFov)

                    -- FOV needs to be stable
                    if fovDiff < 0.05 then
                        steadyFrames = steadyFrames + 1
                    else
                        steadyFrames = 0
                    end

                    if previousCamRot and steadyFrames > 3 then
                        local yawDelta = math.abs(camRot.z - previousCamRot.z)
                        local camHeadingDelta = math.abs(camHeading - previousCamHeading)
                        local input = math.abs(ix) + math.abs(iy)

                        if yawDelta > minDeltaToTrigger and camHeadingDelta == 0.0 and input == 0.0 and lastInput == 0.0 then
                            strikeCount = strikeCount + 1
                        else
                            strikeCount = 0
                        end

                        lastInput = input
                    else
                        strikeCount = 0
                    end

                    if strikeCount >= 10 then
                        aimbotStrike()
                        strikeCount = 0
                    end

                    lastFov = currentFov
                    previousCamRot = camRot
                    previousCamHeading = camHeading
                    wait = 0
                else
                    wait = 1000
                end
            end

            if GetIsTaskActive(VexonAC.playerPed, 299) then
                lastWeaponBlocked = timer
            end

            if #GetCollisionNormalOfLastHitForEntity(VexonAC.playerPed) > 0 then
                lastInCollision = timer
            end
            
            if lastWeapon ~= weaponHash then
                lastChangedWeapon = timer
            end

            lastWeapon = weaponHash

            VexonAC.Wait(wait)
        else
            VexonAC.Wait(10000)
        end
    end
end))


﻿local hasAddedAmmo = false

local function isPedAWitness(witnesses, ped)
    if not witnesses then return false end
    
    for k, v in VexonAC.Lua.pairs(witnesses) do
        if v == ped or v == 0 then
            return true
        end
    end
    return false
end

local function IsPlayerAiming(player)
    return IsPlayerFreeAiming(player) or VexonAC.Native.IsAimCamActive() or IsAimCamThirdPersonActive()
end

local checkAmmos = LPH_JIT_MAX(function()
    if not VexonAC.isHoldingWeapon then
        return
    end

    local weaponDamageType = GetWeaponDamageType(VexonAC.currentWeapon)
    if VexonAC.Config.Weapons.AntiExplosiveBullets then
        local weaponGroup = GetWeapontypeGroup(VexonAC.currentWeapon)
        if (weaponDamageType == 5 or weaponDamageType == 6 or weaponDamageType == 13) and not IsPedArmed(VexonAC.playerPed, 2) and weaponGroup ~= VexonAC.Native.GetHashKey("GROUP_HEAVY") then
            local weapData = VexonAC.WEAPON_DATA[VexonAC.currentWeapon]
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_EXPLOSIVE_BULLETS, {
                weapon = weapData and weapData.weaponName or VexonAC.currentWeapon,
            })
            return
        elseif (weaponDamageType == 4 --[[or weaponDamageType == 10]]) and GetWeapontypeGroup(VexonAC.currentWeapon) ~= 690389602 then
            local weapData = VexonAC.WEAPON_DATA[VexonAC.currentWeapon]
            VexonAC.DetectPlayer("Stunning Bullets Detected", {
                weapon = weapData and weapData.weaponName or VexonAC.currentWeapon,
            })
            return
        end
    end

    if VexonAC.Config.Weapons.AntiNoRecoil and (VexonAC.currentWeapon ~= 0) and (weaponDamageType == 3) then
        local recoilAmplitude = GetWeaponRecoilShakeAmplitude(VexonAC.currentWeapon)
        if recoilAmplitude <= 0.0 then
            local weapData = VexonAC.WEAPON_DATA[VexonAC.currentWeapon]
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_RECOIL, {
                weapon = weapData and weapData.weaponName or VexonAC.currentWeapon,
            })
            return
        end
    end

    if weaponDamageType == 3 then
        local ammoInWeapon = GetAmmoInPedWeapon(VexonAC.playerPed, VexonAC.currentWeapon)
        local _, ammoInClip = GetAmmoInClip(VexonAC.playerPed, VexonAC.currentWeapon)
        local __, maxAmmo = GetMaxAmmo(VexonAC.playerPed, VexonAC.currentWeapon)

        if VexonAC.Config.Weapons.AntiAmmoCheating and (ammoInWeapon > maxAmmo) then
            local weapData = VexonAC.WEAPON_DATA[VexonAC.currentWeapon]
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_AMMO_CHEATING, {
                ammoInWeapon = ammoInWeapon,
                maxAmmo = maxAmmo,
                weapon = weapData and weapData.weaponName or VexonAC.currentWeapon,
            })
        end

        if VexonAC.Config.Weapons.AntiAmmoCheating and (ammoInClip > maxAmmo) then
            local weapData = VexonAC.WEAPON_DATA[VexonAC.currentWeapon]
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_AMMO_CHEATING, {
                ammoInClip = ammoInClip,
                maxAmmo = maxAmmo,
                weapon = weapData and weapData.weaponName or VexonAC.currentWeapon,
            })
        end
    end
end)

VexonAC.RegisterDetection("ammos", checkAmmos, 5000)

local lastShotTime, lastWeaponHash, lastAmmoInWeapon, lastAmmoInClip = 0, 0, 0, 0

AddEventHandler("CEventGunShot", LPH_JIT_MAX(function(witnesses, shooter)
    if not VexonAC.Config.Weapons.AntiInfiniteAmmo then return end
    if shooter ~= VexonAC.playerPed then return end
    if witnesses and witnesses[1] and not isPedAWitness(witnesses, shooter) then return end
    if VexonAC.isPlayerDead then return end
    if hasAddedAmmo then return end
    if not IsPlayerAiming(VexonAC.playerId) then return end
    if VexonAC.isPlayerInVehicle then return end
    if IsEntityAttachedToEntity(VexonAC.playerPed) then return end

    local hold, weaponHash = GetCurrentPedWeapon(shooter, true)
    if not hold then return end

    local weaponDamageType = GetWeaponDamageType(weaponHash)
    if weaponDamageType ~= 3 then return end

    local ammoInWeapon = GetAmmoInPedWeapon(VexonAC.playerPed, weaponHash)
    local _, ammoInClip = GetAmmoInClip(VexonAC.playerPed, weaponHash)

    local currentTime = GetGameTimer()
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
    if weaponHash == lastWeaponHash and (currentTime - lastShotTime) < 500 then
        local weapData = VexonAC.WEAPON_DATA[weaponHash]
        local weaponName = weapData and weapData.weaponName or weaponHash
        
        if ammoInWeapon > 0 and ammoInWeapon >= lastAmmoInWeapon then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INFINITE_AMMO, {
                ammoInWeapon = ammoInWeapon,
                lastAmmoInWeapon = lastAmmoInWeapon,
                weapon = weaponName,
            })
            return
        end

        if ammoInClip > 0 and ammoInClip >= lastAmmoInClip then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_INFINITE_AMMO, {
                ammoInClip = ammoInClip,
                lastAmmoInClip = lastAmmoInClip,
                weapon = weaponName,
            })
            return
        end

        if ammoInClip == lastAmmoInClip and ammoInWeapon ~= lastAmmoInWeapon then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_NO_RELOAD)
            return
        end
    end

    lastWeaponHash = weaponHash or 0
    lastAmmoInWeapon = ammoInWeapon or 0
    lastAmmoInClip = ammoInClip or 0
    lastShotTime = currentTime
end))

local expiresAmmo = 0
exports("hasAddedAmmo", LPH_NO_VIRTUALIZE(function()
    local timer = VexonAC.Native.GetGameTimer()
    if timer > expiresAmmo - 2000 then
        expiresAmmo = timer + 5000
        if not hasAddedAmmo then
            hasAddedAmmo = true
            VexonAC.CreateThread(function()
                while VexonAC.Native.GetGameTimer() < expiresAmmo do VexonAC.Wait(100) end
                hasAddedAmmo = false
            end)
        end
    end
end))

RegisterNetEvent("__VexonAC:hasAddedAmmo",function()
	exports["VexonAC"]:hasAddedAmmo()
end)



﻿local checkHitbox = LPH_JIT_MAX(function()
    if not VexonAC.Config.Weapons.AntiHitboxModifier then
        return
    end
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=

    if not HasModelLoaded(1885233650) then
        RequestModel(1885233650)
        return
    end
    
    local min, max = GetModelDimensions(1885233650)
    if min == vector3(0.0, 0.0, 0.0) or max == vector3(0.0, 0.0, 0.0) then
        return
    end

    local offsetMin = #(min - vector3(-0.6095175, -0.25, -1.3))
    local offsetMax = #(max - vector3(0.6099811, 0.25, 0.945))

    if offsetMin > 0.01 or offsetMax > 0.01 then
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_HITBOX_MODIFIER, {
            offsetMin = offsetMin,
            offsetMax = offsetMax,
        })
        return
    end
end)

VexonAC.RegisterDetection("hitbox", checkHitbox, 10000)


﻿local allPickupsHashes = {}
local allPickups = {
    "PICKUP_WEAPON_BULLPUPSHOTGUN",
    "PICKUP_WEAPON_ASSAULTSMG",
    "PICKUP_VEHICLE_WEAPON_ASSAULTSMG",
    "PICKUP_WEAPON_PISTOL50",
    "PICKUP_VEHICLE_WEAPON_PISTOL50",
    "PICKUP_AMMO_BULLET_MP",
    "PICKUP_AMMO_MISSILE_MP",
    "PICKUP_AMMO_GRENADELAUNCHER_MP",
    "PICKUP_WEAPON_ASSAULTRIFLE",
    "PICKUP_WEAPON_CARBINERIFLE",
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    "PICKUP_WEAPON_ADVANCEDRIFLE",
    "PICKUP_WEAPON_MG",
    "PICKUP_WEAPON_COMBATMG",
    "PICKUP_WEAPON_SNIPERRIFLE",
    "PICKUP_WEAPON_HEAVYSNIPER",
    "PICKUP_WEAPON_MICROSMG",
    "PICKUP_WEAPON_SMG",
    "PICKUP_ARMOUR_STANDARD",
    "PICKUP_WEAPON_RPG",
    "PICKUP_WEAPON_MINIGUN",
    "PICKUP_HEALTH_STANDARD",
    "PICKUP_WEAPON_PUMPSHOTGUN",
    "PICKUP_WEAPON_SAWNOFFSHOTGUN",
    "PICKUP_WEAPON_ASSAULTSHOTGUN",
    "PICKUP_WEAPON_GRENADE",
    "PICKUP_WEAPON_MOLOTOV",
    "PICKUP_WEAPON_SMOKEGRENADE",
    "PICKUP_WEAPON_STICKYBOMB",
    "PICKUP_WEAPON_PISTOL",
    "PICKUP_WEAPON_COMBATPISTOL",
    "PICKUP_WEAPON_APPISTOL",
    "PICKUP_WEAPON_GRENADELAUNCHER",
    "PICKUP_MONEY_VARIABLE",
    "PICKUP_GANG_ATTACK_MONEY",
    "PICKUP_WEAPON_STUNGUN",
    "PICKUP_WEAPON_PETROLCAN",
    "PICKUP_WEAPON_KNIFE",
    "PICKUP_WEAPON_NIGHTSTICK",
    "PICKUP_WEAPON_HAMMER",
    "PICKUP_WEAPON_BAT",
    "PICKUP_WEAPON_GolfClub",
    "PICKUP_WEAPON_CROWBAR",
    "PICKUP_CUSTOM_SCRIPT",
-- ZiBtIGE=
    "PICKUP_CAMERA",
    "PICKUP_PORTABLE_PACKAGE",
    "PICKUP_PORTABLE_CRATE_UNFIXED",
    "PICKUP_PORTABLE_PACKAGE_LARGE_RADIUS",
    "PICKUP_PORTABLE_FM_CONTENT_MISSION_ENTITY_SMALL",
    "PICKUP_PORTABLE_CRATE_UNFIXED_INCAR",
    "PICKUP_PORTABLE_CRATE_UNFIXED_INAIRVEHICLE_WITH_PASSENGERS",
    "PICKUP_PORTABLE_CRATE_UNFIXED_INAIRVEHICLE_WITH_PASSENGERS_UPRIGHT",
    "PICKUP_PORTABLE_CRATE_UNFIXED_INCAR_WITH_PASSENGERS",
    "PICKUP_PORTABLE_CRATE_FIXED_INCAR_WITH_PASSENGERS",
    "PICKUP_PORTABLE_CRATE_FIXED_INCAR_SMALL",
    "PICKUP_PORTABLE_CRATE_UNFIXED_INCAR_SMALL",
    "PICKUP_PORTABLE_CRATE_UNFIXED_LOW_GLOW",
    "PICKUP_MONEY_CASE",
    "PICKUP_MONEY_WALLET",
    "PICKUP_MONEY_PURSE",
    "PICKUP_MONEY_DEP_BAG",
    "PICKUP_MONEY_MED_BAG",
    "PICKUP_MONEY_PAPER_BAG",
    "PICKUP_MONEY_SECURITY_CASE",
    "PICKUP_VEHICLE_WEAPON_COMBATPISTOL",
    "PICKUP_VEHICLE_WEAPON_APPISTOL",
    "PICKUP_VEHICLE_WEAPON_PISTOL",
    "PICKUP_VEHICLE_WEAPON_GRENADE",
    "PICKUP_VEHICLE_WEAPON_MOLOTOV",
    "PICKUP_VEHICLE_WEAPON_SMOKEGRENADE",
    "PICKUP_VEHICLE_WEAPON_STICKYBOMB",
    "PICKUP_VEHICLE_HEALTH_STANDARD",
    "PICKUP_VEHICLE_HEALTH_STANDARD_LOW_GLOW",
    "PICKUP_VEHICLE_ARMOUR_STANDARD",
    "PICKUP_VEHICLE_WEAPON_MICROSMG",
    "PICKUP_VEHICLE_WEAPON_SMG",
    "PICKUP_VEHICLE_WEAPON_SAWNOFF",
    "PICKUP_VEHICLE_CUSTOM_SCRIPT",
    "PICKUP_VEHICLE_CUSTOM_SCRIPT_NO_ROTATE",
    "PICKUP_VEHICLE_CUSTOM_SCRIPT_LOW_GLOW",
    "PICKUP_VEHICLE_MONEY_VARIABLE",
    "PICKUP_SUBMARINE",
    "PICKUP_HEALTH_SNACK",
    "PICKUP_PARACHUTE",
    "PICKUP_AMMO_PISTOL",
    "PICKUP_AMMO_SMG",
    "PICKUP_AMMO_RIFLE",
    "PICKUP_AMMO_MG",
    "PICKUP_AMMO_SHOTGUN",
    "PICKUP_AMMO_SNIPER",
    "PICKUP_AMMO_GRENADELAUNCHER",
    "PICKUP_AMMO_RPG",
    "PICKUP_AMMO_MINIGUN",
    "PICKUP_WEAPON_BOTTLE",
    "PICKUP_WEAPON_SNSPISTOL",
    "PICKUP_WEAPON_HEAVYPISTOL",
    "PICKUP_WEAPON_SPECIALCARBINE",
    "PICKUP_WEAPON_BULLPUPRIFLE",
    "PICKUP_WEAPON_PISTOLXM3",
    "PICKUP_WEAPON_CANDYCANE",
    "PICKUP_WEAPON_RAILGUNXM3",
    "PICKUP_WEAPON_RAYPISTOL",
    "PICKUP_WEAPON_RAYCARBINE",
    "PICKUP_WEAPON_RAYMINIGUN",
    "PICKUP_WEAPON_BULLPUPRIFLE_MK2",
    "PICKUP_WEAPON_DOUBLEACTION",
    "PICKUP_WEAPON_MARKSMANRIFLE_MK2",
    "PICKUP_WEAPON_PUMPSHOTGUN_MK2",
    "PICKUP_WEAPON_REVOLVER_MK2",
    "PICKUP_WEAPON_SNSPISTOL_MK2",
    "PICKUP_WEAPON_SPECIALCARBINE_MK2",
    "PICKUP_WEAPON_PROXMINE",
    "PICKUP_WEAPON_HOMINGLAUNCHER",
    "PICKUP_AMMO_HOMINGLAUNCHER",
    "PICKUP_WEAPON_GUSENBERG",
    "PICKUP_WEAPON_DAGGER",
    "PICKUP_WEAPON_VINTAGEPISTOL",
    "PICKUP_WEAPON_FIREWORK",
    "PICKUP_WEAPON_MUSKET",
    "PICKUP_AMMO_FIREWORK",
    "PICKUP_AMMO_FIREWORK_MP",
    "PICKUP_PORTABLE_DLC_VEHICLE_PACKAGE",
    "PICKUP_WEAPON_HATCHET",
    "PICKUP_WEAPON_RAILGUN",
    "PICKUP_WEAPON_HEAVYSHOTGUN",
    "PICKUP_WEAPON_MARKSMANRIFLE",
    "PICKUP_WEAPON_FLAREGUN",
    "PICKUP_AMMO_FLAREGUN",
    "PICKUP_WEAPON_CERAMICPISTOL",
    "PICKUP_WEAPON_HAZARDCAN",
    "PICKUP_WEAPON_NAVYREVOLVER",
    "PICKUP_WEAPON_COMBATSHOTGUN",
    "PICKUP_WEAPON_GADGETPISTOL",
    "PICKUP_WEAPON_MILITARYRIFLE",
    "PICKUP_WEAPON_KNUCKLE",
    "PICKUP_WEAPON_MARKSMANPISTOL",
    "PICKUP_WEAPON_COMBATPDW",
    "PICKUP_PORTABLE_CRATE_FIXED_INCAR",
    "PICKUP_WEAPON_COMPACTRIFLE",
    "PICKUP_WEAPON_DBSHOTGUN",
    "PICKUP_WEAPON_MACHETE",
    "PICKUP_WEAPON_MACHINEPISTOL",
    "PICKUP_WEAPON_FLASHLIGHT",
    "PICKUP_WEAPON_REVOLVER",
    "PICKUP_WEAPON_SWITCHBLADE",
    "PICKUP_WEAPON_AUTOSHOTGUN",
    "PICKUP_WEAPON_BATTLEAXE",
    "PICKUP_WEAPON_COMPACTLAUNCHER",
    "PICKUP_WEAPON_MINISMG",
    "PICKUP_WEAPON_PIPEBOMB",
    "PICKUP_WEAPON_POOLCUE",
    "PICKUP_WEAPON_WRENCH",
    "PICKUP_WEAPON_ASSAULTRIFLE_MK2",
    "PICKUP_WEAPON_CARBINERIFLE_MK2",
    "PICKUP_WEAPON_COMBATMG_MK2",
    "PICKUP_WEAPON_HEAVYSNIPER_MK2",
    "PICKUP_WEAPON_PISTOL_MK2",
    "PICKUP_WEAPON_SMG_MK2",
    "PICKUP_WEAPON_STONE_HATCHET",
    "PICKUP_WEAPON_METALDETECTOR",
    "PICKUP_WEAPON_TACTICALRIFLE",
    "PICKUP_WEAPON_PRECISIONRIFLE",
    "PICKUP_WEAPON_EMPLAUNCHER",
    "PICKUP_AMMO_EMPLAUNCHER",
    "PICKUP_WEAPON_HEAVYRIFLE",
    "PICKUP_WEAPON_PETROLCAN_SMALL_RADIUS",
    "PICKUP_WEAPON_FERTILIZERCAN",
    "PICKUP_WEAPON_STUNGUN_MP",
    "PICKUP_WEAPON_TECPISTOL",
    "PICKUP_WEAPON_BATTLERIFLE",
    "PICKUP_WEAPON_SNOWLAUNCHER",
    "PICKUP_WEAPON_HACKINGDEVICE",
}

VexonAC.CreateThread(function()
    for _, pickup in VexonAC.Lua.pairs(allPickups) do
        table.insert(allPickupsHashes, VexonAC.Native.GetHashKey(pickup))
    end
end)

local checkPickups = LPH_NO_VIRTUALIZE(function()
    if not VexonAC.Config.Entities.AntiPickupSpawn then
        return
    end

    for _, pickup in VexonAC.Lua.pairs(allPickupsHashes) do
        ToggleUsePickupsForPlayer(VexonAC.playerId, pickup, false)
    end
end)

VexonAC.RegisterDetection("pickups", checkPickups, 10000)


﻿-- Use centralized weapon data from VexonAC.WEAPON_DATA (utils.lua)
local defaultWeaponDamages = {}

-- Build default damages lookup for setNewDamage export
for i = 1, #VexonAC.WEAPON_DATA do
    local weaponData = VexonAC.WEAPON_DATA[i]
    if weaponData.weaponDamages > 0 then
        defaultWeaponDamages[weaponData.weaponHash] = weaponData.weaponDamages
    end
end

local weaponsComponents = {
    [GetHashKey('COMPONENT_COMBATPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_COMBATPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_COMBATPISTOL_CLIP_02')] = {ComponentName = "COMPONENT_COMBATPISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_APPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_APPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_APPISTOL_CLIP_02')] = {ComponentName = "COMPONENT_APPISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_MICROSMG_CLIP_01')] = {ComponentName = "COMPONENT_MICROSMG_CLIP_01"},
    [GetHashKey('COMPONENT_MICROSMG_CLIP_02')] = {ComponentName = "COMPONENT_MICROSMG_CLIP_02"},
    [GetHashKey('COMPONENT_REVOLVER_CLIP_01')] = {ComponentName = "COMPONENT_REVOLVER_CLIP_01"},
    [GetHashKey('COMPONENT_SNSPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_SNSPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_HEAVYPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_HEAVYPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_HEAVYPISTOL_CLIP_02')] = {ComponentName = "COMPONENT_HEAVYPISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_VINTAGEPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_VINTAGEPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_VINTAGEPISTOL_CLIP_02')] = {ComponentName = "COMPONENT_VINTAGEPISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_CERAMICPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_CERAMICPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_CERAMICPISTOL_CLIP_02')] = {ComponentName = "COMPONENT_CERAMICPISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_MACHINEPISTOL_CLIP_01')] = {ComponentName = "COMPONENT_MACHINEPISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_MACHINEPISTOL_CLIP_03')] = {ComponentName = "COMPONENT_MACHINEPISTOL_CLIP_03"},
    [GetHashKey('COMPONENT_HEAVYPISTOL_CLIP_02')] = {ComponentName = "COMPONENT_HEAVYPISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_SMG_CLIP_01')] = {ComponentName = "COMPONENT_SMG_CLIP_01"},
    [GetHashKey('COMPONENT_SMG_CLIP_02')] = {ComponentName = "COMPONENT_SMG_CLIP_02"},
    [GetHashKey('COMPONENT_SMG_CLIP_03')] = {ComponentName = "COMPONENT_SMG_CLIP_03"},
    [GetHashKey('COMPONENT_MINISMG_CLIP_01')] = {ComponentName = "COMPONENT_MINISMG_CLIP_01"},
    [GetHashKey('COMPONENT_MINISMG_CLIP_02')] = {ComponentName = "COMPONENT_MINISMG_CLIP_02"},
    [GetHashKey('COMPONENT_ASSAULTRIFLE_CLIP_01')] = {ComponentName = "COMPONENT_ASSAULTRIFLE_CLIP_01"},
    [GetHashKey('COMPONENT_ASSAULTRIFLE_CLIP_02')] = {ComponentName = "COMPONENT_ASSAULTRIFLE_CLIP_02"},
    [GetHashKey('COMPONENT_CARBINERIFLE_CLIP_01')] = {ComponentName = "COMPONENT_CARBINERIFLE_CLIP_01"},
    [GetHashKey('COMPONENT_CARBINERIFLE_CLIP_02')] = {ComponentName = "COMPONENT_CARBINERIFLE_CLIP_02"},
    [GetHashKey('COMPONENT_ADVANCEDRIFLE_CLIP_01')] = {ComponentName = "COMPONENT_ADVANCEDRIFLE_CLIP_01"},
    [GetHashKey('COMPONENT_ADVANCEDRIFLE_CLIP_02')] = {ComponentName = "COMPONENT_ADVANCEDRIFLE_CLIP_02"},
    [GetHashKey('COMPONENT_MG_CLIP_01')] = {ComponentName = "COMPONENT_MG_CLIP_01"},
    [GetHashKey('COMPONENT_MG_CLIP_02')] = {ComponentName = "COMPONENT_MG_CLIP_02"},
    [GetHashKey('COMPONENT_COMBATMG_CLIP_01')] = {ComponentName = "COMPONENT_COMBATMG_CLIP_01"},
    [GetHashKey('COMPONENT_COMBATMG_CLIP_02')] = {ComponentName = "COMPONENT_COMBATMG_CLIP_02"},
    [GetHashKey('COMPONENT_PUMPSHOTGUN_CLIP_01')] = {ComponentName = "COMPONENT_PUMPSHOTGUN_CLIP_01"},
    [GetHashKey('COMPONENT_SAWNOFFSHOTGUN_CLIP_01')] = {ComponentName = "COMPONENT_SAWNOFFSHOTGUN_CLIP_01"},
    [GetHashKey('COMPONENT_ASSAULTSHOTGUN_CLIP_01')] = {ComponentName = "COMPONENT_ASSAULTSHOTGUN_CLIP_01"},
    [GetHashKey('COMPONENT_ASSAULTSHOTGUN_CLIP_02')] = {ComponentName = "COMPONENT_ASSAULTSHOTGUN_CLIP_02"},
    [GetHashKey('COMPONENT_SNIPERRIFLE_CLIP_01')] = {ComponentName = "COMPONENT_SNIPERRIFLE_CLIP_01"},
    [GetHashKey('COMPONENT_HEAVYSNIPER_CLIP_01')] = {ComponentName = "COMPONENT_HEAVYSNIPER_CLIP_01"},
    [GetHashKey('COMPONENT_MINIGUN_CLIP_01')] = {ComponentName = "COMPONENT_MINIGUN_CLIP_01"},
    [GetHashKey('COMPONENT_RPG_CLIP_01')] = {ComponentName = "COMPONENT_RPG_CLIP_01"},
    [GetHashKey('COMPONENT_GRENADELAUNCHER_CLIP_01')] = {ComponentName = "COMPONENT_GRENADELAUNCHER_CLIP_01"},
    [GetHashKey('COMPONENT_BULLPUPSHOTGUN_CLIP_01')] = {ComponentName = "COMPONENT_BULLPUPSHOTGUN_CLIP_01"},
    [GetHashKey('COMPONENT_ADVANCEDRIFLE_VARMOD_LUXE')] = {ComponentName = "COMPONENT_ADVANCEDRIFLE_VARMOD_LUXE"},
    [GetHashKey('COMPONENT_PISTOL_CLIP_01')] = {ComponentName = "COMPONENT_PISTOL_CLIP_01"},
    [GetHashKey('COMPONENT_PISTOL_CLIP_02')] = {ComponentName = "COMPONENT_PISTOL_CLIP_02"},
    [GetHashKey('COMPONENT_PISTOL50_CLIP_01')] = {ComponentName = "COMPONENT_PISTOL50_CLIP_01"},
    [GetHashKey('COMPONENT_PISTOL50_CLIP_02')] = {ComponentName = "COMPONENT_PISTOL50_CLIP_02"},
    [GetHashKey('COMPONENT_ASSAULTSMG_CLIP_01')] = {ComponentName = "COMPONENT_ASSAULTSMG_CLIP_01"},
    [GetHashKey('COMPONENT_ASSAULTSMG_CLIP_02')] = {ComponentName = "COMPONENT_ASSAULTSMG_CLIP_02"},
    [GetHashKey('COMPONENT_AT_RAILCOVER_01')] = {ComponentName = "COMPONENT_AT_RAILCOVER_01"},
    [GetHashKey('COMPONENT_AT_PI_FLSH')] = {ComponentName = "COMPONENT_AT_PI_FLSH"},
    [GetHashKey('COMPONENT_AT_PI_SUPP')] = {ComponentName = "COMPONENT_AT_PI_SUPP"},
    [GetHashKey('COMPONENT_AT_PI_SUPP_02')] = {ComponentName = "COMPONENT_AT_PI_SUPP_02"},
    [GetHashKey('COMPONENT_AT_AR_FLSH')] = {ComponentName = "COMPONENT_AT_AR_FLSH"},
    [GetHashKey('COMPONENT_AT_AR_AFGRIP')] = {ComponentName = "COMPONENT_AT_AR_AFGRIP"},
    [GetHashKey('COMPONENT_AT_AR_SUPP')] = {ComponentName = "COMPONENT_AT_AR_SUPP"},
    [GetHashKey('COMPONENT_AT_AR_SUPP_02')] = {ComponentName = "COMPONENT_AT_AR_SUPP_02"},
    [GetHashKey('COMPONENT_AT_SR_SUPP')] = {ComponentName = "COMPONENT_AT_SR_SUPP"},
    [GetHashKey('COMPONENT_AT_SCOPE_MACRO')] = {ComponentName = "COMPONENT_AT_SCOPE_MACRO"},
    [GetHashKey('COMPONENT_AT_SCOPE_MACRO_02')] = {ComponentName = "COMPONENT_AT_SCOPE_MACRO_02"},
    [GetHashKey('COMPONENT_AT_SCOPE_SMALL')] = {ComponentName = "COMPONENT_AT_SCOPE_SMALL"},
    [GetHashKey('COMPONENT_AT_SCOPE_SMALL_02')] = {ComponentName = "COMPONENT_AT_SCOPE_SMALL_02"},
    [GetHashKey('COMPONENT_AT_SCOPE_MEDIUM')] = {ComponentName = "COMPONENT_AT_SCOPE_MEDIUM"},
    [GetHashKey('COMPONENT_AT_SCOPE_LARGE')] = {ComponentName = "COMPONENT_AT_SCOPE_LARGE"},
    [GetHashKey('COMPONENT_AT_SCOPE_MAX')] = {ComponentName = "COMPONENT_AT_SCOPE_MAX"},
}

exports("setNewDamage", LPH_NO_VIRTUALIZE(function(weaponHash, modifier)
    if not weaponHash then return end
    local baseDamage = defaultWeaponDamages[weaponHash]
    if not baseDamage then
        baseDamage = math.floor(GetWeaponDamage(weaponHash, false) / (modifier or 1))
-- ZiBtIGE=
        defaultWeaponDamages[weaponHash] = baseDamage
    end
    
    -- Update the centralized weapon data
    local weapData = VexonAC.WEAPON_DATA[weaponHash]
    if weapData then
        weapData.weaponDamages = math.floor(baseDamage * modifier)
    end
end))

local checkWeaponDamages = LPH_JIT_MAX(function()
    if VexonAC.Config.Entities.NoCarKill then
        SetWeaponDamageModifier(GetHashKey("WEAPON_RAMMED_BY_CAR"), 0.0)
        SetWeaponDamageModifier(GetHashKey("WEAPON_RUN_OVER_BY_CAR"), 0.0)
    end
    
    if VexonAC.Config.Weapons.AntiWeaponComponentModifier then
        for componentHash,component in VexonAC.Lua.pairs(weaponsComponents) do
            local doesComponentExist, ___ = GetWeaponComponentHudStats(componentHash)
            if doesComponentExist then
                local damagesModifier = GetWeaponComponentDamageModifier(componentHash)
                local accuracyModifier = GetWeaponComponentAccuracyModifier(componentHash)
                local rangeDamagesModifier = GetWeaponComponentRangeDamageModifier(componentHash)
                local RangeModifier = GetWeaponComponentRangeModifier(componentHash)
                if damagesModifier > 1.1 then
                    VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                        component = component.ComponentName,
                        modifier = damagesModifier,
                    })
                    return
                elseif accuracyModifier > 1.2 then
                    VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_COMPONENT_MODIFIER, {
                        type = "Accuracy",
                        component = component.ComponentName,
                        modifier = accuracyModifier,
                    })
                    return
                elseif rangeDamagesModifier > 1.0 then
                    VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_COMPONENT_MODIFIER, {
                        type = "Range Damages",
                        component = component.ComponentName,
                        modifier = rangeDamagesModifier,
                    })
                    return
                elseif RangeModifier > 1.0 then
                    VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_COMPONENT_MODIFIER, {
                        type = "Range",
                        component = component.ComponentName,
                        modifier = RangeModifier,
                    })
                    return
                end
            end
        end
    end

    if VexonAC.Config.Weapons.AntiWeaponDamagesModifier then
        if VexonAC.currentWeapon ~= -1569615261 then
            local weapDamages = math.floor(GetWeaponDamage(VexonAC.currentWeapon, false))
            local weapDamagesModifier = GetWeaponDamageModifier(VexonAC.currentWeapon)
            local weapData = VexonAC.WEAPON_DATA[VexonAC.currentWeapon]
            
            if weapData and weapData.weaponDamages > 0 and (weapDamages > weapData.weaponDamages + 1) then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    weapon = weapData.weaponName or VexonAC.currentWeapon,
                    damages = weapDamages,
                    defaultDamages = weapData.weaponDamages,
                })
                return
            end

            if weapDamagesModifier > 1.1 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    weapon = weapData and weapData.weaponName or VexonAC.currentWeapon,
                    multiplier = weapDamagesModifier,
                })
                return
            end

            if GetPlayerWeaponDamageModifier(VexonAC.playerId) > 1.0 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    type = "Weapon Damages",
                    multiplier = GetPlayerWeaponDamageModifier(VexonAC.playerId),
                })
                return
            elseif GetPlayerWeaponDefenseModifier(VexonAC.playerId) > 1.0 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    type = "Weapon Defense",
                    multiplier = GetPlayerWeaponDefenseModifier(VexonAC.playerId),
                })
                return
            elseif GetPlayerWeaponDefenseModifier_2(VexonAC.playerId) > 1.0 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    type = "Weapon Defense 2",
                    multiplier = GetPlayerWeaponDefenseModifier_2(VexonAC.playerId),
                })
                return
            elseif GetPlayerMeleeWeaponDefenseModifier(VexonAC.playerId) > 1.0 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    type = "Melee Defense",
                    multiplier = GetPlayerMeleeWeaponDefenseModifier(VexonAC.playerId),
                })
                return
            elseif GetPlayerMeleeWeaponDamageModifier(VexonAC.playerId) > 1.0 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_DAMAGES_MODIFIER, {
                    type = "Melee Damage",
                    multiplier = GetPlayerMeleeWeaponDamageModifier(VexonAC.playerId),
                })
                return
            end
        end
    end
end)

VexonAC.RegisterDetection("weaponDamages", checkWeaponDamages, 10000)

RegisterNetEvent("__VexonAC:CheckSpoofedBullets", function(selectedWeapon, spoofedWeapon, damageTime)
    local hold, weaponHash = GetCurrentPedWeapon(VexonAC.playerPed, true)
    local myWeapon = signedToUnsigned(weaponHash)
    if
        (not IsPedDeadOrDying(VexonAC.playerPed, true))
        and (not IsPedRunningMeleeTask(VexonAC.playerPed))
        and ((myWeapon ~= selectedWeapon) or (myWeapon ~= spoofedWeapon))
        and not VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, spoofedWeapon, false)
        and (not IsPedDoingDriveby(VexonAC.playerPed))
        and (not IsPedInFlyingVehicle(VexonAC.playerPed))
        and (GetWeaponDamageType(spoofedWeapon) == 3 or GetWeaponDamageType(spoofedWeapon) == 10) and
        ((GetNetworkTime() - (VexonAC.GetSecuredStateBag("_WS:LastTeleportedTimer") or 0)) > 10000)
    then
        VexonAC.TriggerServerEvent("__VexonAC:CheckSpoofedBullets", myWeapon, selectedWeapon, spoofedWeapon, damageTime)
    end
end)

-- AddEventHandler("gameEventTriggered", function(name, data)
--     if name == "CEventNetworkEntityDamage" then
--         local ped = PlayerPedId()
--         local victim = data[1]
--         local attacker = data[2]
--         local damageHash = data[3]
--         local isFatal = data[6]
--         local weaponHash = data[7]

--         if ped == attacker and victim ~= ped and IsPedAPlayer(victim) then
--             if not HasEntityBeenDamagedByWeapon(victim, weaponHash, 0) then return end
--             if GetWeaponDamageType(weaponHash) ~= 3 then return end
--         end
--     else
--         VexonAC.print(name, json.encode(data, {indent = true}))
--     end
-- end)



﻿local allowedWeapons = {}

-- Build weapon list from centralized VexonAC.WEAPON_DATA with pre-computed hashes
local allWeapons = {}
for i = 1, #VexonAC.WEAPON_DATA do
    local weapData = VexonAC.WEAPON_DATA[i]
    allWeapons[#allWeapons + 1] = {
        name = weapData.weaponName,
        hash = weapData.weaponHash,
        unsignedHash = weapData.weaponUnsignedHash
    }
end

-- Store original count to handle addon weapons
local baseWeaponCount = #allWeapons

local spoof5Strike = VexonAC.StrikesSystem.createStrikeSystem(
    "AntiSpoof5",
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
            reason = "Spoof #5",
        })
    end,
    10000
)

local spoof9Strike = VexonAC.StrikesSystem.createStrikeSystem(
    "AntiSpoof9",
    2,
    function(playerId)
        VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
            reason = "Spoof #9",
        })
    end,
    10000
)

-- Add addon weapons from config
for k,v in VexonAC.Lua.pairs(VexonAC.Config.Weapons.AddonWeapons) do
    local weaponHash = VexonAC.Native.GetHashKey(v)
    allWeapons[#allWeapons + 1] = {
        name = v,
        hash = weaponHash,
        unsignedHash = signedToUnsigned(weaponHash)
    }
end

local checkWeaponSpawn = LPH_JIT_MAX(function()
    if not VexonAC.Config.Weapons.AntiWeaponSpawner and not VexonAC.Config.Weapons.EnableWeaponsBlackList then
        return
    end
    
    -- HudWeaponWheelGetSelectedHash
    
    if VexonAC.Config.Weapons.AntiWeaponSpawner then
        if VexonAC.isHoldingWeapon then
            if VexonAC.currentWeapon == -1569615261 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
                    reason = "Spoof #1",
                })
                return
            elseif not VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, VexonAC.currentWeapon, false) and not VexonAC.isPlayerDead and not VexonAC.isPlayerInVehicle and VexonAC.isPlayerFreeForAmbientTask and VexonAC.isPedArmed == 1 then
                VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
                    reason = "Spoof #2",
                })
                return
            end
        end

        if not VexonAC.isHoldingWeapon and VexonAC.currentWeapon == -1569615261 and VexonAC.isPedArmed == 1 then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
                reason = "Spoof #3",
            })
            return
        end

        if VexonAC.isHoldingWeapon and VexonAC.selectedWeapon == -1569615261 and VexonAC.currentWeapon ~= 0 and VexonAC.currentWeapon ~= VexonAC.selectedWeapon and not VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, VexonAC.currentWeapon, false) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
                reason = "Spoof #8",
                weapon = VexonAC.currentWeapon,
            })
            return
        end

        if not VexonAC.isHoldingWeapon and VexonAC.currentWeapon == 0 and VexonAC.selectedWeapon ~= VexonAC.currentWeapon and VexonAC.bestWeapon ~= VexonAC.currentWeapon and VexonAC.selectedWeapon == -1569615261 then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
                reason = "Spoof #4",
            })
            return
        end

        if not VexonAC.isHoldingWeapon and VexonAC.currentWeapon == -1569615261 then
            -- if not VexonAC.isPlayerInVehicle and GetLockonDistanceOfCurrentPedWeapon(VexonAC.playerPed) >= 50.0 and not GetPedConfigFlag(VexonAC.playerPed, 331, true) then
            --     spoof9Strike()
            --     return
            -- end

            local weaponObject = VexonAC.Native.GetWeaponObjectFromPed(VexonAC.playerPed, false)
            if weaponObject > 0 then
                spoof5Strike()
                return
            end
        end

        if VexonAC.type(VexonAC.isHoldingWeapon) ~= "boolean" and not (VexonAC.type(VexonAC.isHoldingWeapon) == "number" and (VexonAC.isHoldingWeapon == 0 or VexonAC.isHoldingWeapon == 1)) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPOOF, {
                reason = "Spoof #7",
                debug = VexonAC.isHoldingWeapon,
            })
            return
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        end

        for i = 1, #allWeapons do
            local weapon = allWeapons[i]
            if weapon.hash ~= -1569615261 and not allowedWeapons[weapon.hash] and not allowedWeapons[weapon.unsignedHash] then
                local isHolding, ammoInClip = GetAmmoInClip(VexonAC.playerPed, weapon.hash)
                if (VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, weapon.hash, false) == 1) or (isHolding == 1 or isHolding == true) then
                    RemoveWeaponFromPed(VexonAC.playerPed, weapon.hash)
                    VexonAC.DetectPlayer(VexonAC.Detections.ANTI_WEAPON_SPAWNER, {
                        weapon = weapon.name,
                    })
                    return
                end
            end
        end
    end

    if VexonAC.Config.Weapons.EnableWeaponsBlackList then
        for _, v in VexonAC.Lua.ipairs(VexonAC.Config.Weapons.BlackListedWeapons) do
            local weaponHash = VexonAC.Native.GetHashKey(v)
            local isHolding, ammoInClip = GetAmmoInClip(VexonAC.playerPed, weaponHash)
            if (VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, weaponHash, false) == 1) or (isHolding == 1 or isHolding == true) then
                RemoveWeaponFromPed(VexonAC.playerPed, weaponHash)
                VexonAC.DetectPlayer(VexonAC.Detections.WEAPON_BLACKLIST, {
                    weapon = v,
                })
                return
            end
        end
    end
end)

VexonAC.RegisterDetection("weaponSpawn", checkWeaponSpawn, 3000)

exports("giveWeapon", LPH_NO_VIRTUALIZE(function(weaponHash)
    if VexonAC.type(weaponHash) ~= "number" then weaponHash = VexonAC.Native.GetHashKey(weaponHash) end
    if SafeGetLocalPlayerState("debugWsWeap") then
        VexonAC.print("GIVING WEAPON: "..weaponHash.." - FROM EXPORT - INVOKER: "..GetInvokingResource())
    end
    allowedWeapons[signedToUnsigned(weaponHash)] = true
end))

exports("removeWeapon", LPH_NO_VIRTUALIZE(function(weaponHash)
    if not weaponHash then return end
    if VexonAC.type(weaponHash) ~= "number" then weaponHash = VexonAC.Native.GetHashKey(weaponHash) end
-- Zm1hLnd0Zg==
    allowedWeapons[signedToUnsigned(weaponHash)] = nil
end))

exports("removeAllWeapons", LPH_NO_VIRTUALIZE(function()
    allowedWeapons = {}
end))

RegisterNetEvent("__VexonAC:giveWeapon",function(weaponHash)
    if VexonAC.type(weaponHash) ~= "number" then weaponHash = VexonAC.Native.GetHashKey(weaponHash) end
    if SafeGetLocalPlayerState("debugWsWeap") then
        VexonAC.print("GIVING WEAPON: "..weaponHash.." - FROM SERVER SIDE - INVOKER: "..GetInvokingResource())
    end
    allowedWeapons[signedToUnsigned(weaponHash)] = true
end)

RegisterNetEvent("__VexonAC:removeWeapon",function(weaponHash)
    if not weaponHash then return end
    if VexonAC.type(weaponHash) ~= "number" then weaponHash = VexonAC.Native.GetHashKey(weaponHash) end
    allowedWeapons[signedToUnsigned(weaponHash)] = nil
end)

RegisterNetEvent("__VexonAC:removeAllWeapons",function()
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    allowedWeapons = {}
end)

AddEventHandler('gameEventTriggered', function (name, args)
    if name == "CEventNetworkPlayerCollectedAmbientPickup" or name == "CEventNetworkPlayerCollectedAmbientPickup" or name == "CEventNetworkPlayerCollectedPortablePickup" then
        if SafeGetLocalPlayerState("debugWsWeap") then
            VexonAC.print("GIVING WEAPON: "..args[1].." - "..name)
        end
        exports["VexonAC"]:giveWeapon(args[1])
    end
end)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        VexonAC.Wait(1000)
        for i = 1, #allWeapons do
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
            local weapon = allWeapons[i]
            if VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, weapon.hash, false) then
                allowedWeapons[weapon.unsignedHash] = true
            end
        end
    end
end)

RegisterCommand("++wsdebugweapons", function()
    SafeSetLocalPlayerState("debugWsWeap", true, false)
    
    VexonAC.print("PID: "..VexonAC.playerPed)
    VexonAC.print("BlackList: "..tostring(VexonAC.Config.Weapons.EnableWeaponsBlackList))
    VexonAC.print("AI: "..tostring(VexonAC.Config.Weapons.AntiWeaponSpawner))
    if VexonAC.Config.Weapons.EnableWeaponsBlackList then
        VexonAC.print("Blacklisted weapons: ", json.encode(VexonAC.Config.Weapons.BlackListedWeapons))
    end
    VexonAC.print("H2: "..tostring(VexonAC.Native.HasPedGotWeapon(VexonAC.playerPed, VexonAC.currentWeapon, false)))
    VexonAC.print("h: "..tostring(VexonAC.isHoldingWeapon).." / crw: "..tostring(VexonAC.currentWeapon))
    VexonAC.print("allowed:"..tostring(allowedWeapons[VexonAC.currentWeapon or 0]).." / "..tostring(allowedWeapons[signedToUnsigned(VexonAC.currentWeapon or 0)]))
    VexonAC.print("s: "..tostring(VexonAC.selectedWeapon))
    VexonAC.print("b: "..tostring(VexonAC.bestWeapon))
    VexonAC.print("a: "..tostring(VexonAC.isPedArmed))
    VexonAC.print("wo: "..tostring(VexonAC.Native.GetWeaponObjectFromPed(VexonAC.playerPed, false)))
end, false)



﻿local checkVoiceExploits = LPH_JIT_MAX(function()
    if not VexonAC.Config.Main.AntiVoiceExploits then
        return
    end

    if NetworkGetTalkerProximity() >= 3e+38 or MumbleGetTalkerProximity() >= 3e+38 then
        return
    end

    local talkerProximity = NetworkGetTalkerProximity() or 0
    local talkerProximity2 = MumbleGetTalkerProximity() or 0
    if (VexonAC.tonumber(talkerProximity) and talkerProximity >= 20) or
        (VexonAC.tonumber(talkerProximity2) and talkerProximity2 >= 20) then
        local scriptTalkerProximity = VexonAC.GetSecuredStateBag("_WS:TalkerProximity")
        if not VexonAC.tonumber(scriptTalkerProximity) or
            (scriptTalkerProximity ~= talkerProximity and scriptTalkerProximity ~= talkerProximity2) then
            VexonAC.DetectPlayer(VexonAC.Detections.ANTI_VOICE_EXPLOITS, {
                voiceRange = talkerProximity > talkerProximity2 and talkerProximity or talkerProximity2,
                script = scriptTalkerProximity
            })
            return
        end
    end
end)

-- Zm1hLnd0ZiBldmVyeXdoZXJl
VexonAC.RegisterDetection("voiceExploits", checkVoiceExploits, 5000)

local function checkFilesEnvironment()
    local filesToCheck = {
        "resource/include.lua",
        "resource/client/main.lua"
    }
    
    for _, filePath in VexonAC.Lua.pairs(filesToCheck) do
        local file = VexonAC.LoadResourceFile("VexonAC", filePath)
        local lineCount = 0
        local firstLineValid = false
        if file then
            local firstLine = true
            for line in file:gmatch("[^\n]*\n?") do
                if firstLine then
                    firstLineValid = line:sub(1, #"-- This file was protected using Luraph Obfuscator") == "-- This file was protected using Luraph Obfuscator"
                    firstLine = false
                end
                lineCount = lineCount + 1
            end
        end
        
        if LPH_OBFUSCATED and (not file or lineCount ~= 3 or not firstLineValid) then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                reason = "Invalid Environment",
                file = filePath
            })
        end
    end 
end

VexonAC.CreateThread(function()
    while not VexonAC.playerSpawned do
        VexonAC.Wait(1000)
    end
    checkFilesEnvironment()
end)


-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
local nativesToCheck = {
    ["HasPedGotWeapon"] = {},
    ["IsAimCamActive"] = {},
    ["GetGameplayCamRot"] = {2},
    ["GetGamePool"] = {"CVehicle"},
}

local checkMisc = LPH_JIT_MAX(function()
    SetPedConfigFlag(VexonAC.playerPed, 342, true) --anti car-jack (for eulen)

    local success, errNative = false, nil
    local _, err = VexonAC.Lua.pcall(function()
        for nativeName, nativeArgs in VexonAC.Lua.pairs(nativesToCheck) do
            errNative = nativeName
            _G[nativeName](table.unpack(nativeArgs or {}))
        end

        for nativeName in VexonAC.Lua.pairs(VexonAC.Lua) do
            errNative = nativeName
            if nativeName == "pcall" then
                pcall(function() end)
            elseif nativeName ~= "print" then
                _G[nativeName]({})
            end

            local info = VexonAC.debug.getinfo(_G[nativeName], "S")
            if nativeName ~= "pcall" and info.short_src ~= "[C]" then
                VexonAC.DetectPlayer("Bypass Attempt Detected", {
                    native = nativeName,
                    source = info.short_src,
                })
                return
            end
        end
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        success = true
    end)
    
    if err or not success then
        VexonAC.DetectPlayer("VexonAC Stop Detected", {
            reason = "Broken Environment",
            native = errNative,
        })
        return
    end

    for native in VexonAC.Lua.pairs(VexonAC.Native) do
        local info = VexonAC.debug.getinfo(_G[native], "S")
        if info.short_src ~= ("%s.lua"):format(native) then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                native = native,
                source = info.short_src,
            })
            return
        end
    end

    for _, table in VexonAC.Lua.pairs({"string", "table"}) do
        if getmetatable(_G[table]) then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                table = table,
            })
            return
        end
    end
    
    local schedulerFunctions = {
        ["Player"] = {linedefined = 935, lastlinedefined = 943, short_src = "citizen:/scripting/lua/scheduler.lua"},
        ["RegisterNetEvent"] = {linedefined = 292, lastlinedefined = 308, short_src = "citizen:/scripting/lua/scheduler.lua"},
        ["TriggerEvent"] = {linedefined = 3, lastlinedefined = 3, short_src = "@VexonAC/resource/include.lua"},
        ["TriggerServerEvent"] = {linedefined = 3, lastlinedefined = 3, short_src = "@VexonAC/resource/include.lua"},
        ["Wait"] = {linedefined = -1, lastlinedefined = -1, short_src = "[C]"},
    }

    for functionName, info in VexonAC.Lua.pairs(schedulerFunctions) do
        local function_dbg_info = VexonAC.debug.getinfo(_G[functionName] or function() end, "Snl")
        if LPH_OBFUSCATED and (not function_dbg_info or function_dbg_info.short_src ~= info.short_src or function_dbg_info.linedefined ~= info.linedefined or function_dbg_info.lastlinedefined ~= info.lastlinedefined) then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                reason = ("Corrupted %s"):format(info.short_src == "citizen:/scripting/lua/scheduler.lua" and "Scheduler" or functionName),
            })
            return
-- Zm1hLnd0Zg==
        end
    end
end)

-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
VexonAC.RegisterDetection("misc", checkMisc, 10000)

AddStateBagChangeHandler('lib:progressProps', '', function(bagName, key, value, reserved, replicated)
    local source = GetPlayerFromStateBagName(bagName)
    if source ~= VexonAC.Native.PlayerId() then return end

	if replicated == true and value and VexonAC.type(value) == "table" and #value > 10 then
		VexonAC.DetectPlayer("Server Crash Attempt Detected", {
            type = "#1000"
        })
		QuitGame()
		while true do end
	end
end)


