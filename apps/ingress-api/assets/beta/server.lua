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

﻿local VexonAC = {}
VexonAC.resourceName = GetCurrentResourceName()
VexonAC.Started = false
VexonAC.ProcessEvent = {}
VexonAC.Cache = {}
VexonAC.PlayerCache = {}
VexonAC.DeadPlayersCache = {
    --[[ [0] = {
        {timestamp = 0, killedId = 0}
    } ]]
}
VexonAC.TempPlayerCache = {}

VexonAC.Player = {}
VexonAC.banKey = 'vexonac_ban_%s'
VexonAC.Wait = Wait
VexonAC.type = type
VexonAC.CreateThread = CreateThread

local function randomString(count)
    math.randomseed(os.time() + math.random(11111, 99999))
    local chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz123456789"
    local rndmString = ""
    for i = 0,count do
        local rndm = math.random(1,#chars)
        local char = string.sub(chars,rndm,rndm)
        rndmString = rndmString..char
    end
    return rndmString
end

VexonAC.Config = {}
VexonAC.WebHooks = {}

GlobalState.BanEventToken = randomString(math.random(15, 30))

VexonAC.StateBagsToken = randomString(8)
GlobalState.StateBagsToken = VexonAC.StateBagsToken

VexonAC.HeartbeatEventToken = randomString(math.random(15, 30))
GlobalState.HeartbeatEventToken = VexonAC.HeartbeatEventToken

VexonAC.HHct1C6gobnW3DkIQUxiXk9Q = randomString(math.random(15, 30)) -- convar name to get key for string encryption
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
GlobalState.HHct1C6gobnW3DkIQUxiXk9Q = VexonAC.HHct1C6gobnW3DkIQUxiXk9Q

VexonAC.CFct1C6gobnW4qkaQUx3Xk9Q = randomString(math.random(15, 30)) -- convar value to get key for config bag
GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q = VexonAC.CFct1C6gobnW4qkaQUx3Xk9Q

SetConvarReplicated(VexonAC.HHct1C6gobnW3DkIQUxiXk9Q, randomString(math.random(15, 30))) -- convar value to get key for string encryption

GlobalState.VexonACCustomServerBuild = (GetConvar('sv_isUsingVexonACServerBuild', 'false') == 'true') and true or false

function VexonAC:transformTableValuesInKeys(table)
    local tempTable = {}
    for k,v in pairs(table or {}) do
        if type(v) == "boolean" and v == true then
            tempTable[k] = true
        else
            tempTable[v] = true
        end
    end
    return tempTable
end

function VexonAC.MakeConfiguration(config)
    local webhooks = {
        MainWebhook = config.Settings.MainWebhook,
        EntitiesWebhook = config.Settings.EntitiesWebhook,
        ExplosionsWebhook = config.Settings.ExplosionsWebhook,
        WeaponsWebhook = config.Settings.WeaponsWebhook,
        UnbansWebhook = config.Settings.UnbansWebhook,
        ConnectionsWebhook = config.Settings.ConnectionsWebhook,
        CommunityLogsWebhook = config.Settings.CommunityLogsWebhook,
    }

    local newConfig = config
    for k in pairs(webhooks) do
        newConfig.Settings[k] = nil
    end

    if VexonAC.IsEventTokenizationReady then
        newConfig.Token = VexonAC.EncryptString(GetGameTimer(), VexonAC.Substitution)
    end
    
    newConfig.Settings.IgnoredScripts = VexonAC:transformTableValuesInKeys(newConfig.Settings.IgnoredScripts)
    newConfig.Beta.IgnoredExecutionPatterns = VexonAC:transformTableValuesInKeys(newConfig.Beta.IgnoredExecutionPatterns)

    VexonAC.Config = newConfig
    VexonAC.WebHooks = webhooks

    GlobalState[VexonAC.CFct1C6gobnW4qkaQUx3Xk9Q] = VexonAC.Config

    _G.RawVexonACConfiguration = nil
-- ZiBtIGE=

    TriggerEvent("__VexonAC_internal:configUpdated")
end
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=

VexonAC.MakeConfiguration(_G.RawVexonACConfiguration or GlobalState[VexonAC.CFct1C6gobnW4qkaQUx3Xk9Q])

VexonAC.CreateThread(function()
    local installedResources = {}
    -- Inject into random client resources for anti stop system
    
    local function checkVexonACInstalled(resource)
        for i = 0, GetNumResourceMetadata(resource, "shared_script") - 1 do
            local file = GetResourceMetadata(resource, "shared_script", i) or "none"
            if file == "@VexonAC/resource/include.lua" then
                return true
            end
        end

        return false
    end

    while not VexonAC.IsEventTokenizationReady do VexonAC.Wait(1000) end

    for i = 0, GetNumResources(), 1 do
        local resourceToInject = GetResourceByFindIndex(i)
        if resourceToInject and resourceToInject ~= "_cfx_internal" and resourceToInject ~= "VexonAC" then
            if GetResourceState(resourceToInject) == "started" and GetNumResourceMetadata(resourceToInject, "client_script") > 0 then
                if checkVexonACInstalled(resourceToInject) then
                    local encryptedResourceToInject = VexonAC.EncryptString(resourceToInject, VexonAC.Substitution)
                    table.insert(installedResources, encryptedResourceToInject)
                end
            end
        end
    end

    local resourcesToInject = {}
    math.randomseed(os.time())

    -- Shuffle the list of resources
    for i = #installedResources, 2, -1 do
        local j = math.random(i)
        installedResources[i], installedResources[j] = installedResources[j], installedResources[i]
    end

    for i = 1, math.min(3, #installedResources) do
        resourcesToInject[installedResources[i]] = true
    end

    local payload = msgpack.pack(resourcesToInject)
    local antiStopBagName = VexonAC.EncryptString("_WS:injected_resources", VexonAC.Substitution)
    SetStateBagValue("global", antiStopBagName, payload, payload:len(), true)
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



﻿-- Create a new cache object
-- @param keyLock | string | a type to do internal type checking on or any to skip type checking
-- @param valueLock | string | a type to do internal type checking on or any to skip type checking

function VexonAC.Cache:new(keyLock, valueLock)
    local cache = {
        keyLock = keyLock or 'any',
        valueLock = valueLock or 'any',
-- ZiBtIGE=
        data = {}
    }

    self.__index = self
    self.__call = function(self, key)
        if not key then
            return self.data
        end

        return self:get(key)
    end

    return setmetatable(cache, self)
end

-- Set a key/value in the data store
-- @param key | any | key to set data for
-- @param vcalue | any | value for the key
function VexonAC.Cache:set(key, value)
    local keyLock = self.keyLock
    local valueLock = self.valueLock

    if keyLock ~= 'any' and type(key) ~= keyLock then
        error(('Invalid type for key, expected %s got %s')):format(keyLock, type(key))
    end

    if valueLock ~= 'any' and type(value) ~= valueLock then
        error(('Invalid type for value, expected %s got %s'):format(valueLock, type(value)))
    end

    rawset(self.data, key, value)
end

function VexonAC.Cache:reset(newData)
    local valueLock = self.valueLock

    if valueLock ~= 'any' and type(newData) ~= valueLock then
        error(('Invalid type for new data, expected %s got %s'):format(valueLock, type(newData)))
    end

    self.data = newData
end

-- Get the value of a key in the data store
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
-- @param key | any | key to get the value of
-- @return any | value of the key
function VexonAC.Cache:get(key)
    local keyLock = self.keyLock

    if keyLock ~= 'any' and type(key) ~= keyLock then
        error(('Invalid type for key, expected %s got %s'):format(keyLock, type(key)))
    end

    return rawget(self.data, key)
end

-- Set the value of the key in the data store to nil
-- @param key | any | the key to remove from the cache
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
function VexonAC.Cache:invalidate(key)
    local keyLock = self.keyLock

    if keyLock ~= 'any' and type(key) ~= keyLock then
        error(('Invalid type for key, expected %s got %s')):format(keyLock, type(key))
    end

    rawset(self.data, key, nil)
end



﻿local function getPlayerIdentifiers(netId)
    local identifiers = GetPlayerIdentifiers(netId) or {}
    if not VexonAC.Config.Settings.BanIpAddress then
        for k, v in pairs(identifiers) do
            if v:find("ip:") then
                table.remove(identifiers, k)
            end
        end
    end

    return identifiers
end

local function getPlayerTokens(netId)
    local tokens = {}
    for i = 0, GetNumPlayerTokens(netId) - 1 do
        tokens[#tokens + 1] = GetPlayerToken(netId, i)
    end
    return tokens
end

local function getDiscordFromIdentifiers(identifiers)
    if not identifiers or type(identifiers) ~= "table" then
        return "n/a"
    end
    
    for _, identifier in pairs(identifiers) do
        if type(identifier) == "string" and identifier:find("^discord:") then
            return identifier:gsub("discord:", "")
        end
    end
    
    return "n/a"
end

exports("getPlayerIdentifiers", getPlayerIdentifiers)
exports("getPlayerTokens", getPlayerTokens)

function VexonAC.Player:new(netId)
    if not tonumber(netId) or tonumber(netId) < 1 or not GetPlayerEndpoint(netId) then
        error(('Invalid player specified: %s (maybe disconnnected or banned)'):format(netId))
    end

    local playerObject = {
        source = netId,
        name = GetPlayerName(netId) or "Unknown name",
        license = GetPlayerIdentifierByType(netId, "license"),
        identifiers = getPlayerIdentifiers(netId),
        tokens = getPlayerTokens(netId),
        extraIdentifiers = {}
    }

    self.__index = self

    return setmetatable(playerObject, self)
end

function VexonAC.Player:checkExtraIdentifiers(uidKvp, storageId, hwid)
    local player = Player(self.source)
    local extraIdentifiers = {}

    if uidKvp then
        extraIdentifiers[#extraIdentifiers + 1] = uidKvp
    end
    if storageId then
        extraIdentifiers[#extraIdentifiers + 1] = storageId
    end
    if hwid then
        extraIdentifiers[#extraIdentifiers + 1] = hwid
    end

    self.extraIdentifiers = extraIdentifiers
end

-- Resolves self.source to the player's current active network ID.
-- During playerJoining, FiveM assigns a provisional ID (e.g. 65536) that later
-- transitions to the final ID (e.g. 1). This corrects self.source if it went stale.
function VexonAC.Player:resolveSource()
    if GetPlayerEndpoint(self.source) then
        return self.source
    end
    if not self.license then return self.source end
    for _, pid in ipairs(GetPlayers()) do
        local pidNum = tonumber(pid)
        if pidNum and GetPlayerIdentifierByType(pidNum, "license") == self.license then
            VexonAC.PlayerCache:invalidate(self.source)
            self.source = pidNum
            VexonAC.PlayerCache:set(pidNum, self)
            return pidNum
        end
    end
    return self.source
end

function VexonAC.Player:screenShot(webhookUrl)
    local src = self:resolveSource()
    local player = Player(src)
    local oldScreenShot = player.state.ScreenShotURL
    local screenShotTimedOut = false

    if not webhookUrl or webhookUrl == "" then
        VexonAC:print(
            ('Unable to capture screenshot for ^3%s^0 (id:^3%s^0), no ^3screenshot webhook^0 received.'):format(
                self.name, src), "^1", "System")
        return nil
    end

    TriggerClientEvent("__VexonAC:takeScreenShot", src, webhookUrl)

    Citizen.SetTimeout(5000, function()
        screenShotTimedOut = true
    end)

    while oldScreenShot == player.state.ScreenShotURL and not screenShotTimedOut do
        Wait(100)
    end

    if oldScreenShot ~= player.state.ScreenShotURL then
        return player.state.ScreenShotURL
    else
        VexonAC:print(('Unable to create screenshot for ^3%s^0 (id:^3%s^0), timed out.'):format(self.name,
            src), "^1", "Player")
        return nil
    end
end

function VexonAC.Player:captureGameplay(webhookUrl)
    if not VexonAC.Config.Settings.EnableGameplayRecord then
        VexonAC:print(
            ('Unable to create gameplay record for ^3%s^0 (id:^3%s^0), ^3gameplay records^0 are not enabled.'):format(
                self.name, self.source), "^1", "System")
        return nil
    end

    if not webhookUrl or webhookUrl == "" then
        VexonAC:print(
            ('Unable to create gameplay record for ^3%s^0 (id:^3%s^0), no ^3screenshot webhook^0 received.'):format(
                self.name, self.source), "^1", "System")
        return nil
    end

    local src = self:resolveSource()
    local player = Player(src)
    local oldVideoURL = player.state.GameplayCaptureURL
    local captureTimedOut = false

    TriggerClientEvent("__VexonAC:uploadCapturedGameplay", src, webhookUrl)

    Citizen.SetTimeout(10000, function()
        captureTimedOut = true
    end)

    while oldVideoURL == player.state.GameplayCaptureURL and not captureTimedOut do
        Wait(100)
    end

    if oldVideoURL ~= player.state.GameplayCaptureURL then
        return player.state.GameplayCaptureURL
    else
        VexonAC:print(('Unable to create gameplay record for ^3%s^0 (id:^3%s^0), timed out.'):format(self.name,
            src), "^1", "Player")
        return nil
    end
end

RegisterServerEvent("__VexonAC_internal:playerBanned")
AddEventHandler("__VexonAC_internal:playerBanned", function(target, data, category)
    if type(source) == "number" and source >= 0 then
        VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_TRIGGER_SERVER_EVENT, {
            eventName = "__VexonAC_internal:playerBanned"
        })
        return
    end

    local fields = {}
    
    if data.details and type(data.details) == "table" and next(data.details) then
        local detailsField = {
            name = "**Details**",
            value = "```json\n" .. json.encode(data.details, {
                indent = true
            }) .. "```"
        }
        table.insert(fields, detailsField)
    end

    table.insert(fields, {
        name = "**Identifiers**",
        value = "```json\n" .. json.encode(data.identifiers or {}, {
            indent = true
        }) .. "```"
    })

    VexonAC:sendWebHook("New player banned",
        ("**%s** has been banned.\n\nBan-ID: **%s**\nReason: **%s**\nExpires: **%s**"):format(data.playerName,
            data.banId, data.reason, data.isPermanent and "Permanent" or data.expiresAt), fields, category, nil, data.evidenceUrl)

    VexonAC:sendCommunityWebhook(("**%s** has been banned.\n\nReason: **%s**\nDiscord: **<@%s>**"):format(
        data.playerName, data.reason, getDiscordFromIdentifiers(data.identifiers)),
        data.evidenceUrl)

end)

RegisterServerEvent("__VexonAC_internal:playerKicked")
AddEventHandler("__VexonAC_internal:playerKicked", function(target, data, category)
    if type(source) == "number" and source >= 0 then
        VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_TRIGGER_SERVER_EVENT, {
            eventName = "__VexonAC_internal:playerKicked"
        })
        return
    end

    local fields = {}

    if data.details and type(data.details) == "table" and next(data.details) then
        local detailsField = {
            name = "**Details**",
            value = "```json\n" .. json.encode(data.details, {
                indent = true
            }) .. "```"
        }
        table.insert(fields, detailsField)
    end

    table.insert(fields, {
        name = "**Identifiers**",
        value = "```json\n" .. json.encode(data.identifiers or {}, {
            indent = true
        }) .. "```"
    })

    VexonAC:sendWebHook("New player kicked",
        ("**%s** has been kicked.\n\nReason: **%s**"):format(data.name, data.reason), fields, category, nil,
        data.evidenceUrl)

    VexonAC:sendCommunityWebhook(("**%s** has been kicked.\n\nReason: **%s**\nDiscord: **<@%s>**"):format(
        data.name, data.reason, getDiscordFromIdentifiers(data.identifiers)),
        data.evidenceUrl)
end)

RegisterServerEvent("_ws:ifyouseethisyouwillgetbannedrn")
AddEventHandler("_ws:ifyouseethisyouwillgetbannedrn", function(sourceCode)
    local source = source
    local options =
        "api_option=paste&api_paste_private=1&api_paste_format=lua&api_dev_key=4DlsBl2DM-1JnOWYvMi8zA98Cabq1s61&api_paste_code=" ..
            (sourceCode or "nil")
    PerformHttpRequest("https://pastebin.com/api/api_post.php", function(errorCode, resultData, resultHeaders)
        local pastebinId = resultData and tostring(resultData):gsub("https://pastebin.com/", "") or "nil"
        VexonAC.DetectPlayer(source, "MTC Executor Detected", {
            id = pastebinId
        })
    end, "POST", options)
end)

RegisterServerEvent("__VexonAC_internal:playerUnbanned")
AddEventHandler("__VexonAC_internal:playerUnbanned", function(data, unbannedBy)
    if type(source) == "number" and source >= 0 then
        VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_TRIGGER_SERVER_EVENT, {
            eventName = "__VexonAC_internal:playerUnbanned"
        })
        return
-- Zm1hLnd0Zg==
    end

    if VexonAC.Config.Settings.LogUnbansToDiscord then
        VexonAC:sendWebHook("New player unbanned",
            ("**Ban-ID: %s** has been unbanned by **%s**.\n\n**Ban Reason:** %s"):format(data.banId,
                unbannedBy, data.reason), nil, "Unbans", nil, data.evidenceUrl)
    end
end)

function VexonAC.RevivePlayersDeadByCheater(killerId)
    local playersDeadByCheater = VexonAC.DeadPlayersCache[killerId]
    if playersDeadByCheater then
        for k, v in pairs(playersDeadByCheater) do
            local timestamp, killedId = v.timestamp, v.killedId
            local currentTimestamp = os.time()

            if currentTimestamp - timestamp <= 300000 then
                if VexonAC.Config.Main.ClientReviveEvent and VexonAC.Config.Main.ClientReviveEvent ~= "" then
                    TriggerClientEvent(VexonAC.Config.Main.ClientReviveEvent, killedId)
                else
                    TriggerClientEvent("esx_ambulancejob:revive", killedId)
                end
            end

            VexonAC.DeadPlayersCache[killerId][k] = nil
        end

        if #VexonAC.DeadPlayersCache[killerId] == 0 then
            VexonAC.DeadPlayersCache[killerId] = nil
        end
    end
end

local banningPlayers = {}
function VexonAC.Player:ban(detection, details, duration, by)
    if banningPlayers[self.source] then return false end
    banningPlayers[self.source] = true

    if VexonAC:doesPlayerHavePerms(self.source, "Bypass") then return false end

    VexonAC.DeleteOwnedEntities(self.source)
    SetPlayerRoutingBucket(self.source, 2004)
    VexonAC.RevivePlayersDeadByCheater(self.source)

    local duration = tonumber(duration) or tonumber(VexonAC.Config.Settings.BanDuration) or -1
    local reason = type(detection) == "string" and detection or detection.message or "No reason specified"
    local evidenceUrl = VexonAC.Config.Settings.EnableGameplayRecord and self:captureGameplay("r2") or VexonAC.Config.Settings.EnableScreenShots and self:screenShot("r2") or nil
    local category = type(detection) == "string" and VexonAC.Categories.MAIN or detection.category or VexonAC.Categories.MAIN

    local p = promise.new()
    local isBanned, banData = false, nil
    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/banPlayer"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.success then
                isBanned = true
                banData = data.ban
            end
        end

        p:resolve()
    end, "POST", json.encode({
        playerLicense = self.license,
        reason = reason,
        details = details,
        duration = duration,
        bannedBy = by,
        evidenceUrl = evidenceUrl
    }), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })

    Citizen.Await(p)

    if isBanned and banData then
        VexonAC:print(("Successfully banned ^3%s^0 (id:^3%s^0) with Ban-Id: ^3%s^0 & Reason: ^3%s^0"):format(
        self.name, self.source, banData.banId, reason), "^1", "Player")
        banData.identifiers = self.identifiers
        TriggerEvent('__VexonAC_internal:playerBanned', self.source, banData, category)
        DropPlayer(self.source, (VexonAC.Config.Settings.BanMessage .. '\nBanId: %s'):format(banData.banId))
    else
        VexonAC:print(string.format("Unable to ban ^3%s^0 (id:^3%s^0), an error occurred.", self.name, self.source), "^1", "Player")
        DropPlayer(self.source, VexonAC.Config.Settings.BanMessage)
    end

    banningPlayers[self.source] = nil
    return isBanned
end

function VexonAC.Player:kick(detection, details, duration)
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
    if banningPlayers[self.source] then return false end
    banningPlayers[self.source] = true

    if VexonAC:doesPlayerHavePerms(self.source, "Bypass") then return false end

    local reason = type(detection) == "string" and detection or detection.message or "No reason specified"
    local category = type(detection) == "string" and VexonAC.Categories.MAIN or detection.category or VexonAC.Categories.MAIN
    details = details or {}

    local data = {
        name = self.name,
        identifiers = self.identifiers,
        reason = reason,
        details = details,
        evidenceUrl = nil
    }

    if VexonAC.Config.Settings.EnableGameplayRecord then
        data.evidenceUrl = self:captureGameplay("r2")
    elseif VexonAC.Config.Settings.EnableScreenShots then
        data.evidenceUrl = self:screenShot("r2")
    end

    VexonAC.DeleteOwnedEntities(self.source)
    SetPlayerRoutingBucket(self.source, 2004)
    VexonAC.RevivePlayersDeadByCheater(self.source)

    VexonAC:print(("Successfully kicked ^3%s^0 (id:^3%s^0) with Reason: ^3%s^0"):format(self.name, self.source,
        reason), "^1", "Player")
    TriggerEvent('__VexonAC_internal:playerKicked', self.source, data, category)
    DropPlayer(self.source, "You have been kicked by VexonAC for security reasons.")

    banningPlayers[self.source] = nil
    return true
end

VexonAC.DetectPlayer = function(source, detection, details, action, duration, by)
    assert(VexonAC.TypeCheck.isTable(detection) or VexonAC.TypeCheck.isString(detection), "detection: table or string")
    assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isTable)(details), "details?: table")
    assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isNumber)(action), "action?: number")
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isNumber)(duration), "duration?: number")
    assert(VexonAC.TypeCheck.isOptional(VexonAC.TypeCheck.isString)(by), "by?: string")

    local source = tonumber(source)
    local WS_Player = VexonAC.PlayerCache(source)
    if not WS_Player then
        VexonAC:print(string.format("Invalid player id: ^3%s^0.", source), "^1", "Player")
        return false
    end

    if not VexonAC.Config.Settings.EnableBans then
        return WS_Player:kick(detection, details, duration)
    end

    if not action or action == VexonAC.Actions.BAN.id then
        return WS_Player:ban(detection, details, duration, by)
    elseif action == VexonAC.Actions.KICK.id then
        return WS_Player:kick(detection, details, duration)
    end
end

function VexonAC:unban(banId, unbannedBy)
    local p = promise.new()
    local isUnbanned, unbanData = false, nil
    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/unbanPlayer"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.success then
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
                isUnbanned = true
                unbanData = data.unban
            end
        end

        p:resolve()
    end, "POST", json.encode({banId = tostring(banId), unbannedBy = unbannedBy}), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })

    Citizen.Await(p)

    if isUnbanned then
        VexonAC:print(string.format("Successfully unbanned Ban-Id: ^3%s^0.", banId), "^2", "Player")
        TriggerEvent('__VexonAC_internal:playerUnbanned', unbanData, unbanData.unbannedBy or "Console")
    else
        VexonAC:print(string.format("Unable to find Ban-Id: ^3%s^0, this ban does not exist.", banId), "^1", "Player")
    end

    return isUnbanned
end

VexonAC.UnbanAllPlayers = function(unbannedBy)
    local p = promise.new()
    local isUnbanned, unbans = false, 0
    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/unbanAllPlayers"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.success then
                isUnbanned = true
                unbans = data.unbans or 0
            end
        end

        p:resolve()
    end, "POST", json.encode({unbannedBy = unbannedBy}), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })

    Citizen.Await(p)

    if isUnbanned then
        VexonAC:print(("Successfully deleted %s all ban records."):format(unbans), "^2","Bans")
        if VexonAC.Config.Settings.LogUnbansToDiscord then
            VexonAC:sendWebHook("Players unbanned",("**%s** players have been unbanned by **Console**."):format(unbans),nil,"Unbans")
        end
    else
        VexonAC:print("Unable to remove all bans, an error occurred.", "^1", "Bans")
    end
    
    return isUnbanned
end

local function BanEventHandler(source, data)
    local source = tostring(source)
    local detection, details, action, duration = table.unpack(data)

    if type(detection) == "string" then
        detection = VexonAC.DecryptString(detection, VexonAC.InverseSubstitution)
    end

    VexonAC.DetectPlayer(source, detection, details, action, duration)
end

RegisterNetEvent(GlobalState.BanEventToken, function(data)
    BanEventHandler(source, data)
end)

AddStateBagChangeHandler(GlobalState.BanEventToken, nil, function(bagName, key, value, reserved, replicated)
    local source = GetPlayerFromStateBagName(bagName)
    if source == 0 then
        return
    end

    BanEventHandler(source, value)
end)

VexonAC.CreateThread(function()
    while not VexonAC.IsEventTokenizationReady do VexonAC.Wait(10) end
    local BanEventToken = VexonAC.EncryptString(GlobalState.BanEventToken, VexonAC.Substitution)

    RegisterNetEvent(BanEventToken, function(data)
        BanEventHandler(source, data)
    end)
    
    AddStateBagChangeHandler(BanEventToken, nil, function(bagName, key, value, reserved, replicated)
        local source = GetPlayerFromStateBagName(bagName)
        if source == 0 then
            return
        end
    
        BanEventHandler(source, value)
    end)
end)

exports("banPlayer", function(source, reason, details, duration)
    return VexonAC.DetectPlayer(source, reason, details, VexonAC.Actions.BAN.id, duration)
end)

exports("kickPlayer", function(source, reason, details, duration)
    return VexonAC.DetectPlayer(source, reason, details, VexonAC.Actions.KICK.id, duration)
end)

exports("unbanPlayer", function(banId, reason, from)
    return VexonAC:unban(banId, reason, from)
end)

exports("screenshot", function(source, webhook)
    local source = tonumber(source)
    if not source then
        VexonAC:print("Invalid player id: not a number.", "^1", "Player")
        return
    end
    local WS_Player = VexonAC.PlayerCache(source)
    if not WS_Player then
        VexonAC:print(string.format("Invalid player id: ^3%s^0.", source), "^1", "Player")
        return
    end

    return WS_Player:screenShot(webhook)
end)

exports("captureLastSeconds", function(source, webhook)
    local source = tonumber(source)
    if not source then
        VexonAC:print("Invalid player id: not a number.", "^1", "Player")
        return
    end
    local WS_Player = VexonAC.PlayerCache(source)
    if not WS_Player then
        VexonAC:print(string.format("Invalid player id: ^3%s^0.", source), "^1", "Player")
        return
    end

    return WS_Player:captureGameplay(webhook)
end)
-- Zm1hLnd0ZiBldmVyeXdoZXJl

exports("unbanAllPlayers", function(from)
    return VexonAC.UnbanAllPlayers(from)
end)

exports("getBanInfo", function(banId)
    local p = promise.new()
    local exists, data = false, nil
    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/getBanInfo"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.success then
                exists = true
                data = data.ban
            end
        end
    end, "POST", json.encode({banId = tostring(banId)}), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })

    Citizen.Await(p)

    return exists, data
end)

exports("getThreatScore", function(playerId)
    return Player(tonumber(playerId)).state["WS:threatScore"]
end)

exports("getPlayTime", function(playerId)
    return Player(tonumber(playerId)).state["WS:playTime"]
end)

exports("hasBypass", function(playerId)
    return VexonAC:doesPlayerHavePerms(playerId, "Bypass")
end)


﻿VexonAC.PlayerCache = VexonAC.Cache:new('number', 'table')

function VexonAC.PlayerCache:initialize()
    local players = GetPlayers()

    ---@diagnostic disable-next-line: undefined-field
    table.clear(self.data)

    for i = 1, #players do
        local netId = tonumber(players[i])

        self:set(netId, VexonAC.Player:new(netId))
    end
end

-- Handle creation of new entries into the PlayerCache once the player transitions to joining
AddEventHandler('playerJoining', LPH_NO_VIRTUALIZE(function()
    VexonAC.PlayerCache:set(source, VexonAC.Player:new(source))
end))

-- Handle deltion of PlayerCache entries upon player disconnection
AddEventHandler('playerDropped', function()
    local playerLicense = GetPlayerIdentifierByType(source, "license")
    local timeOnline = math.floor(GetPlayerTimeOnline(source) / 60) or 0

    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/savePlayTime"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.success then
                return true
            end
        end

        VexonAC:print("An Error occured (#SP)", "^1", "API")
    end, "POST", json.encode({
        playerLicense = playerLicense,
        timeOnline = timeOnline,
    }), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })

    VexonAC.PlayerCache:invalidate(source)

end)


function VexonAC.IsPlayerBanned(netId, playerName, playerLicense, identifiers, tokens, deferrals)
    local p = promise.new()
    local isBanned = false
    local banData, playTime, threatScore, isAdmin, isBypass = nil, 0, 0, false, false
    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/checkPlayer"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.banned then
                isBanned = VexonAC:doesPlayerHavePerms(netId, "Bypass") and false or true
                banData = data.ban
            end
            playTime = data.playTime
            threatScore = data.threatScore
            isAdmin = data.isAdmin
            isBypass = data.isBypass
        end

        p:resolve()
    end, "POST", json.encode({
        playerName = playerName,
        playerLicense = playerLicense,
        identifiers = identifiers,
        tokens = tokens,
    }), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })

-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    Citizen.Await(p)

    if isBanned then
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(('Banned player ^3%s^0 has just attempted to connect with Ban-Id: ^3%s^0'):format(playerName, banData.banId), "^6", "Connect")
        end

        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** has just attempted to connect with Ban-Id: **%s**."):format(playerName, banData.banId), {
                {
                    name = "**Identifiers**",
                    value = "```json\n"..json.encode(identifiers or {},{indent = true}).."```",
                }
            }, "Connections","10181046")
        end

        VexonAC.presentCard(
            netId,
            deferrals,
            VexonAC.Config.Settings.BanMessage,
            banData and banData.banId or "N/A",
            banData and (banData.isPermanent and "Permanent" or banData.expiresAt) or "N/A",
            banData and banData.evidenceUrl or nil,
            "ban"
        )
    else
        VexonAC.TempPlayerCache[tostring(netId)] = {
            playTime = playTime or 0,
            threatScore = threatScore or 0,
            isAdmin = isAdmin or false,
            isBypass = isBypass or false
        }
    end

    return isBanned, threatScore, isAdmin, isBypass
end

function VexonAC.IsPlayerExtraIdentifiersBanned(netId)
    local WS_Player = VexonAC.PlayerCache(netId)
    if not WS_Player then return end

    local p = promise.new()
    local isBanned = false
    local banData, threatScore = nil, nil
    VexonAC.API.PerformHttpRequest(VexonAC.API.AuthServer.. LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/checkTokens"), function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local data = json.decode(resultData)
            if data.banned then
                isBanned = true
                banData = data.ban
                threatScore = data.threatScore
            end
        end

        p:resolve()
    end, "POST", json.encode({
        playerLicense = WS_Player.license,
        extraIdentifiers = WS_Player.extraIdentifiers
    }), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    })
-- Zm1hLnd0ZiBldmVyeXdoZXJl

    Citizen.Await(p)

    if threatScore then
        Player(netId).state:set("WS:threatScore", threatScore, false)
    end

    return isBanned, banData
end

RegisterNetEvent('__VexonAC:checkExtraIdentifiers', LPH_JIT_MAX(function(uidKvp, storageId, hwid)    
    local source = tonumber(source)
    local WS_Player = VexonAC.PlayerCache(source)
    
    if not VexonAC.Config.Main.AntiSpoofer or not WS_Player or #WS_Player.extraIdentifiers > 0 or 
       VexonAC:doesPlayerHavePerms(source, "Bypass") then 
        return 
    end
    
    WS_Player:checkExtraIdentifiers(uidKvp, storageId, hwid)
    
    local banned, banData = VexonAC.IsPlayerExtraIdentifiersBanned(source)
    if not banned or not banData then return end

    VexonAC.DetectPlayer(source, "Ban Evade (Spoof) Detected", {
        previousBanId = banData.banId,
        previousBanReason = banData.reason,
    })
end))


﻿local function signedToUnsigned(num)
    if not num or type(num) ~= "number" then return end
    
    if num >= 0 then
        return num
    end
    
    local complement = 4294967296 + num
    return complement
end

function VexonAC:drawLogo()
end
-- Zm1hLnd0ZiBldmVyeXdoZXJl

function VexonAC:print(text, color, type)
    color = color or "^3"
    type = type and (type:lower():gsub("^%l", string.upper)) or "Info"

    return print("^0(^5VexonAC^0): ["..color..""..type.."^0] >> "..(text).."^0")
end

function VexonAC:stopServer()
    if os.exit then
        Wait(1000)
        return os.exit()
    else
        if pcall(function() exports.VexonAC:js_loaded() end) then
            Wait(1000)
            exports.VexonAC:StopServer()
            return
        end
        while true do end
    end
end

function VexonAC:isWindows()
    if (os.getenv("oS") or ""):match("^Windows") then return true else return false end
end

function VexonAC:createDirectory(dirName)
    if pcall(function() exports.VexonAC:js_loaded() end) then
        exports.VexonAC:CreateDirectory("VexonAC", dirName)
        return
    end
    VexonAC:print(("Please manually create the directory ^1@/VexonAC/%s^0 and restart your server."):format(dirName), "^1", "System")
end

function VexonAC:getMsDiff(clock)
    return math.floor((os.clock()-clock)*100)
end

function VexonAC:filesToCheck()
    return {
        {localFilePath = "resource/server/auth.lua", distantFileName = "auth.lua"},
        {localFilePath = "resource/server/exports.lua", distantFileName = "exports.lua"},
        {localFilePath = "resource/include.lua", distantFileName = "include.lua"},
        {localFilePath = "resource/vexonac.js", distantFileName = "vexonac.js"},
        {localFilePath = "resource/client/main.lua", distantFileName = "client.lua"},
        {localFilePath = "fxmanifest.lua", distantFileName = "fxmanifest.lua"},
        {localFilePath = "web/ui.html", distantFileName = "ui.html"},
        {localFilePath = "web/ui.js", distantFileName = "ui.js"},
        {localFilePath = "web/server.js", distantFileName = "server.js"},
    }
end
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=

function VexonAC:daysUntilTimeStamp(timestamp)
    local one_day_seconds = 86400
    local current_time = os.time()
    local time_difference = timestamp - current_time
    local days = math.floor(time_difference / one_day_seconds)
    return days
end

-- local staffPermissions = {}

function VexonAC:doesPlayerHavePerms(source, wichPerm, onlyAce)
    if wichPerm == "Bypass" and Player(source).state["WS:isBypass"] == true then return true end
    if wichPerm == "AdminMenu" and Player(source).state["WS:isAdmin"] == true then return true end
    if not onlyAce and wichPerm == "Commands" and Player(source).state["WS:isAdmin"] == true then return true end

    if IsPlayerAceAllowed(source, ("VexonAC.%s"):format(wichPerm)) then return true end
    return false
end

function VexonAC:transformTableValuesInHashKeys(table)
    local tempTable = {}
    for k,v in pairs(table or {}) do
        if type(v) == "number" or type(tonumber(v)) == "number" then
            tempTable[tonumber(v)] = true
        elseif type(v) == "string" then
            tempTable[GetHashKey(v)] = true
        elseif (type(v) == "boolean") and (v == true) then
            tempTable[k] = true
        end
    end
    return tempTable
end


﻿local function _obj(obj)
    local s = msgpack.pack(obj)
    return s, #s
end

-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
local function char_to_hex(c)
    return string.format("%%%02X", string.byte(c))
end

local API = {
    Version = LoadResourceFile("VexonAC", "auth/version.txt") or "0.0.0",
    LatestVersion = nil,
    BETA = false,
    License = (LoadResourceFile("VexonAC", "auth/license.txt") or "unknown"):gsub('[%s]', ''),
    httpDispatch = {},
    AuthServer = LPH_ENCSTR("https://vexonac.com")
}

API.BETA = API.Version:find("beta") and true or false

API.HttpResponseHandler = AddEventHandler('__cfx_internal:httpResponse',function(token, status, body, headers, errorData)
    if token and API and API.httpDispatch[token] then
        if GetInvokingResource() ~= nil then
            return
        end

        local userCallback = API.httpDispatch[token]
        API.httpDispatch[token] = nil
        userCallback(status, body, headers, errorData)
    end
end)

function API.SendHttpRequest(url, cb, method, data, headers, options)
    local followLocation = true

    if options and options.followLocation ~= nil then
        followLocation = options.followLocation
    end

    local t = {
        url = url,
        method = method or 'GET',
        data = data or '',
        headers = headers or {},
        followLocation = followLocation
    }

    local requestData_bytes, requestData_len = _obj(t)
    local id = Citizen.InvokeNative("0x6b171e87", requestData_bytes, requestData_len, Citizen.ResultAsInteger())

    if id ~= -1 then
        API.httpDispatch[id] = cb
    else
        cb(0, nil, {}, 'Failure handling HTTP request')
    end
end

function API.PerformHttpRequest(url, callback, method, data, headers)
    local tempCallback = callback
-- ZiBtIGE=
    callback = function(...)
        local requiredUserAgent = LPH_ENCSTR("AYZNNNISTHEBEST")
        local requiredContentType = "application/json"
        local Header1 = "Content-Type"
        local Header2 = LPH_ENCSTR("User-Agent")

        if headers["User-Agent"] ~= requiredUserAgent then
            API.AntiCrack.BlackList("invalid user agent", headers["User-Agent"])
            return tempCallback(200, json.encode({ Authorized = true }), {})
        elseif method == "POST" and headers["Content-Type"] ~= requiredContentType then
            API.AntiCrack.BlackList("invalid content type", headers["Content-Type"])
            return tempCallback(200, json.encode({ Authorized = true }), {})
        elseif type(data) ~= "string" then
            API.AntiCrack.BlackList("invalid data", data)
            return tempCallback(200, json.encode({ Authorized = true }), {})
        elseif data ~= "" and not json.decode(data) then
            API.AntiCrack.BlackList("invalid data", data)
            return tempCallback(200, json.encode({ Authorized = true }), {})
        elseif not method or (method ~= "GET" and method ~= "POST") then
            API.AntiCrack.BlackList("invalid method", method)
            return tempCallback(200, json.encode({ Authorized = true }), {})
        else
            local headerCount = 0
            for k, v in pairs(headers) do
                if k ~= Header1 and k ~= Header2 then
                    API.AntiCrack.BlackList("invalid header", k)
                    return tempCallback(200, json.encode({ Authorized = true }), {})
                end
                headerCount = headerCount + 1
            end
            if (method == "GET" and headerCount ~= 1) or (method == "POST" and headerCount ~= 2) then
                API.AntiCrack.BlackList("added headers", headerCount)
                return tempCallback(200, json.encode({ Authorized = true }), {})
            end
        end

        if not tempCallback or type(tempCallback) ~= "function" then
            API.AntiCrack.BlackList("not callback")
            return tempCallback(200, json.encode({ Authorized = true }), {})
        end

        if not url or not url:find(API.AuthServer) then
            API.AntiCrack.BlackList("not url", url)
            return tempCallback(200, json.encode({ Authorized = true }), {})
        end

        return tempCallback(...)
    end
    return API.SendHttpRequest(url, callback, method, data, headers)
end

function API.EncodeURL(url)
    if url == nil then
        return
    end
    url = url:gsub("\n", "\r\n")
    url = url:gsub("([^%w ])", char_to_hex)
    url = url:gsub(" ", "+")
    return url
end

function API.GetServerConfig()
    local url = API.AuthServer.. LPH_ENCSTR('/api/license/') .. (API.EncodeURL(API.License) or "gibta_le_hackeur") .. LPH_ENCSTR("/config")
    local serverConfiguration

    while type(serverConfiguration) ~= "table" do
        print("(^5VexonAC^0): [^3Auth^0] >> Getting your server configuration...");
        local p = promise.new()
        API.PerformHttpRequest(url, function(errorCode, resultData, resultHeaders)
            if errorCode == 200 and resultData then
                local data = json.decode(resultData)
                if data and type(data) == "table" and data.configuration then
                    serverConfiguration = data.configuration
                end
            end
            p:resolve()
        end, "GET", "", { [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST") })
        Citizen.Await(p)
        if not serverConfiguration then
            Citizen.Wait(3000)
        end
    end

    VexonAC.MakeConfiguration(serverConfiguration)
end

function API.GetLatestVersion()
    local url = API.AuthServer.. LPH_ENCSTR('/api/license/') ..(API.EncodeURL(API.License) or "gibta_le_hackeur").. LPH_ENCSTR('/latestVersion')
    local latestVersion = nil

    local p = promise.new()
    API.PerformHttpRequest(url, function(errorCode, resultData, resultHeaders)
        if errorCode == 200 and resultData then
            local data = json.decode(resultData)
            if data and type(data) == "table" and data.latestVersion then
                latestVersion = data.latestVersion
            end
        end
        p:resolve()
    end, "GET", "", { [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST") })
    Citizen.Await(p)

    return latestVersion
end

API.AntiCrack = {}

function API.AntiCrack.FuckIt()
end

function API.AntiCrack.CheckStartedFiles()
    local filesRight = true
    local data = {}
    local validFiles = {
        ["resource/server/auth.lua"] = true,
        ["resource/server/exports.lua"] = true,
        ["web/server.js"] = true,
        ["resource/vexonac.lua"] = true,
        ["resource/include.lua"] = true,
        ["resource/vexonac.js"] = true,
        ["@mysql-async/lib/MySQL.lua"] = true,
    }

    local fileLength = GetNumResourceMetadata("VexonAC", "server_script")
    for i = 0, (fileLength - 1) do
        local file = GetResourceMetadata("VexonAC", "server_script", i)
        if not validFiles[file] then
            table.insert(data, file)
            filesRight = false
        end
    end

    return filesRight, data
end

function API.AntiCrack.CheckVars()
    local vars = {
        {
            ["type"] = "function",
            ["name"] = "PerformHttpRequestInternalEx",
            ["func"] = PerformHttpRequestInternalEx,
            ["source"] = "@PerformHttpRequestInternalEx.lua",
            ["short_src"] = "PerformHttpRequestInternalEx.lua"
        },
        {
            ["type"] = "function",
            ["name"] = "PerformHttpRequestInternal",
            ["func"] = PerformHttpRequestInternal,
            ["source"] = "@PerformHttpRequestInternal.lua",
            ["short_src"] = "PerformHttpRequestInternal.lua"
        },
        {
            ["type"] = "function",
            ["name"] = "PerformHttpRequest",
            ["func"] = PerformHttpRequest,
            ["source"] = "@citizen:/scripting/lua/scheduler.lua",
            ["short_src"] = "citizen:/scripting/lua/scheduler.lua"
        },
        {
            ["type"] = "function",
            ["name"] = "Citizen.InvokeNative",
            ["func"] = Citizen and Citizen.InvokeNative,
            ["source"] = "=[C]",
            ["what"] = "C"
        },
        {
            ["type"] = "function",
            ["name"] = "load",
            ["func"] = load,
            ["source"] = "=[C]",
            ["what"] = "C"
        },
        {
            ["type"] = "table",
-- ZGlzY29yZC5nZy9mbWE=
            ["name"] = "os",
            ["table"] = os
        },
        {
            ["type"] = "function",
            ["name"] = "type",
            ["func"] = type,
            ["source"] = "=[C]",
            ["what"] = "C"
        },
        {
            ["type"] = "function",
            ["name"] = "os.exit",
            ["func"] = os and os.exit,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C"
        },
        {
            ["type"] = "function",
            ["name"] = "os.execute",
            ["func"] = os and os.execute,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C" },
        {
            ["type"] = "table",
            ["name"] = "debug",
            ["table"] = debug
        },
        {
            ["type"] = "function",
            ["name"] = "debug.getinfo",
            ["func"] = debug and debug.getinfo,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C"
        },
        {
            ["type"] = "function",
            ["name"] = "json.decode",
            ["func"] = json and json.decode,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C"
        },
        {
            ["type"] = "table",
            ["name"] = "json",
            ["table"] = json
        },
        {
            ["type"] = "table",
            ["name"] = "table",
            ["table"] = table
        },
        {
            ["type"] = "function",
            ["name"] = "table.concat",
            ["func"] = table and table.concat,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C"
        },
        {
            ["type"] = "table",
            ["name"] = "json",
            ["table"] = json
        },
        {
            ["type"] = "function",
            ["name"] = "table.concat",
            ["func"] = table and table.concat,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C"
        },
        {
            ["type"] = "table",
            ["name"] = "table",
            ["table"] = table
        },
        {
            ["type"] = "function",
            ["name"] = "print",
            ["func"] = print,
            ["source"] = "=[C]",
            ["short_src"] = nil,
            ["what"] = "C"
        },

        {
            ["type"] = "function",
            ["name"] = "GetResourceMetadata",
            ["func"] = GetResourceMetadata,
            ["source"] = "@GetResourceMetadata.lua",
            ["short_src"] = "GetResourceMetadata.lua",
        },
        {
            ["type"] = "function",
            ["name"] = "LoadResourceFile",
            ["func"] = LoadResourceFile,
            ["source"] = "@LoadResourceFile.lua",
            ["short_src"] = "LoadResourceFile.lua",
        },
        {
            ["type"] = "function",
            ["name"] = "SaveResourceFile",
            ["func"] = SaveResourceFile,
            ["source"] = "@SaveResourceFile.lua",
            ["short_src"] = "SaveResourceFile.lua",
        },
        {
            ["type"] = "function",
            ["name"] = "GetConvar",
            ["func"] = GetConvar,
            ["source"] = "@GetConvar.lua",
            ["short_src"] = "GetConvar.lua",
        },
        {
            ["type"] = "function",
            ["name"] = "GetStateBagValue",
            ["func"] = GetStateBagValue,
            ["source"] = "@GetStateBagValue.lua",
            ["short_src"] = "GetStateBagValue.lua",
        },
    }

    for _,var in pairs(vars) do
        if (var.type == "table") and (var.table == nil or type(var.table) ~= "table") then
            return true, {name = var.name, violation = " is nil"}
        elseif (var.type == "function") and (var.func == nil or type(var.func) ~= "function") then
            if var.name ~= "os.exit" then
                return true, {name = var.name, violation = " is nil"}
            end
        elseif var.func then
            local info = debug.getinfo(var.func)
            if info == nil or info.source == nil or info.short_src == nil or info.what == nil or (info.source ~= var.source and info.source ~= "@citizen:/scripting/lua/natives_server.lua") or (var.short_src ~= nil and var.short_src ~= info.short_src and info.short_src ~= "citizen:/scripting/lua/natives_server.lua") or (var.what ~= nil and var.what ~= info.what) then
                return true, info and {
                    name = var.name,
                    source = info.source,
                    short_src = info.short_src,
                    what = info.what,
                } or {
                    name = var.name,
                    source = "null",
                    short_src = "null",
                    what = "null",
                }
            end
        end
    end

    return false
end

function API.AntiCrack.BlackList(reason, details)
    local url = API.AuthServer.. LPH_ENCSTR('/api/license/') ..(API.EncodeURL(API.License) or "gibta_le_hackeur").. LPH_ENCSTR('/retard')
    details = details or "null";
    API.PerformHttpRequest(url, function(errorCode, resultData, resultHeaders)
        print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
        print(
        "(^5VexonAC^0): [^1Auth^0] >> Your license has been permanently ^1banned^0 due to the violation of our terms of use.");
        API.AntiCrack.FuckIt()
        while true do while true do while true do while true do while true do while true do end end end end end end
    end, "POST", json.encode({
        ["reason"] = tostring(reason),
        ["version"] = tostring(API.Version),
        ["details"] = tostring(details)
    }), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST"),
    });
end

function API.AntiCrack.CheckFileExecution()
    local info = debug.getinfo(2, "Snl")
    local source = info.source:gsub("%s+", "")

    if not info or (source ~= "Luraph" and info.short_src ~= "[C]") or (info.currentline ~= 1 and info.currentline ~= -1) then
        API.AntiCrack.BlackList("invalid execution [IN]", json.encode({2, info.short_src, info.source, info.currentline, info.name}))
        return true
    end

    local info = debug.getinfo(3, "Snl")
    local source = info.source:gsub("%s+", "")

    if not info or (source ~= "Luraph" and info.short_src ~= "[C]") or info.name ~= "?" then
        API.AntiCrack.BlackList("invalid execution [IN]", json.encode({3, info.short_src, info.source, info.currentline, info.name}))
        return true
    end

    local info = debug.getinfo(4, "Snl")
    local source = info.source:gsub("%s+", "")

    if not info or (source ~= "Luraph" and info.short_src ~= "@VexonAC/resource/server/auth.lua") or (info.currentline ~= 1 and info.currentline ~= 5) then
        API.AntiCrack.BlackList("invalid execution [IN]", json.encode({4, info.source, info.short_src, info.name}))
        return true
    end

    local info = debug.getinfo(5, "Snl")
    local source = info.source:gsub("%s+", "")

    if not info or (info.short_src ~= "[C]" and source ~= "Luraph" and (info.short_src ~= "@VexonAC/resource/server/auth.lua" and info.name ~= "handler")) or (info.currentline ~= -1 and info.currentline ~= 1 and info.currentline ~= 5) then
        API.AntiCrack.BlackList("invalid execution [IN]", json.encode({5, info.short_src, info.source, info.currentline, info.name}))
        return true
    end

    return false
end

function API.AntiCrack.Check()
    local authFile = LoadResourceFile("VexonAC", "resource/server/auth.lua")
    local lineCount = 0
    local firstLineValid = false
    if authFile then
        local firstLine = true
        for line in authFile:gmatch("[^\n]*\n?") do
            if firstLine then
                firstLineValid = line:sub(1, #"-- This file was protected using Luraph Obfuscator") == "-- This file was protected using Luraph Obfuscator"
                firstLine = false
            end
            lineCount = lineCount + 1
        end
    end
    
    if LPH_OBFUSCATED and (not authFile or lineCount ~= 3 or not firstLineValid) then
        API.AntiCrack.BlackList("Invalid auth file")
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
    end

    local crackAttempt, data = API.AntiCrack.CheckVars()
    if crackAttempt then
        API.AntiCrack.BlackList("Function override detected [IN]", json.encode(data));
        return true
    end

    local debugInfo = debug.getinfo(debug.getinfo)
    local defaultValues = {
        lastlinedefined = -1,
        nups = 0,
        ftransfer = 0,
        source = "=[C]",
        istailcall = false,
        ntransfer = 0,
        isvararg = true,
        nparams = 0,
        linedefined = -1,
        what = "C",
        short_src = "[C]",
        namewhat = "",
        currentline = -1,
    }
    for k, v in pairs(debugInfo) do
        if defaultValues[k] and defaultValues[k] ~= v then
            API.AntiCrack.BlackList("debug bypass", "debug.getinfo." .. k .. " == " .. v)
            return true
        end
    end

    local filesRight, data2 = API.AntiCrack.CheckStartedFiles()
    if not filesRight then
        API.AntiCrack.BlackList("Server files modified [IN]", json.encode(data2))
        return true
    end

    return false
end

function API.HashString(input, outputLength)
    outputLength = outputLength or 8
    
    if not input or type(input) ~= "string" then
        return string.rep("0", outputLength)
    end
    
    local hash = 0
    for i = 1, #input do
        local char = string.byte(input, i)
        hash = (hash << 5) - hash + char
        hash = hash & 0xFFFFFFFF
        if hash > 0x7FFFFFFF then
            hash = hash - 0x100000000
        end
    end
    
    hash = math.abs(hash)
    
    local result = ""
    if hash == 0 then
        result = "0"
    else
        local digits = "0123456789abcdefghijklmnopqrstuvwxyz"
        while hash > 0 do
            local remainder = hash % 36
            result = string.sub(digits, remainder + 1, remainder + 1) .. result
            hash = math.floor(hash / 36)
        end
    end
    
    if #result > outputLength then
        result = string.sub(result, 1, outputLength)
    else
        result = string.rep("0", outputLength - #result) .. result
    end
    
    return result
end

function API.VerifyAuthToken(token)
    if not token or type(token) ~= "string" then
        API.AntiCrack.BlackList("Invalid token", json.encode({token, type(token)}))
        return false
    end

    if not string.match(token, "^ws_") then
        API.AntiCrack.BlackList("Invalid token prefix", json.encode({token}))
        return false
    end

    local parts = {}
    for part in string.gmatch(token, "[^_]+") do
        table.insert(parts, part)
    end
    
    if #parts ~= 6 then
        API.AntiCrack.BlackList("Invalid token parts", json.encode({parts, #parts}))
        return false
    end

    local expectedLicenseHash = API.HashString(API.License, 8)
    if parts[4] ~= expectedLicenseHash then
        API.AntiCrack.BlackList("Invalid license hash", json.encode({parts[4], expectedLicenseHash}))
        return false
    end

    local expectedVersionHash = API.HashString(API.Version, 6)
    if parts[5] ~= expectedVersionHash then
        API.AntiCrack.BlackList("Invalid version hash", json.encode({parts[5], expectedVersionHash}))
        return false
    end

    local expectedLatestVersionHash = API.HashString(API.LatestVersion, 6)
    if parts[6] ~= expectedLatestVersionHash then
        API.AntiCrack.BlackList("Invalid latest version hash", json.encode({parts[6], expectedLatestVersionHash}))
        return false
    end

    local timestamp = tonumber(parts[3])
    if not timestamp then
        API.AntiCrack.BlackList("Invalid timestamp", json.encode({parts[3]}))
        return false
    end

    local expectedTimestamp = API.HashString(tostring(timestamp), 8)
    if parts[2] ~= expectedTimestamp then
        API.AntiCrack.BlackList("Invalid timestamp hash", json.encode({parts[1], expectedTimestamp}))
        return false
    end
    
    local maxAge = 48 * 60 * 60
    local now = os.time() or 0
    local difference = math.abs(now - timestamp)
    if difference > maxAge then
        return false, "TOKEN_EXPIRED"
    end

    return true
end

VexonAC.API = API


﻿local blockedNetGameEvents = {
    [3002107268] = "NETWORK_GIVE_PICKUP_REWARDS_EVENT",
    [1537535389] = "PLAYER_TAUNT_EVENT",
    [2639765290] = "NETWORK_PLAY_AIRDEFENSE_FIRE_EVENT",
    [1992295566] = "BLOCK_WEAPON_SELECTION",
    [2654380799] = "NETWORK_SPECIAL_FIRE_EQUIPPED_WEAPON",
    [1167173304] = "GIVE_PICKUP_REWARDS_EVENT",
    [935852904] = "RAGDOLL_REQUEST_EVENT",
}

RegisterNetEvent("__VexonAC_internal:configUpdated",function()
    if type(source) == "number" then DropPlayer(source, "Sync error") end

-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
    VexonAC.Config.Weapons.WhiteListedProjectiles = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Weapons.WhiteListedProjectiles)

    VexonAC.Config.Explosions.BlackListedExplosions = VexonAC:transformTableValuesInKeys(VexonAC.Config.Explosions.BlackListedExplosions)

    VexonAC.Config.Explosions.WhiteListedParticles = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Explosions.WhiteListedParticles)
    VexonAC.Config.Explosions.WhiteListedParticles = VexonAC:runAutoWhiteList(VexonAC.Config.Explosions.WhiteListedParticles,"Particles")

    VexonAC.Config.Entities.WhiteListedPeds = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Entities.WhiteListedPeds)
    VexonAC.Config.Entities.WhiteListedPeds = VexonAC:runAutoWhiteList(VexonAC.Config.Entities.WhiteListedPeds,"Peds")

    VexonAC.Config.Entities.WhiteListedVehicles = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Entities.WhiteListedVehicles)
    VexonAC.Config.Entities.WhiteListedVehicles = VexonAC:runAutoWhiteList(VexonAC.Config.Entities.WhiteListedVehicles,"Vehicles")

    VexonAC.Config.Entities.BlackListedVehicles = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Entities.BlackListedVehicles)
    VexonAC.Config.Entities.BlackListedPeds = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Entities.BlackListedPeds)

    VexonAC.Config.Entities.WhiteListedObjects = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Entities.WhiteListedObjects)
    VexonAC.Config.Entities.WhiteListedObjects = VexonAC:runAutoWhiteList(VexonAC.Config.Entities.WhiteListedObjects,"Props")

    VexonAC.Config.Entities.PreBlackListedObjects = VexonAC:runAutoBlackList()
    VexonAC.Config.Entities.BlackListedObjects = VexonAC:transformTableValuesInHashKeys(VexonAC.Config.Entities.BlackListedObjects)

    SetConvar("sv_filterRequestControl", "4")
    SetConvar("sv_enableNetworkedPhoneExplosions", "false")
    SetConvar("sv_enableNetworkedSounds", "false")
    SetConvar("sv_enableNetworkedScriptEntityStates", "false")
    SetConvarReplicated("game_sanitizeRagdollEvents", "true")
    -- SetConvarReplicated("sv_protectServerEntities", "true")

    SetConvar("sv_experimentalNetGameEventHandler", "true")

    local allowedCommand = IsPrincipalAceAllowed("resource.VexonAC", "command")
    if allowedCommand then
        local version = VexonAC:GetFXVersion()
        if version and version >= 16276 then
            for eventHash, eventName in pairs(blockedNetGameEvents) do
                ExecuteCommand("block_net_game_event " .. tostring(version >= 16563 and eventName or eventHash))
            end
        end
    end
end)

function VexonAC:ReloadConfiguration()
    VexonAC.API.GetServerConfig()
    --TriggerClientEvent("__VexonAC_internal:configUpdated", -1)
    VexonAC:print("Successfully reloaded the configuration.","^2","Config")
end

exports("ReloadConfiguration", function()
    local invoker = GetInvokingResource()
    if invoker == "VexonAC" then
        VexonAC:ReloadConfiguration()
    end
end)


﻿function VexonAC:saveFile(resourceName, fileName, data)
    --todo test if native works or invoke it
    local saved
    if resourceName == "VexonAC" then
        saved = SaveResourceFile(resourceName, fileName, data, -1)
    elseif pcall(function() exports.VexonAC:js_loaded() end) then
        saved = exports.VexonAC:SaveResourceFile(tostring(resourceName),tostring(fileName), tostring(data))
    end

    if not saved then
        VexonAC:print("Failed to save ^1@"..resourceName.."/"..fileName.."^0.","^1", "System")
        if resourceName ~= "VexonAC" and not pcall(function() exports.VexonAC:js_loaded() end) then
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
            VexonAC:print("Download new ^1VexonAC^0 files from the web panel.","^1", "System")
        else
            VexonAC:print("Lack of permissions detected, please grant them to the ^1VexonAC^0 folder.","^1", "System")
        end
    end

    return saved
end

-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
function VexonAC:searchForUpdate()
    if VexonAC.API.Version == nil or VexonAC.API.Version == "" then
        VexonAC:saveFile(VexonAC.resourceName, "auth/version.txt", "0.0.0")
        VexonAC.API.Version = "0.0.0"
    end

    if VexonAC.API.BETA and VexonAC.API.Version ~= (VexonAC.API.LatestVersion .. "-beta") then
        VexonAC:print("An update has been found (" .. VexonAC.API.Version .. "->" .. (VexonAC.API.LatestVersion .. "-beta") .. "), download in progress...", "^3", "Version")

        local updateTimeInMs = 0
        for i,v in pairs(VexonAC:filesToCheck()) do
            local success,ms = false,0
            while not success do
                success,ms = VexonAC:downloadFile(v.localFilePath,v.distantFileName)
                if not success then
                    VexonAC:print("Failed to download the ^1"..v.localFilePath.." ^0file, retrying...","^1","Version")
                else
                    updateTimeInMs = updateTimeInMs + ms
                end
                Wait(100)
            end
        end

        VexonAC:saveFile(VexonAC.resourceName, "auth/version.txt", VexonAC.API.LatestVersion .. "-beta")
        VexonAC:print("Update successfully ^2completed^0 in ^3"..updateTimeInMs.."ms^0, please restart your server.","^2","Version")
        VexonAC:stopServer()
        return false
    elseif not VexonAC.API.BETA and VexonAC.API.Version ~= VexonAC.API.LatestVersion then
        VexonAC:print("An update has been found ("..VexonAC.API.Version.."->"..VexonAC.API.LatestVersion.."), download in progress...","^3", "Version")

        local updateTimeInMs = 0
        for i,v in pairs(VexonAC:filesToCheck()) do
            local success,ms = false,0
            while not success do
                success,ms = VexonAC:downloadFile(v.localFilePath,v.distantFileName)
                if not success then
                    VexonAC:print("Failed to download the ^1"..v.localFilePath.." ^0file, retrying...","^1","Version")
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
                else
                    updateTimeInMs = updateTimeInMs + ms
                end
                    Wait(100)
                end
            end

            VexonAC:saveFile(VexonAC.resourceName, "auth/version.txt", VexonAC.API.LatestVersion)
            VexonAC:print("Update successfully ^2completed^0 in ^3"..updateTimeInMs.."ms^0, please restart your server.","^2","Version")
            VexonAC:stopServer()
            return false
        end
        return true
end

function VexonAC:downloadFile(localFilePath, distantFileName)
    local clock = os.clock() or 0
    local result, ms

    local url = VexonAC.API.AuthServer.. LPH_ENCSTR('/api/license/') .. (VexonAC.API.EncodeURL(VexonAC.API.License) or "gibta_le_hackeur") .. LPH_ENCSTR('/update?fileName=') .. VexonAC.API.EncodeURL(distantFileName) .. LPH_ENCSTR('&beta=') .. tostring(VexonAC.API.BETA)
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm

    local p = promise.new()
    VexonAC.API.PerformHttpRequest(url, function(errorCode, resultData, resultHeaders)
        local data = json.decode(resultData)
        if (errorCode == 200) and (data ~= nil) and (type(data) == "table") and (data.file) then
            local file = data.file
            VexonAC:saveFile(VexonAC.resourceName, localFilePath, file)
            result, ms = true, VexonAC:getMsDiff(clock)
        else
            result, ms = false, 0
        end
        p:resolve()
    end, "GET", "", { [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST") });

    Citizen.Await(p)

    return result, ms
end



local categoriesColor = {
    ["Main"] = 3447003,
    ["Entities"] = 16727197,
    ["Explosions"] = 13266944,
    ["Weapons"] = 16711680,
    ["Unbans"] = 16777215,
-- Zm1hLnd0ZiBldmVyeXdoZXJl
    ["Connections"] = 5763719,
    ["Screenshots"] = 0
}

local categoriesWebhook = {
    ["Main"] = "MainWebhook",
    ["Entities"] = "EntitiesWebhook",
    ["Explosions"] = "ExplosionsWebhook",
    ["Weapons"] = "WeaponsWebhook",
    ["Unbans"] = "UnbansWebhook",
    ["Connections"] = "ConnectionsWebhook",
    ["CommunityLogs"] = "CommunityLogsWebhook",
}

function VexonAC:sendWebHook(title,description,fields,category,overrideColor,image)
    local color = 3447003
    if overrideColor then color = tonumber(overrideColor) or 3447003 else color = categoriesColor[category] or 3447003 end

    if not VexonAC.Config.Settings.ShowIpAddress and fields ~= nil then
        for k,v in pairs(fields) do
            local string = v.value
            local newString = ''
            if string:find("ip:") then
                for line in string:gmatch("[^\n]+") do
                    if not string.find(line, "ip:") then
                        newString = newString .. line .. "\n"
                    end
                end
            end
            fields[k] = {value = newString, name = v.name}
        end
    end

    if not VexonAC.Config.Settings.EnableDiscordLogs then return end

    local webHookContent = {
        {
            ["color"] = color,
            ["type"] = "rich",
            ["description"] = description,
            ["url"] = "https://www.vexonac.com/",
            ["author"] = {
                ["name"] = title,
                ["url"] = "https://www.vexonac.com/",
                ["icon_url"] = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&"
            },
            ["footer"] = {
                ["text"] = "VexonAC "..VexonAC.API.Version.." - "..os.date("%A, %d %B %Y - %X")
            },
            ["fields"] = fields,
        }
    }
    if fields == nil then
        webHookContent[1].thumbnail = {url = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&"}
    end

    local webHookUrl = VexonAC.WebHooks[categoriesWebhook[category]] or VexonAC.WebHooks["MainWebhook"]
    if webHookUrl ~= nil and webHookUrl ~= "" then
        local enableVideo = false
        if (image ~= nil) then
            if image:find("vexonac%-capture%.webm") or image:find("r2.vexonac.com") then
                enableVideo = true
                -- todo mettre lien video dans embed comme ca on enleve cette ligne
            else
                webHookContent[1].image = {url = image}
            end
        end

        PerformHttpRequest(webHookUrl, function(err)
            if not webHookUrl:find("736948237692436700") then
                if err ~= 200 and err ~= 201 and err ~= 204 and err ~= 304 then
                    if err == 400 then
                        VexonAC:print("Failed to send this embed to discord: ^3BAD REQUEST^0 (^3The request was improperly formatted^7)","^1","Webhook")
                    elseif err == 429 then
                        VexonAC:print("Failed to send this embed to discord: ^3TOO MANY REQUESTS^0 (^3You are being rate limited^7)","^1","Webhook")
                    elseif err == 401 or err == 403 or err == 404 or err == 405 then
                        VexonAC:print("Failed to send this embed to discord: ^3UNAUTHORIZED^0 (^3Your WebHook doesn't exists or invalid request^7)","^1","Webhook")
                    elseif err >= 500 then
                        VexonAC:print("Failed to send this embed to discord: ^3SERVER ERROR^0 (^3Error From Discord API^7)","^1","Webhook")
                    else
                        VexonAC:print("Failed to send this embed to discord: ^3"..err.."^0 (^3Error From Discord API^7)","^1","Webhook")
                    end
                end
            end
        end, "POST", json.encode({username = "VexonAC", avatar_url = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&",embeds = webHookContent}), {["Content-Type"] = "application/json"})

        if enableVideo then
            PerformHttpRequest(webHookUrl, function(err)
            end, "POST", json.encode({content = image, username = "VexonAC", avatar_url = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&"}), {["Content-Type"] = "application/json"})
        end
    else
        VexonAC:print("Failed to send this embed to discord. (^3Webhook unspecified, make sure you configured them^7)","^1","Webhook")
    end
-- ZiBtIGE=
    return webHookContent
end

function VexonAC:sendCommunityWebhook(content, screenShot)
    local webHookUrl = VexonAC.WebHooks["CommunityLogsWebhook"]
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    if webHookUrl == nil or webHookUrl == "" then return end

    local webHookContent = {
        {
            ["color"] = categoriesColor["Main"],
            ["type"] = "rich",
            ["description"] = content,
            ["url"] = "https://www.vexonac.com/",
            ["author"] = {
                ["name"] = "New player banned",
                ["url"] = "https://www.vexonac.com/",
                ["icon_url"] = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&"
            },
            ["footer"] = {
                ["text"] = "VexonAC "..VexonAC.API.Version.." - "..os.date("%A, %d %B %Y - %X")
            },
        }
    }

    local enableVideo = false
    if (screenShot ~= nil) then
        if screenShot:find("vexonac%-capture%.webm") then
            enableVideo = true
            -- todo mettre lien video dans embed comme ca on enleve cette ligne
        else
            webHookContent[1].image = {url = screenShot}
        end
    end

    PerformHttpRequest(webHookUrl, function()
    end, "POST", json.encode({username = "VexonAC", avatar_url = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&", embeds = webHookContent}), {["Content-Type"] = "application/json"})

    if enableVideo then
        PerformHttpRequest(webHookUrl, function(err)
        end, "POST", json.encode({content = screenShot, username = "VexonAC", avatar_url = "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&"}), {["Content-Type"] = "application/json"})
    end
end
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=

function VexonAC:onVexonACStart()
    TriggerEvent("__VexonAC_internal:onVexonACStart", VexonAC.API.License, VexonAC.API.Version)
    VexonAC.Started = true
end

AddEventHandler('__VexonAC:webhooksUpdated', function(webhooksJson)
    local webhooks = json.decode(webhooksJson) or {}
    VexonAC.WebHooks.MainWebhook           = webhooks.MainWebhook or ""
    VexonAC.WebHooks.EntitiesWebhook       = webhooks.EntitiesWebhook or ""
    VexonAC.WebHooks.ExplosionsWebhook     = webhooks.ExplosionsWebhook or ""
    VexonAC.WebHooks.WeaponsWebhook        = webhooks.WeaponsWebhook or ""
    VexonAC.WebHooks.UnbansWebhook         = webhooks.UnbansWebhook or ""
    VexonAC.WebHooks.ConnectionsWebhook    = webhooks.ConnectionsWebhook or ""
    VexonAC.WebHooks.CommunityLogsWebhook  = webhooks.CommunityLogsWebhook or ""
    if VexonAC.Started then
        VexonAC:sendWebHook("VexonAC Status","**```VexonAC has been successfully started```**",nil,"Main")
    end
end)



﻿function VexonAC:checkIfFilesExist()
    local shouldStop = false
    local updateTimeInMs = 0

    for _,v in pairs(VexonAC:filesToCheck()) do
        local file = Citizen.InvokeNative(string.format("0x%x", 0x76A9EE1F),tostring(VexonAC.resourceName), v.localFilePath, Citizen.ReturnResultAnyway(), Citizen.ResultAsString())
        if (file == nil) or (file == "") then
            shouldStop = true

            if v.localFilePath:find("web/") then
                VexonAC:createDirectory("web")
            end

            local success,ms = false, 0
            while not success do
                success,ms = VexonAC:downloadFile(v.localFilePath,v.distantFileName)
                if not success then
                    VexonAC:print("Failed to download the ^1"..v.localFilePath.." ^0file, retrying...","^1","Version")
                else
                    updateTimeInMs = updateTimeInMs + ms
                end
                Wait(100)
            end
        end
    end

    if pcall(function() exports.VexonAC:js_loaded() end) then
        local fileDeleted = exports.VexonAC:DeleteFile("VexonAC", "resource/vexonac.lua")
        if fileDeleted then shouldStop = true end
    end

    if shouldStop then
        VexonAC:print("Missing file(s) successfully ^2downloaded^0 in ^3"..updateTimeInMs.."ms^0, please restart your server.","^2","Version")
        VexonAC:stopServer()
        return false
    else
        return true
    end
end

function VexonAC:GetFXVersion()
    local version = tonumber(string.match(string.lower(GetConvar('version')), 'v1.0.0.(%d+)'))
    return version
end

function VexonAC:checkVersion()
    local currentVersion = VexonAC.API.Version:gsub("-beta", "")
    if not VexonAC.API.LatestVersion or not currentVersion or (currentVersion ~= VexonAC.API.LatestVersion) then
        VexonAC.API.AntiCrack.BlackList("Version Bypass", json.encode({Current = VexonAC.API.Version, Latest = VexonAC.API.LatestVersion}))
        return false
    end

    local latestVersion = VexonAC.API.GetLatestVersion()
    if not latestVersion or latestVersion ~= currentVersion then return false end

    return true
end

function VexonAC:checkRequirements()
    local version = VexonAC:GetFXVersion()
    if version ~= nil and version < 14317 then
        VexonAC:print("You need newer artifacts to start VexonAC (^3+14317 recommanded^0). Current: ^3"..tostring(version).."^0.","^1","System")
        VexonAC:stopServer()
        return false
    end

    if version ~= nil and not pcall(function() exports.VexonAC:js_loaded() end) then
        VexonAC:print("You are running an invalid version of VexonAC, please download the latest version.","^1","System")
        VexonAC:stopServer()
        return false
    end

    if version ~= nil and version >= 16276 then
        local allowedCommand = IsPrincipalAceAllowed("resource.VexonAC", "command")
        if not allowedCommand then
            VexonAC:print("Add to your server.cfg: ^3add_ace resource.VexonAC command allow^0", "^1", "System")
            VexonAC:print("Add to your server.cfg: ^3add_ace resource.VexonAC command allow^0", "^1", "System")
            VexonAC:print("Add to your server.cfg: ^3add_ace resource.VexonAC command allow^0", "^1", "System")
            VexonAC:print("Add to your server.cfg: ^3add_ace resource.VexonAC command allow^0", "^1", "System")
            VexonAC:print("Add to your server.cfg: ^3add_ace resource.VexonAC command allow^0", "^1", "System")
            VexonAC:stopServer()
            return false
        end
    end

    local onesyncState = GetConvar('onesync', 'off')
    if onesyncState == "off" or onesyncState == "legacy" then
        VexonAC:print("You need to enable ^3OneSync Infinity^0 to start VexonAC.","^1","System")
        VexonAC:print("Use ^3set onesync on^0 in the command line or the server.cfg.","^1","System")
        VexonAC:stopServer()
        return false
    end

    local onesyncPopulationState = GetConvar('onesync_population', 'true')
    if onesyncPopulationState == "true" and VexonAC.Config.Entities.DisableNPCPopulation == true then
        VexonAC:print("You need to disable ^3OneSync Population^0 if you disable NPC Population in the config.","^1","System")
        VexonAC:print("Use ^3set onesync_population false^0 in the command line or the server.cfg.","^1","System")
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
        VexonAC:stopServer()
        return false
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    end

    local lua54State = GetResourceMetadata("VexonAC", 'lua54', 0)
    if lua54State ~= "yes" then
        VexonAC:print("You need to enable ^3Lua54^0 to start VexonAC.","^1","System")
        VexonAC:print("Add ^3lua54 'yes'^0 to VexonAC's fxmanifest.lua.","^1","System")
        VexonAC:stopServer()
        return false
    end

    return true
end

function VexonAC:checkResourceName()
    if VexonAC.resourceName ~= "VexonAC" then
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
        VexonAC:print("The resource name of the anti-cheat must be '^1VexonAC^0'.","^1","System")
        return false
    end
    return true
end



﻿function VexonAC:checkInstallation()
    local installedResources = 0
    local uninstalledResources = 0

    for i = 0, GetNumResources() - 1, 1 do
        local resourceName = GetResourceByFindIndex(i)

        if resourceName ~= "_cfx_internal" then
            for _, v in pairs({'fxmanifest.lua', '__resource.lua'}) do
                local manifestFile = Citizen.InvokeNative(string.format("0x%x", 0x76A9EE1F),tostring(resourceName),tostring(v), Citizen.ReturnResultAnyway(), Citizen.ResultAsString())
                if manifestFile ~= nil and type(manifestFile) == "string" then
                    if VexonAC.Config.Settings.IgnoredScripts[resourceName] then
                        if  string.find(manifestFile, "resource/include%.lua") or
                            string.find(manifestFile, "resource/vexonac%.js") or
                            string.find(manifestFile, "resource/vexonac%.lua")
                        then
                            local uninstalled = VexonAC:uninstallResource(resourceName)
                            if uninstalled then
-- ZGlzY29yZC5nZy9mbWE=
                                uninstalledResources = uninstalledResources + 1
                                Citizen.Wait(0)
                            end
                        end
                    else
                        local shouldInstallLUA = false
                        local shouldInstallJS = false

                        for __, metadataKey in pairs({"client_script", "server_script", "shared_script"}) do
                            for i = 0, GetNumResourceMetadata(resourceName, metadataKey) - 1 do
                                local file = (GetResourceMetadata(resourceName, metadataKey, i) or "none")
                                if file:find("%.lua") or (file:sub(-1) == "*") then
                                    shouldInstallLUA = true
                                end

                                if file:find("%.js") or (file:sub(-1) == "*") then
                                    shouldInstallJS = true
                                end
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
                            end
                        end

                        if (shouldInstallLUA and not string.find(manifestFile, "resource/include%.lua"))
                            or (shouldInstallJS and not string.find(manifestFile, "resource/vexonac%.js"))
                        then
                            local installed = VexonAC:installResource(resourceName, v, shouldInstallLUA, shouldInstallJS)
                            if installed then
                                installedResources = installedResources + 1
                                Citizen.Wait(0)
                            end
                        end
                    end
                    break
                end
            end
        end
    end

    if (installedResources > 0) then
        VexonAC:print("VexonAC has been installed in ^3"..installedResources.."^0 resources, a restart is required to apply the changes.","^2","Installer")
        os.remove("@VexonAC/resource/vexonac.lua")
    end

    if (uninstalledResources > 0) then
        VexonAC:print("VexonAC has been uninstalled in ^3"..uninstalledResources.."^0 resources, a restart is required to apply the changes.","^2","Installer")
    end

    if (installedResources > 0 or uninstalledResources > 0) then
        VexonAC:stopServer()
    end

    return true, installedResources, uninstalledResources
end

local function uninstallFile(manifestFile)
    if manifestFile == nil or type(manifestFile) ~= "string" then return end

    local newManifestCode = manifestFile
    local patterns = {
        -- Old shared_script patterns (with and without comments)
        "shared_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/vexonac%.lua['\"]%s*%-%-this%s+line%s+was%s+automatically%s+written%s+by%s+VexonAC[^\n]*\n?",
        "shared_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/vexonac%.lua['\"][^\n]*\n?",
        "shared_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/vexonac%.js['\"]%s*%-%-this%s+line%s+was%s+automatically%s+written%s+by%s+VexonAC[^\n]*\n?",
        "shared_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/vexonac%.js['\"][^\n]*\n?",

        -- New client/server script patterns
        "client_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/client/include%.lua['\"][^\n]*\n?",
        "server_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/server/include%.lua['\"][^\n]*\n?",
        "shared_script%s+['\"]@" .. VexonAC.resourceName .. "/resource/include%.lua['\"][^\n]*\n?",
    }

    -- Apply all cleanup patterns
    for _, pattern in ipairs(patterns) do
        newManifestCode = newManifestCode:gsub(pattern, "")
    end

    -- Clean up multiple consecutive empty lines (more than 2)
    newManifestCode = newManifestCode:gsub("\n\n\n+", "\n\n")

    -- Clean up trailing whitespace on lines
    newManifestCode = newManifestCode:gsub("[ \t]+\n", "\n")

    -- Remove leading empty lines if any were created
    newManifestCode = newManifestCode:gsub("^[\n\r%s]*", "")

    return newManifestCode
end

function VexonAC:installResource(resourceName, manifestName, lua, js)
    if resourceName == VexonAC.resourceName then return false end
    if VexonAC.Config.Settings.IgnoredScripts[resourceName] then return false end
    local manifestFile = Citizen.InvokeNative(string.format("0x%x", 0x76A9EE1F),tostring(resourceName),tostring(manifestName), Citizen.ReturnResultAnyway(), Citizen.ResultAsString())

    local manifestCode = uninstallFile(manifestFile)
    if manifestCode then
        local changes = ""

        if lua then
            changes = changes .. "shared_script '@" .. VexonAC.resourceName .. "/resource/include.lua'\n"
        end

        if js then
            changes = changes .. "shared_script '@" .. VexonAC.resourceName .. "/resource/vexonac.js'\n"
        end

        if changes ~= "" then
            local newManifestCode = changes .. "\n" .. manifestCode
            local saved = VexonAC:saveFile(resourceName, manifestName, newManifestCode)
            return saved
        end
    end
    return false
end

function VexonAC:uninstallResource(resourceName)
    if resourceName ~= "_cfx_internal" then
        for _, v in pairs({'fxmanifest.lua', '__resource.lua'}) do
            local manifestFile = Citizen.InvokeNative(string.format("0x%x", 0x76A9EE1F),tostring(resourceName),tostring(v), Citizen.ReturnResultAnyway(), Citizen.ResultAsString())
            if resourceName ~= VexonAC.resourceName then
                local newManifestCode = uninstallFile(manifestFile)
                if newManifestCode and newManifestCode ~= manifestFile then
                    local saved = VexonAC:saveFile(resourceName, v, newManifestCode)
                    return saved
                end
            end
            break
        end
    end

    return false
end

-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
function VexonAC:uninstallResources()
    local uninstalledResources = 0

    for i = 0, GetNumResources() - 1, 1 do
        local resourceName = GetResourceByFindIndex(i)
        local uninstalled = VexonAC:uninstallResource(resourceName)
        if uninstalled then uninstalledResources = uninstalledResources + 1 Citizen.Wait(0) end
    end
    if uninstalledResources > 0 then
        VexonAC:print("VexonAC has been ^3uninstalled^0 in ".. uninstalledResources .." resources, a reboot is required to apply the changes.","^2","Installer")
        VexonAC:stopServer()
    end

    return true, uninstalledResources
end


﻿-- const schema = z.object({
--   type: z.enum(["EXPLOSION", "ENTITY_CREATE", "KILL"]),
--   playerLicense: z.string().min(1, "Player license is required"),
--   playerId: z.string().min(1, "Player ID is required").optional(),
--   details: z
--     .union([
--       z.record(
--         z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
--       ),
--       z.array(z.string()),
--     ])
--     .optional(),
-- });

RegisterNetEvent("__VexonAC:debugLogs", function(functionName, stacks)
  print(source, functionName, json.encode(stacks))
end)

function VexonAC.SendLog(logType, playerId, details)
  assert(type(logType) == "string", "Type must be a string")
  assert(logType == "EXPLOSION" or logType == "ENTITY_CREATE" or logType == "KILL",
    "Type must be either EXPLOSION, ENTITY_CREATE, or KILL")

  local playerId = tostring(playerId)
  local playerLicense = GetPlayerIdentifierByType(playerId, "license")

  VexonAC.API.PerformHttpRequest(
    VexonAC.API.AuthServer ..
    LPH_ENCSTR("/api/license/") .. VexonAC.API.EncodeURL(VexonAC.API.License) .. LPH_ENCSTR("/sendLog"),
    function(errorCode, resultData, resultHeaders)
      --
    end, "POST", json.encode({
      type = logType,
      playerLicense = playerLicense,
      playerId = playerId,
      details = details,
    }), {
      ["Content-Type"] = "application/json",
      [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
-- Zm1hLnd0Zg==
    })
end



﻿local canLogIn = false
local authToken

RegisterServerEvent("VexonAC:FuckMyComputerLMAO")
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
local logInEvent = AddEventHandler("VexonAC:FuckMyComputerLMAO",function(token, latestVersion)
    canLogIn = true
    authToken = token
    VexonAC.API.LatestVersion = latestVersion
    RemoveCrackHandler()
    _G.script_key = "huh??? wait ayznnn is smarter"
end)

function RemoveCrackHandler()
    RemoveEventHandler(logInEvent)
end

if VexonAC.API.AntiCrack.CheckFileExecution() then return end

Citizen.CreateThread(function()
    if not VexonAC:checkResourceName() then return end -- search for resource name

    for _ = 1, 10000 do
        if canLogIn then
            break
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        end
        Citizen.Wait(0)
    end

    if not canLogIn then
        return VexonAC.API.AntiCrack.BlackList("Not authorized to load", logInEvent)
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    end

    local success, reason = VexonAC.API.VerifyAuthToken(authToken)
    if not success then
        if reason == "TOKEN_EXPIRED" then
            VexonAC:print("Authentication token has expired, maybe sync OS time?","^1","System")
-- ZGlzY29yZC5nZy9mbWE=
        end
        return
    end

    if VexonAC.API.AntiCrack.Check() then return end

    TriggerEvent("__VexonAC_internal:configUpdated")

    --SetConvarServerInfo("VexonAC-V4", "This server is secured by VexonAC Anti-Cheat.")
    VexonAC:drawLogo()

    if not VexonAC:searchForUpdate() then return end -- search for updates
    if not VexonAC:checkIfFilesExist() then return end -- check if required files exist
    if not VexonAC:checkRequirements() then return end -- check if requirements are valid
    if not VexonAC:checkVersion() then return end -- check that we running latest version

    if GlobalState.VexonACCustomServerBuild --[[ isUsingVexonACPremium TODO: set la clÃ© en premium sql et check que c premium ]] then
        VexonAC:print("Welcome to ^5VexonAC Premium^0, loading version ^3"..VexonAC.API.Version.."^7...","^2","Version")
    else
        VexonAC:print("Welcome to VexonAC, loading version ^3"..VexonAC.API.Version.."^7...","^2","Version")
    end

    local version = VexonAC:GetFXVersion()
    if version and version < 16811 then
        VexonAC:print("We highly recommand you to use ^3server builds 16811 or above^0. Current: ^3"..tostring(version).."^0.","^1","System")
    end

    VexonAC:checkInstallation()

    VexonAC.PlayerCache:initialize()

    VexonAC:onVexonACStart()
    VexonAC:print("VexonAC has been successfully loaded, enjoy your experience!","^2","System")
end)



﻿local protectedEvents = {}

exports("IsEventProtected", function(eventName)
  local resourceName = GetInvokingResource()
  if not resourceName then return end
  
  return protectedEvents[eventName..":"..resourceName] ~= nil
end)

AddEventHandler("__VexonAC_internal:protectEvent", function(eventName)
  local resourceName = GetInvokingResource()
  if not resourceName then return end

  protectedEvents[eventName..":"..resourceName] = true
-- ZGlzY29yZC5nZy9mbWE=
end)


﻿local clientResources = GlobalState.VexonAC_ClientResources and json.decode(GlobalState.VexonAC_ClientResources) or {}
local serverResources = GlobalState.VexonAC_ServerResources and json.decode(GlobalState.VexonAC_ServerResources) or {}

AddStateBagChangeHandler('VexonAC_ClientResources', 'global', function(bagName, key, value, reserved, replicated)
    clientResources = json.decode(value)
end)

AddStateBagChangeHandler('VexonAC_ServerResources', 'global', function(bagName, key, value, reserved, replicated)
    serverResources = json.decode(value)
end)

-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
local function RegisterResources()
    local clientResources = {}
    local serverResources = {}

    for i = 0, GetNumResources() - 1 do
        local resourceName = GetResourceByFindIndex(i)
        if GetResourceState(resourceName) == "started" then
            serverResources[resourceName] = true
            for i = 0, GetNumResourceMetadata(resourceName, "shared_script") - 1 do
                local file = (GetResourceMetadata(resourceName, "shared_script", i) or "none")
                if file == "resource/include.lua" then
                    clientResources[resourceName] = true
                end
            end
        end
    end
    GlobalState.VexonAC_ClientResources = json.encode(clientResources)
    GlobalState.VexonAC_ServerResources = json.encode(serverResources)
end

Citizen.CreateThread(function()
    RegisterResources()
end)

AddEventHandler("onResourceListRefresh", function()
    RegisterResources()
end)

local resourceStopDisableTimeout = 0
local function tempDisableAntiResourceStop(resourceName, cRs, sRs)
    TriggerClientEvent("__VexonAC:NewResourcesData", -1, resourceName, cRs, sRs)
    resourceStopDisableTimeout = GetGameTimer() + 30000
    if not GlobalState.IsAntiResourceStopDisabled then
        GlobalState.IsAntiResourceStopDisabled = true
        CreateThread(function()
            while GetGameTimer() < resourceStopDisableTimeout do
                Wait(100)
            end
            GlobalState.IsAntiResourceStopDisabled = false
            resourceStopDisableTimeout = 0
        end)
    end
end

AddEventHandler("onResourceStart",function(resourceName)
    if not clientResources[resourceName] then
        for i = 0, GetNumResourceMetadata(resourceName, "shared_script") - 1 do
            local file = (GetResourceMetadata(resourceName, "shared_script", i) or "none")
            if file == "resource/include.lua" then
                clientResources[resourceName] = true
            end
        end
    end
    if not serverResources[resourceName] then
        serverResources[resourceName] = true
    end

    local c, s = json.encode(clientResources), json.encode(serverResources)
    GlobalState.VexonAC_ClientResources = c
    GlobalState.VexonAC_ServerResources = s
    tempDisableAntiResourceStop(resourceName, c, s)
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
end)

AddEventHandler("onResourceStop",function(resourceName)
    if clientResources[resourceName] then
        clientResources[resourceName] = nil
    end
    if serverResources[resourceName] then
        serverResources[resourceName] = nil
    end

    local c, s = json.encode(clientResources), json.encode(serverResources)
    GlobalState.VexonAC_ClientResources = c
    GlobalState.VexonAC_ServerResources = s
    tempDisableAntiResourceStop(resourceName, c, s)
end)



﻿local autoBlackListTable = {
    "h4_prop_bush_buddleia_low_01",
    "h4_prop_bush_fern_tall_cc",
    "prop_container_hole",
    "prop_sub_trans_02a",
    "prop_fragtest_cnst_01",
    "prop_fragtest_cnst_02",
    "prop_fragtest_cnst_04",
    "prop_fragtest_cnst_05",
    "prop_fragtest_cnst_06",
    "prop_fragtest_cnst_06b",
    "prop_fragtest_cnst_07",
    "prop_fragtest_cnst_08",
    "prop_fragtest_cnst_08b",
    "prop_fragtest_cnst_08c",
    "prop_fragtest_cnst_09",
    "prop_fragtest_cnst_09b",
    "prop_fragtest_cnst_10",
    "prop_fragtest_cnst_11",
    "p_spinning_anus_s",
    "prop_ld_bomb_anim",
    "prop_temp_carrier",
    "stt_prop_stunt_bblock_huge_01",
    "stt_prop_stunt_bblock_huge_02",
    "stt_prop_stunt_bblock_huge_03",
    "stt_prop_stunt_bblock_huge_04",
    "stt_prop_stunt_bblock_huge_05",
    "stt_prop_stunt_bblock_hump_01",
    "stt_prop_stunt_bblock_hump_02",
    "stt_prop_stunt_bblock_lrg1",
    "stt_prop_stunt_bblock_lrg2",
    "stt_prop_stunt_bblock_lrg3",
    "stt_prop_stunt_bblock_mdm1",
    "stt_prop_stunt_bblock_mdm2",
    "stt_prop_stunt_bblock_mdm3",
    "stt_prop_stunt_bblock_qp",
    "stt_prop_stunt_bblock_qp2",
    "stt_prop_stunt_bblock_qp3",
    "stt_prop_stunt_bblock_sml1",
    "stt_prop_stunt_bblock_sml2",
    "stt_prop_stunt_bblock_sml3",
    "stt_prop_stunt_bblock_xl1",
    "stt_prop_stunt_bblock_xl2",
    "stt_prop_stunt_bblock_xl3",
    "stt_prop_stunt_bowling_ball",
    "stt_prop_stunt_bowling_pin",
    "stt_prop_stunt_bowlpin_stand",
    "stt_prop_stunt_domino",
    "stt_prop_stunt_jump15",
    "stt_prop_stunt_jump30",
    "stt_prop_stunt_jump45",
    "stt_prop_stunt_jump_l",
    "stt_prop_stunt_jump_lb",
    "stt_prop_stunt_jump_loop",
    "stt_prop_stunt_jump_m",
    "stt_prop_stunt_jump_mb",
    "stt_prop_stunt_jump_s",
    "stt_prop_stunt_jump_sb",
    "stt_prop_stunt_landing_zone_01",
    "stt_prop_stunt_ramp",
    "stt_prop_stunt_soccer_ball",
    "stt_prop_stunt_soccer_goal",
    "stt_prop_stunt_soccer_lball",
    "stt_prop_stunt_soccer_sball",
    "stt_prop_stunt_target",
    "stt_prop_stunt_target_small",
    "stt_prop_stunt_track_bumps",
    "stt_prop_stunt_track_cutout",
    "stt_prop_stunt_track_dwlink",
    "stt_prop_stunt_track_dwlink_02",
    "stt_prop_stunt_track_dwsh15",
    "stt_prop_stunt_track_dwshort",
    "stt_prop_stunt_track_dwslope15",
    "stt_prop_stunt_track_dwslope30",
    "stt_prop_stunt_track_dwslope45",
    "stt_prop_stunt_track_dwturn",
    "stt_prop_stunt_track_dwuturn",
    "stt_prop_stunt_track_exshort",
    "stt_prop_stunt_track_fork",
    "stt_prop_stunt_track_funlng",
    "stt_prop_stunt_track_funnel",
    "stt_prop_stunt_track_hill",
    "stt_prop_stunt_track_hill2",
    "stt_prop_stunt_track_jump",
    "stt_prop_stunt_track_link",
    "stt_prop_stunt_track_otake",
    "stt_prop_stunt_track_sh15",
    "stt_prop_stunt_track_sh30",
    "stt_prop_stunt_track_sh45",
    "stt_prop_stunt_track_sh45_a",
    "stt_prop_stunt_track_short",
    "stt_prop_stunt_track_slope15",
    "stt_prop_stunt_track_slope30",
    "stt_prop_stunt_track_slope45",
    "stt_prop_stunt_track_st_01",
    "stt_prop_stunt_track_st_02",
    "stt_prop_stunt_track_start",
    "stt_prop_stunt_track_start_02",
    "stt_prop_stunt_track_straight",
    "stt_prop_stunt_track_straightice",
    "stt_prop_stunt_track_turn",
    "stt_prop_stunt_track_turnice",
    "stt_prop_stunt_track_uturn",
    "stt_prop_stunt_tube_crn",
    "stt_prop_stunt_tube_crn2",
    "stt_prop_stunt_tube_crn_15d",
    "stt_prop_stunt_tube_crn_30d",
    "stt_prop_stunt_tube_crn_5d",
    "stt_prop_stunt_tube_cross",
    "stt_prop_stunt_tube_end",
    "stt_prop_stunt_tube_ent",
    "stt_prop_stunt_tube_fn_01",
    "stt_prop_stunt_tube_fn_02",
    "stt_prop_stunt_tube_fn_03",
    "stt_prop_stunt_tube_fn_04",
    "stt_prop_stunt_tube_fn_05",
    "stt_prop_stunt_tube_fork",
    "stt_prop_stunt_tube_gap_01",
    "stt_prop_stunt_tube_gap_02",
    "stt_prop_stunt_tube_gap_03",
    "stt_prop_stunt_tube_hg",
    "stt_prop_stunt_tube_jmp",
    "stt_prop_stunt_tube_jmp2",
    "stt_prop_stunt_tube_l",
    "stt_prop_stunt_tube_m",
    "stt_prop_stunt_tube_qg",
    "stt_prop_stunt_tube_s",
    "stt_prop_stunt_tube_speed",
    "stt_prop_stunt_tube_speeda",
    "stt_prop_stunt_tube_speedb",
    "stt_prop_stunt_tube_xs",
    "stt_prop_stunt_tube_xxs",
    "stt_prop_stunt_wideramp",
    "stt_prop_ramp_adj_flip_m",
    "stt_prop_ramp_adj_flip_mb",
    "stt_prop_ramp_adj_flip_s",
    "stt_prop_ramp_adj_flip_sb",
    "stt_prop_ramp_adj_hloop",
    "stt_prop_ramp_adj_loop",
    "stt_prop_ramp_jump_l",
    "stt_prop_ramp_jump_m",
    "stt_prop_ramp_jump_s",
    "stt_prop_ramp_jump_xl",
    "stt_prop_ramp_jump_xs",
    "stt_prop_ramp_jump_xxl",
    "stt_prop_ramp_multi_loop_rb",
    "stt_prop_ramp_spiral_l",
    "stt_prop_ramp_spiral_l_l",
    "stt_prop_ramp_spiral_l_m",
    "stt_prop_ramp_spiral_l_s",
    "stt_prop_ramp_spiral_l_xxl",
    "stt_prop_ramp_spiral_m",
    "stt_prop_ramp_spiral_s",
    "stt_prop_ramp_spiral_xxl",
    "stt_prop_wallride_01",
    "stt_prop_wallride_01b",
    "stt_prop_wallride_02",
    "stt_prop_wallride_02b",
    "stt_prop_wallride_04",
    "stt_prop_wallride_05",
    "stt_prop_wallride_05b",
    "stt_prop_wallride_45l",
    "stt_prop_wallride_45la",
    "stt_prop_wallride_45r",
    "stt_prop_wallride_45ra",
    "stt_prop_wallride_90l",
    "stt_prop_wallride_90lb",
    "stt_prop_wallride_90r",
    "stt_prop_wallride_90rb",
    "ar_prop_ar_stunt_block_01a",
    "ar_prop_ar_stunt_block_01b",
    "ar_prop_ar_tube_2x_crn",
    "ar_prop_ar_tube_2x_crn_15d",
    "ar_prop_ar_tube_2x_crn_30d",
    "ar_prop_ar_tube_2x_crn_5d",
    "ar_prop_ar_tube_2x_crn2",
    "ar_prop_ar_tube_2x_gap_02",
    "ar_prop_ar_tube_2x_l",
    "ar_prop_ar_tube_2x_m",
    "ar_prop_ar_tube_2x_s",
    "ar_prop_ar_tube_2x_speed",
    "ar_prop_ar_tube_2x_xs",
    "ar_prop_ar_tube_2x_xxs",
    "ar_prop_ar_tube_4x_crn",
    "ar_prop_ar_tube_4x_crn_15d",
    "ar_prop_ar_tube_4x_crn_30d",
    "ar_prop_ar_tube_4x_crn_5d",
    "ar_prop_ar_tube_4x_crn2",
    "ar_prop_ar_tube_4x_gap_02",
    "ar_prop_ar_tube_4x_l",
    "ar_prop_ar_tube_4x_m",
    "ar_prop_ar_tube_4x_s",
    "ar_prop_ar_tube_4x_speed",
    "ar_prop_ar_tube_4x_xs",
    "ar_prop_ar_tube_4x_xxs",
    "ar_prop_ar_tube_crn",
    "ar_prop_ar_tube_crn_15d",
    "ar_prop_ar_tube_crn_30d",
    "ar_prop_ar_tube_crn_5d",
    "ar_prop_ar_tube_crn2",
    "ar_prop_ar_tube_cross",
    "ar_prop_ar_tube_fork",
    "ar_prop_ar_tube_gap_02",
    "ar_prop_ar_tube_hg",
    "ar_prop_ar_tube_jmp",
    "ar_prop_ar_tube_l",
    "ar_prop_ar_tube_m",
    "ar_prop_ar_tube_qg",
    "ar_prop_ar_tube_s",
    "ar_prop_ar_tube_speed",
    "ar_prop_ar_tube_xs",
    "ar_prop_ar_tube_xxs",
    "bkr_prop_biker_tube_crn",

    2030482070, --phaze cage
    373823972, --phaze city 1
    899449633, --phaze desert
    -473353655, --phaze hills
    1307249709, --phaze mount chiliad
    -365313125, --phaze structures
    856550814, --phaze buildings
}

local autoWhiteListTable = {
    ["default"] = {
        Props = {
            -- gta world default
            "p_parachute1_mp_s",
            "p_parachute1_mp_dec",
            "imp_prop_impexp_para_s",
            "prop_roadcone01a",
            "prop_roadcone02a",
            "prop_juicestand",

            -- servers might use
            "xm_prop_x17_tem_control_01",
            "prop_npc_phone",
            "prop_npc_phone_02",
            "prop_cs_phone_01",
            "prop_amb_phone",
            "prop_cs_burger_01",
            "prop_sandwich_01",
            "prop_ld_flow_bottle",
            "L1_1",
        },
    },
    ["ox_inventory"] = {
        Props = {
            "w_am_baseball",
            "w_am_brfcase",
            "w_am_case",
            "w_am_digiscanner",
            "w_am_digiscanner_reh",
            "w_am_fire_exting",
            "w_am_flare",
            "w_am_jerrycan",
            "w_am_jerrycan_sf",
            "w_am_papers_xm3",
            "w_ar_advancedrifle",
            "w_ar_advancedrifle_luxe",
            "w_ar_advancedrifle_luxe_mag1",
            "w_ar_advancedrifle_luxe_mag2",
            "w_ar_advancedrifle_mag1",
            "w_ar_advancedrifle_mag2",
            "w_ar_assaultrifle",
            "w_ar_assaultrifle_boxmag",
            "w_ar_assaultrifle_boxmag_luxe",
            "w_ar_assaultrifle_luxe",
            "w_ar_assaultrifle_luxe_mag1",
            "w_ar_assaultrifle_luxe_mag2",
            "w_ar_assaultrifle_mag1",
            "w_ar_assaultrifle_mag2",
            "w_ar_assaultrifle_smg",
            "w_ar_assaultrifle_smg_mag1",
            "w_ar_assaultrifle_smg_mag2",
            "w_ar_assaultriflemk2",
            "w_ar_assaultriflemk2_mag_ap",
            "w_ar_assaultriflemk2_mag_fmj",
            "w_ar_assaultriflemk2_mag_inc",
            "w_ar_assaultriflemk2_mag_tr",
            "w_ar_assaultriflemk2_mag1",
            "w_ar_assaultriflemk2_mag2",
            "w_ar_bp_mk2_barrel1",
            "w_ar_bp_mk2_barrel2",
            "w_ar_bullpuprifle",
            "w_ar_bullpuprifle_luxe",
            "w_ar_bullpuprifle_luxe_mag1",
            "w_ar_bullpuprifle_luxe_mag2",
            "w_ar_bullpuprifle_mag1",
            "w_ar_bullpuprifle_mag2",
            "w_ar_bullpuprifleh4",
            "w_ar_bullpuprifleh4_mag1",
            "w_ar_bullpuprifleh4_mag2",
            "w_ar_bullpuprifleh4_sight",
            "w_ar_bullpupriflemk2",
            "w_ar_bullpupriflemk2_camo_ind1",
            "w_ar_bullpupriflemk2_camo1",
            "w_ar_bullpupriflemk2_camo10",
            "w_ar_bullpupriflemk2_camo2",
            "w_ar_bullpupriflemk2_camo3",
            "w_ar_bullpupriflemk2_camo4",
            "w_ar_bullpupriflemk2_camo5",
            "w_ar_bullpupriflemk2_camo6",
            "w_ar_bullpupriflemk2_camo7",
            "w_ar_bullpupriflemk2_camo8",
            "w_ar_bullpupriflemk2_camo9",
            "w_ar_bullpupriflemk2_mag_ap",
            "w_ar_bullpupriflemk2_mag_fmj",
            "w_ar_bullpupriflemk2_mag_inc",
            "w_ar_bullpupriflemk2_mag_tr",
            "w_ar_bullpupriflemk2_mag1",
            "w_ar_bullpupriflemk2_mag2",
            "w_ar_carbinerifle",
            "w_ar_carbinerifle_boxmag",
            "w_ar_carbinerifle_boxmag_luxe",
            "w_ar_carbinerifle_luxe",
            "w_ar_carbinerifle_luxe_mag1",
            "w_ar_carbinerifle_luxe_mag2",
            "w_ar_carbinerifle_mag1",
            "w_ar_carbinerifle_mag2",
            "w_ar_carbinerifle_reh",
            "w_ar_carbineriflemk2",
            "w_ar_carbineriflemk2_camo_ind1",
            "w_ar_carbineriflemk2_camo1",
            "w_ar_carbineriflemk2_camo10",
            "w_ar_carbineriflemk2_camo2",
            "w_ar_carbineriflemk2_camo3",
            "w_ar_carbineriflemk2_camo4",
            "w_ar_carbineriflemk2_camo5",
            "w_ar_carbineriflemk2_camo6",
            "w_ar_carbineriflemk2_camo7",
            "w_ar_carbineriflemk2_camo8",
            "w_ar_carbineriflemk2_camo9",
            "w_ar_carbineriflemk2_mag_ap",
            "w_ar_carbineriflemk2_mag_fmj",
            "w_ar_carbineriflemk2_mag_inc",
            "w_ar_carbineriflemk2_mag_tr",
            "w_ar_carbineriflemk2_mag1",
            "w_ar_carbineriflemk2_mag2",
            "w_ar_heavyrifleh",
            "w_ar_heavyrifleh_sight",
            "w_ar_musket",
            "w_ar_railgun",
            "w_ar_railgun_mag1",
            "w_ar_railgun_xm3",
            "w_ar_sc_barrel_1",
            "w_ar_sc_barrel_2",
            "w_ar_specialcarbine",
            "w_ar_specialcarbine_boxmag",
            "w_ar_specialcarbine_boxmag_luxe",
            "w_ar_specialcarbine_luxe",
            "w_ar_specialcarbine_luxe_mag1",
            "w_ar_specialcarbine_luxe_mag2",
            "w_ar_specialcarbine_mag1",
            "w_ar_specialcarbine_mag2",
            "w_ar_specialcarbinemk2",
            "w_ar_specialcarbinemk2_camo_ind",
            "w_ar_specialcarbinemk2_camo1",
            "w_ar_specialcarbinemk2_camo10",
            "w_ar_specialcarbinemk2_camo2",
            "w_ar_specialcarbinemk2_camo3",
            "w_ar_specialcarbinemk2_camo4",
            "w_ar_specialcarbinemk2_camo5",
            "w_ar_specialcarbinemk2_camo6",
            "w_ar_specialcarbinemk2_camo7",
            "w_ar_specialcarbinemk2_camo8",
            "w_ar_specialcarbinemk2_camo9",
            "w_ar_specialcarbinemk2_mag_ap",
            "w_ar_specialcarbinemk2_mag_fmj",
            "w_ar_specialcarbinemk2_mag_inc",
            "w_ar_specialcarbinemk2_mag_tr",
            "w_ar_specialcarbinemk2_mag1",
            "w_ar_specialcarbinemk2_mag2",
            "w_ar_srifle",
            "w_arena_airmissile_01a",
            "w_at_afgrip_2",
            "w_at_ar_afgrip",
            "w_at_ar_afgrip_luxe",
            "w_at_ar_barrel_1",
            "w_at_ar_barrel_2",
            "w_at_ar_flsh",
            "w_at_ar_flsh_luxe",
            "w_at_ar_flsh_pdluxe",
            "w_at_ar_flsh_reh",
            "w_at_ar_supp",
            "w_at_ar_supp_02",
            "w_at_ar_supp_luxe",
            "w_at_ar_supp_luxe_02",
            "w_at_armk2_camo_ind1",
            "w_at_armk2_camo1",
            "w_at_armk2_camo10",
            "w_at_armk2_camo2",
            "w_at_armk2_camo3",
            "w_at_armk2_camo4",
            "w_at_armk2_camo5",
            "w_at_armk2_camo6",
            "w_at_armk2_camo7",
            "w_at_armk2_camo8",
            "w_at_armk2_camo9",
            "w_at_cr_barrel_1",
            "w_at_cr_barrel_2",
            "w_at_heavysnipermk2_camo_ind1",
            "w_at_heavysnipermk2_camo1",
            "w_at_heavysnipermk2_camo10",
            "w_at_heavysnipermk2_camo2",
            "w_at_heavysnipermk2_camo3",
            "w_at_heavysnipermk2_camo4",
            "w_at_heavysnipermk2_camo5",
            "w_at_heavysnipermk2_camo6",
            "w_at_heavysnipermk2_camo7",
            "w_at_heavysnipermk2_camo8",
            "w_at_heavysnipermk2_camo9",
            "w_at_hrh_camo1",
            "w_at_mg_barrel_1",
            "w_at_mg_barrel_2",
            "w_at_muzzle_1",
            "w_at_muzzle_2",
            "w_at_muzzle_3",
            "w_at_muzzle_4",
            "w_at_muzzle_5",
            "w_at_muzzle_6",
            "w_at_muzzle_7",
            "w_at_muzzle_8",
            "w_at_muzzle_8_xm17",
            "w_at_muzzle_9",
            "w_at_pi_comp_1",
            "w_at_pi_comp_2",
            "w_at_pi_comp_3",
            "w_at_pi_flsh",
            "w_at_pi_flsh_2",
            "w_at_pi_flsh_luxe",
            "w_at_pi_flsh_pdluxe",
            "w_at_pi_rail_1",
            "w_at_pi_rail_2",
            "w_at_pi_snsmk2_flsh_1",
            "w_at_pi_supp",
            "w_at_pi_supp_2",
            "w_at_pi_supp_luxe",
            "w_at_pi_supp_luxe_2",
            "w_at_railcover_01",
            "w_at_sb_barrel_1",
            "w_at_sb_barrel_2",
            "w_at_scope_large",
            "w_at_scope_large_luxe",
            "w_at_scope_macro",
            "w_at_scope_macro_02_luxe",
            "w_at_scope_macro_2",
            "w_at_scope_macro_2_mk2",
            "w_at_scope_macro_luxe",
            "w_at_scope_max",
            "w_at_scope_max_luxe",
            "w_at_scope_medium",
            "w_at_scope_medium_2",
            "w_at_scope_medium_luxe",
            "w_at_scope_nv",
            "w_at_scope_small",
            "w_at_scope_small_02a_luxe",
            "w_at_scope_small_2",
            "w_at_scope_small_luxe",
            "w_at_scope_small_mk2",
            "w_at_sights_1",
            "w_at_sights_smg",
            "w_at_smgmk2_camo_ind1",
            "w_at_smgmk2_camo1",
            "w_at_smgmk2_camo10",
            "w_at_smgmk2_camo2",
            "w_at_smgmk2_camo3",
            "w_at_smgmk2_camo4",
            "w_at_smgmk2_camo5",
            "w_at_smgmk2_camo6",
            "w_at_smgmk2_camo7",
            "w_at_smgmk2_camo8",
            "w_at_smgmk2_camo9",
            "w_at_sr_barrel_1",
            "w_at_sr_barrel_2",
            "w_at_sr_supp",
            "w_at_sr_supp_2",
            "w_at_sr_supp_luxe",
            "w_at_sr_supp3",
            "w_battle_airmissile_01",
            "w_ch_jerrycan",
            "w_ex_apmine",
            "w_ex_arena_landmine_01b",
            "w_ex_birdshat",
            "w_ex_grenadefrag",
            "w_ex_grenadesmoke",
            "w_ex_molotov",
            "w_ex_pe",
            "w_ex_pipebomb",
            "w_ex_snowball",
            "w_ex_vehiclegrenade",
            "w_ex_vehiclemine",
            "w_ex_vehiclemissile_1",
            "w_ex_vehiclemissile_2",
            "w_ex_vehiclemissile_3",
            "w_ex_vehiclemissile_4",
            "w_ex_vehiclemortar",
            "w_lr_40mm",
            "w_lr_compactgl",
            "w_lr_compactgl_mag1",
            "w_lr_compactml",
            "w_lr_compactml_mag1",
            "w_lr_firework",
            "w_lr_firework_rocket",
            "w_lr_grenadelauncher",
            "w_lr_homing",
            "w_lr_homing_rocket",
            "w_lr_ml_40mm",
            "w_lr_rpg",
            "w_lr_rpg_rocket",
            "w_me_bat",
            "w_me_bat_xm3",
            "w_me_bat_xm3_01",
            "w_me_bat_xm3_02",
            "w_me_bat_xm3_03",
            "w_me_bat_xm3_04",
            "w_me_bat_xm3_05",
            "w_me_bat_xm3_06",
            "w_me_bat_xm3_07",
            "w_me_bat_xm3_08",
            "w_me_bat_xm3_09",
            "w_me_battleaxe",
            "w_me_bottle",
            "w_me_candy_xm3",
            "w_me_crowbar",
            "w_me_dagger",
            "w_me_flashlight",
            "w_me_flashlight_flash",
            "w_me_gclub",
            "w_me_hammer",
            "w_me_hatchet",
            "w_me_knife_01",
            "w_me_knife_xm3",
            "w_me_knife_xm3_01",
            "w_me_knife_xm3_02",
            "w_me_knife_xm3_03",
            "w_me_knife_xm3_04",
            "w_me_knife_xm3_05",
            "w_me_knife_xm3_06",
            "w_me_knife_xm3_07",
            "w_me_knife_xm3_08",
            "w_me_knife_xm3_09",
            "w_me_knuckle",
            "w_me_knuckle_02",
            "w_me_knuckle_bg",
            "w_me_knuckle_dlr",
            "w_me_knuckle_dmd",
            "w_me_knuckle_ht",
            "w_me_knuckle_lv",
            "w_me_knuckle_pc",
            "w_me_knuckle_slg",
            "w_me_knuckle_vg",
            "w_me_machette_lr",
            "w_me_nightstick",
            "w_me_poolcue",
            "w_me_stonehatchet",
            "w_me_switchblade",
            "w_me_switchblade_b",
            "w_me_switchblade_g",
            "w_me_wrench",
            "w_mg_combatmg",
            "w_mg_combatmg_luxe",
            "w_mg_combatmg_luxe_mag1",
            "w_mg_combatmg_luxe_mag2",
            "w_mg_combatmg_mag1",
            "w_mg_combatmg_mag2",
            "w_mg_combatmgmk2",
            "w_mg_combatmgmk2_camo_ind1",
            "w_mg_combatmgmk2_camo1",
            "w_mg_combatmgmk2_camo10",
            "w_mg_combatmgmk2_camo2",
            "w_mg_combatmgmk2_camo3",
            "w_mg_combatmgmk2_camo4",
            "w_mg_combatmgmk2_camo5",
            "w_mg_combatmgmk2_camo6",
            "w_mg_combatmgmk2_camo7",
            "w_mg_combatmgmk2_camo8",
            "w_mg_combatmgmk2_camo9",
            "w_mg_combatmgmk2_mag_ap",
            "w_mg_combatmgmk2_mag_fmj",
            "w_mg_combatmgmk2_mag_inc",
            "w_mg_combatmgmk2_mag_tr",
            "w_mg_combatmgmk2_mag1",
            "w_mg_combatmgmk2_mag2",
            "w_mg_mg",
            "w_mg_mg_luxe",
            "w_mg_mg_luxe_mag1",
            "w_mg_mg_luxe_mag2",
            "w_mg_mg_mag1",
            "w_mg_mg_mag2",
            "w_mg_minigun",
            "w_mg_sminigun",
            "w_pi_appistol",
            "w_pi_appistol_luxe",
            "w_pi_appistol_mag1",
            "w_pi_appistol_mag1_luxe",
            "w_pi_appistol_mag2",
            "w_pi_appistol_mag2_luxe",
            "w_pi_appistol_sts",
            "w_pi_ceramic_mag1",
            "w_pi_ceramic_pistol",
            "w_pi_ceramic_supp",
            "w_pi_combatpistol",
            "w_pi_combatpistol_luxe",
            "w_pi_combatpistol_luxe_mag1",
            "w_pi_combatpistol_luxe_mag2",
            "w_pi_combatpistol_mag1",
            "w_pi_combatpistol_mag2",
            "w_pi_flaregun",
            "w_pi_flaregun_mag1",
            "w_pi_flaregun_shell",
            "w_pi_heavypistol",
            "w_pi_heavypistol_luxe",
            "w_pi_heavypistol_luxe_mag1",
            "w_pi_heavypistol_luxe_mag2",
            "w_pi_heavypistol_mag1",
            "w_pi_heavypistol_mag2",
            "w_pi_pistol",
            "w_pi_pistol_luxe",
            "w_pi_pistol_luxe_mag1",
            "w_pi_pistol_luxe_mag2",
            "w_pi_pistol_mag1",
            "w_pi_pistol_mag2",
            "w_pi_pistol_xm3",
            "w_pi_pistol_xm3_mag1",
            "w_pi_pistol_xm3_supp",
            "w_pi_pistol50",
            "w_pi_pistol50_luxe",
            "w_pi_pistol50_mag1",
            "w_pi_pistol50_mag1_luxe",
            "w_pi_pistol50_mag2",
            "w_pi_pistol50_mag2_luxe",
            "w_pi_pistolmk2",
            "w_pi_pistolmk2_camo_ind1",
            "w_pi_pistolmk2_camo_sg",
            "w_pi_pistolmk2_camo_sl_ind1",
            "w_pi_pistolmk2_camo_sl_sg",
            "w_pi_pistolmk2_camo1",
            "w_pi_pistolmk2_camo10",
            "w_pi_pistolmk2_camo2",
            "w_pi_pistolmk2_camo3",
            "w_pi_pistolmk2_camo4",
            "w_pi_pistolmk2_camo5",
            "w_pi_pistolmk2_camo6",
            "w_pi_pistolmk2_camo7",
            "w_pi_pistolmk2_camo8",
            "w_pi_pistolmk2_camo9",
            "w_pi_pistolmk2_mag_fmj",
            "w_pi_pistolmk2_mag_hp",
            "w_pi_pistolmk2_mag_inc",
            "w_pi_pistolmk2_mag_tr",
            "w_pi_pistolmk2_mag1",
            "w_pi_pistolmk2_mag2",
            "w_pi_pistolmk2_slide_camo1",
            "w_pi_pistolmk2_slide_camo10",
            "w_pi_pistolmk2_slide_camo2",
            "w_pi_pistolmk2_slide_camo3",
            "w_pi_pistolmk2_slide_camo4",
            "w_pi_pistolmk2_slide_camo5",
            "w_pi_pistolmk2_slide_camo6",
            "w_pi_pistolmk2_slide_camo7",
            "w_pi_pistolmk2_slide_camo8",
            "w_pi_pistolmk2_slide_camo9",
            "w_pi_raygun",
            "w_pi_raygun_ev",
            "w_pi_revolver",
            "w_pi_revolver_b",
            "w_pi_revolver_g",
            "w_pi_revolver_mag1",
            "w_pi_revolvermk2",
            "w_pi_revolvermk2_camo_ind",
            "w_pi_revolvermk2_camo1",
            "w_pi_revolvermk2_camo10",
            "w_pi_revolvermk2_camo2",
            "w_pi_revolvermk2_camo3",
            "w_pi_revolvermk2_camo4",
            "w_pi_revolvermk2_camo5",
            "w_pi_revolvermk2_camo6",
            "w_pi_revolvermk2_camo7",
            "w_pi_revolvermk2_camo8",
            "w_pi_revolvermk2_camo9",
            "w_pi_revolvermk2_mag1",
            "w_pi_revolvermk2_mag2",
            "w_pi_revolvermk2_mag3",
            "w_pi_revolvermk2_mag4",
            "w_pi_revolvermk2_mag5",
-- Zm1hLnd0Zg==
            "w_pi_singleshot",
            "w_pi_singleshot_shell",
            "w_pi_singleshoth4",
            "w_pi_singleshoth4_shell",
            "w_pi_sns_pistol",
            "w_pi_sns_pistol_luxe",
            "w_pi_sns_pistol_luxe_mag1",
            "w_pi_sns_pistol_luxe_mag2",
            "w_pi_sns_pistol_mag1",
            "w_pi_sns_pistol_mag2",
            "w_pi_sns_pistolmk2",
            "w_pi_sns_pistolmk2_camo_ind1",
            "w_pi_sns_pistolmk2_camo1",
            "w_pi_sns_pistolmk2_camo10",
            "w_pi_sns_pistolmk2_camo2",
            "w_pi_sns_pistolmk2_camo3",
            "w_pi_sns_pistolmk2_camo4",
            "w_pi_sns_pistolmk2_camo5",
            "w_pi_sns_pistolmk2_camo6",
            "w_pi_sns_pistolmk2_camo7",
            "w_pi_sns_pistolmk2_camo8",
            "w_pi_sns_pistolmk2_camo9",
            "w_pi_sns_pistolmk2_mag_fmj",
            "w_pi_sns_pistolmk2_mag_hp",
            "w_pi_sns_pistolmk2_mag_inc",
            "w_pi_sns_pistolmk2_mag_tr",
            "w_pi_sns_pistolmk2_mag1",
            "w_pi_sns_pistolmk2_mag2",
            "w_pi_sns_pistolmk2_sl_camo_ind1",
            "w_pi_sns_pistolmk2_sl_camo1",
            "w_pi_sns_pistolmk2_sl_camo10",
            "w_pi_sns_pistolmk2_sl_camo2",
            "w_pi_sns_pistolmk2_sl_camo3",
            "w_pi_sns_pistolmk2_sl_camo4",
            "w_pi_sns_pistolmk2_sl_camo5",
            "w_pi_sns_pistolmk2_sl_camo6",
            "w_pi_sns_pistolmk2_sl_camo7",
            "w_pi_sns_pistolmk2_sl_camo8",
            "w_pi_sns_pistolmk2_sl_camo9",
            "w_pi_stungun",
            "w_pi_vintage_pistol",
            "w_pi_vintage_pistol_mag1",
            "w_pi_vintage_pistol_mag2",
            "w_pi_wep1_gun",
            "w_pi_wep1_mag1",
            "w_pi_wep2_gun",
            "w_pi_wep2_gun_mag1",
            "w_sb_assaultsmg",
            "w_sb_assaultsmg_luxe",
            "w_sb_assaultsmg_luxe_mag1",
            "w_sb_assaultsmg_luxe_mag2",
            "w_sb_assaultsmg_mag1",
            "w_sb_assaultsmg_mag2",
            "w_sb_compactsmg",
            "w_sb_compactsmg_boxmag",
            "w_sb_compactsmg_mag1",
            "w_sb_compactsmg_mag2",
            "w_sb_gusenberg",
            "w_sb_gusenberg_mag1",
            "w_sb_gusenberg_mag2",
            "w_sb_microsmg",
            "w_sb_microsmg_las",
            "w_sb_microsmg_luxe",
            "w_sb_microsmg_mag1",
            "w_sb_microsmg_mag1_luxe",
            "w_sb_microsmg_mag2",
            "w_sb_microsmg_mag2_luxe",
            "w_sb_microsmg_xm3",
            "w_sb_minismg",
            "w_sb_minismg_mag1",
            "w_sb_minismg_mag2",
            "w_sb_pdw",
            "w_sb_pdw_boxmag",
            "w_sb_pdw_mag1",
            "w_sb_pdw_mag2",
            "w_sb_smg",
            "w_sb_smg_boxmag",
            "w_sb_smg_boxmag_luxe",
            "w_sb_smg_luxe",
            "w_sb_smg_luxe_mag1",
            "w_sb_smg_luxe_mag2",
            "w_sb_smg_mag1",
            "w_sb_smg_mag2",
            "w_sb_smgmk2",
            "w_sb_smgmk2_mag_fmj",
            "w_sb_smgmk2_mag_hp",
            "w_sb_smgmk2_mag_inc",
            "w_sb_smgmk2_mag_tr",
            "w_sb_smgmk2_mag1",
            "w_sb_smgmk2_mag2",
            "w_sg_assaultshotgun",
-- Zm1hLnd0ZiBldmVyeXdoZXJl
            "w_sg_assaultshotgun_mag1",
            "w_sg_assaultshotgun_mag2",
            "w_sg_bullpupshotgun",
            "w_sg_doublebarrel",
            "w_sg_doublebarrel_mag1",
            "w_sg_heavyshotgun",
            "w_sg_heavyshotgun_boxmag",
            "w_sg_heavyshotgun_mag1",
            "w_sg_heavyshotgun_mag2",
            "w_sg_pumpshotgun",
            "w_sg_pumpshotgun_chs",
            "w_sg_pumpshotgun_luxe",
            "w_sg_pumpshotgun_xm3",
            "w_sg_pumpshotgunh4",
            "w_sg_pumpshotgunh4_mag1",
            "w_sg_pumpshotgunmk2",
            "w_sg_pumpshotgunmk2_camo_ind1",
            "w_sg_pumpshotgunmk2_camo1",
            "w_sg_pumpshotgunmk2_camo10",
            "w_sg_pumpshotgunmk2_camo2",
            "w_sg_pumpshotgunmk2_camo3",
            "w_sg_pumpshotgunmk2_camo4",
            "w_sg_pumpshotgunmk2_camo5",
            "w_sg_pumpshotgunmk2_camo6",
            "w_sg_pumpshotgunmk2_camo7",
            "w_sg_pumpshotgunmk2_camo8",
            "w_sg_pumpshotgunmk2_camo9",
            "w_sg_pumpshotgunmk2_mag_ap",
            "w_sg_pumpshotgunmk2_mag_exp",
            "w_sg_pumpshotgunmk2_mag_hp",
            "w_sg_pumpshotgunmk2_mag_inc",
            "w_sg_pumpshotgunmk2_mag1",
            "w_sg_sawnoff",
            "w_sg_sawnoff_luxe",
            "w_sg_sweeper",
            "w_sg_sweeper_mag1",
            "w_smug_airmissile_01b",
            "w_smug_airmissile_02",
            "w_smug_bomb_01",
            "w_smug_bomb_02",
            "w_smug_bomb_03",
            "w_smug_bomb_04",
            "w_sr_heavysniper",
            "w_sr_heavysniper_mag1",
            "w_sr_heavysnipermk2",
            "w_sr_heavysnipermk2_mag_ap",
            "w_sr_heavysnipermk2_mag_ap2",
            "w_sr_heavysnipermk2_mag_fmj",
            "w_sr_heavysnipermk2_mag_inc",
            "w_sr_heavysnipermk2_mag1",
            "w_sr_heavysnipermk2_mag2",
            "w_sr_marksmanrifle",
            "w_sr_marksmanrifle_luxe",
            "w_sr_marksmanrifle_luxe_mag1",
            "w_sr_marksmanrifle_luxe_mag2",
            "w_sr_marksmanrifle_mag1",
            "w_sr_marksmanrifle_mag2",
            "w_sr_marksmanriflemk2",
            "w_sr_marksmanriflemk2_camo_ind",
            "w_sr_marksmanriflemk2_camo1",
            "w_sr_marksmanriflemk2_camo10",
            "w_sr_marksmanriflemk2_camo2",
            "w_sr_marksmanriflemk2_camo3",
            "w_sr_marksmanriflemk2_camo4",
            "w_sr_marksmanriflemk2_camo5",
            "w_sr_marksmanriflemk2_camo6",
            "w_sr_marksmanriflemk2_camo7",
            "w_sr_marksmanriflemk2_camo8",
            "w_sr_marksmanriflemk2_camo9",
            "w_sr_marksmanriflemk2_mag_ap",
            "w_sr_marksmanriflemk2_mag_fmj",
            "w_sr_marksmanriflemk2_mag_inc",
            "w_sr_marksmanriflemk2_mag_tr",
            "w_sr_marksmanriflemk2_mag1",
            "w_sr_marksmanriflemk2_mag2",
            "w_sr_mr_mk2_barrel_1",
            "w_sr_mr_mk2_barrel_2",
            "w_sr_precisionrifle_reh",
            "w_sr_sniperrifle",
            "w_sr_sniperrifle_luxe",
            "w_sr_sniperrifle_mag1",
            "w_sr_sniperrifle_mag1_luxe",
            "w_sr_w_sr_precisionrifle_reh_mag1",
        },
    },
    ["esx_basicneeds"] = {
        Props = {
            "prop_cs_burger_01",
            "prop_choc_ego",
            "ng_proc_food_ornge1a",
            "v_ret_ml_chips4",
            "prop_sandwich_01",
            "prop_ld_flow_bottle",
            "prop_ecola_can",
            "prop_ld_can_01",
            "prop_fib_coffee",
            "prop_amb_beer_bottle",
            "prop_wine_bot_01",
            "prop_vodka_bottle",
            "prop_cs_whiskey_bottle",
            "prop_tequila_bottle",
            "prop_cs_milk_01",
            "prop_rum_bottle",
            "prop_bottle_cognac",
            "prop_wine_white",
            "prop_cs_hotdog_01",
            "prop_taco_01",
            "prop_donut_01",
            "prop_donut_02",
            "prop_food_bs_chips",
            "p_amb_coffeecup_01",
        },
    },
    ["rpemotes"] = {
        Props = {
            'p_wine_glass_s',
            'p_wine_glass_s',
            'prop_beer_amopen',
            'p_wine_glass_s',
            'ba_prop_battle_whiskey_opaque_s',
            'ba_prop_battle_whiskey_opaque_s',
            'p_wine_glass_s',
            'prop_beer_logopen',
            'p_wine_glass_s',
            'p_wine_glass_s',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            "ba_prop_battle_hobby_horse",
            "ba_prop_battle_hobby_horse",
            "ba_prop_battle_hobby_horse",
            'lilprideflag1',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag8',
            'lilprideflag9',
            'lilprideflag9',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'lilprideflag1',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag8',
            'lilprideflag9',
            'lilprideflag9',
            'ind_prop_firework_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'prop_cs_sol_glasses',
            'lilprideflag1',
            'prop_cs_sol_glasses',
            'lilprideflag2',
            'prop_cs_sol_glasses',
            'lilprideflag3',
            'prop_cs_sol_glasses',
            'lilprideflag4',
            'prop_cs_sol_glasses',
            'lilprideflag5',
            'prop_cs_sol_glasses',
            'lilprideflag6',
            'prop_cs_sol_glasses',
            'lilprideflag7',
            'prop_cs_sol_glasses',
            'lilprideflag8',
            'prop_cs_sol_glasses',
            'lilprideflag9',
            'prop_cs_sol_glasses',
            'w_am_baseball',
            'prop_cs_burger_01',
            'prop_controller_01',
            'p_banknote_onedollar_s',
            'bkr_prop_scrunched_moneypage',
            'bkr_prop_money_wrapped_01',
            'ch_prop_ch_moneybag_01a',
            'p_ing_microphonel_01',
            'v_ilev_mr_rasberryclean',
            'v_ilev_mr_rasberryclean',
            'prop_tennis_ball',
            'prop_tennis_rack_01',
            'prop_single_rose',
            'prop_single_rose',
            'w_pi_pistol_luxe',
            'w_pi_pistol_luxe',
            'w_pi_stungun',
            'prop_aviators_01',
            'prop_aviators_01',
            'prop_cs_sol_glasses',
            'prop_cs_sol_glasses',
            'prop_cs_hotdog_01',
            'prop_cs_hotdog_01',
            'ba_prop_battle_sports_helmet',
            'prop_hard_hat_01',
            'prop_proxy_hat_01',
            'prop_aviators_01',
            'prop_proxy_hat_01',
            'prop_aviators_01',
            'prop_cs_steak',
            'prop_cs_steak',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag9',
            'ind_prop_firework_01',
            "ng_proc_cigarette01a",
            "p_amb_brolly_01",
            'p_amb_brolly_01',
            'prop_notepad_01',
            'prop_pencil_01',
            "hei_prop_heist_box",
            'bzzz_prop_gift_orange',
            'bzzz_prop_gift_purple',
            'bzzz_prop_cake_birthday_001',
            'bzzz_prop_cake_baby_001',
            'bzzz_prop_cake_casino001',
            'bzzz_prop_cake_love_001',
            'pata_cake',
            'pata_cake2',
            'pata_cake3',
            "bzzz_prop_cake_birthday_001",
            "bzzz_prop_cake_baby_001",
            "bzzz_prop_cake_casino001",
            "bzzz_prop_cake_love_001",
            "pata_cake",
            "pata_cake2",
            "pata_cake3",
            "prop_single_rose",
            "heart_balloon",
            'prop_cs_ciggy_01',
            'prop_cs_ciggy_01',
            'prop_cs_ciggy_01',
            'ba_prop_battle_vape_01',
            'xm3_prop_xm3_vape_01a',
            'hei_heist_sh_bong_01',
            'xm3_prop_xm3_bong_01a',
            'hei_heist_sh_bong_01',
            'xm3_prop_xm3_bong_01a',
            'prop_fishing_rod_01',
            'prop_fishing_rod_01',
            'prop_fishing_rod_01',
            "prop_ld_suitcase_01",
            "prop_security_case_01",
            "prop_boombox_01",
            "prop_cs_sol_glasses",
            'prop_ghettoblast_02',
            "prop_tool_box_04",
            "imp_prop_tool_box_01a",
            "xm3_prop_xm3_tool_box_01a",
            "xm3_prop_xm3_tool_box_02a",
            "prop_cs_street_binbag_01",
            "v_ret_ml_beerdus",
            "v_ret_ml_beeram",
            "v_ret_ml_beerpride",
            "v_ret_ml_beerbar",
            'prop_police_id_board',
            'p_amb_coffeecup_01',
            'prop_drink_whisky',
            'ba_prop_battle_whiskey_bottle_2_s',
            'prop_amb_beer_bottle',
            'prop_amb_beer_bottle',
            'p_cs_bottle_01',
            'p_cs_bottle_01',
            'p_cs_bottle_01',
            'ba_prop_battle_whiskey_bottle_2_s',
            'ba_prop_battle_whiskey_bottle_2_s',
            'prop_amb_beer_bottle',
            'v_res_tt_can01',
            'v_res_tt_can02',
            'h4_prop_h4_can_beer_01a',
            'prop_wine_rose',
            'prop_amb_beer_bottle',
            'prop_wine_rose',
            'prop_plastic_cup_02',
            'sf_prop_sf_apple_01b',
            'prop_taco_01',
            'prop_cs_hotdog_02',
            'prop_amb_donut',
            "p_amb_coffeecup_01",
            'bzzz_foodpack_donut002',
            'bzzz_foodpack_donut001',
            'bzzz_food_dessert_a',
            'bzzz_foodpack_croissant001',
            'bzzz_food_xmas_gingerbread_a',
            'bzzz_food_xmas_lollipop_a',
            'bzzz_food_xmas_lollipop_b',
            'bzzz_food_xmas_lollipop_c',
            'bzzz_food_xmas_lollipop_d',
            'bzzz_food_xmas_lollipop_e',
            'bzzz_food_xmas_macaroon_a',
            'bzzz_food_xmas_mug_a',
            'bzzz_food_xmas_mug_b',
            'bzzz_food_xmas_mulled_wine_a',
            'pata_christmasfood1',
            'pata_christmasfood2',
            'pata_christmasfood6',
            'pata_christmasfood8',
            "pata_christmasfood7",
            'h4_prop_h4_coke_spoon_01',
            'knjgh_pizzaslice1',
            'knjgh_pizzaslice1',
            'knjgh_pizzaslice2',
            'knjgh_pizzaslice3',
            'knjgh_pizzaslice4',
            'knjgh_pizzaslice5',
            'prop_cs_burger_01',
            'prop_cs_burger_01',
            'ba_prop_battle_sports_helmet',
            'prop_sandwich_01',
            'prop_ecola_can',
            'ng_proc_sodacan_01b',
            'v_ret_fh_bscup',
            'prop_cs_bs_cup',
            'prop_rpemotes_soda03',
            'prop_rpemotes_soda04',
            'prop_rpemotes_soda01',
            'prop_rpemotes_soda02',
            'prop_orang_can_01',
            'prop_rpemotes_soda01',
            'prop_rpemotes_soda02',
            'prop_rpemotes_soda03',
            'prop_rpemotes_soda04',
            'dumbbitchjuice',
            'brum_heartfrappe',
            'starbuckscup',
            "prop_energy_drink",
            "sf_prop_sf_can_01a",
            "sf_p_sf_grass_gls_s_01a",
            'brum_cherryshake_bubblegum',
            'brum_cherryshake_cherry',
            'brum_cherryshake_chocolate',
            'brum_cherryshake_coffee',
            'brum_cherryshake_doublechocolate',
            'brum_cherryshake_frappe',
            'brum_cherryshake_lemon',
            'brum_cherryshake_mint',
            'brum_cherryshake_strawberry',
            'brum_cherryshake_raspberry',
            'brum_cherryshake_salted',
            'brum_cherryshake_vanilla',
            'brum_cherryshake_raspberry',
            'brum_cherryshake_cherry',
            'brum_cherryshake_chocolate',
            'brum_cherryshake_coffee',
            'brum_cherryshake_doublechocolate',
            'brum_cherryshake_frappe',
            'brum_cherryshake_lemon',
            'brum_cherryshake_mint',
            'brum_cherryshake_strawberry',
            'brum_cherryshake_raspberry',
            'brum_cherryshake_salted',
            'brum_cherryshake_vanilla',
            'brum_cherryshake_vanilla',
            'prop_ecola_can',
            'ng_proc_sodacan_01b',
            "vw_prop_casino_water_bottle_01a",
            'prop_choc_ego',
            'prop_candy_pqs',
            'natty_lollipop_spiral01',
            'natty_lollipop_spiral02',
            'natty_lollipop_spiral03',
            'natty_lollipop_spiral04',
            'natty_lollipop_spiral05',
            'natty_lollipop_spiral06',
            "natty_lollipop_spin01",
            "natty_lollipop_spin02",
            "natty_lollipop_spin03",
            "natty_lollipop_spin04",
            "natty_lollipop_spin05",
            'natty_lollipop01',
            'bzzz_icecream_cherry',
            'bzzz_icecream_chocolate',
            'bzzz_icecream_lemon',
            'bzzz_icecream_pistachio',
            'bzzz_icecream_raspberry',
            'bzzz_icecream_stracciatella',
            'bzzz_icecream_strawberry',
            'bzzz_icecream_walnut',
            'prop_drink_redwine',
            'prop_champ_flute',
            'prop_drink_champ',
            'prop_cigar_02',
            'prop_cigar_01',
            'prop_acc_guitar_01',
            'prop_acc_guitar_01',
            'prop_el_guitar_01',
            'prop_el_guitar_03',
            "sf_prop_sf_guitar_case_01a",
            "prop_acc_guitar_01",
            "prop_el_guitar_01",
            "prop_el_guitar_02",
            "prop_el_guitar_03",
            "vw_prop_casino_art_guitar_01a",
            "sf_prop_sf_el_guitar_02a",
            "prop_acc_guitar_01",
            'prop_novel_01',
            'prop_snow_flower_02',
            'pata_freevalentinesday3',
            'v_ilev_mr_rasberryclean',
            'gremlin_plush',
            'p_michael_backpack_s',
            'p_amb_clipboard_01',
            'prop_tourist_map_01',
            "prop_tourist_map_01",
            'prop_beggers_sign_03',
            'prop_cliff_paper',
            'ng_proc_paper_news_quik',
            'ng_proc_paper_news_rag',
            'prop_porn_mag_02',
            'prop_cs_magazine',
            'prop_porn_mag_03',
            'v_res_tt_pornmag01',
            'v_res_tt_pornmag02',
            'v_res_tt_pornmag03',
            'v_res_tt_pornmag04',
            'prop_anim_cash_pile_01',
            'prop_pap_camera_01',
            "prop_ing_camera_01",
            'ba_prop_battle_champ_open',
            'p_cs_joint_02',
            'prop_amb_ciggy_01',
            "prop_ld_case_01",
            "prop_ld_case_01",
            "prop_gun_case_01",
            "prop_cs_tablet",
            "prop_cs_tablet",
            "sf_prop_sf_tablet_01a",
            "sf_prop_sf_tablet_01a",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_cs_hand_radio",
            "prop_cs_hand_radio",
            "prop_cs_hand_radio",
            "prop_cs_hand_radio",
            "prop_sponge_01",
            "prop_sponge_01",
            "prop_cs_protest_sign_01",
            "pride_sign_01",
            "prop_binoc_01",
            "prop_binoc_01",
            "prop_tennis_bag_01",
            'prop_tennis_rack_01',
            "prop_curl_bar_01",
            "prop_curl_bar_01",
            'prop_barbell_01',
            'prop_barbell_01',
            'prop_barbell_01',
            'v_res_tre_weight',
            'v_res_tre_weight',
            'v_res_tre_weight',
            'v_res_tre_weight',
            'prop_freeweight_01',
            "w_am_jerrycan",
            "w_am_jerrycan",
            "w_am_jerrycan",
            'prop_michael_backpack',
            "prop_sign_road_01a",
            "prop_sign_road_02a",
            "prop_sign_road_03d",
            "prop_sign_road_04a",
            "prop_sign_road_04w",
            "prop_sign_road_05a",
            "prop_sign_road_05t",
            "prop_sign_freewayentrance",
            "prop_snow_sign_road_01a",
            "prop_roadcone02b",
            "prop_food_bs_tray_03",
            "prop_food_bs_tray_02",
            "prop_food_cb_tray_02",
            "prop_food_tray_02",
            "prop_food_tray_03",
            "prop_food_bs_tray_02",
            'prop_food_bs_tray_03',
            "prop_food_cb_tray_02",
            'prop_food_cb_tray_02',
            "prop_food_tray_02",
            'prop_food_tray_03',
            "prop_food_tray_02",
            'prop_food_tray_02',
            "prop_food_bs_tray_02",
            "prop_food_bs_tray_02",
            "prop_food_bs_tray_03",
            "prop_food_cb_tray_02",
            "prop_food_tray_02",
            "prop_food_tray_02",
            "prop_pizza_box_02",
            "prop_food_bs_bag_01",
            "prop_food_cb_bag_01",
            "prop_food_bag1",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "h4_prop_h4_caviar_tin_01a",
            'h4_prop_h4_caviar_spoon_01a',
            "prop_cs_plate_01",
            'h4_prop_h4_caviar_spoon_01a',
            "prop_v_cam_01",
            "p_ing_microphonel_01",
            "prop_v_bmike_01",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "v_ilev_fos_mic",
            "v_ilev_fos_mic",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "prop_leaf_blower_01",
            "prop_fish_slice_01",
            "prop_veg_crop_03_pump",
            "prop_veg_crop_03_pump",
            "reh_prop_reh_lantern_pk_01a",
            "reh_prop_reh_lantern_pk_01b",
            "reh_prop_reh_lantern_pk_01c",
            "prop_cs_mop_s",
            "prop_cs_mop_s",
            'prop_cs_dildo_01',
            "prop_tool_rake",
            "prop_tool_rake",
            "prop_tool_rake",
            "prop_tool_rake",
            "prop_tool_broom",
            "prop_tool_broom",
            "prop_tool_broom",
            "prop_tool_broom",
            "vw_prop_vw_tray_01a",
            'prop_champ_cool',
            "prop_toilet_roll_01",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'prop_phone_taymckenzienz',
            'apa_mp_h_stn_chairarm_23',
            'prop_phone_taymckenzienz',
            'prop_phone_taymckenzienz',
            'prop_phone_taymckenzienz',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'p_wine_glass_s',
            'prop_phone_taymckenzienz',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'prop_amb_handbag_01',
            'prop_phone_taymckenzienz',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'prop_cs_dildo_01',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'p_wine_glass_s',
            'prop_phone_taymckenzienz',
            "v_res_tre_remote",
            "p_armchair_01_s",
            "ba_prop_battle_club_chair_03",
            "ba_prop_battle_club_chair_03",
            "ba_prop_battle_club_chair_03",
            "ba_prop_battle_club_chair_03",
            'ba_prop_club_laptop_dj_02',
            'ba_prop_battle_club_chair_02',
            'hei_prop_dlc_tablet',
            'ba_prop_battle_club_chair_02',
            'v_ilev_mp_bedsidebook',
            'ba_prop_battle_club_chair_02',
            "prop_tool_shovel",
            'prop_ld_shovel_dirt',
            "prop_bongos_01",
            "xm_prop_x17_bag_med_01a",
            "bkr_prop_duffel_bag_01a",
            "vw_prop_casino_shopping_bag_01a",
            "prop_shopping_bags02",
            "prop_cs_shopping_bag",
            'prop_carrier_bag_01',
            'prop_phone_taymckenzienz',
            'prop_amb_handbag_01',
            "prop_franklin_dl",
            "prop_fib_badge",
            "prop_michael_sec_id",
            "prop_trev_sec_id",
            "p_ld_id_card_002",
            "prop_cs_r_business_card",
            "prop_michael_sec_id",
            "prop_cop_badge",
            "bkr_prop_fakeid_singledriverl",
            "bkr_prop_fakeid_openpassport",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_wheel_tyre",
            "prop_golf_wood_01",
            "v_ret_gc_cashreg",
            "prop_weed_block_01",
            "bkr_prop_weed_bigbag_01a",
            "bkr_prop_weed_01_small_01c",
            "bkr_prop_weed_01_small_01b",
            "bkr_prop_weed_lrg_01b",
            "bkr_prop_weed_bucket_open_01a",
            "prop_skid_chair_02",
            "prop_skid_chair_02",
            "prop_skid_chair_02",
            "prop_single_rose",
            "prop_single_rose",
            "v_ret_ml_beerben1",
            "v_ret_ml_beerbla1",
            "v_ret_ml_beerjak1",
            "v_ret_ml_beerlog1",
            "v_ret_ml_beerpis1",
            "prop_beer_box_01",
            "prop_bin_08open",
            "prop_cs_bin_01",
            "prop_cs_bin_03",
            "prop_bin_08a",
            "prop_bin_07d",
            'prideflag1',
            'prideflag2',
            'prideflag3',
            'prideflag4',
            'prideflag5',
            'prideflag6',
            'prideflag7',
            'prideflag8',
            'prideflag9',
            'prop_cs_walking_stick',
            'prop_phone_taymckenzienz',
            'w_am_digiscanner',
            'w_am_digiscanner',
            'w_am_digiscanner',
            "prop_parking_wand_01",
            "prop_parking_wand_01",
            "prop_phone_taymckenzienz",
            'prop_mr_raspberry_01',
            'prop_cs_burger_01',
            "prop_ld_flow_bottle",
            "prop_surf_board_01",
            "xs_prop_arena_screen_tv_01",
            "prop_beach_ring_01",
            "bkr_prop_biker_case_shut",
            "prop_cash_case_01",
            "prop_cash_case_02",
            "ch_prop_ch_security_case_01a",
            "prop_suitcase_01c",
            'prop_suitcase_03',
            'prop_phone_taymckenzienz',
            "prop_suitcase_03",
            "prop_megaphone_01",
            "prop_megaphone_01",
            "prop_megaphone_01",
            "bzzz_event_easter_basket_b",
            'bzzz_event_easter_egg_d',
            "bzzz_event_easter_bunny_a",
            "prop_bskball_01",
            "prop_bskball_01",
            "prop_bskball_01",
            "prop_bskball_01",
            "bzzz_prop_torch_fire001",
            "bzzz_prop_torch_fire001",
            "prop_beer_am",
            "apple_1",
            'prop_controller_01',
            'prop_controller_01',
            'xm_prop_x17_laptop_lester_01',
            'prop_cs_bowie_knife',
            'ng_proc_cigpak01a',
            'ultra_ringcase',
            'pata_freevalentinesday',
            'pata_freevalentinesday2',
            'ind_prop_firework_01',
            'prop_tequila',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_hand_radio',
            'prop_cs_police_torch_02',
            "xm3_prop_xm3_pineapple_01a",
            "xm3_prop_xm3_present_01a",
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            "xm3_prop_xm3_papers_01a",
            'prop_ing_camera_01',
            'prop_ing_camera_01',
            'taymckenzienz_skateboard01',
            "taymckenzienz_skateboard02",
            "prop_cs_sol_glasses",
            'taymckenzienz_skateboard01',
            "taymckenzienz_skateboard01",
            "taymckenzienz_skateboard01",
            "prop_cs_sol_glasses",
            'taymckenzienz_skateboard02',
            "taymckenzienz_skateboard02",
            "taymckenzienz_skateboard02",
            "w_pi_revolver_b",
            'prop_cigar_01',
            "prop_riot_shield",
            "prop_ballistic_shield",
            "prop_fib_coffee",
            'prop_cs_burger_01',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'brum_heart',
            'prop_taymckenzienz_popcorn',
            'rpemotes_prop_saxophone01',
            'rpemotes_prop_saxophone02',
        }
    },
    ["dpemotes"] = {
        Props = {
            'p_wine_glass_s',
            'p_wine_glass_s',
            'prop_beer_amopen',
            'p_wine_glass_s',
            'ba_prop_battle_whiskey_opaque_s',
            'ba_prop_battle_whiskey_opaque_s',
            'p_wine_glass_s',
            'prop_beer_logopen',
            'p_wine_glass_s',
            'p_wine_glass_s',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            "ba_prop_battle_hobby_horse",
            "ba_prop_battle_hobby_horse",
            "ba_prop_battle_hobby_horse",
            'lilprideflag1',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag8',
            'lilprideflag9',
            'lilprideflag9',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'lilprideflag1',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag8',
            'lilprideflag9',
            'lilprideflag9',
            'ind_prop_firework_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'prop_cs_sol_glasses',
            'lilprideflag1',
            'prop_cs_sol_glasses',
            'lilprideflag2',
            'prop_cs_sol_glasses',
            'lilprideflag3',
            'prop_cs_sol_glasses',
            'lilprideflag4',
            'prop_cs_sol_glasses',
            'lilprideflag5',
            'prop_cs_sol_glasses',
            'lilprideflag6',
            'prop_cs_sol_glasses',
            'lilprideflag7',
            'prop_cs_sol_glasses',
            'lilprideflag8',
            'prop_cs_sol_glasses',
            'lilprideflag9',
            'prop_cs_sol_glasses',
            'w_am_baseball',
            'prop_cs_burger_01',
            'prop_controller_01',
            'p_banknote_onedollar_s',
            'bkr_prop_scrunched_moneypage',
            'bkr_prop_money_wrapped_01',
            'ch_prop_ch_moneybag_01a',
            'p_ing_microphonel_01',
            'v_ilev_mr_rasberryclean',
            'v_ilev_mr_rasberryclean',
            'prop_tennis_ball',
            'prop_tennis_rack_01',
            'prop_single_rose',
            'prop_single_rose',
            'w_pi_pistol_luxe',
            'w_pi_pistol_luxe',
            'w_pi_stungun',
            'prop_aviators_01',
            'prop_aviators_01',
            'prop_cs_sol_glasses',
            'prop_cs_sol_glasses',
            'prop_cs_hotdog_01',
            'prop_cs_hotdog_01',
            'ba_prop_battle_sports_helmet',
            'prop_hard_hat_01',
            'prop_proxy_hat_01',
            'prop_aviators_01',
            'prop_proxy_hat_01',
            'prop_aviators_01',
            'prop_cs_steak',
            'prop_cs_steak',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag9',
            'ind_prop_firework_01',
            "ng_proc_cigarette01a",
            "p_amb_brolly_01",
            'p_amb_brolly_01',
            'prop_notepad_01',
            'prop_pencil_01',
            "hei_prop_heist_box",
            'bzzz_prop_gift_orange',
            'bzzz_prop_gift_purple',
            'bzzz_prop_cake_birthday_001',
            'bzzz_prop_cake_baby_001',
            'bzzz_prop_cake_casino001',
            'bzzz_prop_cake_love_001',
            'pata_cake',
            'pata_cake2',
            'pata_cake3',
            "bzzz_prop_cake_birthday_001",
            "bzzz_prop_cake_baby_001",
            "bzzz_prop_cake_casino001",
            "bzzz_prop_cake_love_001",
            "pata_cake",
            "pata_cake2",
            "pata_cake3",
            "prop_single_rose",
            "heart_balloon",
            'prop_cs_ciggy_01',
            'prop_cs_ciggy_01',
            'prop_cs_ciggy_01',
            'ba_prop_battle_vape_01',
            'xm3_prop_xm3_vape_01a',
            'hei_heist_sh_bong_01',
            'xm3_prop_xm3_bong_01a',
            'hei_heist_sh_bong_01',
            'xm3_prop_xm3_bong_01a',
            'prop_fishing_rod_01',
            'prop_fishing_rod_01',
            'prop_fishing_rod_01',
            "prop_ld_suitcase_01",
            "prop_security_case_01",
            "prop_boombox_01",
            "prop_cs_sol_glasses",
            'prop_ghettoblast_02',
            "prop_tool_box_04",
            "imp_prop_tool_box_01a",
            "xm3_prop_xm3_tool_box_01a",
            "xm3_prop_xm3_tool_box_02a",
            "prop_cs_street_binbag_01",
            "v_ret_ml_beerdus",
            "v_ret_ml_beeram",
            "v_ret_ml_beerpride",
            "v_ret_ml_beerbar",
            'prop_police_id_board',
            'p_amb_coffeecup_01',
            'prop_drink_whisky',
            'ba_prop_battle_whiskey_bottle_2_s',
            'prop_amb_beer_bottle',
            'prop_amb_beer_bottle',
            'p_cs_bottle_01',
            'p_cs_bottle_01',
            'p_cs_bottle_01',
            'ba_prop_battle_whiskey_bottle_2_s',
            'ba_prop_battle_whiskey_bottle_2_s',
            'prop_amb_beer_bottle',
            'v_res_tt_can01',
            'v_res_tt_can02',
            'h4_prop_h4_can_beer_01a',
            'prop_wine_rose',
            'prop_amb_beer_bottle',
            'prop_wine_rose',
            'prop_plastic_cup_02',
            'sf_prop_sf_apple_01b',
            'prop_taco_01',
            'prop_cs_hotdog_02',
            'prop_amb_donut',
            'bzzz_foodpack_donut002',
            'bzzz_foodpack_donut001',
            'bzzz_food_dessert_a',
            'bzzz_foodpack_croissant001',
            'bzzz_food_xmas_gingerbread_a',
            'bzzz_food_xmas_lollipop_a',
            'bzzz_food_xmas_lollipop_b',
            'bzzz_food_xmas_lollipop_c',
            'bzzz_food_xmas_lollipop_d',
            'bzzz_food_xmas_lollipop_e',
            'bzzz_food_xmas_macaroon_a',
            'bzzz_food_xmas_mug_a',
            'bzzz_food_xmas_mug_b',
            'bzzz_food_xmas_mulled_wine_a',
            'pata_christmasfood1',
            'pata_christmasfood2',
            'pata_christmasfood6',
            'pata_christmasfood8',
            "pata_christmasfood7",
            'h4_prop_h4_coke_spoon_01',
            'knjgh_pizzaslice1',
            'knjgh_pizzaslice1',
            'knjgh_pizzaslice2',
            'knjgh_pizzaslice3',
            'knjgh_pizzaslice4',
            'knjgh_pizzaslice5',
            'prop_cs_burger_01',
            'prop_cs_burger_01',
            'ba_prop_battle_sports_helmet',
            'prop_sandwich_01',
            'prop_ecola_can',
            'ng_proc_sodacan_01b',
            'v_ret_fh_bscup',
            'prop_cs_bs_cup',
            'prop_rpemotes_soda03',
            'prop_rpemotes_soda04',
            'prop_rpemotes_soda01',
            'prop_rpemotes_soda02',
            'prop_orang_can_01',
            'prop_rpemotes_soda01',
            'prop_rpemotes_soda02',
            'prop_rpemotes_soda03',
            'prop_rpemotes_soda04',
            'dumbbitchjuice',
            'brum_heartfrappe',
            'starbuckscup',
            "prop_energy_drink",
            "sf_prop_sf_can_01a",
            "sf_p_sf_grass_gls_s_01a",
            'brum_cherryshake_bubblegum',
            'brum_cherryshake_cherry',
            'brum_cherryshake_chocolate',
            'brum_cherryshake_coffee',
            'brum_cherryshake_doublechocolate',
            'brum_cherryshake_frappe',
            'brum_cherryshake_lemon',
            'brum_cherryshake_mint',
            'brum_cherryshake_strawberry',
            'brum_cherryshake_raspberry',
            'brum_cherryshake_salted',
            'brum_cherryshake_vanilla',
            'brum_cherryshake_raspberry',
            'brum_cherryshake_cherry',
            'brum_cherryshake_chocolate',
            'brum_cherryshake_coffee',
            'brum_cherryshake_doublechocolate',
            'brum_cherryshake_frappe',
            'brum_cherryshake_lemon',
            'brum_cherryshake_mint',
            'brum_cherryshake_strawberry',
            'brum_cherryshake_raspberry',
            'brum_cherryshake_salted',
            'brum_cherryshake_vanilla',
            'brum_cherryshake_vanilla',
            'prop_ecola_can',
            'ng_proc_sodacan_01b',
            "vw_prop_casino_water_bottle_01a",
            'prop_choc_ego',
            'prop_candy_pqs',
            'natty_lollipop_spiral01',
            'natty_lollipop_spiral02',
            'natty_lollipop_spiral03',
            'natty_lollipop_spiral04',
            'natty_lollipop_spiral05',
            'natty_lollipop_spiral06',
            "natty_lollipop_spin01",
            "natty_lollipop_spin02",
            "natty_lollipop_spin03",
            "natty_lollipop_spin04",
            "natty_lollipop_spin05",
            'natty_lollipop01',
            'bzzz_icecream_cherry',
            'bzzz_icecream_chocolate',
            'bzzz_icecream_lemon',
            'bzzz_icecream_pistachio',
            'bzzz_icecream_raspberry',
            'bzzz_icecream_stracciatella',
            'bzzz_icecream_strawberry',
            'bzzz_icecream_walnut',
            'prop_drink_redwine',
            'prop_champ_flute',
            'prop_drink_champ',
            'prop_cigar_02',
            'prop_cigar_01',
            'prop_acc_guitar_01',
            'prop_acc_guitar_01',
            'prop_el_guitar_01',
            'prop_el_guitar_03',
            "sf_prop_sf_guitar_case_01a",
            "prop_acc_guitar_01",
            "prop_el_guitar_01",
            "prop_el_guitar_02",
            "prop_el_guitar_03",
            "vw_prop_casino_art_guitar_01a",
            "sf_prop_sf_el_guitar_02a",
            "prop_acc_guitar_01",
            'prop_novel_01',
            'prop_snow_flower_02',
            'pata_freevalentinesday3',
            'v_ilev_mr_rasberryclean',
            'gremlin_plush',
            'p_michael_backpack_s',
            'p_amb_clipboard_01',
            'prop_tourist_map_01',
            "prop_tourist_map_01",
            'prop_beggers_sign_03',
            'prop_cliff_paper',
            'ng_proc_paper_news_quik',
            'ng_proc_paper_news_rag',
            'prop_porn_mag_02',
            'prop_cs_magazine',
            'prop_porn_mag_03',
            'v_res_tt_pornmag01',
            'v_res_tt_pornmag02',
            'v_res_tt_pornmag03',
            'v_res_tt_pornmag04',
            'prop_anim_cash_pile_01',
            'prop_pap_camera_01',
            "prop_ing_camera_01",
            'ba_prop_battle_champ_open',
            'p_cs_joint_02',
            'prop_amb_ciggy_01',
            "prop_ld_case_01",
            "prop_ld_case_01",
            "prop_gun_case_01",
            "prop_cs_tablet",
            "prop_cs_tablet",
            "sf_prop_sf_tablet_01a",
            "sf_prop_sf_tablet_01a",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_cs_hand_radio",
            "prop_cs_hand_radio",
            "prop_cs_hand_radio",
            "prop_cs_hand_radio",
            "prop_sponge_01",
            "prop_sponge_01",
            "prop_cs_protest_sign_01",
            "pride_sign_01",
            "prop_binoc_01",
            "prop_binoc_01",
            "prop_tennis_bag_01",
            'prop_tennis_rack_01',
            "prop_curl_bar_01",
            "prop_curl_bar_01",
            'prop_barbell_01',
            'prop_barbell_01',
            'prop_barbell_01',
            'v_res_tre_weight',
            'v_res_tre_weight',
            'v_res_tre_weight',
            'v_res_tre_weight',
            'prop_freeweight_01',
            "w_am_jerrycan",
            "w_am_jerrycan",
            "w_am_jerrycan",
            'prop_michael_backpack',
            "prop_sign_road_01a",
            "prop_sign_road_02a",
            "prop_sign_road_03d",
            "prop_sign_road_04a",
            "prop_sign_road_04w",
            "prop_sign_road_05a",
            "prop_sign_road_05t",
            "prop_sign_freewayentrance",
            "prop_snow_sign_road_01a",
            "prop_roadcone02b",
            "prop_food_bs_tray_03",
            "prop_food_bs_tray_02",
            "prop_food_cb_tray_02",
            "prop_food_tray_02",
            "prop_food_tray_03",
            "prop_food_bs_tray_02",
            'prop_food_bs_tray_03',
            "prop_food_cb_tray_02",
            'prop_food_cb_tray_02',
            "prop_food_tray_02",
            'prop_food_tray_03',
            "prop_food_tray_02",
            'prop_food_tray_02',
            "prop_food_bs_tray_02",
            "prop_food_bs_tray_02",
            "prop_food_bs_tray_03",
            "prop_food_cb_tray_02",
            "prop_food_tray_02",
            "prop_food_tray_02",
            "prop_pizza_box_02",
            "prop_food_bs_bag_01",
            "prop_food_cb_bag_01",
            "prop_food_bag1",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "prop_cs_spray_can",
            "h4_prop_h4_caviar_tin_01a",
            'h4_prop_h4_caviar_spoon_01a',
            "prop_cs_plate_01",
            'h4_prop_h4_caviar_spoon_01a',
            "prop_v_cam_01",
            "p_ing_microphonel_01",
            "prop_v_bmike_01",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "v_ilev_fos_mic",
            "v_ilev_fos_mic",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "sf_prop_sf_mic_01a",
            "prop_leaf_blower_01",
            "prop_fish_slice_01",
            "prop_veg_crop_03_pump",
            "prop_veg_crop_03_pump",
            "reh_prop_reh_lantern_pk_01a",
            "reh_prop_reh_lantern_pk_01b",
            "reh_prop_reh_lantern_pk_01c",
            "prop_cs_mop_s",
            "prop_cs_mop_s",
            'prop_cs_dildo_01',
            "prop_tool_rake",
            "prop_tool_rake",
            "prop_tool_rake",
            "prop_tool_rake",
            "prop_tool_broom",
            "prop_tool_broom",
            "prop_tool_broom",
            "prop_tool_broom",
            "vw_prop_vw_tray_01a",
            'prop_champ_cool',
            "prop_toilet_roll_01",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'prop_phone_taymckenzienz',
            'apa_mp_h_stn_chairarm_23',
            'prop_phone_taymckenzienz',
            'prop_phone_taymckenzienz',
            'prop_phone_taymckenzienz',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'p_wine_glass_s',
            'prop_phone_taymckenzienz',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'prop_amb_handbag_01',
            'prop_phone_taymckenzienz',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'prop_cs_dildo_01',
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            'p_wine_glass_s',
            'prop_phone_taymckenzienz',
            "v_res_tre_remote",
            "p_armchair_01_s",
            "ba_prop_battle_club_chair_03",
            "ba_prop_battle_club_chair_03",
            "ba_prop_battle_club_chair_03",
            "ba_prop_battle_club_chair_03",
            'ba_prop_club_laptop_dj_02',
            'ba_prop_battle_club_chair_02',
            'hei_prop_dlc_tablet',
            'ba_prop_battle_club_chair_02',
            'v_ilev_mp_bedsidebook',
            'ba_prop_battle_club_chair_02',
            "prop_tool_shovel",
            'prop_ld_shovel_dirt',
            "prop_bongos_01",
            "xm_prop_x17_bag_med_01a",
            "bkr_prop_duffel_bag_01a",
            "vw_prop_casino_shopping_bag_01a",
            "prop_shopping_bags02",
            "prop_cs_shopping_bag",
            'prop_carrier_bag_01',
            'prop_phone_taymckenzienz',
            'prop_amb_handbag_01',
            "prop_franklin_dl",
            "prop_fib_badge",
            "prop_michael_sec_id",
            "prop_trev_sec_id",
            "p_ld_id_card_002",
            "prop_cs_r_business_card",
            "prop_michael_sec_id",
            "prop_cop_badge",
            "bkr_prop_fakeid_singledriverl",
            "bkr_prop_fakeid_openpassport",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_phone_taymckenzienz",
            "prop_wheel_tyre",
            "prop_golf_wood_01",
            "v_ret_gc_cashreg",
            "prop_weed_block_01",
            "bkr_prop_weed_bigbag_01a",
            "bkr_prop_weed_01_small_01c",
            "bkr_prop_weed_01_small_01b",
            "bkr_prop_weed_lrg_01b",
            "bkr_prop_weed_bucket_open_01a",
            "prop_skid_chair_02",
            "prop_skid_chair_02",
            "prop_skid_chair_02",
            "prop_single_rose",
            "prop_single_rose",
            "v_ret_ml_beerben1",
            "v_ret_ml_beerbla1",
            "v_ret_ml_beerjak1",
            "v_ret_ml_beerlog1",
            "v_ret_ml_beerpis1",
            "prop_beer_box_01",
            "prop_bin_08open",
            "prop_cs_bin_01",
            "prop_cs_bin_03",
            "prop_bin_08a",
            "prop_bin_07d",
            'prideflag1',
            'prideflag2',
            'prideflag3',
            'prideflag4',
            'prideflag5',
            'prideflag6',
            'prideflag7',
            'prideflag8',
            'prideflag9',
            'prop_cs_walking_stick',
            'prop_phone_taymckenzienz',
            'w_am_digiscanner',
            'w_am_digiscanner',
            'w_am_digiscanner',
            "prop_parking_wand_01",
            "prop_parking_wand_01",
            "prop_phone_taymckenzienz",
            'prop_mr_raspberry_01',
            'prop_cs_burger_01',
            "prop_ld_flow_bottle",
            "prop_surf_board_01",
            "xs_prop_arena_screen_tv_01",
            "prop_beach_ring_01",
            "bkr_prop_biker_case_shut",
            "prop_cash_case_01",
            "prop_cash_case_02",
            "ch_prop_ch_security_case_01a",
            "prop_suitcase_01c",
            'prop_suitcase_03',
            'prop_phone_taymckenzienz',
            "prop_suitcase_03",
            "prop_megaphone_01",
            "prop_megaphone_01",
            "prop_megaphone_01",
            "bzzz_event_easter_basket_b",
            'bzzz_event_easter_egg_d',
            "bzzz_event_easter_bunny_a",
            "prop_bskball_01",
            "prop_bskball_01",
            "prop_bskball_01",
            "prop_bskball_01",
            "bzzz_prop_torch_fire001",
            "bzzz_prop_torch_fire001",
            "prop_beer_am",
            "apple_1",
            'prop_controller_01',
            'prop_controller_01',
            'xm_prop_x17_laptop_lester_01',
            'prop_cs_bowie_knife',
            'ng_proc_cigpak01a',
            'ultra_ringcase',
            'pata_freevalentinesday',
            'pata_freevalentinesday2',
            'ind_prop_firework_01',
            'prop_tequila',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_hand_radio',
            'prop_cs_police_torch_02',
            "xm3_prop_xm3_pineapple_01a",
            "xm3_prop_xm3_present_01a",
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            "xm3_prop_xm3_papers_01a",
            'prop_ing_camera_01',
            'prop_ing_camera_01',
            'taymckenzienz_skateboard01',
            "taymckenzienz_skateboard02",
            "prop_cs_sol_glasses",
            'taymckenzienz_skateboard01',
            "taymckenzienz_skateboard01",
            "taymckenzienz_skateboard01",
            "prop_cs_sol_glasses",
            'taymckenzienz_skateboard02',
            "taymckenzienz_skateboard02",
            "taymckenzienz_skateboard02",
            "w_pi_revolver_b",
            'prop_cigar_01',
            "prop_riot_shield",
            "prop_ballistic_shield",
            "prop_fib_coffee",
            'prop_cs_burger_01',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'brum_heart',
            'prop_taymckenzienz_popcorn',
            'rpemotes_prop_saxophone01',
            'rpemotes_prop_saxophone02',
        }
    },
    ["scully_emotemenu"] = {
        Props = {
            'prop_big_shit_02',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'lilprideflag1',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag8',
            'lilprideflag9',
            'lilprideflag9',
            'w_am_baseball',
            'prop_cs_burger_01',
            'prop_controller_01',
            'ba_prop_battle_glowstick_01',
            'ba_prop_battle_glowstick_01',
            'prop_cs_sol_glasses',
            'lilprideflag1',
            'prop_cs_sol_glasses',
            'lilprideflag2',
            'prop_cs_sol_glasses',
            'lilprideflag3',
            'prop_cs_sol_glasses',
            'lilprideflag4',
            'prop_cs_sol_glasses',
            'lilprideflag5',
            'prop_cs_sol_glasses',
            'lilprideflag6',
            'prop_cs_sol_glasses',
            'lilprideflag7',
            'prop_cs_sol_glasses',
            'lilprideflag8',
            'prop_cs_sol_glasses',
            'lilprideflag9',
            'prop_cs_sol_glasses',
            'p_banknote_onedollar_s',
            'bkr_prop_scrunched_moneypage',
            'bkr_prop_money_wrapped_01',
            'ch_prop_ch_moneybag_01a',
            'w_pi_pistol_luxe',
            'prop_aviators_01',
            'prop_aviators_01',
            'prop_cs_sol_glasses',
            'prop_cs_sol_glasses',
            'w_pi_pistol_luxe',
            'prop_proxy_hat_01',
            'prop_aviators_01',
            'prop_proxy_hat_01',
            'prop_aviators_01',
            'prop_cs_hotdog_01',
            'prop_cs_hotdog_01',
            'ba_prop_battle_sports_helmet',
            'prop_hard_hat_01',
            'p_ing_microphonel_01',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag1',
            'lilprideflag2',
            'lilprideflag3',
            'lilprideflag4',
            'lilprideflag5',
            'lilprideflag6',
            'lilprideflag7',
            'lilprideflag8',
            'lilprideflag9',
            'prop_single_rose',
            'prop_single_rose',
            'prop_cs_steak',
            'prop_cs_steak',
            'w_pi_stungun',
            'v_ilev_mr_rasberryclean',
            'v_ilev_mr_rasberryclean',
            'prop_tennis_ball',
            'prop_tennis_rack_01',
            'sf_prop_sf_apple_01b',
            'h4_prop_h4_caviar_tin_01a',
            'h4_prop_h4_caviar_spoon_01a',
            'prop_cs_bowl_01',
            'h4_prop_h4_caviar_spoon_01a',
            'prop_beerdusche',
            'prop_amb_beer_bottle',
            'prop_amb_beer_bottle',
            'prop_beer_logopen',
            'prop_beer_amopen',
            'prop_beer_pissh',
            'prop_amb_beer_bottle',
            'prop_cs_beer_bot_02',
            'prop_bottle_brandy',
            'prop_cs_burger_01',
            'prop_food_bs_coffee',
            'prop_food_bs_juice01',
            'prop_food_bs_chips',
            'scully_boba',
            'scully_boba2',
            'scully_boba3',
            'prop_candy_pqs',
            'bzzz_food_xmas_lollipop_a',
            'bzzz_food_xmas_lollipop_b',
            'bzzz_food_xmas_lollipop_c',
            'bzzz_food_xmas_lollipop_d',
            'bzzz_food_xmas_lollipop_e',
            'prop_drink_champ',
            'v_ret_ml_chips2',
            'p_amb_coffeecup_01',
            'bzzz_foodpack_croissant001',
            'prop_plastic_cup_02',
            'prop_amb_donut',
            'prop_donut_02',
            'bzzz_foodpack_donut002',
            'bzzz_foodpack_donut001',
            'prop_ld_flow_bottle',
            'prop_cs_burger_01',
            'prop_ecola_can',
            'prop_choc_ego',
            'bzzz_animal_fish002',
            'bzzz_food_xmas_gingerbread_a',
            'prop_cs_hotdog_01',
            'prop_cs_hotdog_02',
            'bzzz_icecream_cherry',
            'bzzz_icecream_chocolate',
            'bzzz_icecream_lemon',
            'bzzz_icecream_pistachio',
            'bzzz_icecream_raspberry',
            'bzzz_icecream_stracciatella',
            'bzzz_icecream_strawberry',
            'bzzz_icecream_walnut',
            'natty_lollipop_spiral01',
            'natty_lollipop_spiral02',
            'natty_lollipop_spiral03',
            'natty_lollipop_spiral04',
            'natty_lollipop_spiral05',
            'natty_lollipop_spiral06',
            'natty_lollipop_spin01',
            'natty_lollipop_spin02',
            'natty_lollipop_spin03',
            'natty_lollipop_spin04',
            'natty_lollipop_spin05',
            'natty_lollipop01',
            'bzzz_food_xmas_macaroon_a',
            'bzzz_food_dessert_a',
            'v_res_tt_milk',
            'scully_pho',
            'scully_spoon_pho',
            'scully_pho',
            'prop_pineapple',
            'v_res_tt_pizzaplate',
            'prop_wine_rose',
            'prop_rum_bottle',
            'prop_sandwich_01',
            'v_res_tt_can03',
            'prop_taco_01',
            'prop_tequila_bottle',
            'prop_food_bs_burger2',
            'prop_vodka_bottle',
            'prop_wheat_grass_glass',
            'prop_wheat_grass_half',
            'prop_cs_whiskey_bottle',
            'prop_wine_white',
            'bzzz_food_xmas_mug_a',
            'bzzz_food_xmas_mug_b',
            'bzzz_food_xmas_mulled_wine_a',
            'prop_suitcase_01c',
            'p_michael_backpack_s',
            'prop_bskball_01',
            'prop_bskball_01',
            'prop_bskball_01',
            'prop_bskball_01',
            'prop_fish_slice_01',
            'prop_beach_ring_01',
            'v_ret_ml_beerdus',
            'v_ret_ml_beeram',
            'v_ret_ml_beerpride',
            'v_ret_ml_beerbar',
            'prop_amb_beer_bottle',
            'prop_amb_beer_bottle',
            'prop_beggers_sign_03',
            'prop_binoc_01',
            'prop_binoc_01',
            'hei_heist_sh_bong_01',
            'xm3_prop_xm3_bong_01a',
            'prop_bongos_01',
            'prop_novel_01',
            'prop_boombox_01',
            'prop_cs_sol_glasses',
            'prop_ghettoblast_02',
            'prop_snow_flower_02',
            'hei_prop_heist_box',
            'prop_ld_case_01',
            'prop_ld_case_01',
            'prop_tool_broom',
            'prop_tool_broom',
            'prop_tool_broom',
            'prop_tool_broom',
            'prop_pap_camera_01',
            'scr_bike_cfid_camera_flash',
            'prop_ing_camera_01',
            'scr_bike_cfid_camera_flash',
            'bzzz_pizzahut_cup_a',
            'prop_food_bs_bag_01',
            'prop_food_cb_bag_01',
            'prop_food_bag1',
            'bzzz_pizzahut_menu_a',
            'prop_pizza_box_02',
            'bzzz_pizzahut_box_a',
            'bkr_prop_biker_case_shut',
            'prop_cash_case_01',
            'prop_cash_case_02',
            'ch_prop_ch_security_case_01a',
            'v_ret_ml_beerben1',
            'v_ret_ml_beerbla1',
            'v_ret_ml_beerjak1',
            'v_ret_ml_beerlog1',
            'v_ret_ml_beerpis1',
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
            'prop_beer_box_01',
            'prop_mp_cone_02',
            'prop_mp_cone_02',
            'prop_mp_cone_02',
            'prop_mp_cone_02',
            'prop_mp_cone_02',
            'prop_mp_cone_02',
            'ba_prop_battle_champ_open',
            'scr_ba_club_champagne_spray',
            'vw_prop_vw_tray_01a',
            'prop_champ_cool',
            'prop_amb_ciggy_01',
            'prop_cigar_02',
            'prop_cigar_01',
            'prop_sponge_01',
            'prop_sponge_01',
            'p_amb_clipboard_01',
            'prop_roadcone02b',
            'prop_parking_wand_01',
            'prop_parking_wand_01',
            'prop_cs_bowie_knife',
            'ng_proc_cigpak01a',
            'prop_tool_shovel',
            'prop_ld_shovel_dirt',
            'w_am_digiscanner',
            'w_am_digiscanner',
            'w_am_digiscanner',
            'bkr_prop_duffel_bag_01a',
            'prop_fishing_rod_01',
            'prop_fishing_rod_01',
            'prop_fishing_rod_01',
            'prop_champ_flute',
            'prop_food_bs_tray_03',
            'prop_food_bs_tray_02',
            'prop_food_cb_tray_02',
            'prop_food_tray_02',
            'prop_food_tray_03',
            'prop_food_bs_tray_02',
            'prop_food_bs_tray_03',
            'prop_food_cb_tray_02',
            'prop_food_cb_tray_02',
            'prop_food_tray_02',
            'prop_food_tray_03',
            'prop_food_tray_02',
            'prop_food_tray_02',
            'prop_food_bs_tray_02',
            'prop_food_bs_tray_02',
            'prop_food_bs_tray_03',
            'prop_food_cb_tray_02',
            'prop_food_tray_02',
            'prop_food_tray_02',
            'bzzz_prop_torch_fire001',
            'bzzz_prop_torch_fire001',
            'w_am_jerrycan',
            'w_am_jerrycan',
            'prop_controller_01',
            'prop_cs_street_binbag_01',
            'prop_bin_08open',
            'prop_cs_bin_01',
            'prop_cs_bin_03',
            'prop_bin_08a',
            'prop_bin_07d',
            'bzzz_prop_gift_purple',
            'bzzz_prop_gift_orange',
            'bzzz_prop_gift_jewel',
            'bzzz_prop_gift_bonbonier',
            'prop_golf_wood_01',
            'prop_acc_guitar_01',
            'prop_acc_guitar_01',
            'prop_acc_guitar_01',
            'prop_acc_guitar_01',
            'prop_el_guitar_01',
            'prop_el_guitar_02',
            'prop_el_guitar_03',
            'sf_prop_sf_guitar_case_01a',
            'prop_acc_guitar_01',
            'prop_el_guitar_01',
            'prop_el_guitar_02',
            'prop_el_guitar_03',
            'vw_prop_casino_art_guitar_01a',
            'sf_prop_sf_el_guitar_02a',
            'prop_el_guitar_01',
            'prop_el_guitar_03',
            'prop_acc_guitar_01',
            'prop_acc_guitar_01',
            'prop_el_guitar_01',
            'prop_el_guitar_03',
            'prop_el_guitar_02',
            'prop_gun_case_01',
            'w_am_jerrycan',
            'prop_michael_backpack',
            'ind_prop_firework_01',
            'scr_indep_firework_trail_spawn',
            'ind_prop_firework_01',
            'scr_indep_firework_trail_spawn',
            'ind_prop_firework_01',
            'scr_indep_firework_trail_spawn',
            'ind_prop_firework_01',
            'scr_mich4_firework_trailburst',
            'prop_mr_raspberry_01',
            'prop_franklin_dl',
            'prop_fib_badge',
            'p_ld_id_card_002',
            'prop_michael_sec_id',
            'prop_lspd_badge',
            'bkr_prop_fakeid_singledriverl',
            'bkr_prop_fakeid_openpassport',
            'prop_cs_dildo_01',
            'p_cs_joint_02',
            'prop_skid_chair_02',
            'prop_skid_chair_02',
            'prop_skid_chair_02',
            'prop_leaf_blower_01',
            'ent_anim_leaf_blower',
            'prop_phone_ing',
            'prop_anim_cash_pile_01',
            'scr_xs_money_rain',
            'prop_tourist_map_01',
            'prop_tourist_map_01',
            'xm_prop_x17_bag_med_01a',
            'prop_megaphone_01',
            'prop_megaphone_01',
            'prop_megaphone_01',
            'prop_cs_mop_s',
            'prop_cs_mop_s',
            'prop_police_id_board',
            'bzzz_murder_axe001',
            'p_bloodsplat_s',
            'w_pi_heavypistol',
            'p_bloodsplat_s',
            'bzzz_murder_machete001',
            'p_bloodsplat_s',
            'prop_v_bmike_01',
            'prop_v_cam_01',
            'p_ing_microphonel_01',
            'prop_cliff_paper',
            'ng_proc_paper_news_quik',
            'ng_proc_paper_news_rag',
            'prop_notepad_01',
            'prop_pencil_01',
            'prop_cs_walking_stick',
            'prop_cs_walking_stick',
            'prop_phone_ing',
            'prideflag1',
            'prideflag2',
            'prideflag3',
            'prideflag4',
            'prideflag5',
            'prideflag6',
            'prideflag7',
            'prideflag8',
            'prideflag9',
            'scr_trev_puke',
            'scr_trev_puke',
            'scr_trev_puke',
            'prop_phone_ing',
            'xm3_prop_xm3_papers_01a',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_police_torch_02',
            'prop_cs_hand_radio',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_porn_mag_02',
            'prop_cs_magazine',
            'prop_porn_mag_03',
            'v_res_tt_pornmag01',
            'v_res_tt_pornmag02',
            'v_res_tt_pornmag03',
            'v_res_tt_pornmag04',
            'bkr_prop_weed_01_small_01c',
            'bkr_prop_weed_01_small_01b',
            'bkr_prop_weed_lrg_01b',
            'ultra_ringcase',
            'prop_cs_protest_sign_01',
            'pride_sign_01',
            'scully_blm',
            'prop_veg_crop_03_pump',
            'prop_veg_crop_03_pump',
            'reh_prop_reh_lantern_pk_01a',
            'reh_prop_reh_lantern_pk_01b',
            'reh_prop_reh_lantern_pk_01c',
            'prop_tool_rake',
            'prop_tool_rake',
            'prop_tool_rake',
            'prop_tool_rake',
            'v_ret_gc_cashreg',
            'prop_single_rose',
            'prop_single_rose',
            'prop_single_rose',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_ld_handbag',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_cs_dildo_01',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_toilet_roll_01',
            'ent_anim_dog_poo',
            'vw_prop_casino_shopping_bag_01a',
            'prop_shopping_bags02',
            'prop_cs_shopping_bag',
            'v_res_tre_remote',
            'prop_cs_ciggy_01',
            'prop_cs_ciggy_01',
            'prop_cs_ciggy_01',
            'bzzz_cigarpack_cig002',
            'bzzz_cigarpack_cig001',
            'bzzz_cigarpack_cig003',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'prop_phone_ing',
            'scr_tn_meet_phone_camera_flash',
            'prop_phone_ing',
            'prop_ecola_can',
            'prop_sign_road_01a',
            'prop_sign_road_02a',
            'prop_sign_road_03d',
            'prop_sign_road_04a',
            'prop_sign_road_04w',
            'prop_sign_road_05a',
            'prop_sign_road_05t',
            'prop_sign_freewayentrance',
            'prop_snow_sign_road_01a',
            'xs_prop_arena_screen_tv_01',
            'prop_ld_suitcase_01',
            'prop_security_case_01',
            'prop_surf_board_01',
            'prop_cs_tablet',
            'prop_cs_tablet',
            'prop_cs_spray_can',
            'prop_cs_spray_can',
            'prop_cs_spray_can',
            'prop_cs_spray_can',
            'prop_cs_spray_can',
            'prop_cs_spray_can',
            'v_ilev_mr_rasberryclean',
            'prop_tennis_bag_01',
            'prop_tennis_rack_01',
            'prop_wheel_tyre',
            'prop_tool_box_04',
            'imp_prop_tool_box_01a',
            'xm3_prop_xm3_tool_box_01a',
            'xm3_prop_xm3_tool_box_02a',
            'p_amb_brolly_01',
            'p_amb_brolly_01',
            'p_amb_brolly_01',
            'p_amb_brolly_01',
            'ba_prop_battle_vape_01',
            'exp_grd_bzgas_smoke',
            'prop_beer_am',
            'ba_prop_club_water_bottle',
            'prop_weed_block_01',
            'bkr_prop_weed_bigbag_01a',
            'bkr_prop_weed_bucket_open_01a',
            'prop_curl_bar_01',
            'prop_curl_bar_01',
            'prop_drink_whisky',
            'ba_prop_battle_whiskey_bottle_2_s',
            'ba_prop_battle_whiskey_bottle_2_s',
            'ba_prop_battle_whiskey_bottle_2_s',
            'prop_drink_redwine',
            'prop_wine_rose',
            'prop_wine_rose',
            'prop_cs_hand_radio',
            'prop_cs_hand_radio',
        },
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    },
    ["rcore_pool"] = {
        Props = {
            "prop_pool_cue",
            "prop_poolball_1",
            "prop_poolball_10",
            "prop_poolball_11",
            "prop_poolball_12",
            "prop_poolball_13",
            "prop_poolball_14",
            "prop_poolball_15",
            "prop_poolball_2",
            "prop_poolball_3",
            "prop_poolball_4",
            "prop_poolball_5",
            "prop_poolball_6",
            "prop_poolball_7",
            "prop_poolball_8",
            "prop_poolball_9",
            "prop_poolball_cue",
        }
    },
    ["rcore_spray"] = {
        Props = {
            "p_loose_rag_01_s",
            "ng_proc_spraycan01b",
        },
        Particles = {
            "scr_recartheft",
            "scr_wheel_burnout",
        }
    },
    ["rcore_beerpong"] = {
        Props = {
            "prop_cs_paper_cup",
            "prop_plastic_cup_02",
            "prop_ping_pong",
            "prop_amb_beer_bottle",
        },
    },
    ["rcore_tennis"] = {
        Props = {
            "prop_tennis_rack_01",
            "prop_tennis_rack_01b",
            "prop_tennis_ball",
            "prop_tennis_net_01",
        }
    },
    ["lb-phone"] = {
        Props = {
            "lb_phone_prop"
        },
        Peds = {
            "S_M_Y_XMech_01"
        }
    },
    ["WaveAdmin"] = {
        Particles = {
            "scr_alien_teleport",
        },
    },
    ["rcore_casino"] = {
        Props = {
            "vw_des_vine_casino_doors_01",
            "vw_des_vine_casino_doors_02",
            "vw_des_vine_casino_doors_03",
            "vw_des_vine_casino_doors_04",
            "vw_des_vine_casino_doors_05",
            "vw_des_vine_casino_doors_end",
            "vw_prop_animscreen_temp_01",
            "vw_prop_art_football_01a",
            "vw_prop_art_mic_01a",
            "vw_prop_art_pug_01a",
            "vw_prop_art_pug_01b",
            "vw_prop_art_pug_02a",
            "vw_prop_art_pug_02b",
            "vw_prop_art_pug_03a",
            "vw_prop_art_pug_03b",
            "vw_prop_art_resin_balls_01a",
            "vw_prop_art_resin_guns_01a",
            "vw_prop_art_wall_segment_01a",
            "vw_prop_art_wall_segment_02a",
            "vw_prop_art_wall_segment_02b",
            "vw_prop_art_wall_segment_03a",
            "vw_prop_art_wings_01a",
            "vw_prop_art_wings_01b",
            "vw_prop_book_stack_01a",
            "vw_prop_book_stack_01b",
            "vw_prop_book_stack_01c",
            "vw_prop_book_stack_02a",
            "vw_prop_book_stack_02b",
            "vw_prop_book_stack_02c",
            "vw_prop_book_stack_03a",
            "vw_prop_book_stack_03b",
            "vw_prop_book_stack_03c",
            "vw_prop_casino_3cardpoker_01",
            "vw_prop_casino_3cardpoker_01b",
            "vw_prop_casino_art_absman_01a",
            "vw_prop_casino_art_basketball_01a",
            "vw_prop_casino_art_basketball_02a",
            "vw_prop_casino_art_bird_01a",
            "vw_prop_casino_art_bottle_01a",
            "vw_prop_casino_art_bowling_01a",
            "vw_prop_casino_art_bowling_01b",
            "vw_prop_casino_art_bowling_02a",
            "vw_prop_casino_art_car_01a",
            "vw_prop_casino_art_car_02a",
            "vw_prop_casino_art_car_03a",
            "vw_prop_casino_art_car_04a",
            "vw_prop_casino_art_car_05a",
            "vw_prop_casino_art_car_06a",
            "vw_prop_casino_art_car_07a",
            "vw_prop_casino_art_car_08a",
            "vw_prop_casino_art_car_09a",
            "vw_prop_casino_art_car_10a",
            "vw_prop_casino_art_car_11a",
            "vw_prop_casino_art_car_12a",
            "vw_prop_casino_art_cherries_01a",
            "vw_prop_casino_art_concrete_01a",
            "vw_prop_casino_art_concrete_02a",
            "vw_prop_casino_art_console_01a",
            "vw_prop_casino_art_console_02a",
            "vw_prop_casino_art_deer_01a",
            "vw_prop_casino_art_dog_01a",
            "vw_prop_casino_art_egg_01a",
            "vw_prop_casino_art_ego_01a",
            "vw_prop_casino_art_figurines_01a",
            "vw_prop_casino_art_figurines_02a",
            "vw_prop_casino_art_grenade_01a",
            "vw_prop_casino_art_grenade_01b",
            "vw_prop_casino_art_grenade_01c",
            "vw_prop_casino_art_grenade_01d",
            "vw_prop_casino_art_guitar_01a",
            "vw_prop_casino_art_gun_01a",
            "vw_prop_casino_art_gun_02a",
            "vw_prop_casino_art_head_01a",
            "vw_prop_casino_art_head_01b",
            "vw_prop_casino_art_head_01c",
            "vw_prop_casino_art_head_01d",
            "vw_prop_casino_art_horse_01a",
            "vw_prop_casino_art_horse_01b",
            "vw_prop_casino_art_horse_01c",
            "vw_prop_casino_art_lampf_01a",
            "vw_prop_casino_art_lampm_01a",
            "vw_prop_casino_art_lollipop_01a",
            "vw_prop_casino_art_miniature_05a",
            "vw_prop_casino_art_miniature_05b",
            "vw_prop_casino_art_miniature_05c",
            "vw_prop_casino_art_miniature_09a",
            "vw_prop_casino_art_miniature_09b",
            "vw_prop_casino_art_miniature_09c",
            "vw_prop_casino_art_mod_01a",
            "vw_prop_casino_art_mod_02a",
            "vw_prop_casino_art_mod_03a",
            "vw_prop_casino_art_mod_03a_a",
            "vw_prop_casino_art_mod_03a_b",
            "vw_prop_casino_art_mod_03a_c",
            "vw_prop_casino_art_mod_03b",
            "vw_prop_casino_art_mod_03b_a",
            "vw_prop_casino_art_mod_03b_b",
            "vw_prop_casino_art_mod_03b_c",
            "vw_prop_casino_art_mod_04a",
            "vw_prop_casino_art_mod_04b",
            "vw_prop_casino_art_mod_04c",
            "vw_prop_casino_art_mod_05a",
            "vw_prop_casino_art_mod_06a",
            "vw_prop_casino_art_panther_01a",
            "vw_prop_casino_art_panther_01b",
            "vw_prop_casino_art_panther_01c",
            "vw_prop_casino_art_pill_01a",
            "vw_prop_casino_art_pill_01b",
            "vw_prop_casino_art_pill_01c",
            "vw_prop_casino_art_plant_01a",
            "vw_prop_casino_art_plant_02a",
            "vw_prop_casino_art_plant_03a",
            "vw_prop_casino_art_plant_04a",
            "vw_prop_casino_art_plant_05a",
            "vw_prop_casino_art_plant_06a",
            "vw_prop_casino_art_plant_07a",
            "vw_prop_casino_art_plant_08a",
            "vw_prop_casino_art_plant_09a",
            "vw_prop_casino_art_plant_10a",
            "vw_prop_casino_art_plant_11a",
            "vw_prop_casino_art_plant_12a",
            "vw_prop_casino_art_rocket_01a",
            "vw_prop_casino_art_sculpture_01a",
            "vw_prop_casino_art_sculpture_02a",
            "vw_prop_casino_art_sculpture_02b",
            "vw_prop_casino_art_sh_01a",
            "vw_prop_casino_art_skull_01a",
            "vw_prop_casino_art_skull_01b",
            "vw_prop_casino_art_skull_02a",
            "vw_prop_casino_art_skull_02b",
            "vw_prop_casino_art_skull_03a",
            "vw_prop_casino_art_skull_03b",
            "vw_prop_casino_art_statue_01a",
            "vw_prop_casino_art_statue_02a",
            "vw_prop_casino_art_statue_04a",
            "vw_prop_casino_art_vase_01a",
            "vw_prop_casino_art_vase_02a",
            "vw_prop_casino_art_vase_03a",
            "vw_prop_casino_art_vase_04a",
            "vw_prop_casino_art_vase_05a",
            "vw_prop_casino_art_vase_06a",
            "vw_prop_casino_art_vase_07a",
            "vw_prop_casino_art_vase_08a",
            "vw_prop_casino_art_vase_09a",
            "vw_prop_casino_art_vase_10a",
            "vw_prop_casino_art_vase_11a",
            "vw_prop_casino_art_vase_12a",
            "vw_prop_casino_art_v_01a",
            "vw_prop_casino_art_v_01b",
            "vw_prop_casino_blckjack_01",
            "vw_prop_casino_blckjack_01b",
            "vw_prop_casino_calc",
            "vw_prop_casino_cards_01",
            "vw_prop_casino_cards_02",
            "vw_prop_casino_cards_single",
            "vw_prop_casino_chair_01a",
            "vw_prop_casino_champset",
            "vw_prop_casino_chip_tray_01",
            "vw_prop_casino_chip_tray_02",
            "vw_prop_casino_keypad_01",
            "vw_prop_casino_keypad_02",
            "vw_prop_casino_magazine_01a",
            "vw_prop_casino_mediaplayer_play",
            "vw_prop_casino_mediaplayer_stop",
            "vw_prop_casino_phone_01a",
            "vw_prop_casino_phone_01b",
            "vw_prop_casino_phone_01b_handle",
            "vw_prop_casino_roulette_01",
            "vw_prop_casino_roulette_01b",
            "vw_prop_casino_schedule_01a",
            "vw_prop_casino_shopping_bag_01a",
            "vw_prop_casino_slot_01a",
            "vw_prop_casino_slot_01a_reels",
            "vw_prop_casino_slot_01b_reels",
            "vw_prop_casino_slot_02a",
            "vw_prop_casino_slot_02a_reels",
            "vw_prop_casino_slot_02b_reels",
            "vw_prop_casino_slot_03a",
            "vw_prop_casino_slot_03a_reels",
            "vw_prop_casino_slot_03b_reels",
            "vw_prop_casino_slot_04a",
            "vw_prop_casino_slot_04a_reels",
            "vw_prop_casino_slot_04b_reels",
            "vw_prop_casino_slot_05a",
            "vw_prop_casino_slot_05a_reels",
            "vw_prop_casino_slot_05b_reels",
            "vw_prop_casino_slot_06a",
            "vw_prop_casino_slot_06a_reels",
            "vw_prop_casino_slot_06b_reels",
            "vw_prop_casino_slot_07a",
            "vw_prop_casino_slot_07a_reels",
            "vw_prop_casino_slot_07b_reels",
            "vw_prop_casino_slot_08a",
            "vw_prop_casino_slot_08a_reels",
            "vw_prop_casino_slot_08b_reels",
            "vw_prop_casino_slot_betmax",
            "vw_prop_casino_slot_betone",
            "vw_prop_casino_slot_spin",
            "vw_prop_casino_stool_02a",
            "vw_prop_casino_till",
            "vw_prop_casino_track_chair_01",
            "vw_prop_casino_water_bottle_01a",
            "vw_prop_casino_wine_glass_01a",
            "vw_prop_casino_wine_glass_01b",
            "vw_prop_cas_card_club_02",
            "vw_prop_cas_card_club_03",
            "vw_prop_cas_card_club_04",
            "vw_prop_cas_card_club_05",
            "vw_prop_cas_card_club_06",
            "vw_prop_cas_card_club_07",
            "vw_prop_cas_card_club_08",
            "vw_prop_cas_card_club_09",
            "vw_prop_cas_card_club_10",
            "vw_prop_cas_card_club_ace",
            "vw_prop_cas_card_club_jack",
            "vw_prop_cas_card_club_king",
            "vw_prop_cas_card_club_queen",
            "vw_prop_cas_card_dia_02",
            "vw_prop_cas_card_dia_03",
            "vw_prop_cas_card_dia_04",
            "vw_prop_cas_card_dia_05",
            "vw_prop_cas_card_dia_06",
            "vw_prop_cas_card_dia_07",
            "vw_prop_cas_card_dia_08",
            "vw_prop_cas_card_dia_09",
            "vw_prop_cas_card_dia_10",
            "vw_prop_cas_card_dia_ace",
            "vw_prop_cas_card_dia_jack",
            "vw_prop_cas_card_dia_king",
            "vw_prop_cas_card_dia_queen",
            "vw_prop_cas_card_hrt_02",
            "vw_prop_cas_card_hrt_03",
            "vw_prop_cas_card_hrt_04",
            "vw_prop_cas_card_hrt_05",
            "vw_prop_cas_card_hrt_06",
            "vw_prop_cas_card_hrt_07",
            "vw_prop_cas_card_hrt_08",
            "vw_prop_cas_card_hrt_09",
            "vw_prop_cas_card_hrt_10",
            "vw_prop_cas_card_hrt_ace",
            "vw_prop_cas_card_hrt_jack",
            "vw_prop_cas_card_hrt_king",
            "vw_prop_cas_card_hrt_queen",
            "vw_prop_cas_card_spd_02",
            "vw_prop_cas_card_spd_03",
            "vw_prop_cas_card_spd_04",
            "vw_prop_cas_card_spd_05",
            "vw_prop_cas_card_spd_06",
            "vw_prop_cas_card_spd_07",
            "vw_prop_cas_card_spd_08",
            "vw_prop_cas_card_spd_09",
            "vw_prop_cas_card_spd_10",
            "vw_prop_cas_card_spd_ace",
            "vw_prop_cas_card_spd_jack",
            "vw_prop_cas_card_spd_king",
            "vw_prop_cas_card_spd_queen",
            "vw_prop_chip_100dollar_st",
            "vw_prop_chip_100dollar_x1",
            "vw_prop_chip_10dollar_st",
            "vw_prop_chip_10dollar_x1",
            "vw_prop_chip_10kdollar_st",
            "vw_prop_chip_10kdollar_x1",
            "vw_prop_chip_1kdollar_st",
            "vw_prop_chip_1kdollar_x1",
            "vw_prop_chip_500dollar_st",
            "vw_prop_chip_500dollar_x1",
            "vw_prop_chip_50dollar_st",
            "vw_prop_chip_50dollar_x1",
            "vw_prop_chip_5kdollar_st",
            "vw_prop_chip_5kdollar_x1",
            "vw_prop_door_country_club_01a",
            "vw_prop_flowers_potted_01a",
            "vw_prop_flowers_potted_02a",
            "vw_prop_flowers_potted_03a",
            "vw_prop_flowers_vase_01a",
            "vw_prop_flowers_vase_02a",
            "vw_prop_flowers_vase_03a",
            "vw_prop_garage_control_panel_01a",
            "vw_prop_miniature_yacht_01a",
            "vw_prop_miniature_yacht_01b",
            "vw_prop_miniature_yacht_01c",
            "vw_prop_notebook_01a",
            "vw_prop_plaque_01a",
            "vw_prop_plaque_02a",
            "vw_prop_plaque_02b",
            "vw_prop_plaq_10kdollar_st",
            "vw_prop_plaq_10kdollar_x1",
            "vw_prop_plaq_1kdollar_x1",
            "vw_prop_plaq_5kdollar_st",
            "vw_prop_plaq_5kdollar_x1",
            "vw_prop_roulette_ball",
            "vw_prop_roulette_marker",
            "vw_prop_roulette_rake",
            "vw_prop_toy_sculpture_01a",
            "vw_prop_toy_sculpture_02a",
            "vw_prop_vw_3card_01a",
            "vw_prop_vw_aircon_m_01",
            "vw_prop_vw_arcade_01a",
            "vw_prop_vw_arcade_01_screen",
            "vw_prop_vw_arcade_02a",
            "vw_prop_vw_arcade_02b",
            "vw_prop_vw_arcade_02b_screen",
            "vw_prop_vw_arcade_02c",
            "vw_prop_vw_arcade_02c_screen",
            "vw_prop_vw_arcade_02d",
            "vw_prop_vw_arcade_02d_screen",
            "vw_prop_vw_arcade_02_screen",
            "vw_prop_vw_arcade_03a",
            "vw_prop_vw_arcade_03b",
            "vw_prop_vw_arcade_03c",
            "vw_prop_vw_arcade_03d",
            "vw_prop_vw_arcade_03_screen",
            "vw_prop_vw_arcade_04b_screen",
            "vw_prop_vw_arcade_04c_screen",
            "vw_prop_vw_arcade_04d_screen",
            "vw_prop_vw_arcade_04_screen",
            "vw_prop_vw_backpack_01a",
            "vw_prop_vw_barrier_rope_01a",
            "vw_prop_vw_barrier_rope_01b",
            "vw_prop_vw_barrier_rope_01c",
            "vw_prop_vw_barrier_rope_02a",
            "vw_prop_vw_barrier_rope_03a",
            "vw_prop_vw_barrier_rope_03b",
            "vw_prop_vw_bblock_huge_01",
            "vw_prop_vw_bblock_huge_02",
            "vw_prop_vw_bblock_huge_03",
            "vw_prop_vw_bblock_huge_04",
            "vw_prop_vw_bblock_huge_05",
            "vw_prop_vw_board_01a",
            "vw_prop_vw_box_empty_01a",
            "vw_prop_vw_card_case_01a",
            "vw_prop_vw_casino_bin_01a",
            "vw_prop_vw_casino_cards_01",
            "vw_prop_vw_casino_door_01a",
            "vw_prop_vw_casino_door_01b",
            "vw_prop_vw_casino_door_01c",
            "vw_prop_vw_casino_door_01d",
            "vw_prop_vw_casino_door_02a",
            "vw_prop_vw_casino_door_r_02a",
            "vw_prop_vw_casino_podium_01a",
            "vw_prop_vw_champ_closed",
            "vw_prop_vw_champ_cool",
            "vw_prop_vw_champ_open",
            "vw_prop_vw_chips_bag_01a",
            "vw_prop_vw_chips_pile_01a",
            "vw_prop_vw_chips_pile_02a",
            "vw_prop_vw_chips_pile_03a",
            "vw_prop_vw_cinema_tv_01",
            "vw_prop_vw_club_char_02a",
            "vw_prop_vw_club_char_03a",
            "vw_prop_vw_club_char_04a",
            "vw_prop_vw_club_char_05a",
            "vw_prop_vw_club_char_06a",
            "vw_prop_vw_club_char_07a",
            "vw_prop_vw_club_char_08a",
            "vw_prop_vw_club_char_09a",
            "vw_prop_vw_club_char_10a",
            "vw_prop_vw_club_char_a_a",
            "vw_prop_vw_club_char_j_a",
            "vw_prop_vw_club_char_k_a",
            "vw_prop_vw_club_char_q_a",
            "vw_prop_vw_coin_01a",
            "vw_prop_vw_colle_alien",
            "vw_prop_vw_colle_beast",
            "vw_prop_vw_colle_imporage",
            "vw_prop_vw_colle_pogo",
            "vw_prop_vw_colle_prbubble",
            "vw_prop_vw_colle_rsrcomm",
            "vw_prop_vw_colle_rsrgeneric",
            "vw_prop_vw_colle_sasquatch",
            "vw_prop_vw_crate_01a",
            "vw_prop_vw_crate_02a",
            "vw_prop_vw_dia_char_02a",
            "vw_prop_vw_dia_char_03a",
            "vw_prop_vw_dia_char_04a",
            "vw_prop_vw_dia_char_05a",
            "vw_prop_vw_dia_char_06a",
            "vw_prop_vw_dia_char_07a",
            "vw_prop_vw_dia_char_08a",
            "vw_prop_vw_dia_char_09a",
            "vw_prop_vw_dia_char_10a",
            "vw_prop_vw_dia_char_a_a",
            "vw_prop_vw_dia_char_j_a",
            "vw_prop_vw_dia_char_k_a",
            "vw_prop_vw_dia_char_q_a",
            "vw_prop_vw_door_bath_01a",
            "vw_prop_vw_door_ddl_01a",
            "vw_prop_vw_door_dd_01a",
            "vw_prop_vw_door_lounge_01a",
            "vw_prop_vw_door_sd_01a",
            "vw_prop_vw_door_slide_01a",
            "vw_prop_vw_elecbox_01a",
            "vw_prop_vw_ex_pe_01a",
            "vw_prop_vw_garagedoor_01a",
            "vw_prop_vw_garage_coll_01a",
            "vw_prop_vw_headset_01a",
            "vw_prop_vw_hrt_char_02a",
            "vw_prop_vw_hrt_char_03a",
            "vw_prop_vw_hrt_char_04a",
            "vw_prop_vw_hrt_char_05a",
            "vw_prop_vw_hrt_char_06a",
            "vw_prop_vw_hrt_char_07a",
            "vw_prop_vw_hrt_char_08a",
            "vw_prop_vw_hrt_char_09a",
            "vw_prop_vw_hrt_char_10a",
            "vw_prop_vw_hrt_char_a_a",
            "vw_prop_vw_hrt_char_j_a",
            "vw_prop_vw_hrt_char_k_a",
            "vw_prop_vw_hrt_char_q_a",
            "vw_prop_vw_ice_bucket_01a",
            "vw_prop_vw_ice_bucket_02a",
            "vw_prop_vw_jackpot_off",
            "vw_prop_vw_jackpot_on",
            "vw_prop_vw_jo_char_01a",
            "vw_prop_vw_jo_char_02a",
            "vw_prop_vw_key_cabinet_01a",
            "vw_prop_vw_key_card_01a",
            "vw_prop_vw_lamp_01",
            "vw_prop_vw_lrggate_05a",
            "vw_prop_vw_luckylight_off",
            "vw_prop_vw_luckylight_on",
            "vw_prop_vw_luckywheel_01a",
            "vw_prop_vw_lux_card_01a",
            "vw_prop_vw_marker_01a",
            "vw_prop_vw_marker_02a",
            "vw_prop_vw_monitor_01",
            "vw_prop_vw_offchair_01",
            "vw_prop_vw_offchair_02",
            "vw_prop_vw_offchair_03",
            "vw_prop_vw_panel_off_door_01",
            "vw_prop_vw_panel_off_frame_01",
            "vw_prop_vw_ped_business_01a",
            "vw_prop_vw_ped_epsilon_01a",
            "vw_prop_vw_ped_hillbilly_01a",
            "vw_prop_vw_ped_hooker_01a",
            "vw_prop_vw_planter_01",
            "vw_prop_vw_planter_02",
            "vw_prop_vw_plant_int_03a",
            "vw_prop_vw_player_01a",
            "vw_prop_vw_pogo_gold_01a",
            "vw_prop_vw_radiomast_01a",
            "vw_prop_vw_roof_door_01a",
            "vw_prop_vw_roof_door_02a",
            "vw_prop_vw_safedoor_office2a_l",
            "vw_prop_vw_safedoor_office2a_r",
            "vw_prop_vw_slot_wheel_04a",
            "vw_prop_vw_slot_wheel_04b",
            "vw_prop_vw_slot_wheel_08a",
            "vw_prop_vw_slot_wheel_08b",
            "vw_prop_vw_spd_char_02a",
            "vw_prop_vw_spd_char_03a",
            "vw_prop_vw_spd_char_04a",
            "vw_prop_vw_spd_char_05a",
            "vw_prop_vw_spd_char_06a",
            "vw_prop_vw_spd_char_07a",
            "vw_prop_vw_spd_char_08a",
            "vw_prop_vw_spd_char_09a",
            "vw_prop_vw_spd_char_10a",
            "vw_prop_vw_spd_char_a_a",
            "vw_prop_vw_spd_char_j_a",
            "vw_prop_vw_spd_char_k_a",
            "vw_prop_vw_spd_char_q_a",
            "vw_prop_vw_table_casino_short_01",
            "vw_prop_vw_table_casino_short_02",
            "vw_prop_vw_table_casino_tall_01",
            "vw_prop_vw_trailer_monitor_01",
            "vw_prop_vw_tray_01a",
            "vw_prop_vw_trolly_01a",
            "vw_prop_vw_tv_rt_01a",
            "vw_prop_vw_valet_01a",
            "vw_prop_vw_v_blueprt_01a",
            "vw_prop_vw_v_brochure_01a",
            "vw_prop_vw_wallart_01a",
            "vw_prop_vw_wallart_02a",
            "vw_prop_vw_wallart_03a",
            "vw_prop_vw_wallart_04a",
            "vw_prop_vw_wallart_05a",
            "vw_prop_vw_wallart_06a",
            "vw_prop_vw_wallart_07a",
            "vw_prop_vw_wallart_08a",
            "vw_prop_vw_wallart_09a",
            "vw_prop_vw_wallart_100a",
            "vw_prop_vw_wallart_101a",
            "vw_prop_vw_wallart_102a",
            "vw_prop_vw_wallart_103a",
            "vw_prop_vw_wallart_104a",
            "vw_prop_vw_wallart_105a",
            "vw_prop_vw_wallart_106a",
            "vw_prop_vw_wallart_107a",
            "vw_prop_vw_wallart_108a",
            "vw_prop_vw_wallart_109a",
            "vw_prop_vw_wallart_10a",
            "vw_prop_vw_wallart_110a",
            "vw_prop_vw_wallart_111a",
            "vw_prop_vw_wallart_112a",
            "vw_prop_vw_wallart_113a",
            "vw_prop_vw_wallart_114a",
            "vw_prop_vw_wallart_115a",
            "vw_prop_vw_wallart_116a",
            "vw_prop_vw_wallart_117a",
            "vw_prop_vw_wallart_118a",
            "vw_prop_vw_wallart_11a",
            "vw_prop_vw_wallart_123a",
            "vw_prop_vw_wallart_124a",
            "vw_prop_vw_wallart_125a",
            "vw_prop_vw_wallart_126a",
            "vw_prop_vw_wallart_127a",
            "vw_prop_vw_wallart_128a",
            "vw_prop_vw_wallart_129a",
            "vw_prop_vw_wallart_12a",
            "vw_prop_vw_wallart_130a",
            "vw_prop_vw_wallart_131a",
            "vw_prop_vw_wallart_132a",
            "vw_prop_vw_wallart_133a",
            "vw_prop_vw_wallart_134a",
            "vw_prop_vw_wallart_135a",
            "vw_prop_vw_wallart_136a",
            "vw_prop_vw_wallart_137a",
            "vw_prop_vw_wallart_138a",
            "vw_prop_vw_wallart_139a",
            "vw_prop_vw_wallart_140a",
            "vw_prop_vw_wallart_141a",
            "vw_prop_vw_wallart_142a",
            "vw_prop_vw_wallart_143a",
            "vw_prop_vw_wallart_144a",
            "vw_prop_vw_wallart_145a",
            "vw_prop_vw_wallart_146a",
            "vw_prop_vw_wallart_147a",
            "vw_prop_vw_wallart_14a",
            "vw_prop_vw_wallart_150a",
            "vw_prop_vw_wallart_151a",
            "vw_prop_vw_wallart_151b",
            "vw_prop_vw_wallart_151c",
            "vw_prop_vw_wallart_151d",
            "vw_prop_vw_wallart_151e",
            "vw_prop_vw_wallart_151f",
            "vw_prop_vw_wallart_152a",
            "vw_prop_vw_wallart_153a",
            "vw_prop_vw_wallart_154a",
            "vw_prop_vw_wallart_155a",
            "vw_prop_vw_wallart_156a",
            "vw_prop_vw_wallart_157a",
            "vw_prop_vw_wallart_158a",
            "vw_prop_vw_wallart_159a",
            "vw_prop_vw_wallart_15a",
            "vw_prop_vw_wallart_160a",
            "vw_prop_vw_wallart_161a",
            "vw_prop_vw_wallart_162a",
            "vw_prop_vw_wallart_163a",
            "vw_prop_vw_wallart_164a",
            "vw_prop_vw_wallart_165a",
            "vw_prop_vw_wallart_166a",
            "vw_prop_vw_wallart_167a",
            "vw_prop_vw_wallart_168a",
            "vw_prop_vw_wallart_169a",
            "vw_prop_vw_wallart_16a",
            "vw_prop_vw_wallart_170a",
            "vw_prop_vw_wallart_171a",
            "vw_prop_vw_wallart_172a",
            "vw_prop_vw_wallart_173a",
            "vw_prop_vw_wallart_174a",
            "vw_prop_vw_wallart_17a",
            "vw_prop_vw_wallart_18a",
            "vw_prop_vw_wallart_19a",
            "vw_prop_vw_wallart_20a",
            "vw_prop_vw_wallart_21a",
            "vw_prop_vw_wallart_22a",
            "vw_prop_vw_wallart_23a",
            "vw_prop_vw_wallart_24a",
            "vw_prop_vw_wallart_25a",
            "vw_prop_vw_wallart_26a",
            "vw_prop_vw_wallart_28a",
            "vw_prop_vw_wallart_29a",
            "vw_prop_vw_wallart_30a",
            "vw_prop_vw_wallart_31a",
            "vw_prop_vw_wallart_32a",
            "vw_prop_vw_wallart_33a",
            "vw_prop_vw_wallart_34a",
            "vw_prop_vw_wallart_35a",
            "vw_prop_vw_wallart_36a",
            "vw_prop_vw_wallart_37a",
            "vw_prop_vw_wallart_38a",
            "vw_prop_vw_wallart_39a",
            "vw_prop_vw_wallart_40a",
            "vw_prop_vw_wallart_41a",
            "vw_prop_vw_wallart_42a",
            "vw_prop_vw_wallart_43a",
            "vw_prop_vw_wallart_44a",
            "vw_prop_vw_wallart_46a",
            "vw_prop_vw_wallart_47a",
            "vw_prop_vw_wallart_48a",
            "vw_prop_vw_wallart_49a",
            "vw_prop_vw_wallart_50a",
            "vw_prop_vw_wallart_51a",
            "vw_prop_vw_wallart_52a",
            "vw_prop_vw_wallart_53a",
            "vw_prop_vw_wallart_54a_01a",
            "vw_prop_vw_wallart_55a",
            "vw_prop_vw_wallart_56a",
            "vw_prop_vw_wallart_57a",
            "vw_prop_vw_wallart_58a",
            "vw_prop_vw_wallart_59a",
            "vw_prop_vw_wallart_60a",
            "vw_prop_vw_wallart_61a",
            "vw_prop_vw_wallart_62a",
            "vw_prop_vw_wallart_63a",
            "vw_prop_vw_wallart_64a",
            "vw_prop_vw_wallart_65a",
            "vw_prop_vw_wallart_66a",
            "vw_prop_vw_wallart_67a",
            "vw_prop_vw_wallart_68a",
            "vw_prop_vw_wallart_69a",
            "vw_prop_vw_wallart_70a",
            "vw_prop_vw_wallart_71a",
            "vw_prop_vw_wallart_72a",
            "vw_prop_vw_wallart_73a",
            "vw_prop_vw_wallart_74a",
            "vw_prop_vw_wallart_75a",
            "vw_prop_vw_wallart_76a",
            "vw_prop_vw_wallart_77a",
            "vw_prop_vw_wallart_78a",
            "vw_prop_vw_wallart_79a",
            "vw_prop_vw_wallart_80a",
            "vw_prop_vw_wallart_81a",
            "vw_prop_vw_wallart_82a",
            "vw_prop_vw_wallart_83a",
            "vw_prop_vw_wallart_84a",
            "vw_prop_vw_wallart_85a",
            "vw_prop_vw_wallart_86a",
            "vw_prop_vw_wallart_87a",
            "vw_prop_vw_wallart_88a",
            "vw_prop_vw_wallart_89a",
            "vw_prop_vw_wallart_90a",
            "vw_prop_vw_wallart_91a",
            "vw_prop_vw_wallart_92a",
            "vw_prop_vw_wallart_93a",
            "vw_prop_vw_wallart_94a",
            "vw_prop_vw_wallart_95a",
            "vw_prop_vw_wallart_96a",
            "vw_prop_vw_wallart_97a",
            "vw_prop_vw_wallart_98a",
            "vw_prop_vw_wallart_99a",
            "vw_prop_vw_watch_case_01b",
            "vw_prop_vw_whousedoor_01a",
            "vw_p_para_bag_vine_s",
            "vw_p_vw_cs_bandana_s",
        }
    },
    ["qs-smartphone"] = {
        Peds = {
            "mp_m_freemode_01",
            "mp_f_freemode_01",
        }
    }
    --todo list tt les scripts auto whitelist sur la doc, si votre script pas present, dites le nous ou faites vous mm la liste
}

function VexonAC:getItemsToWhiteList(resourceName, type)
    if autoWhiteListTable[resourceName] then
        return autoWhiteListTable[resourceName][type] or {}
    else
        return {}
    end
end

function VexonAC:runAutoWhiteList(table, type)
    local tempTable = table
    local items = VexonAC:getItemsToWhiteList("default", type)
    for k,v in pairs(items) do
        tempTable[GetHashKey(v)] = true
    end

    if type == "Props" and not VexonAC.Config.Entities.EnableObjectsWhiteList then return tempTable end
    if type == "Peds" and not VexonAC.Config.Entities.EnablePedsWhiteList then return tempTable end
    if type == "Vehicles" and not VexonAC.Config.Entities.EnableVehiclesWhiteList then return tempTable end
    if type == "Particles" and not VexonAC.Config.Explosions.EnableParticlesWhiteList then return tempTable end

    for i = 0, GetNumResources() - 1 do
        local resourceName = GetResourceByFindIndex(i)
        if autoWhiteListTable[resourceName] then
            local resourceState = GetResourceState(resourceName)
            if resourceState == "started" then
                local items2 = VexonAC:getItemsToWhiteList(resourceName, type)
                for k,v in pairs(items2) do
                    tempTable[GetHashKey(v)] = true
                end
            end
        end
    end
    return tempTable
end

function VexonAC:runAutoBlackList()
    local tempTable = {}

    for _, modelName in pairs(autoBlackListTable) do
        local modelHash = (type(modelName) == "string" and GetHashKey(modelName)) or (type(modelName) == "number" and modelName) or tonumber(modelName)
        if modelHash then
            tempTable[modelHash] = true
        end
    end

    return tempTable
end



﻿function IsVehicleOccupiedByAPlayer(vehicle)
    for seat = -1, 6 do
        local ped = GetPedInVehicleSeat(vehicle, seat)
        if ped ~= 0 and IsPedAPlayer(ped) then
            return true
        end
    end
    return false
end

RegisterCommand(VexonAC.Config.Settings.CommandPrefix, function(source, args, raw)
    if source == 0 and not args[1] then
        VexonAC:drawLogo()
        VexonAC:print("Available commands:","^6","System")
        print("")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." install^0 - (install VexonAC in missing resources)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." uninstall^0 - (uninstall VexonAC in all of your resources)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." ban <id> <reason>^0 - (ban specified player)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." baninfo <banId>^0 - (shows specified banId infos)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." unban <banId>^0 - (unban specified player)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." unban all^0 - (unban all banned players)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." reload^0 - (reload the config from the panel)","^6","System")
        VexonAC:print("^3"..VexonAC.Config.Settings.CommandPrefix.." clear <peds/vehicles/objects/all>^0 - (delete all non-needed specified entities on the server)","^6","System")
        print("")
    end

    if args[1] == "install" then
        if source == 0 then
            VexonAC:print("Installing VexonAC in all your resources, please do not stop the server.","^6","System")
            VexonAC:checkInstallation()
        end
    elseif args[1] == "uninstall" then
        if source == 0 then
            VexonAC:print("Uninstalling VexonAC in all your resources, please do not stop the server.","^6","System")
            local uninstalled, nbResourcesUninstalled = VexonAC:uninstallResources()
            VexonAC:print("Successfully uninstalled VexonAC in ^3"..nbResourcesUninstalled.."^0 resources.","^2","System")
        end
    elseif args[1] == "ban" then
        if args[2] == nil or args[2] == nil or args[3] == nil then
            VexonAC:print("Invalid usage of the command: ^3"..VexonAC.Config.Settings.CommandPrefix.." ban <serverId> <reason>^0.","^2","System")
            return
        end
        if VexonAC.Config.Settings.EnableGameplayRecord then
            VexonAC:print("Banning in progress, ^3uploading^0 gameplay capture...","^2","System")
        end
        if source == 0 or source == "0" then
            VexonAC.DetectPlayer(args[2], args[3], nil, nil, nil,"Console")
        elseif VexonAC:doesPlayerHavePerms(source, "Commands", true) then
            VexonAC.DetectPlayer(args[2], args[3], nil, nil, nil, GetPlayerName(source))
        end
    elseif args[1] == "unban" then

        if args[2] == nil then
            VexonAC:print("Invalid usage of the command: ^3"..VexonAC.Config.Settings.CommandPrefix.." unban <banId> <reason>^0.","^2","System")
            return
        end
        if source == 0 then
            if type(args[2]) == "string" and args[2] == "all" then
                VexonAC.UnbanAllPlayers()
            else
                VexonAC:unban(args[2])
            end
        elseif VexonAC:doesPlayerHavePerms(source, "Commands", true) then
            VexonAC:unban(args[2], GetPlayerName(source) or "Unknown Name")
        end
    elseif args[1] == "reload" then
-- ZGlzY29yZC5nZy9mbWE=
        if source == 0 then
            VexonAC:ReloadConfiguration()
        end
    elseif args[1] == "clear" then
        if not args[2] then
            VexonAC:print("Invalid usage of the command: ^3"..VexonAC.Config.Settings.CommandPrefix.." clear <peds/vehicles/objects/all>^0.","^2","System")
            return
        end
        if args[2] == "peds" then
            if source == 0 or VexonAC:doesPlayerHavePerms(source, "Commands") then
                local allPeds = GetAllPeds()
                for _,v in pairs(allPeds) do
                    if DoesEntityExist(v) then
                        DeleteEntity(v)
                    end
                end
                VexonAC:print("Successfully deleted ^3"..#allPeds.."^0 peds.","^2","World")
            end
        elseif args[2] == "vehicles" then
            if source == 0 or VexonAC:doesPlayerHavePerms(source, "Commands") then
                local allVehicles = GetAllVehicles()
                for _,v in pairs(allVehicles) do
                    if DoesEntityExist(v) and not IsVehicleOccupiedByAPlayer(v) then
                        DeleteEntity(v)
                    end
                end
                VexonAC:print("Successfully deleted ^3"..#allVehicles.."^0 vehicles.","^2","World")
            end
        elseif args[2] == "objects" then
            if source == 0 or VexonAC:doesPlayerHavePerms(source, "Commands") then
                local allObjs = GetAllObjects()
                for _,v in pairs(allObjs) do
                    if DoesEntityExist(v) then
                        DeleteEntity(v)
                    end
                end
                VexonAC:print("Successfully deleted ^3"..#allObjs.."^0 objects.","^2","World")
            end
        elseif args[2] == "all" then
            if source == 0 or VexonAC:doesPlayerHavePerms(source, "Commands") then
                local allPeds = GetAllPeds()
                for _,v in pairs(allPeds) do
                    if DoesEntityExist(v) then
                        DeleteEntity(v)
                    end
                end
                local allVehicles = GetAllVehicles()
                for _,v in pairs(allVehicles) do
                    if DoesEntityExist(v) and not IsVehicleOccupiedByAPlayer(v) then
                        DeleteEntity(v)
                    end
                end
                local allObjs = GetAllObjects()
                for _,v in pairs(allObjs) do
                    if DoesEntityExist(v) then
                        DeleteEntity(v)
                    end
                end
                VexonAC:print("Successfully deleted ^3"..#allPeds.."/"..#allVehicles.."/"..#allObjs.."^0 peds/vehicles/objects.","^2","World")
            end
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
        end
    elseif args[1] == "debug" then
        local serverId = tonumber(args[2])
        if not serverId then
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
            VexonAC:print("Invalid usage of the command: ^3"..VexonAC.Config.Settings.CommandPrefix.." debug <serverId>^0.","^2","System")
            return
        end

        local debugEventName = VexonAC.EncryptString("__VexonAC:debug", VexonAC.Substitution)
        local debugEventName2 = VexonAC.EncryptString("__VexonAC:debug_executions", VexonAC.Substitution)

        TriggerClientEvent(debugEventName, serverId)
        TriggerClientEvent(debugEventName2, serverId)
    end
end)


﻿for stateBagIndex, stateBagName in pairs({
    "_WS:LastTeleportedTimer",
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
    "_WS:LastCamEaseTime",
    VexonAC.HHct1C6gobnW3DkIQUxiXk9Q,
    VexonAC.HHct1C6gobnW3DkIQUxiXk9Q.."_SV",
    VexonAC.HHct1C6gobnW3DkIQUxiXk9Q.."_CL",
    "_WS:injctd_astp",
    "WS:playTime",
    "WS:threatScore",
    "WS:isAdmin",
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
    "WS:isBypass",
}) do
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
    --todo les state bag cote client genre LastTeleportedTimer handler si aucune native call = ban
    AddStateBagChangeHandler(stateBagName, nil, LPH_NO_VIRTUALIZE(function(bagName, key, value, reserved, replicated)
        local source = GetPlayerFromStateBagName(bagName)
        if source == 0 then return end
        if reserved ~= 0 then
            VexonAC.DetectPlayer(source, "Bypass Attempt Detected", {
                stateBagName = stateBagName,
            })
        end
    end))
end


﻿local Heartbeats = {}
local PingThresholds = {
    excellent = 30,  -- < 30ms ping - fastest detection
    good = 80,       -- 30-80ms ping - fast detection  
    medium = 150,    -- 80-150ms ping - normal detection
    high = 300       -- > 150ms ping - slower detection
}

local function GetAdaptiveTimeout(playerId, ping)
    local clientInterval = 90
    local requiredTimeouts = 1

    return clientInterval * 1000, requiredTimeouts
end

RegisterNetEvent(VexonAC.HeartbeatEventToken, LPH_JIT_MAX(function(networkTime)
    local source = source
    if source == 0 then return end

    Heartbeats[source] = {
        lastSeen = GetGameTimer(),
        consecutiveTimeouts = 0
    }
end))

-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
VexonAC.CreateThread(LPH_JIT_MAX(function()
    VexonAC.Wait(30000)
    
    while true do
        if not GlobalState.IsAntiResourceStopDisabled then
            local currentTime = GetGameTimer()
            local playersChecked = 0
            
            for playerId, heartbeatData in next, Heartbeats, nil do
                local playerPing = GetPlayerPing(playerId)
                local lastMsg = GetPlayerLastMsg(playerId)
                
-- Zm1hLnd0Zg==
                if playerPing > 0 and playerPing < 300 and lastMsg < 100 then
                    local timeSinceLastSeen = currentTime - heartbeatData.lastSeen
                    local adaptiveTimeout, requiredTimeouts = GetAdaptiveTimeout(playerId, playerPing)
                    
                    if timeSinceLastSeen > adaptiveTimeout then
                        heartbeatData.consecutiveTimeouts = (heartbeatData.consecutiveTimeouts or 0) + 1
                        
                        if heartbeatData.consecutiveTimeouts >= requiredTimeouts then
                            local punishment = VexonAC.Actions.KICK.id
                            -- if playerPing <= PingThresholds.excellent or lastMsg < 25 then
                            --     punishment = VexonAC.Actions.BAN.id
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
                            -- end

                            VexonAC.DetectPlayer(playerId, "VexonAC Stop Detected", {
                                type = "Heartbeat",
                                lastSeen = ("%s seconds ago"):format(math.floor(timeSinceLastSeen / 1000)),
                                ping = playerPing,
                                lastMsg = lastMsg,
                            }, punishment)
                            
                            Heartbeats[playerId] = nil
                        end
                    else
                        heartbeatData.consecutiveTimeouts = 0
                    end
                else
                    Heartbeats[playerId] = nil
                end
                
                playersChecked = playersChecked + 1
                if playersChecked % 50 == 0 then
                    VexonAC.Wait(0)
                end
            end
        end
        
        VexonAC.Wait(10000)
    end
end))

AddEventHandler("respawnPlayerPedEvent", function(player, content)
    local playerId = tonumber(player)
    if not playerId then return end
    
    Heartbeats[playerId] = {
        lastSeen = GetGameTimer(),
        consecutiveTimeouts = 0
    }
end)

AddEventHandler('playerDropped', function(reason, resourceName, clientDropReason)
    local playerId = tonumber(source)
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    if not playerId then return end
    
    Heartbeats[playerId] = nil
end)


local adaptiveCard = {
    ["$schema"] = "http://adaptivecards.io/schemas/adaptive-card.json",
    version = "1.5",
    type = "AdaptiveCard",
    body = {
        {
            type = "TextBlock",
            size = "Large",
            text = "VexonAC Anti-Cheat",
            wrap = true,
            weight = "Bolder",
            horizontalAlignment = "Center",
        },
        {
            type = "Image",
            url = "https://images-ext-1.discordapp.net/external/w5zpJkvpHQ4UpX_hN35hZLNRMEvcIH7RQVEnkQbrU8c/https/i.imgur.com/bv5Khc5.png?format=webp&quality=lossless&width=960&height=960", -- Banner image at the top
            size = "Large",
            horizontalAlignment = "Center"
        },
        {
            type = "TextBlock",
            spacing = "Small",
            horizontalAlignment = "Center",
            size = "Large",
            weight = "Bolder",
            wrap = true,
            text = "You have been permanently banned for cheating.",
        },
        {
            type = "ColumnSet",
            height = "stretch",
            minHeight = "35px",
            bleed = true,
            horizontalAlignment = "Center",
            columns = {
                {
                    type = "Column",
                    width = "auto",
                    items = {
                        {
                            type = "ActionSet",
                            horizontalAlignment = "Right",
                            actions = {
                                {
                                    type = "Action.Submit",
                                    title = "Ban-ID: Unknown",
                                    style = "destructive",
                                }
                            }
                        }
                    }
                },
                {
                    type = "Column",
                    width = "auto",
                    items = {
                        {
                            type = "ActionSet",
                            horizontalAlignment = "Left",
                            actions = {
                                {
                                    type = "Action.Submit",
                                    title = "Expires: Unknown",
                                    style = "destructive",
                                }
                            }
                        }
                    }
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
                }
            }
        },
        {
            type = "TextBlock",
            spacing = "Small",
            horizontalAlignment = "Center",
            size = "Medium",
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
            text = "If you feel this is an error, contact server support.",
            color = "Warning",
            weight = "Bolder",
        },
        {
            type = "Container",
            items = {
                {
                    horizontalAlignment = "Center",
                    type = "Image",
                    url = "",
                },
            }
        },
        {
            type = "ColumnSet",
            height = "stretch",
            minHeight = "35px",
            bleed = true,
            horizontalAlignment = "Center",
            spacing = "Medium",
            columns = {
                {
                    type = "Column",
                    width = "auto",
                    items = {
                        {
                            type = "ActionSet",
                            horizontalAlignment = "Left",
                            actions = {
                                {
                                    type = "Action.OpenUrl",
                                    title = "Discord",
                                    url = "https://discord.gg/HgymcJkQSd",
                                }
                            }
                        }
                    }
                },
                {
                    type = "Column",
                    width = "auto",
                    items = {
                        {
                            type = "ActionSet",
                            horizontalAlignment = "Right",
                            actions = {
                                {
                                    type = "Action.OpenUrl",
                                    title = "Website",
                                    url = "https://vexonac.com",
                                }
                            }
                        }
                    }
                },
            }
        },
    }
}

local connectedLicenses = {}

function VexonAC.presentCard(source, deferrals, textContent, banId, expires, screenShotUrl, cardType)
    local presentCard = json.decode(json.encode(adaptiveCard))
    cardType = cardType or "default"

    if screenShotUrl and screenShotUrl ~= "" then
        presentCard["body"][6]["items"][1].url = screenShotUrl
        presentCard["body"][2] = {}
    end

    presentCard["body"][3].text = textContent or "You have been disconnected by VexonAC."
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
    presentCard["body"][4]["columns"][1]["items"][1]["actions"][1]["title"] = "Ban-ID: "..(banId or "Unknown")
    presentCard["body"][4]["columns"][2]["items"][1]["actions"][1]["title"] = "Expires: "..(expires or "Unknown")

    if cardType ~= "ban" and cardType ~= "xss" then
        presentCard["body"][4] = {}
    end

    -- Customize card appearance based on type
    if cardType == "vpn" then
        presentCard["body"][3].text = "VPN usage is not allowed on this server."
    elseif cardType == "name" then
        presentCard["body"][3].text = "Your username contains prohibited characters."
    elseif cardType == "xss" then
        presentCard["body"][3].text = "Potential security exploit detected in username."
    elseif cardType == "discord" then
        presentCard["body"][3].text = "Discord account linking is required to join this server."
    elseif cardType == "dupe" then
        presentCard["body"][3].text = "Multiple connections detected from your account."
    elseif cardType == "threat" then
        presentCard["body"][3].text = "You are a potential threat to the server."
    end

    while GetPlayerPing(source) < 0 do
        deferrals.presentCard(json.encode(presentCard))
        Wait(2500)
    end

    return
end


function VexonAC.isPlayerUsingVPN(source, playerName, deferrals)
    local p = promise.new()
    local isUsingVPN = false
    PerformHttpRequest("https://blackbox.ipinfo.app/lookup/" .. tostring(GetPlayerEndpoint(source)), function(errorCode, resultData, resultHeaders)
        if resultData and resultData == "Y" then
            isUsingVPN = true
        end
        p:resolve()
    end)
    Citizen.Await(p)
    if isUsingVPN then
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(("^3%s^0 has attempted to connect the server using a ^1VPN^0."):format(playerName),"^1","Player")
        end
        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** has just attempted to connect the server using a **VPN**."):format(playerName),{
                {
                    name = "**Identifiers**",
                    value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
                }
            }, "Connections","15105570")
        end
        VexonAC.presentCard(
            source,
            deferrals,
            "VPN usage is not allowed on this server.",
            "N/A",
            "N/A",
            nil,
            "vpn"
        )
    end
    return isUsingVPN
end

function VexonAC.isPlayerXSS(source, playerName, deferrals)
    if playerName:find("<") and (playerName:find("script") or playerName:find("http") or playerName:find("src") or playerName:find("img")) then
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(("^3%s^0 has attempted to connect the server using a ^1prohibited name^0."):format(playerName),"^1","Player")
        end
        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** has just attempted to connect the server using **XSS Injection**."):format(playerName),{
                {
                    name = "**Identifiers**",
                    value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
                }
            })
        end

        VexonAC.presentCard(
            source,
            deferrals,
            "Potential security exploit detected in username",
            "N/A",
            "N/A",
            nil,
            "xss"
        )
        return true
    end
    return false
end

function VexonAC.isPlayerUsingAlphanumericName(source, playerName, deferrals)
    if string.match(playerName, "^[%w .,?!+-*:/~#_<>|^%[%]%(%)%{%}]+$") and not playerName:find("http") then
        return true
    else
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(("^3%s^0 has attempted to connect the server using ^1special characters^0 in his name."):format(playerName),"^1","Player")
        end
        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** has just attempted to connect the server using **special characters** in his name."):format(playerName),{
                {
                    name = "**Identifiers**",
                    value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
                }
            }, "Connections","15105570")
        end
        VexonAC.presentCard(
            source,
            deferrals,
            "Your username contains prohibited characters",
            "N/A",
            "N/A",
            nil,
            "name"
        )
        return false
    end
end

function VexonAC.isPlayerAThreat(source, playerName, threatScore, deferrals)
    if not VexonAC.Config.Settings.MaxThreatScore then return false end
    if threatScore >= VexonAC.Config.Settings.MaxThreatScore then
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(("^3%s^0 is a potential threat to the server (Threat Score: ^1%s/100^0)."):format(playerName, threatScore),"^1","Player")
        end
        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** is a potential threat to the server (Threat Score: **%s/100**)."):format(playerName, threatScore),{
                {
                    name = "**Identifiers**",
                    value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
                }
            }, "Connections","15105570")
        end
        VexonAC.presentCard(
            source,
            deferrals,
            "You are a potential threat to the server.",
            "N/A",
            "N/A",
            nil,
            "threat"
        )
        return true
    end
    return false
end

function VexonAC.isIsConnectionDuping(source, playerName, deferrals)
    local license = GetPlayerIdentifierByType(source, "license")
    if connectedLicenses[license] and connectedLicenses[license] ~= source then
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(("^3%s^0 has attempted to connect the server using ^1connection duplication^0."):format(playerName),"^1","Player")
        end
        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** has just attempted to connect the server using **connection duplication**."):format(playerName),{
                {
                    name = "**Identifiers**",
                    value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
                }
            }, "Connections","15105570")
        end
        DropPlayer(connectedLicenses[license], "[VexonAC]: Attempted to use connection duplication.")
        VexonAC.presentCard(
            source,
            deferrals,
            "Multiple connections detected from the same account",
            "N/A",
            "N/A",
            nil,
            "dupe"
        )
        return true
    end
    return false
end

function VexonAC.haveDiscordLinked(source, playerName, deferrals)
    local discord = GetPlayerIdentifierByType(source, "discord")
    if not discord then
        if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:print(("^3%s^0 has attempted to connect the server ^1without discord^0 linked."):format(playerName),"^1","Player")
        end
        if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
            VexonAC:sendWebHook("Rejected connection",("**%s** has just attempted to connect the server **without discord linked**."):format(playerName),{
                {
                    name = "**Identifiers**",
-- ZGlzY29yZC5nZy9mbWE=
                    value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
                }
            }, "Connections","15105570")
        end
        VexonAC.presentCard(
            source,
            deferrals,
            "You must have Discord linked to your FiveM account to join this server.",
            "N/A",
            "N/A",
            nil,
            "discord"
        )
        return false
    end
    return true
end

AddEventHandler("playerConnecting", LPH_JIT_MAX(function(playerName, setKickReason, deferrals)
    local source = source
    local playerLicense = GetPlayerIdentifierByType(source, "license")  
    local identifiers = getPlayerIdentifiers(source)
    local tokens = getPlayerTokens(source)

    deferrals.defer()
    Wait(100)

    if not VexonAC.Started then
        while not VexonAC.Started do
            deferrals.update("VexonAC is starting, please wait a momentet...")
            Wait(1000)
        end
    end
    
    deferrals.update("VexonAC is checking your profile...")

    Wait(0)

    local isBanned, threatScore = VexonAC.IsPlayerBanned(source, playerName, playerLicense, identifiers, tokens, deferrals)
    if isBanned then
        return
    end
    
    if not VexonAC:doesPlayerHavePerms(source, "Bypass") then
        if VexonAC.Config.Settings.MaxThreatScore then
            if VexonAC.isPlayerAThreat(source, playerName, threatScore, deferrals) then
                return
            end
        end
        if VexonAC.Config.Settings.AntiConnectionDupe then
            if VexonAC.isIsConnectionDuping(source, playerName, deferrals) then
                return
            end
        end
        if VexonAC.Config.Settings.AntiVPN then
            if VexonAC.isPlayerUsingVPN(source, playerName, deferrals) then
                return
            end
        end
        if VexonAC.Config.Settings.RequireDiscord then
            if not VexonAC.haveDiscordLinked(source, playerName, deferrals) then
                return
            end
        end
        if VexonAC.Config.Settings.AntiXSSInjections then
            if VexonAC.isPlayerXSS(source, playerName, deferrals) then
                return
            end
        end
        if VexonAC.Config.Settings.RequireAlphanumericName then
            if not VexonAC.isPlayerUsingAlphanumericName(source, playerName, deferrals) then
                return
            end
        end
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
    end

    if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnConnect then
        VexonAC:print(("^3%s^0 is connecting to the server."):format(playerName),"^2","Player")
    end
    if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnConnect then
        VexonAC:sendWebHook("New connection",("**%s** is connecting to the server."):format(playerName),{
            {
                name = "**Identifiers**",
                value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
            }
        }, "Connections")
    end
    deferrals.done()
end))

AddEventHandler("playerJoining", LPH_JIT_MAX(function(oldID, dd)
    local source = tonumber(source)
    if source <= 0 then return end
    local playerDetectedName = GetPlayerName(source)
    if type(playerDetectedName) ~= 'string' then return end

    local tempCache = VexonAC.TempPlayerCache[tostring(oldID)]
    Player(source).state:set("WS:playTime", tempCache and tempCache.playTime or 0, false)
    Player(source).state:set("WS:threatScore", tempCache and tempCache.threatScore or 0, false)
    Player(source).state:set("WS:isAdmin", tempCache and tempCache.isAdmin or false, false)
    Player(source).state:set("WS:isBypass", tempCache and tempCache.isBypass or false, false)
    Player(source).state:set(VexonAC.HHct1C6gobnW3DkIQUxiXk9Q.."_SV", randomString(5), true)
    Player(source).state:set(VexonAC.HHct1C6gobnW3DkIQUxiXk9Q.."_CL", randomString(5), true)
    VexonAC.TempPlayerCache[oldID] = nil

    if not VexonAC.Config.Settings.AntiConnectionDupe then return end
    connectedLicenses[GetPlayerIdentifierByType(source, "license")] = source
end))



﻿local blacklistedReasons = {
    -- [contain] = reason
    ["kekhack"] = "Kekhack detected",
    ["poppedRuntime == runtime"] = "Red Engine Detected",
    --["reliable network event overflow"] = "Network event overflow.",
}

AddEventHandler("playerDropped", LPH_JIT_MAX(function(reason)
    if source <= 0 then return end

    if VexonAC.Config.Settings.AntiConnectionDupe then
        local license = GetPlayerIdentifierByType(source, "license")
        local connectedLicense = connectedLicenses[license]
        if connectedLicense and connectedLicense == source then
            connectedLicenses[license] = nil
        end
    end

    for k, v in pairs(blacklistedReasons) do
        if reason:lower():find(k:lower()) then
            VexonAC.DetectPlayer(source, v)
        end
-- ZGlzY29yZC5nZy9mbWE=
    end

    if VexonAC.Config.Settings.LogConnectionsToConsole and VexonAC.Config.Settings.LogOnDisconnect then
        VexonAC:print(("^3%s^0 (ID: ^3%s^0) has left the server. (^3%s^0)"):format(GetPlayerName(source) or "Unknown player",source,reason),"^1","Player")
    end
-- Zm1hLnd0ZiBldmVyeXdoZXJl
-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    if VexonAC.Config.Settings.LogConnectionsToDiscord and VexonAC.Config.Settings.LogOnDisconnect then
        VexonAC:sendWebHook("New disconnection",("**%s** has left the server.\nServer ID: **%s**\nReason: **%s**"):format(GetPlayerName(source) or "Unknown player",source, reason),{
            {
                name = "**Identifiers**",
                value = "```json\n"..json.encode(GetPlayerIdentifiers(source) or {},{indent = true}).."```",
            }
        }, "Connections","15548997")
    end

-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
    VexonAC.DeadPlayersCache[source] = nil
end))



﻿local function check3dMe(text, source)
    if type(text) == "string" and text:find("<") and text:find("img") and text:find("src") then
        CancelEvent()
        VexonAC.DetectPlayer(source, "Attempted to crash players", {
            reason = "/me Exploit",
        })
        return
    end
end

RegisterNetEvent("chatMessage",function(src, author, text)
-- ZGlzY29yZC5nZy9mbWE=
-- Zm1hLnd0Zg==
    check3dMe(text, src)
end)

RegisterNetEvent("3dme:shareDisplay",function(text)
    check3dMe(text, source)
end)


﻿-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
AddEventHandler("clearPedTasksEvent", function(sender, data)
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
-- Zm1hLnd0Zg==
    if VexonAC.Config.Main.AntiClearTasks then
        local pedId = NetworkGetEntityFromNetworkId(data.pedId)
        local pedOwner = DoesEntityExist(pedId) and NetworkGetEntityOwner(pedId)
        local isPlayer = DoesEntityExist(pedId) and IsPedAPlayer(pedId) and (pedOwner ~= tonumber(sender))

        if pedOwner and isPlayer then
            CancelEvent()
            VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_CLEAR_TASKS, {
                immediately = data.immediately,
                target = GetPlayerName(pedOwner) or "Unknown player",
            })
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
            return
        end
    end
end)


﻿local explosionsCreated = {}
local projectileExplosions = {
    ["0"] = true,
    ["1"] = true,
    ["2"] = true,
    ["3"] = true,
    ["4"] = true,
    ["19"] = true,
    ["29"] = true,
    ["21"] = true,
    ["22"] = true,
    ["24"] = true,
    ["25"] = true,
    ["32"] = true,
    ["41"] = true,
    ["56"] = true,
    ["57"] = true,
    ["62"] = true,
}

local ignoredExplosionWeaponHashes = {
    ["1945616459"] = true,
    ["4171469727"] = true,
    ["3473446624"] = true,
    ["4026335563"] = true,
    ["1259576109"] = true,
    ["1186503822"] = true,
-- WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFggZm1h
    ["2669318622"] = true,
    ["3800181289"] = true,
    ["1566990507"] = true,
    ["3450622333"] = true,
    ["3530961278"] = true,
    ["3204302209"] = true,
    ["1638077257"] = true,
    ["1097917585"] = true,
    ["2756787765"] = true,
    ["2144528907"] = true,
    ["1155224728"] = true,
    ["3041872152"] = true,
    ["50118905"] = true,
    ["84788907"] = true,
    ["3959029566"] = true,
}

AddEventHandler("explosionEvent", LPH_JIT_MAX(function(sender, data)
    local source = tonumber(sender)
    local ownerNetId = data.ownerNetId
    local explosionType = data.explosionType
    local weaponHash = data.f164
    local isFromProjectile = data.f240
    local vehicleNetworkId = data.f210 --f208 c pareil
    local explosionName = VexonAC.GetExplosionName(explosionType)

    if VexonAC.Config.Explosions.CancelAllExplosions then
        CancelEvent()
    end

    if data.damageScale <= 0 then return end
    if vehicleNetworkId ~= 0 then return end -- si c la voiture qui a provoque l'explosion
    if data.f190 == true then return end -- si c un explosif collÃ© a un truc
    if data.f240 == true or data.f241 == true or data.f242 == true or data.f243 == true then return end -- si ca vient du monde?
    if explosionType == 11 then return end --Dir_Steam blc

    if VexonAC.Config.Explosions.EnableExplosionsBlackList and VexonAC.Config.Explosions.BlackListedExplosions[explosionType] then
        CancelEvent()
        VexonAC.DetectPlayer(source, VexonAC.Detections.EXPLOSION_BLACKLIST, {
            explosionType = explosionType,
            explosionName = explosionName,
        })
        return
    elseif VexonAC.Config.Explosions.DetectInvisibleExplosions and data.isInvisible then
        CancelEvent()
        VexonAC.DetectPlayer(source, VexonAC.Detections.DETECT_INVISIBLE_EXPLOSIONS, {
            explosionType = explosionType,
            explosionName = explosionName,
        })
        return
    elseif VexonAC.Config.Explosions.DetectInaudibleExplosions and not data.isAudible then
        CancelEvent()
        VexonAC.DetectPlayer(source, VexonAC.Detections.DETECT_INAUDIBLE_EXPLOSIONS, {
            explosionType = explosionType,
            explosionName = explosionName,
        })
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        return
    end

    if VexonAC.Config.Explosions.EnableExplosionsLimiter then
        explosionsCreated[source] = (explosionsCreated[source] or 0) + 1

        if explosionsCreated[source] >= tonumber(VexonAC.Config.Explosions.ExplosionsLimitIn5Seconds) then
            CancelEvent()
            VexonAC.DetectPlayer(source, VexonAC.Detections.EXPLOSION_LIMIT, {
                explosionType = explosionType,
                explosionName = explosionName,
                limit = tonumber(VexonAC.Config.Explosions.ExplosionsLimitIn5Seconds)
            })
            return
        end
    end

    -- ==============================================================================

-- ZmZmZmZmZmZmZmZmZmZtbW1tbW1tbW1tbW1tbW1tbW1tYWFhYWFhYWFhYWFhYWFhYWE=
    if VexonAC.Config.Explosions.LogExplosionSpawnsToConsole and (GetPlayerName(source) ~= nil) then
        VexonAC:print(("^3Explosion^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(explosionName, GetPlayerName(source), source),"^6","Explosions")
    end

    -- ==============================================================================

    -- max exp = 127
    if VexonAC.Config.Explosions.EnableExplosionsAI and not ignoredExplosionWeaponHashes[tostring(weaponHash)] then
        if explosionType == 34 then CancelEvent() return end --Gas_Tank jsp pk faux ban, todo

        local isProjectileExplosion = projectileExplosions[tostring(explosionType)]
        if isProjectileExplosion and not isFromProjectile then
            CancelEvent()
            VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_EXPLOSION, {
                explosionType = explosionType,
                explosionName = explosionName,
            })
            return
        end

        if not isProjectileExplosion then
            CancelEvent()
            VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_EXPLOSION, {
                explosionType = explosionType,
                explosionName = explosionName,
            })
            return
        end
    end

    VexonAC.SendLog("EXPLOSION", source, {
        explosionType = explosionType
    })
end))

CreateThread(function()
    while true do
        explosionsCreated = {}
        Wait(5000)
    end
end)

--todo config updated hjandler transform blacklisted explos



﻿AddEventHandler("fireEvent",function(sender, data)
    if VexonAC.Config.Explosions.CancelAllFires then
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
        CancelEvent()
    end
end)


﻿local playersWhitelistedParticles = {}

AddEventHandler("ptFxEvent", function(sender, data)
    local source = tonumber(sender)

    if VexonAC.Config.Explosions.LogParticleSpawnsToConsole and (GetPlayerName(source) ~= nil) then
        VexonAC:print(("^3Particle^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(data.effectHash, GetPlayerName(source), source),"^6","Particles")
    end

    if VexonAC.Config.Explosions.EnableParticlesWhiteList and data.effectHash ~= nil and data.assetHash ~= nil and not VexonAC.Config.Explosions.WhiteListedParticles[data.effectHash] then
        CancelEvent()
        VexonAC.DetectPlayer(source, VexonAC.Detections.PARTICLE_WHITELIST, {
            particleHash = data.effectHash,
        })
        return
    end
-- ZGlzY29yZC5nZy9mbWE=

    --todo opti this
    if VexonAC.Config.Explosions.DetectParticlesAttachedToEntity then
        local entityNetId = data.entityNetId
        local entity = NetworkGetEntityFromNetworkId(entityNetId)

        if DoesEntityExist(entity) then
            local owner = NetworkGetEntityOwner(entity)
            if owner ~= tonumber(source) then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_PARTICLE_ATTACHED_TO_ENTITY, {
                    particleHash = data.effectHash,
                })
                return
            end
        end
    end

    local scale = tonumber(data.scale)
    if scale ~= nil and scale > tonumber(VexonAC.Config.Explosions.MaxParticleScale) then
        CancelEvent()
        VexonAC.DetectPlayer(source, VexonAC.Detections.PARTICLE_SCALE, {
            particleHash = data.effectHash,
            scale = scale,
        })
        return
    end

    if VexonAC.Config.Explosions.EnableParticlesAI and not VexonAC.Config.Explosions.WhiteListedParticles[data.effectHash] then
        local timer = GetGameTimer()
        local lastSpawned = playersWhitelistedParticles[source] and (playersWhitelistedParticles[source][data.effectHash] or 0) or 0
        local spawnedAge = timer - lastSpawned

        if spawnedAge > 120000 then
            CancelEvent()

            VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_SPAWN_PARTICLE, {
                particleHash = data.effectHash,
            })
            return
        elseif spawnedAge > 5000 then
            CancelEvent()
        end
    end
end)

RegisterNetEvent("__VexonAC:CreateParticle", function(particleHash, functionReference, resourceName)
    if not resourceName or not serverResources[resourceName] then return end
    local particleHash = type(particleHash) == 'number' and particleHash or GetHashKey(particleHash)

    local source = tonumber(source)
    if not playersWhitelistedParticles[source] then playersWhitelistedParticles[source] = {} end

    local timer = GetGameTimer()
    playersWhitelistedParticles[source][particleHash] = timer
    playersWhitelistedParticles[source][signedToUnsigned(particleHash)] = timer
    TriggerClientEvent("_ws:cb", source, particleHash, timer)
end)

AddEventHandler("playerDropped", LPH_JIT_MAX(function(reason, resourceName)
    local source = tonumber(source)
    playersWhitelistedParticles[source] = nil
end))

--todo pr chaque detection le strike/ban/kick/log/none



﻿local projectilesCreated = {}

AddEventHandler("startProjectileEvent", function(sender, data)
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
    if VexonAC.Config.Weapons.EnableProjectilesWhiteList and not VexonAC.Config.Weapons.WhiteListedProjectiles[data.weaponHash] then
        CancelEvent()
        local weapData = VexonAC.WEAPON_DATA[data.weaponHash]
        VexonAC.DetectPlayer(sender, VexonAC.Detections.PROJECTILE_WHITELIST, {
            weapon = weapData and weapData.weaponName or data.weaponHash,
        })
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        return
    end

    if VexonAC.Config.Weapons.EnableProjectilesLimiter then
        projectilesCreated[sender] = (projectilesCreated[sender] or 0) + 1

        if projectilesCreated[sender] >= tonumber(VexonAC.Config.Weapons.ProjectilesLimitIn5Seconds) then
            CancelEvent()
            local weapData = VexonAC.WEAPON_DATA[data.weaponHash]
            VexonAC.DetectPlayer(sender, VexonAC.Detections.PROJECTILE_LIMIT, {
                weapon = weapData and weapData.weaponName or data.weaponHash,
                limit = VexonAC.Config.Weapons.ProjectilesLimitIn5Seconds,
            })
            return
        end
    end
    if VexonAC.Config.Weapons.LogProjectileSpawnsToConsole and (GetPlayerName(sender) ~= nil) then
        VexonAC:print(("^3Projectile^0 spawned from weapon: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(data.weaponHash, GetPlayerName(sender),sender),"^6","Projectiles")
    end
end)

CreateThread(function()
    while true do
        projectilesCreated = {}
        Wait(5000)
    end
end)



﻿AddEventHandler("giveWeaponEvent", function(sender, data)
    if VexonAC.Config.Weapons.AntiGiveWeapons then
        local pedId = NetworkGetEntityFromNetworkId(data.pedId)
        local pedOwner = DoesEntityExist(pedId) and NetworkGetEntityOwner(pedId)
        local isPlayer = DoesEntityExist(pedId) and IsPedAPlayer(pedId) and (pedOwner ~= tonumber(sender))

        if pedOwner and isPlayer then
            CancelEvent()
            local weapData = VexonAC.WEAPON_DATA[data.weaponType]
            VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_GIVE_WEAPONS, {
                target = GetPlayerName(pedOwner) or "Unknown",
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
                weaponType = weapData and weapData.weaponName or data.weaponType,
            })
            return
        end
    end
    return false
end)-- Zm1hLnd0ZiBldmVyeXdoZXJl



﻿AddEventHandler("removeWeaponEvent", function(sender, data)
    if VexonAC.Config.Weapons.AntiRemoveWeapons then
-- ZGlzY29yZC5nZy9mbWE=
        local pedId = NetworkGetEntityFromNetworkId(data.pedId)
        local pedOwner = DoesEntityExist(pedId) and NetworkGetEntityOwner(pedId)
        local isPlayer = DoesEntityExist(pedId) and IsPedAPlayer(pedId) and (pedOwner ~= tonumber(sender))

        if pedOwner and isPlayer then
            CancelEvent()
            local weapData = VexonAC.WEAPON_DATA[data.weaponType]
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
            VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_REMOVE_WEAPONS, {
                target = GetPlayerName(pedOwner) or "Unknown",
                weaponType = weapData and weapData.weaponName or data.weaponType
            })
            return
        end
    end
end)


﻿AddEventHandler("removeAllWeaponsEvent", function(sender, data)
    if VexonAC.Config.Weapons.AntiRemoveWeapons then
        local pedId = NetworkGetEntityFromNetworkId(data.pedId)
        local pedOwner = DoesEntityExist(pedId) and NetworkGetEntityOwner(pedId)
        local isPlayer = DoesEntityExist(pedId) and IsPedAPlayer(pedId) and (pedOwner ~= tonumber(sender))
-- ZiBtIGE=

        if pedOwner and isPlayer then
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
            CancelEvent()
            VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_REMOVE_WEAPONS, {
                target = GetPlayerName(pedOwner) or "Unknown",
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
            })
            return
        end
    end
end)


﻿local ignoredWeapons = {
    ["0"] = true,
    ["126349499"] = true, -- snowball
    ["600439132"] = true, -- ball
    ["2725352035"] = true, -- Fists
    ["1198879012"] = true, -- FLARE GUN
    ["4222310262"] = true,
    ["2461879995"] = true,
    ["3425972830"] = true,
    ["133987706"] = true,
    ["2741846334"] = true,
    ["3452007600"] = true,
    ["4194021054"] = true,
    ["324506233"] = true,
    ["2339582971"] = true,
    ["2294779575"] = true,
    ["28811031"] = true,
    ["148160082"] = true,
    ["1223143800"] = true,
    ["4284007675"] = true,
    ["1936677264"] = true,
    ["539292904"] = true,
    ["910830060"] = true,
    ["3750660587"] = true,
    ["341774354"] = true,
    ["3204302209"] = true,
    ["2282558706"] = true,
    ["431576697"] = true,
    ["2092838988"] = true,
    ["476907586"] = true,
    ["3048454573"] = true,
    ["328167896"] = true,
    ["190244068"] = true,
    ["1151689097"] = true,
    ["3293463361"] = true,
    ["2556895291"] = true,
    ["2756453005"] = true,
    ["1200179045"] = true,
    ["525623141"] = true,
    ["4148791700"] = true,
    ["1000258817"] = true,
    ["3628350041"] = true,
    ["741027160"] = true,
    ["3959029566"] = true,
    ["1817275304"] = true,
    ["1338760315"] = true,
    ["2722615358"] = true,
    ["3936892403"] = true,
    ["2600428406"] = true,
    ["3036244276"] = true,
    ["1595421922"] = true,
    ["3393648765"] = true,
    ["2700898573"] = true,
    ["3507816399"] = true,
    ["1416047217"] = true,
    ["1566990507"] = true,
    ["1987049393"] = true,
    ["2011877270"] = true,
    ["1331922171"] = true,
    ["1226518132"] = true,
    ["855547631"] = true,
    ["785467445"] = true,
    ["704686874"] = true,
    ["1119518887"] = true,
    ["153396725"] = true,
    ["2861067768"] = true,
    ["507170720"] = true,
    ["2206953837"] = true,
    ["394659298"] = true,
    ["711953949"] = true,
    ["3754621092"] = true,
    ["3303022956"] = true,
    ["3846072740"] = true,
    ["3857952303"] = true,
    ["3123149825"] = true,
    ["4128808778"] = true,
    ["3808236382"] = true,
    ["2220197671"] = true,
    ["1198717003"] = true,
    ["3708963429"] = true,
    ["2786772340"] = true,
    ["1097917585"] = true,
    ["3643944669"] = true,
    ["2344076862"] = true,
    ["3595383913"] = true,
    ["3796180438"] = true,
    ["1966766321"] = true,
    ["3473446624"] = true,
    ["1186503822"] = true,
    ["3800181289"] = true,
    ["1638077257"] = true,
    ["2456521956"] = true,
    ["2467888918"] = true,
    ["2263283790"] = true,
    ["162065050"] = true,
    ["3530961278"] = true,
    ["3177079402"] = true,
    ["3878337474"] = true,
    ["158495693"] = true,
    ["1820910717"] = true,
    ["50118905"] = true,
    ["84788907"] = true,
    ["3946965070"] = true,
    ["231629074"] = true,
    ["3169388763"] = true,
    ["1371067624"] = true,
    ["3450622333"] = true,
    ["4171469727"] = true,
    ["3355244860"] = true,
    ["3595964737"] = true,
    ["2667462330"] = true,
    ["968648323"] = true,
    ["955522731"] = true,
    ["519052682"] = true,
    ["1176362416"] = true,
    ["3565779982"] = true,
    ["3884172218"] = true,
    ["1744687076"] = true,
    ["3670375085"] = true,
    ["2656583842"] = true,
    ["1015268368"] = true,
    ["1945616459"] = true,
    ["3683206664"] = true,
    ["1697521053"] = true,
    ["1177935125"] = true,
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
    ["2156678476"] = true,
    ["341154295"] = true,
    ["1192341548"] = true,
    ["2966510603"] = true,
    ["1217122433"] = true,
    ["376489128"] = true,
    ["1100844565"] = true,
    ["3041872152"] = true,
    ["1155224728"] = true,
    ["729375873"] = true,
    ["2144528907"] = true,
    ["2756787765"] = true,
    ["4094131943"] = true,
    ["1347266149"] = true,
    ["2275421702"] = true,
    ["1150790720"] = true,
    ["1741783703"] = true,
    ["1392289305"] = true,
    ["3940737434"] = true,
    ["4161575695"] = true,
    ["3948829706"] = true,
    ["3014743549"] = true,
    ["3794660812"] = true,
    ["3746472001"] = true,
    ["3611149825"] = true,
    ["3059926651"] = true,
    ["2361261192"] = true,
    ["1984488269"] = true,
    ["1790524546"] = true,
    ["1599495177"] = true,
    ["984313451"] = true,
    ["562032424"] = true,
    ["816319410"] = true,

}

local stealthKills = {}

local spamPunchStrike = VexonAC.StrikesSystem.createStrikeSystem("AntiSpamPunch", 10, function(playerId)
    VexonAC.DetectPlayer(playerId, VexonAC.Detections.ANTI_KILL, {
        type = "Spam Punch"
    })
end, 2500)

local stealthKillsStrike = VexonAC.StrikesSystem.createStrikeSystem("AntiStealthKills", 3, function(playerId)
    VexonAC.DetectPlayer(playerId, VexonAC.Detections.ANTI_KILL, {
        type = "Stealth Kill Exploit"
    })
end, 5000)

AddEventHandler("weaponDamageEvent", LPH_JIT_MAX(function(sender, data)
    if data.weaponType == 539292904 and VexonAC.Config.Explosions.CancelAllExplosions then CancelEvent() return end
    if data.weaponType == 3750660587 and VexonAC.Config.Explosions.CancelAllFires then CancelEvent() return end

    if VexonAC.Config.Weapons.AntiSpoofedBullets or VexonAC.Config.Weapons.AntiSuperPunch or VexonAC.Config.Weapons.AntiKill then
        if VexonAC.Config.Weapons.AntiKill then
            if data.silenced and data.weaponDamage == 0 and data.weaponType == 2725352035 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    weaponType = data.weaponType,
                    weaponDamage = data.weaponDamage,
                    damageFlags = data.damageFlags,
                })
                return
            end
            if data.silenced and data.weaponDamage == 0 and data.weaponType == 3452007600 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    weaponType = data.weaponType,
                    weaponDamage = data.weaponDamage,
                    damageFlags = data.damageFlags,
                })
                return
            end

            if data.silenced and data.weaponType == 849905853 and (data.damageFlags == 513 or data.damageFlags == 1) and data.weaponDamage == 0 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Tranquilizer",
                })
                return
            end
            
            if data.silenced and data.weaponType == 1003267566 and data.damageFlags == 1581104 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Eulen Send Crash",
                })
                return
            end

            if data.weaponType == 2725352035 and data.damageFlags == 454 and data.weaponDamage == 0 and (data.damageType == 2 or data.damageType == 3)
            and data.hitComponent == 0 and data.actionResultId == 0 then
                --tz fists 1
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Tz Fists",
                    weaponType = data.weaponType,
                    weaponDamage = data.weaponDamage,
                })
                return
            end
            if data.weaponType == 2725352035 and data.damageFlags == 525312 and data.weaponDamage > 0 and data.hitComponent == 0 and data.actionResultId == 0 then
                --keyser fists 1
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Keyser Fists",
                    weaponDamage = data.weaponDamage,
                })
                return
            end

            if data.weaponType == 2725352035 and data.damageFlags == 524288 and data.weaponDamage == 100 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Ambani Fists",
                })
                return
            end

            if data.weaponType == 2725352035 and data.damageFlags == 454 and data.weaponDamage == 0 and data.hitComponent == 20 and data.damageType == 3 then
                --keyser fists 2
                CancelEvent()
                stealthKillsStrike(sender)
            end
            if data.weaponType == 2725352035 and data.weaponDamage >= 200 and data.damageFlags >= 1500000 then
                --eulen fists
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    weaponType = data.weaponType,
                    weaponDamage = data.weaponDamage,
                    damageFlags = data.damageFlags,
                })
                return
            end
            if data.weaponType == 133987706 and data.weaponDamage > 200 and data.damageFlags == 525312 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Ram Exploit",
                    weaponDamage = data.weaponDamage,
                })
                return
            end
            if data.weaponType == 2725352035 and data.damageFlags == 198 and data.weaponDamage == 1 then
                -- keyser punch
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Punch Exploit",
                    weaponDamage = data.weaponDamage,
                })
                return
            end
            if data.weaponType == 2725352035 and (data.damageFlags == 524810 or data.damageFlags == 8339382) and data.weaponDamage == 0 then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                    type = "Slap Exploit",
                    weaponDamage = data.weaponDamage,
                })
                return
            end

            if data.weaponType == 2725352035 and data.damageFlags == 522 and data.hitGlobalId and data.hitGlobalId > 0 then
                local attackerPos = GetEntityCoords(GetPlayerPed(sender))
                local victim = NetworkGetEntityFromNetworkId(data.hitGlobalId)
                local victimOwner = NetworkGetEntityOwner(victim)
                local victimPed = GetPlayerPed(victimOwner)
                local victimPos = GetEntityCoords(victimPed)
                local distance = #(attackerPos - victimPos)
                if IsPedAPlayer(victimPed) and distance >= 5.0 then
                    CancelEvent()
                    spamPunchStrike(sender)
                end
                return
            end
        end

        if (data.parentGlobalId == 0) and (data.damageType == 3 or data.damageType == 10) then

            if VexonAC.Config.Weapons.AntiKill then
                if data.weaponType == 2339582971 and data.weaponDamage == 9999 and data.damageFlags == 525312 then
                    CancelEvent()
                    VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                        weaponType = data.weaponType,
                        weaponDamage = data.weaponDamage,
                        damageFlags = data.damageFlags,
                    })
                    return
                end

                if data.weaponType == 3452007600 and data.weaponDamage >= 512 and data.damageFlags == 16 then
                    CancelEvent()
                    VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                        weaponType = data.weaponType,
                        weaponDamage = data.weaponDamage,
                        damageFlags = data.damageFlags,
                    })
                    return
                end

                if data.weaponType == 1834887169 and data.damageFlags == 2642962 and data.damageTime > 200000 then
                    CancelEvent()
                    VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_KILL, {
                        weaponType = data.weaponType,
                        weaponDamage = data.weaponDamage,
                        damageFlags = data.damageFlags,
                    })
                    return
                end
            end

            if VexonAC.Config.Weapons.AntiSpoofedBullets and (data.damageFlags == 513 or data.damageFlags == 1 or data.weaponType == 911657153) and not data.f133 and not ignoredWeapons[tostring(data.weaponType)] then
                local selectedWeapon = signedToUnsigned(GetSelectedPedWeapon(GetPlayerPed(sender)))
                if data.weaponType ~= selectedWeapon then
                    CancelEvent()
                end

                if data.damageFlags ~= 513 or (data.damageFlags == 513 and (data.willKill or data.hitComponent == 0)) or data.weaponType == 911657153 then
                    local targetId = NetworkGetEntityFromNetworkId(data.hitGlobalId)
                    if DoesEntityExist(targetId) then
                        TriggerClientEvent("__VexonAC:CheckSpoofedBullets", tonumber(sender), selectedWeapon, data.weaponType, data.damageTime)
                    end
                end
            end
        end

        if VexonAC.Config.Weapons.AntiSuperPunch and data.weaponType == 2725352035 then --super punch
            local targetEntity = NetworkGetEntityFromNetworkId(data.hitGlobalId)
            if (data.parentGlobalId == 0) and (data.damageType == 3) and (data.weaponDamage > 500) then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_SUPER_PUNCH, {
                    type = "Player",
                    damages = data.weaponDamage,
                })
                return
            elseif data.hasImpactDir and (data.damageType == 1) and (data.weaponDamage > 400) and (DoesEntityExist(targetEntity) and GetEntityType(targetEntity) == 2) then
                CancelEvent()
                VexonAC.DetectPlayer(sender, VexonAC.Detections.ANTI_SUPER_PUNCH, {
                    type = "Vehicle",
                    damages = data.weaponDamage,
                })
                return
            end
        end
        --todo check les degats cote srv??
    end

    if data.willKill then
        local targetId = NetworkGetEntityFromNetworkId(data.hitGlobalId)
        if DoesEntityExist(targetId) then
            local targetOwner = NetworkGetEntityOwner(targetId)

            if targetId and targetOwner and (tonumber(sender) ~= targetOwner) then
                if not VexonAC.DeadPlayersCache[tonumber(sender)] then VexonAC.DeadPlayersCache[tonumber(sender)] = {} end
                VexonAC.DeadPlayersCache[tonumber(sender)][#VexonAC.DeadPlayersCache[tonumber(sender)]+ 1] = {timestamp = os.time(), killedId = targetOwner}
            end

            VexonAC.SendLog("KILL", sender, {
                target = ("[%s] %s"):format(targetOwner, GetPlayerName(targetOwner) or "Unknown"),
                weaponType = data.weaponType,
            })
        end
    end
end))

RegisterNetEvent("__VexonAC:CheckSpoofedBullets", function(weaponHash, selectedWeapon, spoofedWeapon, damageTime)
    local interval = GetGameTimer() - (damageTime or 0)
    if interval > 500 then return end

    local selectedClientWeaponData = VexonAC.WEAPON_DATA[weaponHash]
    local selectedServerWeaponData = VexonAC.WEAPON_DATA[selectedWeapon]
    local spoofedWeaponData = VexonAC.WEAPON_DATA[spoofedWeapon]
    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPOOFED_BULLETS, {
        selectedClientWeapon = selectedClientWeaponData and selectedClientWeaponData.weaponName or weaponHash,
        selectedServerWeapon = selectedServerWeaponData and selectedServerWeaponData.weaponName or selectedWeapon,
        spoofedWeapon = spoofedWeaponData and spoofedWeaponData.weaponName or spoofedWeapon,
        damageAgo = interval,
    })
end)

-- AddEventHandler("weaponDamageEvent", function(sender, data)
--     if not data.overrideDefaultDamage then return end
--     if data.willKill then return end

--     local interval = GetGameTimer() - data.damageTime
--     if interval > 100 then return end
--     local targetId = NetworkGetEntityFromNetworkId(data.hitGlobalId)
--     if not DoesEntityExist(targetId) then return end

--     local beforeHealth = GetEntityHealth(targetId)
--     Wait(100)

--     local health = GetEntityHealth(targetId)
--     local healthDiff = math.abs(beforeHealth - health - data.weaponDamage)
--     if health == 0 then return end

--     print("checking...", targetId, GetPlayerInvincible(GetPlayerPed(100)), data.weaponDamage)
--     if healthDiff > 2 then
--         print(targetId, "is in god mode", beforeHealth, "->", health, interval)
--     end
-- end)


-- artifacts >= 12882
AddEventHandler("givePedScriptedTaskEvent", function(source, data)
    -- data.entityNetId, data.taskId || See https://alloc8or.re/gta5/doc/enums/eTaskTypeIndex.txt
end)

AddEventHandler("requestNetworkSyncedSceneEvent", function(source, data)
    -- data.sceneId
end)

AddEventHandler("updateNetworkSyncedSceneEvent", function(source, data)
    -- data.sceneId, data.rate
end)

AddEventHandler("stopNetworkSyncedSceneEvent", function(source, data)
    -- data.sceneId
end)

AddEventHandler("startNetworkSyncedSceneEvent", function(source, data)
    -- uint32_t sceneId; // Increased from uint16_t, see "NetworkSynchronisedSceneHacks.cpp"
	-- uint32_t startTime;

	-- bool isActive;

	-- float scenePosX;
	-- float scenePosY;
	-- float scenePosZ;

	-- float sceneRotX;
-- Zm1hLnd0ZiBldmVyeXdoZXJl
	-- float sceneRotY;
	-- float sceneRotZ;
	-- float sceneRotW;

	-- bool hasAttachEntity;
	-- uint16_t attachEntityId;
	-- uint8_t attachEntityBone;

	-- float phaseToStopScene;
	-- float rate;

	-- bool holdLastFrame;
	-- bool isLooped;
	-- float phase;

	-- uint32_t cameraAnimHash;
	-- uint32_t animDictHash;

	-- std::vector<PedEntityData> pedEntities;
	-- std::vector<NonPedEntityData> nonPedEntities;
	-- std::vector<MapEntityData> mapEntities;
end)




-- test in starlife:

-- AddEventHandler("givePedScriptedTaskEvent", function(source, data)
--     console.log("givePedScriptedTaskEvent", source, json.encode(data, {indent = true}))
-- end)

-- AddEventHandler("vehicleComponentControlEvent", function(source, data)
--     console.log("vehicleComponentControlEvent", source, json.encode(data, {indent = true}))
-- end)

-- AddEventHandler("requestNetworkSyncedSceneEvent", function(source, data)
--     console.log("requestNetworkSyncedSceneEvent", source, json.encode(data, {indent = true}))
-- end)

-- AddEventHandler("startNetworkSyncedSceneEvent", function(source, data)
--     console.log("startNetworkSyncedSceneEvent", source, json.encode(data, {indent = true}))
-- end)

-- AddEventHandler("updateNetworkSyncedSceneEvent", function(source, data)
--     console.log("updateNetworkSyncedSceneEvent", source, json.encode(data, {indent = true}))
-- end)

-- AddEventHandler("stopNetworkSyncedSceneEvent", function(source, data)
--     console.log("stopNetworkSyncedSceneEvent", source, json.encode(data, {indent = true}))
-- end)

﻿local createdAIVehicles = {}
local createdAIPeds = {}

local playersWhitelistedHashes = {}
local serverWhitelistedHashes = {}
local alreadySpawnedEntities = {}

local entitiesCreated = {
    Vehicles = {},
    Peds = {},
    Objects = {},
}

local invalidEntitySpawn = VexonAC.StrikesSystem.createStrikeSystem("InvalidEntitySpawn", 3,
    function(playerId, entityModel, entityType, entityPopType, spawnedAge, spawnedAgeServer, firstOwner, noLongerNeeded,
             beenOwnedByPlayer)
        local detection = VexonAC.Detections.ANTI_SPAWN_VEHICLES
        if entityType == 2 then
            detection = VexonAC.Detections.ANTI_SPAWN_VEHICLES
        elseif entityType == 1 then
            detection = VexonAC.Detections.ANTI_SPAWN_PEDS
        elseif entityType == 3 then
            detection = VexonAC.Detections.ANTI_SPAWN_OBJECTS
        end

        VexonAC.DetectPlayer(playerId, detection, {
            entityModel = entityModel,
            entityPopType = entityPopType,
            spawnedAge = spawnedAge,
            spawnedAgeServer = spawnedAgeServer,
            owner = playerId,
            firstOwner = firstOwner,
            noLongerNeeded = noLongerNeeded,
            beenOwnedByPlayer = beenOwnedByPlayer,
        })
    end, 5000)

AddEventHandler("entityCreating", LPH_JIT_MAX(function(entity)
    -- requirements check
    if not DoesEntityExist(entity) then
        CancelEvent()
        return
    end

    local firstOwner = NetworkGetFirstEntityOwner(entity)
    local source = NetworkGetEntityOwner(entity)
    if not source or firstOwner ~= source then
        CancelEvent()
        return
    end

    local entityType = GetEntityType(entity)
    -- local entityNetType = GetNetTypeFromEntity(entity) --introduced in b16636
    -- enum eNetObjEntityType
    -- {
    --     Automobile = 0,
    --     Bike = 1,
    --     Boat = 2,
    --     Door = 3,
    --     Heli = 4,
    --     Object = 5,
    --     Ped = 6,
    --     Pickup = 7,
    --     PickupPlacement = 8,
    --     Plane = 9,
    --     Submarine = 10,
    --     Player = 11,
    --     Trailer = 12,
    --     Train = 13
    -- };

    local entityPopType = GetEntityPopulationType(entity)

    local isVehicle = entityType == 2
    local isPed = entityType == 1
    local isObject = entityType == 3
    local isPickup = entityType == 0

    local isAIEntity = ((isVehicle and entityPopType ~= 4) or isPed) and (entityPopType ~= 6 and entityPopType ~= 7)
    local isNonNeededEntity = ((isVehicle or isPed) and (entityPopType == 5))

    if (isVehicle or isPed) and entityPopType == 0 then
        CancelEvent()
        return
    end

    if ((isPed or isVehicle) and (isAIEntity and not isNonNeededEntity)) then return end

    local entityModel = GetEntityModel(entity)
    if entityModel == 0 and entityType ~= 0 then
        CancelEvent()
        return
    end

    if (isObject) or (isPickup) or (isPed and not isAIEntity) or (isVehicle and not isAIEntity) or (VexonAC.Config.Entities.DisableNPCPopulation and not isObject and isNonNeededEntity) then
        local playerName = GetPlayerName(source) or "unk"

        if isPickup then
            if VexonAC.Config.Entities.LogObjectSpawnsToConsole then
                VexonAC:print(("^3Pickup^0 spawned: by ^3%s^0 (id:^3%s^0)"):format(playerName, source), "^6",
                    "Entities")
            end

            if VexonAC.Config.Entities.AntiPickupSpawn then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_PICKUP_SPAWN, {
                    entityModel = entityModel,
                })
                return
            end
        elseif isObject then
            if VexonAC.Config.Entities.LogObjectSpawnsToConsole then
                VexonAC:print(
                    ("^3Object^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel, playerName, source), "^6",
                    "Entities")
            end

            if (VexonAC.Config.Entities.PreBlackListedObjects[entityModel] or (VexonAC.Config.Entities.EnableObjectsBlackList and VexonAC.Config.Entities.BlackListedObjects[entityModel])) and not VexonAC.Config.Entities.WhiteListedObjects[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.OBJECT_BLACKLIST, {
                    objectModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnableObjectsWhiteList and not VexonAC.Config.Entities.WhiteListedObjects[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.OBJECT_WHITELIST, {
                    objectModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnableObjectsLimiter then
                if not entitiesCreated["Objects"][source] then
                    entitiesCreated["Objects"][source] = { SpawnedCount = 0, SpawnedEntities = {} }
                end

                entitiesCreated["Objects"][source].SpawnedCount = entitiesCreated["Objects"][source].SpawnedCount +
                    1
                table.insert(entitiesCreated["Objects"][source].SpawnedEntities, entity)
                if #entitiesCreated["Objects"][source].SpawnedEntities > 1 then
                    for k, v in ipairs(entitiesCreated["Objects"][source].SpawnedEntities) do
                        if not DoesEntityExist(v) then
                            table.remove(entitiesCreated["Objects"][source].SpawnedEntities, k)
                            entitiesCreated["Objects"][source].SpawnedCount = entitiesCreated["Objects"][source]
                                .SpawnedCount - 1
                        end
                    end
                end

                if entitiesCreated["Objects"][source].SpawnedCount >= tonumber(VexonAC.Config.Entities.ObjectsLimitIn5Seconds) then
                    for k, v in pairs(entitiesCreated["Objects"][source].SpawnedEntities) do
                        if DoesEntityExist(v) then DeleteEntity(v) end
                    end
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.OBJECT_LIMIT, {
                        objectModel = entityModel,
                        spawnedCount = entitiesCreated["Objects"][source].SpawnedCount,
                    })
                    return
                end
            end
        elseif isPed then
            if VexonAC.Config.Entities.LogPedSpawnsToConsole then
                VexonAC:print(
                    ("^3Ped^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel, playerName, source), "^6",
                    "Entities")
            end

            if (VexonAC.Config.Entities.EnablePedsBlackList and VexonAC.Config.Entities.BlackListedPeds[entityModel]) and not VexonAC.Config.Entities.WhiteListedPeds[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.PED_BLACKLIST, {
                    pedModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnablePedsWhiteList and not VexonAC.Config.Entities.WhiteListedPeds[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.PED_WHITELIST, {
                    pedModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnablePedsLimiter then
                if not entitiesCreated["Peds"][source] then
                    entitiesCreated["Peds"][source] = { SpawnedCount = 0, SpawnedEntities = {} }
                end

                entitiesCreated["Peds"][source].SpawnedCount = entitiesCreated["Peds"][source].SpawnedCount +
                    1
                table.insert(entitiesCreated["Peds"][source].SpawnedEntities, entity)
                if #entitiesCreated["Peds"][source].SpawnedEntities > 1 then
                    for k, v in ipairs(entitiesCreated["Peds"][source].SpawnedEntities) do
                        if not DoesEntityExist(v) then
                            table.remove(entitiesCreated["Peds"][source].SpawnedEntities, k)
                            entitiesCreated["Peds"][source].SpawnedCount = entitiesCreated["Peds"][source].SpawnedCount -
                                1
                        end
                    end
                end

                if entitiesCreated["Peds"][source].SpawnedCount >= tonumber(VexonAC.Config.Entities.PedsLimitIn5Seconds) then
                    for k, v in pairs(entitiesCreated["Peds"][source].SpawnedEntities) do
                        if DoesEntityExist(v) then DeleteEntity(v) end
                    end
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.PED_LIMIT, {
                        pedModel = entityModel,
                        spawnedCount = entitiesCreated["Peds"][source].SpawnedCount,
                    })
                    return
                end
            end
        elseif isVehicle then
            if VexonAC.Config.Entities.LogVehicleSpawnsToConsole then
                VexonAC:print(
                    ("^3Vehicle^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                        VexonAC.GetVehicleName(entityModel),
                        playerName, source), "^6",
                    "Entities")
            end

            if VexonAC.Config.Entities.EnableVehiclesBlackList and VexonAC.Config.Entities.BlackListedVehicles[entityModel] == true then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_BLACKLIST, {
                    vehicle = VexonAC.GetVehicleName(entityModel),
                })
                return
            end

            if VexonAC.Config.Entities.EnableVehiclesWhiteList and not VexonAC.Config.Entities.WhiteListedVehicles[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_WHITELIST, {
                    vehicle = VexonAC.GetVehicleName(entityModel),
                })
                return
            end

            if VexonAC.Config.Entities.EnableVehiclesLimiter then
                if not entitiesCreated["Vehicles"][source] then
                    entitiesCreated["Vehicles"][source] = { SpawnedCount = 0, SpawnedEntities = {} }
                end

                entitiesCreated["Vehicles"][source].SpawnedCount = entitiesCreated["Vehicles"][source].SpawnedCount +
                    1
                table.insert(entitiesCreated["Vehicles"][source].SpawnedEntities, entity)
                if #entitiesCreated["Vehicles"][source].SpawnedEntities > 1 then
                    for k, v in ipairs(entitiesCreated["Vehicles"][source].SpawnedEntities) do
                        if not DoesEntityExist(v) then
                            table.remove(entitiesCreated["Vehicles"][source].SpawnedEntities, k)
                            entitiesCreated["Vehicles"][source].SpawnedCount = entitiesCreated["Vehicles"][source]
                                .SpawnedCount - 1
                        end
                    end
                end

                if entitiesCreated["Vehicles"][source].SpawnedCount >= tonumber(VexonAC.Config.Entities.VehiclesLimitIn5Seconds) then
                    for k, v in pairs(entitiesCreated["Vehicles"][source].SpawnedEntities) do
                        if DoesEntityExist(v) then DeleteEntity(v) end
                    end
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_LIMIT, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        spawnedCount = entitiesCreated["Vehicles"][source].SpawnedCount,
                    })
                    return
                end
            end

            if VexonAC.Config.Entities.AntiThrowVehicles then
                local entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))
                if (entitySpeed >= 40) then
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        vehicleSpeed = entitySpeed,
                    })
                    return
                end

                Wait(100)

                if not DoesEntityExist(entity) then return end

                entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))
                if (entitySpeed >= 100) then
                    DeleteEntity(entity)
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        vehicleSpeed = entitySpeed,
                    })
                    return
                end

                Wait(300)

                if not DoesEntityExist(entity) then return end

                entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))
                if entitySpeed >= 24 and entitySpeed <= 26 then
                    DeleteEntity(entity)
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        vehicleSpeed = entitySpeed,
                    })
                    return
                end
            end
        end

        if (isVehicle and VexonAC.Config.Entities.EnableVehiclesAI) or (isPed and VexonAC.Config.Entities.EnablePedsAI and not VexonAC.Config.Entities.WhiteListedPeds[entityModel]) or (isObject and VexonAC.Config.Entities.EnableObjectsAI and not VexonAC.Config.Entities.WhiteListedObjects[entityModel]) then
            local timer = GetGameTimer()
            local lastSpawned = playersWhitelistedHashes[source] and (playersWhitelistedHashes[source][entityModel] or 0) or
            0
            local lastSpawnedServer = serverWhitelistedHashes[entityModel] or 0
            local spawnedAge = timer - lastSpawned
            local spawnedAgeServer = timer - lastSpawnedServer
            local alreadySpawned = alreadySpawnedEntities[entityModel]

            if spawnedAge > 30000 and spawnedAgeServer > 30000 and lastSpawned ~= -1 then
                CancelEvent()

                if alreadySpawned then
                    invalidEntitySpawn(source, entityModel, entityType, entityPopType, spawnedAge, spawnedAgeServer,
                        NetworkGetFirstEntityOwner(entity), HasEntityBeenMarkedAsNoLongerNeeded(entity),
                        HasVehicleBeenOwnedByPlayer(entity))
                    return
                end

                if isVehicle then
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        entityPopType = entityPopType,
                        spawnedAge = spawnedAge,
                        spawnedAgeServer = spawnedAgeServer,
                        owner = source,
                        firstOwner = NetworkGetFirstEntityOwner(entity),
                        noLongerNeeded = HasEntityBeenMarkedAsNoLongerNeeded(entity),
                        beenOwnedByPlayer = HasVehicleBeenOwnedByPlayer(entity),
                    })
                elseif isPed then
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_PEDS, {
                        pedModel = entityModel,
                        entityPopType = entityPopType,
                        spawnedAge = spawnedAge,
                        spawnedAgeServer = spawnedAgeServer,
                        owner = source,
                        firstOwner = NetworkGetFirstEntityOwner(entity),
                        noLongerNeeded = HasEntityBeenMarkedAsNoLongerNeeded(entity),
                    })
                elseif isObject then
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_OBJECTS, {
                        objectModel = entityModel,
                        entityPopType = entityPopType,
                        spawnedAge = spawnedAge,
                        spawnedAgeServer = spawnedAgeServer,
                        owner = source,
                        firstOwner = NetworkGetFirstEntityOwner(entity),
                        noLongerNeeded = HasEntityBeenMarkedAsNoLongerNeeded(entity),
                    })
                end
            elseif spawnedAge > 5000 and spawnedAgeServer > 1000 and lastSpawned ~= -1 then
                VexonAC:print(("Potential malicious entity spawn: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                        (entityModel), GetPlayerName(source) or "unk", source), "^1",
                    "Entity Warning")
                CancelEvent()
            end
        end

        -- VexonAC.SendLog("ENTITY_CREATE", source, {
        --     entityModel = entityModel,
        --     entityType = (isVehicle and "Vehicle" or isPed and "Ped" or isObject and "Object" or isPickup and "Pickup") or "Unknown",
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        -- })
    elseif (isVehicle and isNonNeededEntity and (VexonAC.Config.Entities.EnableVehiclesAIv2 or VexonAC.Config.Entities.EnableVehiclesBlackList) and HasEntityBeenMarkedAsNoLongerNeeded(entity) and (HasVehicleBeenOwnedByPlayer(entity) == 1 or GetVehicleType(entity) == "train")) then
        local entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))

        if VexonAC.Config.Entities.EnableVehiclesBlackList and VexonAC.Config.Entities.BlackListedVehicles[entityModel] == true then
            -- todo check si scenarios ca enleve les autobus, si oui, on desactive scenarios h24 + on ban ici
            -- DeleteEntity(entity)
            CancelEvent()
            VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_BLACKLIST, {
                vehicle = VexonAC.GetVehicleName(entityModel),
                popType = entityPopType,
            })
            return
        end

        if VexonAC.Config.Entities.AntiThrowVehicles then
            if (entitySpeed >= 50) then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                    vehicle = VexonAC.GetVehicleName(entityModel),
                    speed = math.floor(entitySpeed),
                })
                return
            end
        end

        if VexonAC.Config.Entities.EnableVehiclesAIv2 then
            VexonAC:print(
                ("^1Badly spawned Vehicle^0: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                    (VexonAC.GetVehicleName(entityModel)), GetPlayerName(source) or "unk",
                    source), "^1",
                "Entity Warning")
            CancelEvent()
            return
        end
    elseif (VexonAC.Config.Entities.EnableVehiclesAIv2 and isVehicle and isAIEntity and isNonNeededEntity and HasEntityBeenMarkedAsNoLongerNeeded(entity) and not HasVehicleBeenOwnedByPlayer(entity) and GetEntitySpeed(entity) == 0 and not GetIsVehicleEngineRunning(entity) and GetVehicleDoorLockStatus(entity) == 0 and (#(GetEntityCoords(entity) - GetEntityCoords(GetPlayerPed(source))) < 3.0)) then
        VexonAC:print(
            ("^1Potential malicious vehicle spawn^0: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                (VexonAC.GetVehicleName(entityModel)), GetPlayerName(source) or "unk",
                source), "^1",
            "Entity Warning")
        CancelEvent()
    elseif isPed and isNonNeededEntity and HasEntityBeenMarkedAsNoLongerNeeded(entity) and VexonAC.Config.Entities.EnablePedsAIv2 then
        local pedTask = GetPedSpecificTaskType(entity, 0)
        if pedTask == 531 then
            Citizen.Wait(100)
            if not DoesEntityExist(entity) then return end
            pedTask = GetPedSpecificTaskType(entity, 0)
        end

        if pedTask == 38 then return end

        local pedTask2 = GetPedSpecificTaskType(entity, 1)
        local pedWeapon = GetCurrentPedWeapon(entity)
        local isAnimal = pedWeapon == -100946242 or pedWeapon ~= -1569615261 --armes a feu ca met animal

        if pedTask == 1.0 and (pedTask2 == 531 or pedTask2 == 343 or pedTask2 == 1.0 or (pedTask2 == 221 and isAnimal)) then
            VexonAC:print(
                ("^1Badly spawned Ped^0: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel, playerName, source), "^1",
                "Entity Warning")
            DeleteEntity(entity)
            CancelEvent()
            return
        elseif pedTask == 531 and not isAnimal or pedWeapon == 0 then
            --ca delete des vrai ped desfois qui sont pas animal
            DeleteEntity(entity)
            CancelEvent()
            return
        end

        -- if (not playerState[tostring(entityModel)] or lastSpawned > 60000) then
        --     --todo check si ya encore des voitures pnj qui passe ici, sinon on peut ban instant
        --     --todo cote client avec l'event creationnpc on peut check si c pas pnj, ban nstant
        --     TriggerClientEvent("__VexonAC:checkPed", source, NetworkGetNetworkIdFromEntity(entity))
        -- end
    end
end))

CreateThread(function()
    while true do
        entitiesCreated = {
            Vehicles = {},
            Peds = {},
            Objects = {},
        }
        Wait(5000)
    end
end)

function VexonAC.DeleteOwnedEntities(netId)
    for _, entityGroup in pairs({ GetAllObjects(), GetAllPeds(), GetAllVehicles() }) do
        for k, entityHandle in pairs(entityGroup) do
            if DoesEntityExist(entityHandle) then
                if (NetworkGetEntityOwner(entityHandle) == netId or NetworkGetFirstEntityOwner(entityHandle) == netId) then
                    DeleteEntity(entityHandle)
-- ZiBtIGE=
                end
            end
        end
    end
end

RegisterNetEvent("__VexonAC:CreateEntity", LPH_JIT_MAX(function(modelHash, functionReference, resourceName)
    if not resourceName or not serverResources[resourceName] then return end
    local modelHash = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)

    local source = tonumber(source)
    if not playersWhitelistedHashes[source] then playersWhitelistedHashes[source] = {} end
-- ZGlzY29yZC5nZy9mbWE=

    if not alreadySpawnedEntities[modelHash] then alreadySpawnedEntities[modelHash] = true end
    local timer = GetGameTimer()
    if functionReference == "GetClosestObjectOfType" then
        playersWhitelistedHashes[source][modelHash] = -1
        serverWhitelistedHashes[modelHash] = timer
        TriggerClientEvent("_ws:cb", source, modelHash, -1)
    else
        playersWhitelistedHashes[source][modelHash] = timer
        if functionReference ~= "ClonePed" and functionReference ~= "ClonePedEx" then
            serverWhitelistedHashes[modelHash] = timer
        end
        TriggerClientEvent("_ws:cb", source, modelHash, timer)
    end
end))

exports("CreateEntity", LPH_NO_VIRTUALIZE(function(modelHash)
    if not GetInvokingResource() then return end

    local modelHash = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    serverWhitelistedHashes[modelHash] = GetGameTimer()
end))

AddEventHandler("playerDropped", LPH_JIT_MAX(function(reason, resourceName)
    local source = tonumber(source)
    playersWhitelistedHashes[source] = nil
end))

RegisterNetEvent("__VexonAC:checkPed", LPH_JIT_MAX(function(netId)
    local _source = source
    local entity = NetworkGetEntityFromNetworkId(netId)
    local source = NetworkGetFirstEntityOwner(entity)
    if not source or _source ~= source then return end

    if DoesEntityExist(entity) then
        local entityModel = GetEntityModel(entity)

        if VexonAC.Config.Entities.LogPedSpawnsToConsole then
            VexonAC:print(
                ("^1MALICIOUS ^3Ped^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel,
                    GetPlayerName(source) or "unk", source), "^6", "Entities")
        end

        DeleteEntity(entity)

        -- if VexonAC.Config.Entities.EnablePedsWhiteList and not VexonAC.Config.Entities.WhiteListedPeds[entityModel] then
        --     exports[VexonAC.resourceName]:banPlayer(tonumber(source),"Attempted to spawn a blacklisted ped #2","Ped Model: "..entityModel,"Entities")
        --     return
        -- end

        if VexonAC.Config.Entities.EnablePedsAIv2 then
            if createdAIPeds[source] and createdAIPeds[source] >= 5 then
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_AI_SPAWN_PEDS, {
                    pedModel = entityModel,
                })
                return
            else
                if not createdAIPeds[source] then
                    createdAIPeds[source] = 0
                    CreateThread(function()
                        Wait(1000)
                        createdAIPeds[source] = nil
                    end)
                else
                    createdAIPeds[source] = createdAIPeds[source] + 1
                end
            end
        end
    end
end))



﻿local createdAIVehicles = {}
local createdAIPeds = {}

local playersWhitelistedHashes = {}
local serverWhitelistedHashes = {}
local alreadySpawnedEntities = {}

local entitiesCreated = {
    Vehicles = {},
    Peds = {},
    Objects = {},
}

local invalidEntitySpawn = VexonAC.StrikesSystem.createStrikeSystem("InvalidEntitySpawn", 3,
    function(playerId, entityModel, entityType, entityPopType, spawnedAge, spawnedAgeServer, firstOwner, noLongerNeeded,
             beenOwnedByPlayer)
        local detection = VexonAC.Detections.ANTI_SPAWN_VEHICLES
        if entityType == 2 then
            detection = VexonAC.Detections.ANTI_SPAWN_VEHICLES
        elseif entityType == 1 then
            detection = VexonAC.Detections.ANTI_SPAWN_PEDS
        elseif entityType == 3 then
            detection = VexonAC.Detections.ANTI_SPAWN_OBJECTS
        end

        VexonAC.DetectPlayer(playerId, detection, {
            entityModel = entityModel,
            entityPopType = entityPopType,
            spawnedAge = spawnedAge,
            spawnedAgeServer = spawnedAgeServer,
            owner = playerId,
            firstOwner = firstOwner,
            noLongerNeeded = noLongerNeeded,
            beenOwnedByPlayer = beenOwnedByPlayer,
        })
    end, 5000)

AddEventHandler("entityCreating", LPH_JIT_MAX(function(entity)
    -- requirements check
    if not DoesEntityExist(entity) then
        CancelEvent()
        return
    end

    local firstOwner = NetworkGetFirstEntityOwner(entity)
    local source = NetworkGetEntityOwner(entity)
    if not source or firstOwner ~= source then
        CancelEvent()
        return
    end

    local entityType = GetEntityType(entity)
    -- local entityNetType = GetNetTypeFromEntity(entity) --introduced in b16636
    -- enum eNetObjEntityType
    -- {
    --     Automobile = 0,
    --     Bike = 1,
    --     Boat = 2,
    --     Door = 3,
    --     Heli = 4,
    --     Object = 5,
    --     Ped = 6,
    --     Pickup = 7,
    --     PickupPlacement = 8,
    --     Plane = 9,
    --     Submarine = 10,
    --     Player = 11,
    --     Trailer = 12,
    --     Train = 13
    -- };

    local entityPopType = GetEntityPopulationType(entity)

    local isVehicle = entityType == 2
    local isPed = entityType == 1
    local isObject = entityType == 3
    local isPickup = entityType == 0

    local isAIEntity = ((isVehicle and entityPopType ~= 4) or isPed) and (entityPopType ~= 6 and entityPopType ~= 7)
    local isNonNeededEntity = ((isVehicle or isPed) and (entityPopType == 5))

    if (isVehicle or isPed) and entityPopType == 0 then
        CancelEvent()
        return
    end

    if ((isPed or isVehicle) and (isAIEntity and not isNonNeededEntity)) then return end

    local entityModel = GetEntityModel(entity)
    if entityModel == 0 and entityType ~= 0 then
        CancelEvent()
        return
    end

    if (isObject) or (isPickup) or (isPed and not isAIEntity) or (isVehicle and not isAIEntity) or (VexonAC.Config.Entities.DisableNPCPopulation and not isObject and isNonNeededEntity) then
        local playerName = GetPlayerName(source) or "unk"

        if isPickup then
            if VexonAC.Config.Entities.LogObjectSpawnsToConsole then
                VexonAC:print(("^3Pickup^0 spawned: by ^3%s^0 (id:^3%s^0)"):format(playerName, source), "^6",
                    "Entities")
            end

            if VexonAC.Config.Entities.AntiPickupSpawn then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_PICKUP_SPAWN, {
                    entityModel = entityModel,
                })
                return
            end
        elseif isObject then
            if VexonAC.Config.Entities.LogObjectSpawnsToConsole then
                VexonAC:print(
                    ("^3Object^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel, playerName, source), "^6",
                    "Entities")
            end

            if (VexonAC.Config.Entities.PreBlackListedObjects[entityModel] or (VexonAC.Config.Entities.EnableObjectsBlackList and VexonAC.Config.Entities.BlackListedObjects[entityModel])) and not VexonAC.Config.Entities.WhiteListedObjects[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.OBJECT_BLACKLIST, {
                    objectModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnableObjectsWhiteList and not VexonAC.Config.Entities.WhiteListedObjects[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.OBJECT_WHITELIST, {
                    objectModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnableObjectsLimiter then
                if not entitiesCreated["Objects"][source] then
                    entitiesCreated["Objects"][source] = { SpawnedCount = 0, SpawnedEntities = {} }
                end

                entitiesCreated["Objects"][source].SpawnedCount = entitiesCreated["Objects"][source].SpawnedCount +
                    1
                table.insert(entitiesCreated["Objects"][source].SpawnedEntities, entity)
                if #entitiesCreated["Objects"][source].SpawnedEntities > 1 then
                    for k, v in ipairs(entitiesCreated["Objects"][source].SpawnedEntities) do
                        if not DoesEntityExist(v) then
                            table.remove(entitiesCreated["Objects"][source].SpawnedEntities, k)
                            entitiesCreated["Objects"][source].SpawnedCount = entitiesCreated["Objects"][source]
                                .SpawnedCount - 1
                        end
                    end
                end

                if entitiesCreated["Objects"][source].SpawnedCount >= tonumber(VexonAC.Config.Entities.ObjectsLimitIn5Seconds) then
                    for k, v in pairs(entitiesCreated["Objects"][source].SpawnedEntities) do
                        if DoesEntityExist(v) then DeleteEntity(v) end
                    end
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.OBJECT_LIMIT, {
                        objectModel = entityModel,
                        spawnedCount = entitiesCreated["Objects"][source].SpawnedCount,
                    })
                    return
                end
            end
        elseif isPed then
            if VexonAC.Config.Entities.LogPedSpawnsToConsole then
                VexonAC:print(
                    ("^3Ped^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel, playerName, source), "^6",
                    "Entities")
            end

            if (VexonAC.Config.Entities.EnablePedsBlackList and VexonAC.Config.Entities.BlackListedPeds[entityModel]) and not VexonAC.Config.Entities.WhiteListedPeds[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.PED_BLACKLIST, {
                    pedModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnablePedsWhiteList and not VexonAC.Config.Entities.WhiteListedPeds[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.PED_WHITELIST, {
                    pedModel = entityModel,
                })
                return
            end

            if VexonAC.Config.Entities.EnablePedsLimiter then
                if not entitiesCreated["Peds"][source] then
                    entitiesCreated["Peds"][source] = { SpawnedCount = 0, SpawnedEntities = {} }
                end

                entitiesCreated["Peds"][source].SpawnedCount = entitiesCreated["Peds"][source].SpawnedCount +
                    1
                table.insert(entitiesCreated["Peds"][source].SpawnedEntities, entity)
                if #entitiesCreated["Peds"][source].SpawnedEntities > 1 then
                    for k, v in ipairs(entitiesCreated["Peds"][source].SpawnedEntities) do
                        if not DoesEntityExist(v) then
                            table.remove(entitiesCreated["Peds"][source].SpawnedEntities, k)
                            entitiesCreated["Peds"][source].SpawnedCount = entitiesCreated["Peds"][source].SpawnedCount -
                                1
                        end
                    end
                end

                if entitiesCreated["Peds"][source].SpawnedCount >= tonumber(VexonAC.Config.Entities.PedsLimitIn5Seconds) then
                    for k, v in pairs(entitiesCreated["Peds"][source].SpawnedEntities) do
                        if DoesEntityExist(v) then DeleteEntity(v) end
                    end
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.PED_LIMIT, {
                        pedModel = entityModel,
                        spawnedCount = entitiesCreated["Peds"][source].SpawnedCount,
                    })
                    return
                end
            end
        elseif isVehicle then
            if VexonAC.Config.Entities.LogVehicleSpawnsToConsole then
                VexonAC:print(
                    ("^3Vehicle^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                        VexonAC.GetVehicleName(entityModel),
                        playerName, source), "^6",
                    "Entities")
            end

            if VexonAC.Config.Entities.EnableVehiclesBlackList and VexonAC.Config.Entities.BlackListedVehicles[entityModel] == true then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_BLACKLIST, {
                    vehicle = VexonAC.GetVehicleName(entityModel),
                })
                return
            end

            if VexonAC.Config.Entities.EnableVehiclesWhiteList and not VexonAC.Config.Entities.WhiteListedVehicles[entityModel] then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_WHITELIST, {
                    vehicle = VexonAC.GetVehicleName(entityModel),
                })
                return
            end

            if VexonAC.Config.Entities.EnableVehiclesLimiter then
                if not entitiesCreated["Vehicles"][source] then
                    entitiesCreated["Vehicles"][source] = { SpawnedCount = 0, SpawnedEntities = {} }
                end

                entitiesCreated["Vehicles"][source].SpawnedCount = entitiesCreated["Vehicles"][source].SpawnedCount +
                    1
                table.insert(entitiesCreated["Vehicles"][source].SpawnedEntities, entity)
                if #entitiesCreated["Vehicles"][source].SpawnedEntities > 1 then
                    for k, v in ipairs(entitiesCreated["Vehicles"][source].SpawnedEntities) do
                        if not DoesEntityExist(v) then
                            table.remove(entitiesCreated["Vehicles"][source].SpawnedEntities, k)
                            entitiesCreated["Vehicles"][source].SpawnedCount = entitiesCreated["Vehicles"][source]
                                .SpawnedCount - 1
                        end
                    end
                end

                if entitiesCreated["Vehicles"][source].SpawnedCount >= tonumber(VexonAC.Config.Entities.VehiclesLimitIn5Seconds) then
                    for k, v in pairs(entitiesCreated["Vehicles"][source].SpawnedEntities) do
                        if DoesEntityExist(v) then DeleteEntity(v) end
                    end
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_LIMIT, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        spawnedCount = entitiesCreated["Vehicles"][source].SpawnedCount,
                    })
                    return
                end
            end

            if VexonAC.Config.Entities.AntiThrowVehicles then
                local entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))
                if (entitySpeed >= 40) then
                    CancelEvent()
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        vehicleSpeed = entitySpeed,
                    })
                    return
                end

                Wait(100)

                if not DoesEntityExist(entity) then return end

                entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))
                if (entitySpeed >= 100) then
                    DeleteEntity(entity)
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        vehicleSpeed = entitySpeed,
                    })
                    return
                end

                Wait(300)

                if not DoesEntityExist(entity) then return end

                entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))
                if entitySpeed >= 24 and entitySpeed <= 26 then
                    DeleteEntity(entity)
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        vehicleSpeed = entitySpeed,
                    })
                    return
                end
            end
        end

        if (isVehicle and VexonAC.Config.Entities.EnableVehiclesAI) or (isPed and VexonAC.Config.Entities.EnablePedsAI and not VexonAC.Config.Entities.WhiteListedPeds[entityModel]) or (isObject and VexonAC.Config.Entities.EnableObjectsAI and not VexonAC.Config.Entities.WhiteListedObjects[entityModel]) then
            local timer = GetGameTimer()
            local lastSpawned = playersWhitelistedHashes[source] and (playersWhitelistedHashes[source][entityModel] or 0) or
            0
            local lastSpawnedServer = serverWhitelistedHashes[entityModel] or 0
            local spawnedAge = timer - lastSpawned
            local spawnedAgeServer = timer - lastSpawnedServer
            local alreadySpawned = alreadySpawnedEntities[entityModel]

            if spawnedAge > 30000 and spawnedAgeServer > 30000 and lastSpawned ~= -1 then
                CancelEvent()

                if alreadySpawned then
                    invalidEntitySpawn(source, entityModel, entityType, entityPopType, spawnedAge, spawnedAgeServer,
                        NetworkGetFirstEntityOwner(entity), HasEntityBeenMarkedAsNoLongerNeeded(entity),
                        HasVehicleBeenOwnedByPlayer(entity))
                    return
                end

                if isVehicle then
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_VEHICLES, {
                        vehicle = VexonAC.GetVehicleName(entityModel),
                        entityPopType = entityPopType,
                        spawnedAge = spawnedAge,
                        spawnedAgeServer = spawnedAgeServer,
                        owner = source,
                        firstOwner = NetworkGetFirstEntityOwner(entity),
                        noLongerNeeded = HasEntityBeenMarkedAsNoLongerNeeded(entity),
                        beenOwnedByPlayer = HasVehicleBeenOwnedByPlayer(entity),
                    })
                elseif isPed then
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_PEDS, {
                        pedModel = entityModel,
                        entityPopType = entityPopType,
                        spawnedAge = spawnedAge,
                        spawnedAgeServer = spawnedAgeServer,
                        owner = source,
                        firstOwner = NetworkGetFirstEntityOwner(entity),
                        noLongerNeeded = HasEntityBeenMarkedAsNoLongerNeeded(entity),
                    })
                elseif isObject then
                    VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_SPAWN_OBJECTS, {
                        objectModel = entityModel,
                        entityPopType = entityPopType,
                        spawnedAge = spawnedAge,
                        spawnedAgeServer = spawnedAgeServer,
                        owner = source,
                        firstOwner = NetworkGetFirstEntityOwner(entity),
                        noLongerNeeded = HasEntityBeenMarkedAsNoLongerNeeded(entity),
                    })
                end
            elseif spawnedAge > 5000 and spawnedAgeServer > 1000 and lastSpawned ~= -1 then
                VexonAC:print(("Potential malicious entity spawn: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                        (entityModel), GetPlayerName(source) or "unk", source), "^1",
                    "Entity Warning")
                CancelEvent()
            end
        end

        -- VexonAC.SendLog("ENTITY_CREATE", source, {
        --     entityModel = entityModel,
        --     entityType = (isVehicle and "Vehicle" or isPed and "Ped" or isObject and "Object" or isPickup and "Pickup") or "Unknown",
-- b3JpZ2luYWwgb3duZXIgb2YgdGhpcyBzb3VyY2UgaXMgRk1B
        -- })
    elseif (isVehicle and isNonNeededEntity and (VexonAC.Config.Entities.EnableVehiclesAIv2 or VexonAC.Config.Entities.EnableVehiclesBlackList) and HasEntityBeenMarkedAsNoLongerNeeded(entity) and (HasVehicleBeenOwnedByPlayer(entity) == 1 or GetVehicleType(entity) == "train")) then
        local entitySpeed = #(GetEntityVelocity(entity) - vector3(0, 0, 0))

        if VexonAC.Config.Entities.EnableVehiclesBlackList and VexonAC.Config.Entities.BlackListedVehicles[entityModel] == true then
            -- todo check si scenarios ca enleve les autobus, si oui, on desactive scenarios h24 + on ban ici
            -- DeleteEntity(entity)
            CancelEvent()
            VexonAC.DetectPlayer(source, VexonAC.Detections.VEHICLE_BLACKLIST, {
                vehicle = VexonAC.GetVehicleName(entityModel),
                popType = entityPopType,
            })
            return
        end

        if VexonAC.Config.Entities.AntiThrowVehicles then
            if (entitySpeed >= 50) then
                CancelEvent()
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_THROW_VEHICLES, {
                    vehicle = VexonAC.GetVehicleName(entityModel),
                    speed = math.floor(entitySpeed),
                })
                return
            end
        end

        if VexonAC.Config.Entities.EnableVehiclesAIv2 then
            VexonAC:print(
                ("^1Badly spawned Vehicle^0: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                    (VexonAC.GetVehicleName(entityModel)), GetPlayerName(source) or "unk",
                    source), "^1",
                "Entity Warning")
            CancelEvent()
            return
        end
    elseif (VexonAC.Config.Entities.EnableVehiclesAIv2 and isVehicle and isAIEntity and isNonNeededEntity and HasEntityBeenMarkedAsNoLongerNeeded(entity) and not HasVehicleBeenOwnedByPlayer(entity) and GetEntitySpeed(entity) == 0 and not GetIsVehicleEngineRunning(entity) and GetVehicleDoorLockStatus(entity) == 0 and (#(GetEntityCoords(entity) - GetEntityCoords(GetPlayerPed(source))) < 3.0)) then
        VexonAC:print(
            ("^1Potential malicious vehicle spawn^0: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(
                (VexonAC.GetVehicleName(entityModel)), GetPlayerName(source) or "unk",
                source), "^1",
            "Entity Warning")
        CancelEvent()
    elseif isPed and isNonNeededEntity and HasEntityBeenMarkedAsNoLongerNeeded(entity) and VexonAC.Config.Entities.EnablePedsAIv2 then
        local pedTask = GetPedSpecificTaskType(entity, 0)
        if pedTask == 531 then
            Citizen.Wait(100)
            if not DoesEntityExist(entity) then return end
            pedTask = GetPedSpecificTaskType(entity, 0)
        end

        if pedTask == 38 then return end

        local pedTask2 = GetPedSpecificTaskType(entity, 1)
        local pedWeapon = GetCurrentPedWeapon(entity)
        local isAnimal = pedWeapon == -100946242 or pedWeapon ~= -1569615261 --armes a feu ca met animal

        if pedTask == 1.0 and (pedTask2 == 531 or pedTask2 == 343 or pedTask2 == 1.0 or (pedTask2 == 221 and isAnimal)) then
            VexonAC:print(
                ("^1Badly spawned Ped^0: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel, playerName, source), "^1",
                "Entity Warning")
            DeleteEntity(entity)
            CancelEvent()
            return
        elseif pedTask == 531 and not isAnimal or pedWeapon == 0 then
            --ca delete des vrai ped desfois qui sont pas animal
            DeleteEntity(entity)
            CancelEvent()
            return
        end

        -- if (not playerState[tostring(entityModel)] or lastSpawned > 60000) then
        --     --todo check si ya encore des voitures pnj qui passe ici, sinon on peut ban instant
        --     --todo cote client avec l'event creationnpc on peut check si c pas pnj, ban nstant
        --     TriggerClientEvent("__VexonAC:checkPed", source, NetworkGetNetworkIdFromEntity(entity))
        -- end
    end
end))

CreateThread(function()
    while true do
        entitiesCreated = {
            Vehicles = {},
            Peds = {},
            Objects = {},
        }
        Wait(5000)
    end
end)

function VexonAC.DeleteOwnedEntities(netId)
    for _, entityGroup in pairs({ GetAllObjects(), GetAllPeds(), GetAllVehicles() }) do
        for k, entityHandle in pairs(entityGroup) do
            if DoesEntityExist(entityHandle) then
                if (NetworkGetEntityOwner(entityHandle) == netId or NetworkGetFirstEntityOwner(entityHandle) == netId) then
                    DeleteEntity(entityHandle)
-- ZiBtIGE=
                end
            end
        end
    end
end

RegisterNetEvent("__VexonAC:CreateEntity", LPH_JIT_MAX(function(modelHash, functionReference, resourceName)
    if not resourceName or not serverResources[resourceName] then return end
    local modelHash = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)

    local source = tonumber(source)
    if not playersWhitelistedHashes[source] then playersWhitelistedHashes[source] = {} end
-- ZGlzY29yZC5nZy9mbWE=

    if not alreadySpawnedEntities[modelHash] then alreadySpawnedEntities[modelHash] = true end
    local timer = GetGameTimer()
    if functionReference == "GetClosestObjectOfType" then
        playersWhitelistedHashes[source][modelHash] = -1
        serverWhitelistedHashes[modelHash] = timer
        TriggerClientEvent("_ws:cb", source, modelHash, -1)
    else
        playersWhitelistedHashes[source][modelHash] = timer
        if functionReference ~= "ClonePed" and functionReference ~= "ClonePedEx" then
            serverWhitelistedHashes[modelHash] = timer
        end
        TriggerClientEvent("_ws:cb", source, modelHash, timer)
    end
end))

exports("CreateEntity", LPH_NO_VIRTUALIZE(function(modelHash)
    if not GetInvokingResource() then return end

    local modelHash = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    serverWhitelistedHashes[modelHash] = GetGameTimer()
end))

AddEventHandler("playerDropped", LPH_JIT_MAX(function(reason, resourceName)
    local source = tonumber(source)
    playersWhitelistedHashes[source] = nil
end))

RegisterNetEvent("__VexonAC:checkPed", LPH_JIT_MAX(function(netId)
    local _source = source
    local entity = NetworkGetEntityFromNetworkId(netId)
    local source = NetworkGetFirstEntityOwner(entity)
    if not source or _source ~= source then return end

    if DoesEntityExist(entity) then
        local entityModel = GetEntityModel(entity)

        if VexonAC.Config.Entities.LogPedSpawnsToConsole then
            VexonAC:print(
                ("^1MALICIOUS ^3Ped^0 spawned: ^3%s^0 by ^3%s^0 (id:^3%s^0)"):format(entityModel,
                    GetPlayerName(source) or "unk", source), "^6", "Entities")
        end

        DeleteEntity(entity)

        -- if VexonAC.Config.Entities.EnablePedsWhiteList and not VexonAC.Config.Entities.WhiteListedPeds[entityModel] then
        --     exports[VexonAC.resourceName]:banPlayer(tonumber(source),"Attempted to spawn a blacklisted ped #2","Ped Model: "..entityModel,"Entities")
        --     return
        -- end

        if VexonAC.Config.Entities.EnablePedsAIv2 then
            if createdAIPeds[source] and createdAIPeds[source] >= 5 then
                VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_AI_SPAWN_PEDS, {
                    pedModel = entityModel,
                })
                return
            else
                if not createdAIPeds[source] then
                    createdAIPeds[source] = 0
                    CreateThread(function()
                        Wait(1000)
                        createdAIPeds[source] = nil
                    end)
                else
                    createdAIPeds[source] = createdAIPeds[source] + 1
                end
            end
        end
    end
end))



﻿-- local vehiclesRemoved = {}
--
-- AddEventHandler("entityRemoved",function(handle)
--     if not VexonAC.Config.Entities.AntiDeleteVehicles then return end
--     if not DoesEntityExist(handle) then return end
-- 	local entityType = GetEntityType(handle)
-- 	local entityPopulationType = GetEntityPopulationType(handle)
-- 	local source = NetworkGetEntityOwner(handle)
-- 	if entityType == 2 and (entityPopulationType == 6 or entityPopulationType == 7) then
--         local lastDeletedVehicle = Player(source).state["LastDeletedVehicle"] or 0
--         if ((GetGameTimer() - lastDeletedVehicle) > 10000) then
--             if vehiclesRemoved[source] and vehiclesRemoved[source] >= 5 then
--                 CancelEvent()
--                 exports[VexonAC.resourceName]:banPlayer(tonumber(source),"Attempted to delete vehicles.",("Deleted %s vehicles in less than 5 seconds."):format(tonumber(vehiclesRemoved[source])),"Entities")
--                 return
--             else
--                 if not vehiclesRemoved[source] then
--                     vehiclesRemoved[source] = 0
--                     CreateThread(function()
--                         Wait(5000)
--                         vehiclesRemoved[source] = nil
--                     end)
--                 else
--                     vehiclesRemoved[source] = vehiclesRemoved[source] + 1
--                 end
--             end
--         end
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
-- 	end
--     --todo check si ca ban qd c delete cote srv
-- end)



﻿local flagData = {}
local flagThreshold = 5 -- Number of flags before ban
local timeWindow = 10000 -- Time window in milliseconds (10 seconds)

local blacklistedAnimPartialHash = {
	[274603296] = true, --lumia
	[269768552] = true, --phaze
	[789512159] = true, --phaze
	[2178555905] = true, --phaze freecam drag
	[1050245] = true,
    [1050677] = true, --phaze freecam drag
    [137702147] = true, --phaze freecam drag
    [2151786840] = true,
    [418136066] = true, --lumia
	-- phaze control vehicle
	[134355605] = true,
	[134363797] = true,
	[134277781] = true,
	[134271637] = true,
	[2148346200] = true,
	[2149820760] = true,
	[2148444504] = true,
	[3024097374] = true,
	[3236761604] = true,
	[1049653] = true,
	[1049717] = true,
}
  
local blacklistedCameraAnimHash = {
	[3918430216] = true, --lumia
    [100666202] = true, --lumia
	[444598280] = true, --phaze
	[444598277] = true, --phaze
	[444598281] = true, --phaze
	[173650] = true, --phaze freecam drag
	[2236392730] = true, --phaze control vehicle
	[109036198] = true, --phaze control vehicle
}

AddEventHandler("startNetworkSyncedSceneEvent", function(sender, data)
	if not VexonAC.Config.Premium.AntiRequestControl then return end
	if #data.pedEntities ~= 1 then return end
	local source = tonumber(sender)
	
	local animPartialHash = data.pedEntities[1].animPartialHash
	if 	blacklistedAnimPartialHash[animPartialHash]
		or (animPartialHash >= 134200000 and animPartialHash <= 134500000)
		or (animPartialHash >= 2148000000 and animPartialHash <= 2159000000)
		or (animPartialHash >= 1048000 and animPartialHash <= 1051000)
	then
		CancelEvent()
		VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_REQUEST_CONTROL, {
			animPartialHash = animPartialHash,
		})
		return;
	end

	local cameraAnimHash = data.cameraAnimHash
	if blacklistedCameraAnimHash[cameraAnimHash] or (cameraAnimHash >= 444598000 and cameraAnimHash <= 444599000) then
		CancelEvent()
		VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_REQUEST_CONTROL, {
			cameraAnimHash = cameraAnimHash,
		})
		return;
	end

	local attachEntityBone = data.attachEntityBone
	if data.rate >= 1 and data.hasAttachEntity and (attachEntityBone == 24 or attachEntityBone == 28) and data.cameraAnimHash > 0 then
		CancelEvent()
		-- exports["VexonAC"]:banPlayer(
			-- source, 
			-- "Attempted to control an entity", 
			-- "Attach Bone: " .. attachEntityBone, 
			-- "Entities"
		-- )
		return;
	end

	local objectId = data.pedEntities[1].objectId
	local entity = NetworkGetEntityFromNetworkId(objectId)
	local entityOwner = NetworkGetEntityOwner(entity)
	local entityType = GetEntityType(entity)

	if source ~= entityOwner and (entityType == 1 or entityType == 2) then				
		local currentTime = GetGameTimer()
		
		-- Clean up expired entries for this player
		if flagData[source] and currentTime - flagData[source].time > timeWindow then
			flagData[source] = nil
		end
		
		-- Initialize or update player data
		if not flagData[source] then
			flagData[source] = { time = currentTime, count = 1 }
		else
			flagData[source].count = flagData[source].count + 1
		end
		
		-- Ban if threshold reached
		if flagData[source].count >= flagThreshold then
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
			CancelEvent()
-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm
			VexonAC.DetectPlayer(source, VexonAC.Detections.ANTI_REQUEST_CONTROL, {
				reason = "Spam",
			})
			flagData[source] = nil
		end
	end
end)



﻿if GlobalState.VexonACCustomServerBuild then
    AddEventHandler("WS_ayznnn_requestPhoneExplosionEvent", function(sender, data)
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
        if VexonAC.Config.Premium.AntiBombVehicles then
            CancelEvent()
            VexonAC.DetectPlayer(sender, "Vehicle Phone Explosion Detected", {
-- WlhYWFhYWFhYWFhYWFhYWENDQ0NDQ0NDQ0NDQ0NDQ0NDQyBmbWE=
                stateChangeName = data.stateChangeName,
            })
        end
    end)

    AddEventHandler("WS_ayznnn_ragdollRequestEvent", function(sender, data)
        if VexonAC.Config.Premium.AntiRagdollExploit then
            CancelEvent()
            VexonAC.DetectPlayer(sender, "Illegal Ragdoll Attempt Detected")
        end
    end)

    AddEventHandler("WS_ayznnn_scriptEntityStateChangeEvent", function(sender, data)
        if VexonAC.Config.Premium.AntiRequestControl then
-- Zm1hLnd0Zg==
            if data.stateChangeName == "SetExclusiveDriver" then
                CancelEvent()
                VexonAC.DetectPlayer(sender, "Illegal Entity State Change Detected", {
                    stateChangeName = data.stateChangeName,
                })
            end
        end
-- ZGlzY29yZC5nZy9mbWE=
    end)
end


