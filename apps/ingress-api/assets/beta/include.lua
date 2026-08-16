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

﻿local isServerSide <const> = IsDuplicityVersion()
local VexonAC = {}
local PlayerId <const> = PlayerId
local type <const> = type
local GlobalState = GlobalState
local table_unpack <const> = table.unpack
local debug <const> = debug
local debug_getinfo <const> = debug.getinfo
local _in <const> = Citizen.InvokeNative
local GetGameTimer <const> = GetGameTimer
local Wait <const> = Wait
local _exports <const> = exports

VexonAC.exports = _exports["VexonAC"]
VexonAC.resourceName = GetCurrentResourceName()
VexonAC.Wait = Wait
VexonAC.CreateThread = CreateThread

VexonAC.GenerateSubstitution = LPH_JIT_MAX(function(key)
  local blacklist = {
      ["^"] = true,
      [" "] = true,
      ["\\"] = true
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

if isServerSide then
  VexonAC.CreateThread(function()
      while not GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""] or not GlobalState.HHct1C6gobnW3DkIQUxiXk9Q do
          VexonAC.Wait(10)
      end

      VexonAC.SubstitutionKey = GlobalState.HHct1C6gobnW3DkIQUxiXk9Q
      VexonAC.Substitution, VexonAC.InverseSubstitution = VexonAC.GenerateSubstitution(GetConvar(VexonAC.SubstitutionKey, "weaponDamageEvent"))

      VexonAC.IsEventTokenizationReady = true
  end)
else
  if not GlobalState.HHct1C6gobnW3DkIQUxiXk9Q then while true do end end
  
  VexonAC.SubstitutionKey = GlobalState.HHct1C6gobnW3DkIQUxiXk9Q
  VexonAC.Substitution, VexonAC.InverseSubstitution = VexonAC.GenerateSubstitution(GetConvar(VexonAC.SubstitutionKey, "weaponDamageEvent"))

  VexonAC.IsEventTokenizationReady = true
end

-- Consolidated ignored events list with exact matches and glob patterns
local predefinedIgnoredEvents = {
  -- Exact matches (converted from old ignoredEvents)
  "ox_lib:validateCallback",
  "onResourceStarting",
  "mumbleDisconnected", 
  "entityDamaged",
  "onClientResourceStart",
  "onResourceStop",
  "gameEventTriggered",
  "onClientResourceStop",
  "populationPedCreating",
  "mumbleConnected",
  "onServerResourceStart",
  "onServerResourceStop", 
  "onResourceListRefresh",
  "playerConnecting",
  "playerDropped",
  "playerJoining",
  "rconCommand",
  "weaponDamageEvent",
  "vehicleComponentControlEvent",
  "ptFxEvent",
  "removeAllWeaponsEvent",
  "removeWeaponEvent",
  "startProjectileEvent",
  "giveWeaponEvent",
  "clearPedTasksEvent",
  "fireEvent",
  "respawnPlayerPedEvent",
  "explosionEvent",
  "entityCreated",
-- ZGlzY29yZC5nZy9mbWE=
  "entityCreating",
  "entityRemoved",
  "playerEnteredScope",
  "playerLeftScope",
  "hostingSession",
  "hostedSession",
  "sessionHostResult",
  "playerSpawned",
  "onClientMapStart",
  "onClientMapStop",
  "onClientGameTypeStart",
  "onClientGameTypeStop",
  "onMapStart",
  "onMapStop",
  "onGameTypeStart",
  "onGameTypeStop",
  "CEvent",
  "__VexonAC_internal:protectEvent",
  
  -- Glob patterns (converted from old prohibitedEvents)
  "__cfx_export_VexonAC_*",
  "__cfx_internal:*",
  "__cfx_nui:*", 
  "txaLogger:*",
  "txsv:*",
  "baseevents:*",
  "mapmanager:*",
  "pmc__callback_retval:*",
  "_WS:webrtc:*"
}

-- Pre-build exact match lookup table for O(1) performance
local exactMatchCache = {}
local globPatterns = {}

-- Separate exact matches from glob patterns for optimization
for i = 1, #predefinedIgnoredEvents do
  local pattern = predefinedIgnoredEvents[i]
  if pattern:find("*") then
    globPatterns[#globPatterns + 1] = pattern
  else
    exactMatchCache[pattern] = true
  end
end

-- Optimized glob pattern matching function
local function matchesGlobPattern(eventName, pattern)
  if not pattern:find("*") then
      return eventName == pattern
  end
  
  -- Handle patterns ending with *
  if pattern:sub(-1) == "*" then
      local prefix = pattern:sub(1, -2)
      return eventName:sub(1, #prefix) == prefix
  end
  
  -- Handle patterns starting with *
  if pattern:sub(1, 1) == "*" then
      local suffix = pattern:sub(2)
      return eventName:sub(-#suffix) == suffix
  end
  
  -- Handle patterns with * in the middle
  local starPos = pattern:find("*")
  if starPos then
      local prefix = pattern:sub(1, starPos - 1)
      local suffix = pattern:sub(starPos + 1)
      return eventName:sub(1, #prefix) == prefix and eventName:sub(-#suffix) == suffix
  end
  
  return eventName == pattern
end

-- Consolidated and optimized event filtering function
local isIgnoredEvent = LPH_NO_VIRTUALIZE(function(eventName)
  if not eventName or type(eventName) ~= "string" or eventName == "" then
      return true
  end

  -- Fast O(1) lookup for exact matches
  if exactMatchCache[eventName] then
      return true
  end

  -- Check predefined glob patterns
  for i = 1, #globPatterns do
      if matchesGlobPattern(eventName, globPatterns[i]) then
          return true
      end
  end

  -- Check configuration-based ignored events
  local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
  if Configuration and Configuration.Main then
      local configIgnoredEvents = Configuration.Main.IgnoredEvents
      if configIgnoredEvents then
          for i = 1, #configIgnoredEvents do
              local ignoredPattern = configIgnoredEvents[i]
              if matchesGlobPattern(eventName, ignoredPattern) then
                  return true
              end
          end
      end
  end

  return false
end)


﻿if not isServerSide then

VexonAC.TriggerServerEvent = TriggerServerEvent
VexonAC.TriggerEvent = TriggerEvent
VexonAC.TriggerServerEventInternal = TriggerServerEventInternal
VexonAC.TriggerEventInternal = TriggerEventInternal
VexonAC.TriggerLatentServerEventInternal = TriggerLatentServerEventInternal
VexonAC.GetStateBagValue = GetStateBagValue
VexonAC.SetStateBagValue = SetStateBagValue
VexonAC.msgpack = msgpack.pack
VexonAC.msgpack_args = msgpack.pack_args
VexonAC.print = print

local serverId = GetPlayerServerId(PlayerId())
local isFXAP = LoadResourceFile(VexonAC.resourceName, '.fxap') ~= nil
local stateBagTimers = {}
local stateBagVariables = {}
local ConfigBagKey = GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q
if not ConfigBagKey then
    VexonAC.print("VexonAC is not correctly started, check your console.")
    return
end

VexonACAPI = {}

local lastHeartbeat = 0
VexonAC.CreateThread(LPH_NO_VIRTUALIZE(function() while true do lastHeartbeat = GetGameTimer() VexonAC.Wait(1000) end end))   

local _pcall = pcall
local _load = load
local _xpcall = xpcall

local playerBagName = ("player:%d"):format(serverId)

local SafeGetLocalPlayerState = function(key)
    return VexonAC.GetStateBagValue(playerBagName, key)
end

local SafeSetLocalPlayerState = function(key, value, replicated)
    local payload = VexonAC.msgpack(value)
    return VexonAC.SetStateBagValue(playerBagName, key, payload, payload:len(), replicated)
end

-- ============================================================================
-- OPTIMIZED IsValidExecution (Client-Side Stack Gathering)
-- ============================================================================


local debugStateBagName = VexonAC.EncryptString("ws_debug", VexonAC.Substitution)
local executionCache = {}

-- Pre-computed constants for fast comparison
local SCHEDULER_PATH <const> = "citizen:/scripting/lua/scheduler.lua"
local CITIZEN_PREFIX <const> = "citizen:/scripting/lua/"

-- Reusable stacks table to avoid allocations
local stacksBuffer = {}
local stacksBufferSize = 0

-- Fast hash function for cache keys (avoids string.format overhead)
local computeCacheHash = LPH_NO_VIRTUALIZE(function(funcName, src, name, namewhat, line)
    local h = 5381
    if funcName then
        for i = 1, #funcName do
            h = ((h * 33) + string.byte(funcName, i)) % 2147483647
        end
    end
    if src then
        for i = 1, #src do
            h = ((h * 33) + string.byte(src, i)) % 2147483647
        end
    end
    if name then
        for i = 1, #name do
            h = ((h * 33) + string.byte(name, i)) % 2147483647
        end
    end
    if namewhat then
        for i = 1, #namewhat do
            h = ((h * 33) + string.byte(namewhat, i)) % 2147483647
        end
    end
    h = ((h * 33) + (line or 0)) % 2147483647
    return h
end)

-- Clear stacks buffer for reuse
local function clearStacksBuffer()
    for i = 1, stacksBufferSize do
        stacksBuffer[i] = nil
    end
    stacksBufferSize = 0
end

local IsValidExecution <const> = LPH_JIT_MAX(function(functionName, functionName2, additionalStacks)
    additionalStacks = additionalStacks or 0
    local targetLevel = 3 + additionalStacks
    
    -- Get the critical info3 first for cache check (only one call initially)
    local info3 = debug_getinfo(targetLevel, "lLnS")
    if not info3 then
        return true -- No stack info available, allow
    end
    
    -- Compute cache key using hash (faster than string.format)
    local cacheKey = computeCacheHash(
        functionName,
        info3.short_src,
        info3.name,
        info3.namewhat,
        info3.currentline
    )
    
    -- Check cache first (most common path)
    local cached = executionCache[cacheKey]
    if cached then
        local debugMode = SafeGetLocalPlayerState(debugStateBagName) and true or false
        if debugMode then
            executionCache[cacheKey] = nil
        else
            return cached
        end
    end
    
    -- Fast path: Known safe scheduler patterns (avoid full stack gathering)
    local src = info3.short_src
    if src == SCHEDULER_PATH then
        local line = info3.currentline
        if functionName == "pcall" and line == 718 then
            executionCache[cacheKey] = true
            return true
        end
        if functionName == "xpcall" and line == 483 then
            executionCache[cacheKey] = true
            return true
        end
    end
    
    -- Fast path: Luraph obfuscated code
    if functionName == "pcall" and src and src:find("Luraph", 1, true) then
        executionCache[cacheKey] = true
        return true
    end
    
    -- Now we need to gather full stacks for the export call
    -- Use smart depth detection: start with common depth, expand if needed
    clearStacksBuffer()
    
    local maxDepth = 20 -- Most executions don't exceed this
    local foundEnd = false
    
    for i = 1, maxDepth do
        local info
        if i == targetLevel then
            info = info3 -- Reuse already fetched info
        else
            info = debug_getinfo(i, "Snl")
        end
        
        if not info then
            foundEnd = true
            break
        end
        
        stacksBuffer[i] = info
        stacksBufferSize = i
    end
    
    -- If we hit maxDepth without finding end, continue (rare case)
    if not foundEnd then
        for i = maxDepth + 1, 100 do -- Extended limit but not 1000
            local info = debug_getinfo(i, "Snl")
            if not info then break end
            stacksBuffer[i] = info
            stacksBufferSize = i
        end
    end
    
    -- Call the validation export
    local isValid = false
    local ok, err = _pcall(function()
        isValid = VexonAC.exports:IsValidExecution(functionName, functionName2, stacksBuffer, additionalStacks, isFXAP)
    end)
    
    if not ok then
        if VexonAC.resourceName ~= "monitor" and VexonAC.resourceName ~= "VexonAC" then
            VexonAC.print("^1Invalid VexonAC installation, please start VexonAC first in your server.cfg")
        end
        return true
    end
    
    if isValid then
        executionCache[cacheKey] = true
    end
    
    return isValid or false
end)

VexonACAPI.IsValidExecution = IsValidExecution
-- VexonACAPI.BlockNativeExecution = function(functionName)
--     _G[functionName] = function(...)
--         VexonAC.DetectPlayer("Blocked Native Execution", {
--             functionName = functionName,
--             resourceName = VexonAC.resourceName
--         })

--         return nil
--     end
-- end

local backup = VexonACAPI
VexonACAPI = setmetatable({}, {
    __index = backup,
    __newindex = function(t, k, v)
        if backup[k] then
            VexonAC.DetectPlayer("Bypass Attempt Detected", {
                functionName = k,
                resourceName = VexonAC.resourceName
            })
            return
        end
        backup[k] = v
    end
})

local AllowSource = LPH_NO_VIRTUALIZE(function(source)
    VexonAC.exports:AllowSource(source)
end)

VexonAC.DetectPlayer = function(detection, details, action, duration)
    while not VexonAC.IsEventTokenizationReady do VexonAC.Wait(10) end
    local BanEventToken = VexonAC.EncryptString(GlobalState.BanEventToken, VexonAC.Substitution)
    
    if not detection then detection = "Unknown Reason" end
    if type(detection) == "string" then
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

exports('IsAlive', function()
    return true, lastHeartbeat
end)

local clientFunctions = {
    ["CreateCam"] = {
        Type = "Exports",
        When = "After",
        ExportName = "createCam"
    },
    ["CreateCamera"] = {
        Type = "Exports",
        When = "After",
        ExportName = "createCam"
    },
    ["CreateCamWithParams"] = {
        Type = "Exports",
        When = "After",
        ExportName = "createCam"
    },
    ["CreateCameraWithParams"] = {
        Type = "Exports",
        When = "After",
        ExportName = "createCam"
    },
    ["DestroyCam"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "destroyCam",
        Args = {1}
    },
    ["DestroyAllCams"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "destroyCams"
    },
    ["DisplayOnscreenKeyboardWithLongerInitialString"] = {
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        Type = "Exports",
        When = "Before",
        ExportName = "displayInputBox",
        SkipVerification = true
    },
    ["DisplayOnscreenKeyboard"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "displayInputBox",
        SkipVerification = true
    },
    ["StartPlayerTeleport"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasTeleported",
        Flags = {"PlayerId"}
    },
    ["SetPlayerModel"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasChangedPedModel",
        Flags = {"PlayerId"},
        Args = {2}
    },
    ["ResurrectPed"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "playerRevived",
        Flags = {"PlayerPedId"}
    },
    ["NetworkResurrectLocalPlayer"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "playerRevived"
    },
    ["ReviveInjuredPed"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "playerRevived",
        Flags = {"PlayerPedId"}
    },
    ["RestorePlayerStamina"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "resettedStamina",
        Flags = {"PlayerId"},
        SkipVerification = true
    },
    ["ModifyVehicleTopSpeed"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "newTopSpeedModifier",
        Flags = {"Driver"},
        Args = {2},
        Alts = {"SetVehicleEnginePowerMultiplier"},
        SkipVerification = true
    },
    ["SetVehicleCheatPowerIncrease"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "newCheatPowerIncrease",
        Flags = {"Driver"},
        Args = {2},
        Alts = {"SetVehicleEngineTorqueMultiplier"},
        SkipVerification = true
    },
    ["SetVehicleGravityAmount"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "newGravity",
        Flags = {"Driver"},
        Args = {2}
    },
    ["AddAmmoToPed"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasAddedAmmo",
        Flags = {"PlayerPedId"}
    },
    ["AddAmmoToPedByType"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasAddedAmmo",
        Flags = {"PlayerPedId"},
        Alts = {"AddPedAmmo"},
        SkipVerification = true
    },
    ["RefillAmmoInstantly"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasAddedAmmo",
        Flags = {"PlayerPedId"},
        Alts = {"PedSkipNextReloading"},
        SkipVerification = true
    },
    ["SetAmmoInClip"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasAddedAmmo",
        Flags = {"PlayerPedId"}
    },
    ["SetPedAmmo"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasAddedAmmo",
        Flags = {"PlayerPedId"}
    },
    ["SetPedAmmoByType"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "hasAddedAmmo",
        Flags = {"PlayerPedId"}
    },
    ["GiveWeaponToPed"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "giveWeapon",
        Flags = {"PlayerPedId"},
        Args = {2}
    },
    ["RemoveAllPedWeapons"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "removeAllWeapons",
        Flags = {"PlayerPedId"}
    },
    ["RemoveWeaponFromPed"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "removeWeapon",
        Flags = {"PlayerPedId"},
        Args = {2}
    },
    ["NetworkSetInSpectatorMode"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "setSpectatorMode",
        Args = {1}
    },
    ["NetworkSetInSpectatorModeExtended"] = {
        Type = "Exports",
        When = "Before",
        ExportName = "setSpectatorMode",
        Args = {1}
    },
    ["SetVehicleNumberPlateText"] = {
        Type = "StateBag",
        Mode = "ToClient",
        StateBagName = "_WS:LastChangedVehiclePlate"
    },
    ["SetDefaultVehicleNumberPlateTextPattern"] = {
        Type = "StateBag",
        Mode = "ToClient",
        StateBagName = "_WS:LastChangedVehiclePlate"
    },
    ["StartNetworkedParticleFxLoopedOnEntity"] = {
        Type = "StateBag",
        Mode = "WhiteList",
        Args = {"StartNetworkedParticleFxLoopedOnEntity", "__VexonAC:CreateParticle"},
    },
    ["StartNetworkedParticleFxLoopedOnEntityBone"] = {
        Type = "StateBag",
        Mode = "WhiteList",
        Args = {"StartNetworkedParticleFxLoopedOnEntityBone", "__VexonAC:CreateParticle"},
    },
    ["StartNetworkedParticleFxNonLoopedAtCoord"] = {
        Type = "StateBag",
        Mode = "WhiteList",
        Args = {"StartNetworkedParticleFxNonLoopedAtCoord", "__VexonAC:CreateParticle"},
    },
    ["StartNetworkedParticleFxNonLoopedOnEntity"] = {
        Type = "StateBag",
        Mode = "WhiteList",
        Args = {"StartNetworkedParticleFxNonLoopedOnEntity", "__VexonAC:CreateParticle"},
    },
    ["StartNetworkedParticleFxNonLoopedOnEntityBone"] = {
        Type = "StateBag",
        Mode = "WhiteList",
        Args = {"StartNetworkedParticleFxNonLoopedOnEntityBone", "__VexonAC:CreateParticle"}
    },
    ["StartNetworkedParticleFxNonLoopedOnPedBone"] = {
        Type = "StateBag",
        Mode = "WhiteList",
        Args = {"StartNetworkedParticleFxNonLoopedOnPedBone", "__VexonAC:CreateParticle"},
    },
    ["MumbleSetTalkerProximity"] = {
        Type = "StateBag",
        Mode = "ToClient",
        StateBagName = "_WS:TalkerProximity",
        ArgValuePosition = 1
    },
    ["NetworkSetTalkerProximity"] = {
        Type = "StateBag",
        Mode = "ToClient",
        StateBagName = "_WS:TalkerProximity",
        ArgValuePosition = 1
    },
    ["MumbleSetAudioOutputDistance"] = {
        Type = "StateBag",
        Mode = "ToClient",
        StateBagName = "_WS:TalkerProximity",
        ArgValuePosition = 1
    },
    --[[ ["print"] = {}, ]]
}

VexonAC.SetSecuredStateBag = LPH_JIT_MAX(function(bagName, value, replicated)
    if not replicated then
        SafeSetLocalPlayerState(VexonAC.ConvertEvent("SetSecuredStateBag"), {
            b = VexonAC.EncryptString(bagName, VexonAC.Substitution),
            t = VexonAC.EncryptString(GlobalState.StateBagsToken, VexonAC.Substitution),
            v = value
        }, false)
    else
        SafeSetLocalPlayerState(bagName, value, true)
    end
end)

local _CreateThread = CreateThread
CreateThread = LPH_NO_VIRTUALIZE(function(func, ...)
    if not IsValidExecution("CreateThread") then
        return
    end

    return _CreateThread(func, ...)
end)
Citizen.CreateThread = CreateThread

local _coroutine_create = coroutine.create
coroutine.create = LPH_NO_VIRTUALIZE(function(func, ...)
    if not IsValidExecution("create") then
        return
    end

    return _coroutine_create(func, ...)
end)

local _invokeFunctionReference = Citizen.InvokeFunctionReference
Citizen.InvokeFunctionReference = LPH_NO_VIRTUALIZE(function(functionReference, ...)
    if not IsValidExecution("InvokeFunctionReference") then
        return
    end
    return _invokeFunctionReference(functionReference, ...)
end)

--Ox imports compatibility
debug.getinfo = LPH_NO_VIRTUALIZE(function(thread, func, ...)
    if type(thread) == "number" then
        thread = thread + 1

        local callerInfo = debug_getinfo(2, "Sn")
        if callerInfo and callerInfo.source:find("^@@ox_lib/imports/require") and callerInfo.name == "getModuleInfo" and type(thread) == "number" then
            local callingInfo = debug_getinfo(thread + 2, "n")
            if callingInfo and callingInfo.name == "pcall" then
                thread = thread + 3
            end
        end
    end

    local info = debug_getinfo(thread, func, ...)
    return info
end)

local debug_getupvalue = debug.getupvalue
debug.getupvalue = LPH_JIT_MAX(function(func, upvalueIndex, ...)
    local info = debug_getinfo(2, "Snl")
    if info.short_src ~= "citizen:/scripting/lua/scheduler.lua" then
        VexonAC.DetectPlayer("Bypass Attempt Detected", {
            native = "debug.getupvalue",
            source = info.short_src
        })
        return
    end

    local name, value = debug_getupvalue(func, upvalueIndex, ...)
    return name, value
end)

load = LPH_NO_VIRTUALIZE(function(chunk, source, ...)
    if not IsValidExecution("load") then
        return
    end

    if source then
        _pcall(function() AllowSource(source) end)
    end

    return _load(chunk, source, ...)
end)

pcall = function(...)
    if not IsValidExecution("pcall") then
        return
    end

    return _pcall(...)
end

xpcall = function(...)
    if not IsValidExecution("xpcall") then
        return
    end

    return _xpcall(...)
end

local _registerCommand = RegisterCommand
RegisterCommand = function(...)
    if not IsValidExecution("RegisterCommand") then
        return
    end

    return _registerCommand(...)
end

local removeEventHandler = RemoveEventHandler
RemoveEventHandler = LPH_NO_VIRTUALIZE(function(eventHandlerData, ...)
    if type(eventHandlerData) ~= "table" then return end
    if eventHandlerData.e then
        removeEventHandler(eventHandlerData.e, ...)
    end
    if eventHandlerData.n then
        removeEventHandler(eventHandlerData.n, ...)
    end
    if eventHandlerData.name and eventHandlerData.key then
        removeEventHandler(eventHandlerData, ...)
    end
end)

local addEventHandler = AddEventHandler
AddEventHandler = LPH_JIT_MAX(function(eventName, callback)
    if isIgnoredEvent(eventName) then
        return addEventHandler(eventName, callback)
    end

    local oldEvent, newEvent
    VexonAC.TriggerEvent("__VexonAC_internal:protectEvent", eventName)

    oldEvent = addEventHandler(eventName, function(...)
        local invoker = GetInvokingResource()
        if invoker ~= nil then
            local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
            
            local shouldBan = false
            if Configuration and lastHeartbeat > 0 then
                if eventName:find("__cfx_export_") then
                    shouldBan = Configuration.Main.AntiTriggerExportAI
                else
                    shouldBan = Configuration.Main.AntiTriggerClientEventAI
                end
            end

            if (shouldBan and not isIgnoredEvent(eventName)) or eventName:find("VexonAC") then
                if not Configuration.Settings.IgnoredScripts[invoker] then
                    local isEventProtected = VexonAC.exports:IsEventProtected(eventName)
                    if isEventProtected then
                        VexonAC.DetectPlayer("Illegal Client Event Triggered", {
                            eventName = eventName,
                            invoker = invoker,
                            resourceName = VexonAC.resourceName
                        })
                        return
                    end
                end
            end
        end

        if callback and type(callback) == "function" then
            return callback(...)
        end
    end)

    local encryptedEventName = VexonAC.ConvertEvent(eventName)
    RegisterNetEvent(encryptedEventName)
    newEvent = addEventHandler(encryptedEventName, function(clientToken, ...)
        if not eventName:find("__cfx_export_") and not GetInvokingResource() then return end

        if type(clientToken) ~= "string" then
            VexonAC.DetectPlayer("Illegal Client Event Triggered", {
                reason = "Invalid token type",
                eventName = eventName,
                invoker = GetInvokingResource(),
                resourceName = VexonAC.resourceName
            })
            return
        end

        local decryptedClientToken = VexonAC.DecryptString(clientToken, VexonAC.InverseSubstitution)
        local clientServerId, clientGameTime, clientSignature = string.match(decryptedClientToken or "", "([^:]+):([^:]+):([^:]+)")

        if lastHeartbeat > 0 and (clientSignature ~= "ayznnn" or clientServerId ~= tostring(serverId) or not tonumber(clientGameTime) or (GetGameTimer() - tonumber(clientGameTime)) > 250) then
            VexonAC.DetectPlayer("Illegal Client Event Triggered", {
                reason = "Invalid token",
                eventName = eventName,
                invoker = GetInvokingResource(),
                resourceName = VexonAC.resourceName
            })
            return
        end

        if callback and type(callback) == "function" then
            return callback(...)
        end
    end)

    return {
        n = newEvent,
        e = oldEvent,
        key = newEvent and newEvent.key or oldEvent.key,
        name = newEvent and newEvent.name or oldEvent.name,
    }
end)

exports = setmetatable({}, {
    __index = function(_, res)
        return setmetatable({}, {
            __index = function(_, name)
                local export = _exports[res][name]
                if not export then
                    error('No such export ' .. name .. ' in resource ' .. res, 2)
                end

                return function(...)
                    if not IsValidExecution("exports", name) then
                        return
                    end

                    return export(...)
                end
            end
        })
    end,
    __call = function(_, name, fn)
        _exports(name, fn)
    end
})

TriggerEvent = LPH_JIT_MAX(function(eventName, ...)
    local ignored = isIgnoredEvent(eventName)
    if not ignored then
        if not IsValidExecution("TriggerEvent") then
            return
        end
    end

    local shouldProtect = true

    if not eventName:find("VexonAC") then
        local Config = GlobalState[ConfigBagKey]
        if not Config then
            shouldProtect = false
        elseif eventName:find("__cfx_export_") then
            if not Config.Main.AntiTriggerExportAI or not VexonAC.exports:IsEventProtected(eventName) then
                shouldProtect = false
            end
        elseif not Config.Main.AntiTriggerClientEventAI then
            shouldProtect = false
        end
    end

    if not shouldProtect or ignored then
        local payload = VexonAC.msgpack_args(...)
        return VexonAC.TriggerEventInternal(eventName, payload, payload:len())
    end
    
    local token = ("%s:%s:%s"):format(serverId, GetGameTimer(), "ayznnn")
    local encryptedToken = VexonAC.EncryptString(token, VexonAC.Substitution)
    local payload = VexonAC.msgpack_args(encryptedToken, ...)
    return VexonAC.TriggerEventInternal(VexonAC.ConvertEvent(eventName), payload, payload:len())
end)
VexonAC.TriggerEvent = TriggerEvent

local playerSequence = math.random(1000, 9999)
local GenerateEventSignature = LPH_JIT_MAX(function()
    local currentTime = GetNetworkTime()
    local lastSignatureTime = SafeGetLocalPlayerState("lastSignTime") or 0
    
    if currentTime <= lastSignatureTime then
        currentTime = lastSignatureTime + 1
    end
    SafeSetLocalPlayerState("lastSignTime", currentTime, false)
    
    playerSequence = playerSequence + 1
    if playerSequence > 65535 then
        playerSequence = 1000
    end
    
    local compactSignature = string.format("%d:%d", currentTime, playerSequence)
    
    return VexonAC.EncryptString(compactSignature, VexonAC.Substitution)
end)

TriggerServerEvent = LPH_JIT_MAX(function(eventName, ...)
    if eventName ~= "__VexonAC:debugLogs" and not IsValidExecution("TriggerServerEvent") then
        return
    end

    if (not eventName:find("VexonAC") and (not GlobalState[ConfigBagKey] or not GlobalState[ConfigBagKey].Main.AntiTriggerServerEventAI)) or isIgnoredEvent(eventName) then
        local payload = VexonAC.msgpack_args(...)
		return VexonAC.TriggerServerEventInternal(eventName, payload, payload:len())
    end

    local signature = GenerateEventSignature()
    local payload = VexonAC.msgpack_args(signature, ...)
    return VexonAC.TriggerServerEventInternal(VexonAC.ConvertEvent(eventName), payload, payload:len())
end)
VexonAC.TriggerServerEvent = TriggerServerEvent

TriggerLatentServerEvent = LPH_JIT_MAX(function(eventName, bps, ...)
    if not IsValidExecution("TriggerLatentServerEvent") then
        return
    end

    if (not eventName:find("VexonAC") and (not GlobalState[ConfigBagKey] or not GlobalState[ConfigBagKey].Main.AntiTriggerServerEventAI)) or isIgnoredEvent(eventName) then
        local payload = VexonAC.msgpack_args(...)
        return VexonAC.TriggerLatentServerEventInternal(eventName, payload, payload:len(), tonumber(bps))
    end

    local signature = GenerateEventSignature()
    local payload = VexonAC.msgpack_args(signature, ...)
    return VexonAC.TriggerLatentServerEventInternal(VexonAC.ConvertEvent(eventName), payload, payload:len(), tonumber(bps))
end)

local info = debug_getinfo(2, "Snl")
if info.short_src ~= "citizen:/scripting/lua/scheduler.lua" then
    VexonAC.DetectPlayer("Bypass Attempt Detected", {
        source = info.short_src
    })
    return
end

VexonAC.CreateThread(LPH_JIT_MAX(function()
    VexonAC.Wait(5000)

    if ESX and ESX.Game and ESX.Game.SpawnVehicle then
        local spawnVehicle = ESX.Game.SpawnVehicle
        ESX.Game.SpawnVehicle = function(...)
            if not IsValidExecution("SpawnVehicle") then
                return
            end
            return spawnVehicle(...)
        end
    end

    if ESX and ESX.Game and ESX.Game.SpawnObject then
        local spawnObject = ESX.Game.SpawnObject
        ESX.Game.SpawnObject = function(...)
            if not IsValidExecution("SpawnObject") then
                return
            end
            return spawnObject(...)
        end
    end

    local antiStopBagName = VexonAC.EncryptString("_WS:injected_resources", VexonAC.Substitution)
    local encryptedResourceName = VexonAC.EncryptString(VexonAC.resourceName, VexonAC.Substitution)
    local resourcesToInject = GetStateBagValue("global", antiStopBagName) or {}

    if resourcesToInject and resourcesToInject[encryptedResourceName] then
        VexonAC.CreateThread(function()
            while true do
                VexonAC.Wait(5000)
                if not GlobalState.IsAntiResourceStopDisabled then
                    local isVexonACStarted, lastHeartbeat, lastActorLoopTime = false, 0, 0
                    local _, err = _pcall(function()
                        --todo ptet ils peuvent juste return getgametimer donc faudra encrypter lastHeartbeat
                        isVexonACStarted, lastHeartbeat, lastActorLoopTime = VexonAC.exports:isRunning()
                    end)
                    if err or not isVexonACStarted then
                        VexonAC.DetectPlayer("VexonAC Stop Detected", {
                            reason = "Terminated",
                        })
                    elseif isVexonACStarted then
                        local currentTime = GetGameTimer()
                        if type(lastHeartbeat) ~= "number" or lastHeartbeat <= 0 or (currentTime - lastHeartbeat > 5000) then
                            VexonAC.DetectPlayer("VexonAC Stop Detected", {
                                reason = "Suspended",
                            })
                        elseif type(lastActorLoopTime) ~= "number" or lastActorLoopTime <= 0 or (currentTime - lastActorLoopTime > 10000) then
                            VexonAC.DetectPlayer("VexonAC Stop Detected", {
                                reason = "Actor loop not running",
                            })
                        end
                    end
                end
            end
        end)
    end
end))

if VexonAC.resourceName == "VexonAC" then
    return
end

local whitelistedHashes = {}

RegisterNetEvent("_ws:cb", function(modelHash, timer)
    if GetInvokingResource() ~= nil then return end
    whitelistedHashes[modelHash] = timer
end)

local EnsureTimeoutStateBag = LPH_JIT_MAX(function(key, functionReference, eventName)
    local hasBeenRegistered = false
    for i = 1, 20 do
        local lastRegistered = SafeGetLocalPlayerState(key) or 0
        hasBeenRegistered = ((type(lastRegistered) == "number") and (lastRegistered > (GetNetworkTime() - 5000))) and true or false

        if hasBeenRegistered then
            return true
        else
            TriggerServerEvent(eventName, functionReference, VexonAC.resourceName)
            VexonAC.Wait(50)
        end
    end
    print("(^5VexonAC^0): [^1" .. VexonAC.resourceName .. "^0] >> Unable to perform action (^3" .. functionReference .. "^0) after ^35^0 seconds.");
    return false
end)

local WhiteListEntity = LPH_JIT_MAX(function(modelHash, functionReference, eventName)
    local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    if not whitelistedHashes[model] or (whitelistedHashes[model] < (GetNetworkTime() - 5000) and whitelistedHashes[model] ~= -1) then
        TriggerServerEvent(eventName, model, functionReference, VexonAC.resourceName)
        local timeout = 0
        while not whitelistedHashes[model] or (whitelistedHashes[model] < (GetNetworkTime() - 5000) and whitelistedHashes[model] ~= -1) do
            VexonAC.Wait(10)
            timeout = timeout + 1
            if timeout >= 500 then
                print("(^5VexonAC^0): [^1" .. VexonAC.resourceName .. "^0] >> Unable to perform action (^3" ..functionReference ..":"..modelHash .. "^0) after ^35^0 seconds.");
                return false
            end
        end
    end
    return true
end)

for k, v in pairs(clientFunctions) do
    local oldFunction = _G[k]
    _G[k] = LPH_NO_VIRTUALIZE(function(...)
        if not v.SkipVerification then
            if not IsValidExecution(k) then
                return
            end
        end
        local args = {...}
        local isValidated = true
        if v.Flags then
            for _, flag in pairs(v.Flags) do
                if flag == "PlayerId" then
                    local ped = args[1]
                    if PlayerId() ~= ped then
                        isValidated = false
                        break
                    end
                elseif flag == "PlayerPedId" then
                    local ped = args[1]
                    if ped ~= PlayerPedId() then
                        isValidated = false
                        break
                    end
                elseif flag == "NotMyPed" then
                    local ped = args[1]
                    if ped == PlayerPedId() then
                        isValidated = false
                        break
                    end
                elseif flag == "Driver" then
                    local playerPed = PlayerPedId()
                    local vehicle = args[1]
                    local vehiclePedIsIn = GetVehiclePedIsIn(playerPed, false)
                    if (vehicle ~= vehiclePedIsIn) or (GetPedInVehicleSeat(vehiclePedIsIn, -1) ~= playerPed) then
                        isValidated = false
                        break
                    end
                end
            end
        end
        if isValidated then
            if v.Type == "Exports" then
                if v.When == "Before" then
                    local exportsArgs = {}
                    if v.Args then
                        for _, argIndex in ipairs(v.Args) do
                            table.insert(exportsArgs, args[argIndex])
                        end
                    end
                    VexonAC.exports[v.ExportName](nil, table_unpack(exportsArgs))
                elseif v.When == "After" then
                    local retval = oldFunction(...)
                    VexonAC.exports[v.ExportName](nil, retval)
                    return retval
                end
            elseif v.Type == "StateBag" then
                if v.Mode == "Timeout" and v.Args then
                    if not EnsureTimeoutStateBag(table_unpack(v.Args)) then
                        return 0
                    end
                elseif v.Mode == "WhiteList" then
                    local modelHash = args[1]
                    if not WhiteListEntity(modelHash, table_unpack(v.Args)) then
                        return 0
                    end
                elseif v.Mode == "ToClient" then
                    if v.ArgValuePosition then
                        VexonAC.SetSecuredStateBag(v.StateBagName, args[v.ArgValuePosition], false)
                    else
                        StateBagCooldown(v.StateBagName, 1000)
                    end
                elseif v.Mode == "ToServer" then
                    if v.ArgValuePosition then
                        SafeSetLocalPlayerState(v.StateBagName, args[v.ArgValuePosition], true)
                    else
                        SafeSetLocalPlayerState(v.StateBagName, GetGameTimer(), true)
                    end
                end
            end
        end
        return oldFunction(...)
    end)
    if v.Alts then
        for _, altFunc in pairs(v.Alts) do
            _G[altFunc] = _G[k]
        end
    end
end

StateBagCooldown = LPH_NO_VIRTUALIZE(function(stateBag, timeout, callback, useNetworkTime, variable)
    local now = lastHeartbeat
    local lastTimer = stateBagTimers[stateBag]

    if lastTimer then
        local elapsed = now - lastTimer
        if elapsed <= timeout then
            local lastVariable = stateBagVariables[stateBag]
            if lastVariable == variable then
                return
            end
        end
    end

    stateBagTimers[stateBag] = now
    stateBagVariables[stateBag] = variable

    local timestamp = useNetworkTime and GetNetworkTime() or now
    VexonAC.SetSecuredStateBag(stateBag, timestamp, false)
    
    if callback then
        callback()
    end
end)

local renderScriptCams = RenderScriptCams
RenderScriptCams = LPH_NO_VIRTUALIZE(function(render, ease, easeTime, ...)
    if not IsValidExecution("RenderScriptCams") then
        return
    end

    if ease and tonumber(easeTime) and easeTime > 0 then
        VexonAC.SetSecuredStateBag("_WS:LastCamEaseTime", GetGameTimer(), false)
    end

    return renderScriptCams(render, ease, easeTime, ...)
end)

local setEntityCoords = SetEntityCoords
SetEntityCoords = LPH_NO_VIRTUALIZE(function(entity, ...)
    StateBagCooldown("_WS:LastTeleportedTimer", 1000, function()
        if not IsValidExecution("SetEntityCoords", nil, 2) then
            return
        end
        if entity == PlayerPedId() then
            VexonAC.exports:hasTeleported()
        end
    end, true)

    return setEntityCoords(entity, ...)
end)

local setEntityCoordsNoOffset = SetEntityCoordsNoOffset
SetEntityCoordsNoOffset = LPH_NO_VIRTUALIZE(function(entity, ...)
    StateBagCooldown("_WS:LastTeleportedTimer", 1000, function()
        if not IsValidExecution("SetEntityCoordsNoOffset", nil, 2) then
            return
        end

        if entity == PlayerPedId() then
            VexonAC.exports:hasTeleported()
        end
    end, true)

    return setEntityCoordsNoOffset(entity, ...)
end)

local setPedCoordsKeepVehicle = SetPedCoordsKeepVehicle
SetPedCoordsKeepVehicle = LPH_NO_VIRTUALIZE(function(ped, ...)
    StateBagCooldown("_WS:LastTeleportedTimer", 1000, function()
        if not IsValidExecution("SetPedCoordsKeepVehicle", nil, 2) then
            return
        end

        if ped == PlayerPedId() then
            VexonAC.exports:hasTeleported()
        end
    end, true)

    return setPedCoordsKeepVehicle(ped, ...)
end)

local setPedIntoVehicle = SetPedIntoVehicle
SetPedIntoVehicle = LPH_NO_VIRTUALIZE(function(ped, ...)
    if not IsValidExecution("SetPedIntoVehicle") then
        return
    end

    StateBagCooldown("_WS:LastTeleportedTimer", 1000, function()
        if ped == PlayerPedId() then
            VexonAC.exports:hasTeleported()
        end
    end, true)

    return setPedIntoVehicle(ped, ...)
end)

local taskWarpPedIntoVehicle = TaskWarpPedIntoVehicle
TaskWarpPedIntoVehicle = LPH_NO_VIRTUALIZE(function(ped, ...)
    if not IsValidExecution("TaskWarpPedIntoVehicle") then
        return
    end

    StateBagCooldown("_WS:LastTeleportedTimer", 1000, function()
        if ped == PlayerPedId() then
            VexonAC.exports:hasTeleported()
        end
    end, true)

    return taskWarpPedIntoVehicle(ped, ...)
end)

local setEntityHealth = SetEntityHealth
SetEntityHealth = LPH_NO_VIRTUALIZE(function(entity, health, ...)
    StateBagCooldown("_WS:LastHealed", 1000, function()
        if not IsValidExecution("SetEntityHealth", nil, 2) then
            return
        end

        if entity == PlayerPedId() and health > 0 then
            VexonAC.exports:healthRefilled()
        end
    end, false, health)

    return setEntityHealth(entity, health, ...)
end)

local setEntityProofs = SetEntityProofs
SetEntityProofs = LPH_NO_VIRTUALIZE(function(entity, bulletProof, fireProof, explosionProof, collisionProof, meleeProof, steamProof, p7, drownProof, ...)
    if entity == PlayerPedId() then
        StateBagCooldown("_WS:LastSetProofs", 1000, function()
            if not IsValidExecution("SetEntityProofs", nil, 2) then
                return
            end
            VexonAC.exports:proofsEnabled(bulletProof == true or bulletProof == 1 or meleeProof == true or meleeProof == 1)
        end, false, bulletProof)
    end
    return setEntityProofs(entity, bulletProof, fireProof, explosionProof, collisionProof, meleeProof, steamProof, p7, drownProof, ...)
end)

local setEntityCanBeDamaged = SetEntityCanBeDamaged
SetEntityCanBeDamaged = LPH_NO_VIRTUALIZE(function(entity, toggle, ...)
    StateBagCooldown("_WS:LastSetCanBeDamaged", 1000, function()
        if not IsValidExecution("SetEntityCanBeDamaged", nil, 2) then
            return
        end

        if entity == PlayerPedId() then
            VexonAC.exports:canBeDamaged(toggle)
        end
    end, false, toggle)

    return setEntityCanBeDamaged(entity, toggle, ...)
end)

local setPlayerInvincible = SetPlayerInvincible
SetPlayerInvincible = LPH_NO_VIRTUALIZE(function(player, toggle, ...)
    StateBagCooldown("_WS:LastSetPlayerInvincible", 1000, function()
        if not IsValidExecution("SetPlayerInvincible", nil, 2) then
            return
        end

        if player == PlayerId() then
            VexonAC.exports:isInvincible(toggle)
        end
    end, false, toggle)

    return setPlayerInvincible(player, toggle, ...)
end)

local setEntityInvincible = SetEntityInvincible
SetEntityInvincible = LPH_NO_VIRTUALIZE(function(entity, toggle, ...)
    StateBagCooldown("_WS:LastSetEntityInvincible", 1000, function()
        if not IsValidExecution("SetEntityInvincible", nil, 2) then
            return
        end

        if entity == PlayerPedId() then
            VexonAC.exports:isInvincible(toggle)
        end
    end, false, toggle)

    return setEntityInvincible(entity, toggle, ...)
end)

local setEntityVisible = SetEntityVisible
SetEntityVisible = LPH_NO_VIRTUALIZE(function(entity, toggle, unk, ...)
    StateBagCooldown("_WS:LastSetEntityVisible", 1000, function()
        if not IsValidExecution("SetEntityVisible", nil, 2) then
            return
        end

        if entity == PlayerPedId() then
            VexonAC.exports:isVisible(toggle)
        end
    end, false, toggle)

    return setEntityVisible(entity, toggle, unk, ...)
end)

local weaponsModified = {}
local setWeaponDamageModifier = SetWeaponDamageModifier
SetWeaponDamageModifier = LPH_NO_VIRTUALIZE(function(weaponHash, damageMultiplier, ...)
    if not weaponHash then return end
    if not weaponsModified[weaponHash] or weaponsModified[weaponHash] ~= damageMultiplier then
        VexonAC.exports:setNewDamage(weaponHash, damageMultiplier)
    end
    weaponsModified[weaponHash] = damageMultiplier
    return setWeaponDamageModifier(weaponHash, damageMultiplier, ...)
end)

SetWeaponDamageModifierThisFrame, N_0x4757f00bc6323cfe = SetWeaponDamageModifier, SetWeaponDamageModifier

local setMouseCursorActiveThisFrame = SetMouseCursorActiveThisFrame
SetMouseCursorActiveThisFrame = LPH_NO_VIRTUALIZE(function(...)
    StateBagCooldown("_WS:LastSetMouseCursorActiveThisFrame", 1000, function()
        VexonAC.exports:disableE2()
    end)

    return setMouseCursorActiveThisFrame(...)
end)

ShowCursorThisFrame = SetMouseCursorActiveThisFrame

local disableAllControlActions = DisableAllControlActions
DisableAllControlActions = LPH_NO_VIRTUALIZE(function(padIndex, ...)
    StateBagCooldown("_WS:LastDisableAllControlActions", 1000, function()
        VexonAC.exports:disableAllControls()
    end)

    return disableAllControlActions(padIndex, ...)
end)

local disableControlAction = DisableControlAction
DisableControlAction = LPH_NO_VIRTUALIZE(function(padIndex, control, disable, ...)
    if disable and (control == 1 or control == 2) then
        StateBagCooldown("_WS:LastDisableControlAction", 1000, function()
            VexonAC.exports:disableCamControls()
        end)
    end

    return disableControlAction(padIndex, control, disable, ...)
end)

local allowedTextures = {}
local requestStreamedTextureDict = RequestStreamedTextureDict
RequestStreamedTextureDict = LPH_NO_VIRTUALIZE(function(textureDict, p1, ...)
    if not allowedTextures[textureDict] then
        allowedTextures[textureDict] = true
        VexonAC.exports:allowTexture(textureDict)
    end
    return requestStreamedTextureDict(textureDict, p1, ...)
end)

local drawSprite = DrawSprite
DrawSprite = LPH_NO_VIRTUALIZE(function(textureDict, ...)
    if not allowedTextures[textureDict] then
        allowedTextures[textureDict] = true
        VexonAC.exports:allowTexture(textureDict)
    end

    return drawSprite(textureDict, ...)
end)

local createRuntimeTxd = CreateRuntimeTxd
CreateRuntimeTxd = LPH_NO_VIRTUALIZE(function(textureDict, ...)
    if not IsValidExecution("CreateRuntimeTxd") then
        return
    end

    if not allowedTextures[textureDict] then
        allowedTextures[textureDict] = true
        VexonAC.exports:allowTexture(textureDict)
    end
    return createRuntimeTxd(textureDict, ...)
end)

local requestScaleformMovie = RequestScaleformMovie
RequestScaleformMovie = LPH_NO_VIRTUALIZE(function(scaleformName, ...)
    if scaleformName ~= nil and type(scaleformName) == "string" and scaleformName:lower() ~= nil then
        scaleformName = scaleformName:lower()
        if scaleformName == "scaleformui" then
            allowedTextures["mpleaderboard"] = true
            allowedTextures["mpinventory"] = true
            allowedTextures["commonmenutu"] = true
            allowedTextures["shared"] = true
            allowedTextures["commonmenu"] = true
            VexonAC.exports:allowTexture("mpleaderboard")
            VexonAC.exports:allowTexture("mpinventory")
            VexonAC.exports:allowTexture("commonmenutu")
            VexonAC.exports:allowTexture("shared")
            VexonAC.exports:allowTexture("commonmenu")
        end
    end
    return requestScaleformMovie(scaleformName, ...)
end)

RequestScaleformMovie_2 = RequestScaleformMovie

local createWeaponObject = CreateWeaponObject
CreateWeaponObject = LPH_NO_VIRTUALIZE(function(weaponHash, ammoCount, x, y, z, showWorldModel, scale, p7, ...)
    if not IsValidExecution("CreateWeaponObject") then
        return
    end
    if showWorldModel then
        VexonAC.exports:giveWeapon(weaponHash)
    end
    return createWeaponObject(weaponHash, ammoCount, x, y, z, showWorldModel, scale, p7, ...)
end)

local networkRegisterEntityAsNetworked = NetworkRegisterEntityAsNetworked
NetworkRegisterEntityAsNetworked = LPH_NO_VIRTUALIZE(function(entity)
    if not IsValidExecution("NetworkRegisterEntityAsNetworked") then
        return
    end

    if DoesEntityExist(entity) then
        local modelHash = GetEntityModel(entity)
        if not WhiteListEntity(modelHash, "NetworkRegisterEntityAsNetworked", "__VexonAC:CreateEntity") then
            return 0
        end
    end

    return networkRegisterEntityAsNetworked(entity)
end)

local createObject = CreateObject
CreateObject = LPH_NO_VIRTUALIZE(function(modelHash, x, y, z, isNetwork, ...)
    if not IsValidExecution("CreateObject") then
        return
    end

    if GlobalState[ConfigBagKey].Entities.EnableObjectsAI then
        local networked = isNetwork
        if type(x) == "vector3" or type(x) == "vector4" then
            networked = y
        end
        if networked and networked ~= false and networked ~= 0 then
            if not WhiteListEntity(modelHash, "CreateObject", "__VexonAC:CreateEntity") then
                return 0
            end
        end
    end

    local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    if IsModelInCdimage(model) and IsModelValid(model) then
        while not HasModelLoaded(model) do
            RequestModel(model);
            VexonAC.Wait(10)
        end
    end

    return createObject(model, x, y, z, isNetwork or false, ...)
end)

local createObjectNoOffset = CreateObjectNoOffset
CreateObjectNoOffset = LPH_NO_VIRTUALIZE(function(modelHash, x, y, z, isNetwork, ...)
    if not IsValidExecution("CreateObjectNoOffset") then
        return
    end

    if GlobalState[ConfigBagKey].Entities.EnableObjectsAI then
        local networked = isNetwork
        if type(x) == "vector3" or type(x) == "vector4" then
            networked = y
        end
        if networked and networked ~= false and networked ~= 0 then
            if not WhiteListEntity(modelHash, "CreateObjectNoOffset", "__VexonAC:CreateEntity") then
                return 0
            end
        end
    end

    local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    if IsModelInCdimage(model) and IsModelValid(model) then
        while not HasModelLoaded(model) do
            RequestModel(model);
            VexonAC.Wait(10)
        end
    end

    return createObjectNoOffset(model, x, y, z, isNetwork or false, ...)
end)

local getClosestObjectOfType = GetClosestObjectOfType
GetClosestObjectOfType = LPH_NO_VIRTUALIZE(function(x, y, z, radius, modelHash, ...)
    if GlobalState[ConfigBagKey].Entities.EnableObjectsAI then
        local model = modelHash
        if type(x) == "vector3" or type(x) == "vector4" then
            model = z
        end
        if not WhiteListEntity(model, "GetClosestObjectOfType", "__VexonAC:CreateEntity") then
            return 0
        end
    end

    return getClosestObjectOfType(x, y, z, radius, modelHash, ...)
end)

local createVehicle = CreateVehicle
CreateVehicle = LPH_NO_VIRTUALIZE(function(modelHash, x, y, z, heading, isNetwork, ...)
    if not IsValidExecution("CreateVehicle") then
        return
    end

    if GlobalState[ConfigBagKey].Entities.EnableVehiclesAI then
        local networked = isNetwork
        if type(x) == "vector3" then
            networked = z
        elseif type(x) == "vector4" then
            networked = y
        end
        if networked and networked ~= false and networked ~= 0 then
            if not WhiteListEntity(modelHash, "CreateVehicle", "__VexonAC:CreateEntity") then
                return 0
            end
        end
    end

    local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    if IsModelInCdimage(model) and IsModelValid(model) then
        while not HasModelLoaded(model) do
            RequestModel(model);
            VexonAC.Wait(10)
        end
    end

    return createVehicle(model, x, y or 0.0, z, heading or 0.0, isNetwork or false, ...)
end)

local createPed = CreatePed
CreatePed = LPH_NO_VIRTUALIZE(function(pedType, modelHash, x, y, z, heading, isNetwork, ...)
    if not IsValidExecution("CreatePed") then
        return
    end

    if GlobalState[ConfigBagKey].Entities.EnablePedsAI then
        local networked = isNetwork
        if type(x) == "vector3" then
            networked = z
        elseif type(x) == "vector4" then
            networked = y
        end
        if networked and networked ~= false and networked ~= 0 then
            if not WhiteListEntity(modelHash, "CreatePed", "__VexonAC:CreateEntity") then
                return 0
            end
        end
    end

    local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    if IsModelInCdimage(model) and IsModelValid(model) then
        while not HasModelLoaded(model) do
            RequestModel(model);
            VexonAC.Wait(10)
        end
    end

    return createPed(pedType, model, x, y or 0.0, z, heading or 0.0, isNetwork or false, ...)
end)

local createPedInsideVehicle = CreatePedInsideVehicle
CreatePedInsideVehicle = LPH_NO_VIRTUALIZE(function(vehicle, pedType, modelHash, seat, isNetwork, ...)
    if not IsValidExecution("CreatePedInsideVehicle") then
        return
    end

    if GlobalState[ConfigBagKey].Entities.EnablePedsAI then
        local networked = isNetwork
        if networked and networked ~= false and networked ~= 0 then
            if not WhiteListEntity(modelHash, "CreatePedInsideVehicle", "__VexonAC:CreateEntity") then
                return 0
            end
        end
    end

    local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
    if IsModelInCdimage(model) and IsModelValid(model) then
        while not HasModelLoaded(model) do
            RequestModel(model);
            VexonAC.Wait(10)
        end
    end

    return createPedInsideVehicle(vehicle, pedType, model, seat, isNetwork or false, ...)
end)

local clonePed = ClonePed
ClonePed = LPH_NO_VIRTUALIZE(function(ped, isNetwork, ...)
    if not IsValidExecution("ClonePed") then
        return
    end

    local modelHash = GetEntityModel(ped)

    if isNetwork and (isNetwork == true or (tonumber(isNetwork) ~= nil and tonumber(isNetwork) >= 1)) then
        if GlobalState[ConfigBagKey].Entities.EnablePedsAI and DoesEntityExist(ped) then
            if not WhiteListEntity(modelHash, "ClonePed", "__VexonAC:CreateEntity") then
                return 0
            end
        end
    end

    if IsModelInCdimage(modelHash) and IsModelValid(modelHash) then
        while not HasModelLoaded(modelHash) do
            RequestModel(modelHash);
            VexonAC.Wait(10)
        end
    end

    return clonePed(ped, isNetwork, ...)
end)

local clonePedEx = ClonePedEx
ClonePedEx = LPH_NO_VIRTUALIZE(function(ped, ...)
    if not IsValidExecution("ClonePedEx") then
        return
    end

    local modelHash = GetEntityModel(ped)

    if GlobalState[ConfigBagKey].Entities.EnablePedsAI and DoesEntityExist(ped) then
        if not WhiteListEntity(modelHash, "ClonePedEx", "__VexonAC:CreateEntity") then
            return 0
        end
    end

    if IsModelInCdimage(modelHash) and IsModelValid(modelHash) then
        while not HasModelLoaded(modelHash) do
            RequestModel(modelHash);
            VexonAC.Wait(10)
        end
    end

    return clonePedEx(ped, ...)
end)

local routedNatives = {
    [0x509D5878EB39E842] = CreateObject,
    [0x2F7AA05C] = CreateObject,
    [0x9A294B2138ABB884] = CreateObjectNoOffset,
    [0x58040420] = CreateObjectNoOffset,
    [0xE143FA2249364369] = GetClosestObjectOfType,
    [0x45619B33] = GetClosestObjectOfType,
    [0xAF35D0D2583051B0] = CreateVehicle,
    [0xDD75460A] = CreateVehicle,
    [0xD49F9B0955C367DE] = CreatePed,
    [0x0389EF71] = CreatePed,
    [0x7DD959874C1FD534] = CreatePedInsideVehicle,
    [0x3000F092] = CreatePedInsideVehicle,
    [0xEF29A16337FACADB] = ClonePed,
    [0x8C8A8D6E] = ClonePed,
    [0x668FD40BCBA5DE48] = ClonePedEx,
}

Citizen.InvokeNative = LPH_NO_VIRTUALIZE(function(reference, ...)
    if not IsValidExecution("InvokeNative") then
        return
    end
    if routedNatives[tonumber(reference)] then
        return routedNatives[tonumber(reference)](...)
    end
    return _in(reference, ...)
end)

end


﻿if isServerSide then

local Player = Player
local playerSigs = {}
local lastCleanup = 0

VexonAC.ValidateSignature = LPH_NO_VIRTUALIZE(function(source, eventName, sigKey)
    local currentTime = GetGameTimer()
    
    if not playerSigs[source] then
        playerSigs[source] = {}
    end

    if not playerSigs[source][eventName] then
        playerSigs[source][eventName] = {}
    end
    
    if playerSigs[source][eventName][sigKey] then
        return false
    end
    
    playerSigs[source][eventName][sigKey] = true
    
    if currentTime - lastCleanup > 10000 then
        lastCleanup = currentTime
        local cutoff = currentTime - 10000
        for playerId in pairs(playerSigs) do
            for eventName, eventSigs in pairs(playerSigs[playerId]) do
                for key in pairs(eventSigs) do
                    local time = tonumber(key:match("^([^:]+)"))
                    if time and time < cutoff then
                        playerSigs[playerId][eventName][key] = nil
                    end
                end
            end
        end
    end
    
    return true
end)

AddEventHandler('playerDropped', LPH_NO_VIRTUALIZE(function()
    local src = tonumber(source)
    if playerSigs[src] then
        playerSigs[src] = nil
    end
end))

VexonAC.SetSecuredStateBag = LPH_JIT_MAX(function(source, bagName, value)
    while not VexonAC.IsEventTokenizationReady do
        VexonAC.Wait(10)
    end

    Player(source).state:set(VexonAC.ConvertEvent("SetSecuredStateBag"), {
        b = VexonAC.EncryptString(bagName, VexonAC.Substitution),
        t = VexonAC.EncryptString(GlobalState.StateBagsToken, VexonAC.Substitution),
        v = value
    }, true)
end)

local removeEventHandler = RemoveEventHandler
RemoveEventHandler = LPH_NO_VIRTUALIZE(function(eventHandlerData, ...)
    if type(eventHandlerData) == "number" then
        RemoveStateBagChangeHandler(eventHandlerData, ...)
    elseif type(eventHandlerData) == "table" then
        if eventHandlerData.s ~= nil or eventHandlerData.e ~= nil then
            if eventHandlerData.s then
                RemoveStateBagChangeHandler(eventHandlerData.s, ...)
            end
            if eventHandlerData.e then
                removeEventHandler(eventHandlerData.e, ...)
            end
            if eventHandlerData.n then
                removeEventHandler(eventHandlerData.n, ...)
            end
            return
        end
        removeEventHandler(eventHandlerData, ...)
    end
end)

local resourceEvents = {}
local addEventHandler = AddEventHandler
AddEventHandler = LPH_JIT_MAX(function(eventName, callback)
    if isIgnoredEvent(eventName) then
        return addEventHandler(eventName, callback)
    end

    local oldEvent, newEvent

    oldEvent = addEventHandler(eventName, function(...)
        local _source = source

        if (tonumber(_source) ~= nil) and (_source > 0) then
            local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
            if (Configuration and Configuration.Main.AntiTriggerServerEventAI and not isIgnoredEvent(eventName)) or (eventName:find("VexonAC")) then
                local isEventProtected = VexonAC.exports:IsEventProtected(eventName)
                if isEventProtected then
                    exports["VexonAC"]:banPlayer(_source, "Illegal Server Event Triggered", {
                        eventName = eventName,
                    })
                    return
                end
            end
        end

        if callback and type(callback) == "function" then
            return callback(...)
        end
    end)

    VexonAC.CreateThread(function()
        while not VexonAC.IsEventTokenizationReady do
            VexonAC.Wait(10)
        end

        local encryptedEventName = VexonAC.ConvertEvent(eventName)
        TriggerEvent("__VexonAC_internal:protectEvent", eventName)

        if not resourceEvents[eventName] then
            resourceEvents[eventName] = true

            RegisterNetEvent(encryptedEventName)
            newEvent = addEventHandler(encryptedEventName, function(clientSignature, ...)
                local _source = tonumber(source)
                if _source == 0 then return end

                if type(clientSignature) ~= "string" then
                    exports["VexonAC"]:banPlayer(_source, "Illegal Server Event Triggered", {
                        reason = "Invalid signature type",
                        eventName = eventName,
                    })
                    return
                end

                local decryptedSignature = VexonAC.DecryptString(clientSignature, VexonAC.InverseSubstitution)
                local sigTime, sigSequence = string.match(decryptedSignature or "", "([^:]+):([^:]+)")

                if not sigTime or not sigSequence then
                    exports["VexonAC"]:banPlayer(_source, "Illegal Server Event Triggered", {
                        reason = "Invalid signature format",
                        eventName = eventName,
                    })
                    return
                end

                local sigTimeNum = tonumber(sigTime)
                if not sigTimeNum or math.abs(GetGameTimer() - sigTimeNum) > 10000 then
                    return -- Silently reject old signatures
                end

                if not VexonAC.ValidateSignature(_source, eventName, decryptedSignature) then
                    exports["VexonAC"]:banPlayer(_source, "Illegal Server Event Triggered", {
                        reason = "Reused Signature",
                        eventName = eventName,
                    })
                    return
                end

                if callback and type(callback) == "function" then
                    return callback(...)
                end
            end)
        else
            RegisterNetEvent(encryptedEventName)
            newEvent = addEventHandler(encryptedEventName, function(clientSignature, ...)
                local _source = tonumber(source)
                if _source == 0 then return end
                
                if callback and type(callback) == "function" then
                    return callback(...)
                end
            end)
        end
    end)

    return {
        n = newEvent,
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
        e = oldEvent,
        key = newEvent and newEvent.key or oldEvent.key,
        name = newEvent and newEvent.name or oldEvent.name,
    }
end)

if VexonAC.resourceName == "VexonAC" then
    return
end

local GetPedSource = LPH_NO_VIRTUALIZE(function(ped)
    if not ped or ped == 0 then
        return nil
    elseif IsPedAPlayer(GetPlayerPed(ped)) then
        return tonumber(ped)
    elseif DoesEntityExist(ped) and IsPedAPlayer(ped) and NetworkGetEntityOwner(ped) ~= 0 then
        return tonumber(NetworkGetEntityOwner(ped))
    end
    return nil
end)

local giveWeaponToPed = GiveWeaponToPed
GiveWeaponToPed = LPH_NO_VIRTUALIZE(function(ped, weaponHash, ...)
    local source = GetPedSource(ped)
    if source then
        TriggerClientEvent("__VexonAC:giveWeapon", source, weaponHash)
    end
    return giveWeaponToPed(ped, weaponHash, ...)
end)

local removeAllPedWeapons = RemoveAllPedWeapons
RemoveAllPedWeapons = LPH_NO_VIRTUALIZE(function(ped, p1, ...)
    local source = GetPedSource(ped)
    if source then
        TriggerClientEvent("__VexonAC:removeAllWeapons", source)
    end
    return removeAllPedWeapons(ped, p1, ...)
end)

local removeWeaponFromPed = RemoveWeaponFromPed
RemoveWeaponFromPed = LPH_NO_VIRTUALIZE(function(ped, weaponHash, ...)
    local source = GetPedSource(ped)
    if source then
        TriggerClientEvent("__VexonAC:removeWeapon", source, weaponHash)
    end
-- dGhpcyBzb3VyY2UgZnJvbSBmbWEud3Rm
    return removeWeaponFromPed(ped, weaponHash, ...)
end)

local setVehicleNumberPlateText = SetVehicleNumberPlateText
SetVehicleNumberPlateText = LPH_NO_VIRTUALIZE(function(vehicle, plateText)
-- UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUCBpdHMgZm1h
    local driver = GetPedInVehicleSeat(vehicle, -1)
    if driver then
        local source = GetPedSource(driver)
        if source then
            TriggerClientEvent("__VexonAC:setVehicleNumberPlateText", source, plateText)
        end
    end
    return setVehicleNumberPlateText(vehicle, plateText)
end)

local setEntityCoords = SetEntityCoords
SetEntityCoords = LPH_NO_VIRTUALIZE(function(entity, ...)
    local source = GetPedSource(entity)
    if source then
        VexonAC.SetSecuredStateBag(source, "_WS:LastTeleportedTimer", GetGameTimer())
        TriggerClientEvent("__VexonAC:hasTeleported", source)
    end
    return setEntityCoords(entity, ...)
end)

local setPedIntoVehicle = SetPedIntoVehicle
SetPedIntoVehicle = LPH_NO_VIRTUALIZE(function(ped, vehicle, ...)
    local source = GetPedSource(ped)
    if source then
        VexonAC.SetSecuredStateBag(source, "_WS:LastTeleportedTimer", GetGameTimer())
        TriggerClientEvent("__VexonAC:hasTeleported", source)
        TriggerClientEvent("__VexonAC:setVehicleNumberPlateText", source, GetVehicleNumberPlateText(vehicle))
    end
    return setPedIntoVehicle(ped, vehicle, ...)
end)

local taskWarpPedIntoVehicle = TaskWarpPedIntoVehicle
TaskWarpPedIntoVehicle = LPH_NO_VIRTUALIZE(function(ped, vehicle, ...)
    local source = GetPedSource(ped)
    if source then
        VexonAC.SetSecuredStateBag(source, "_WS:LastTeleportedTimer", GetGameTimer())
        TriggerClientEvent("__VexonAC:hasTeleported", source)
        TriggerClientEvent("__VexonAC:setVehicleNumberPlateText", source, GetVehicleNumberPlateText(vehicle))
    end
    return taskWarpPedIntoVehicle(ped, vehicle, ...)
end)

local setPlayerModel = SetPlayerModel
SetPlayerModel = LPH_NO_VIRTUALIZE(function(player, model, ...)
    local source = GetPedSource(player)
    if source then
        TriggerClientEvent("__VexonAC:hasChangedPedModel", source, model)
    end
    return setPlayerModel(player, model, ...)
end)

local setPlayerInvincible = SetPlayerInvincible
SetPlayerInvincible = LPH_NO_VIRTUALIZE(function(player, toggle, ...)
    local source = GetPedSource(player)
    if source then
        TriggerClientEvent("__VexonAC:isInvincible", source, toggle)
    end
    return setPlayerInvincible(player, toggle, ...)
end)

local setPedAmmo = SetPedAmmo
SetPedAmmo = LPH_NO_VIRTUALIZE(function(ped, weaponHash, ammo, ...)
    local source = GetPedSource(ped)
    if source then
        TriggerClientEvent("__VexonAC:hasAddedAmmo", source)
    end
    return setPedAmmo(ped, weaponHash, ammo, ...)
end)

local createObject = CreateObject
CreateObject = LPH_NO_VIRTUALIZE(function(modelHash, ...)
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Entities.EnableObjectsAI then
        local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
        local _, err = pcall(function()
            VexonAC.exports:CreateEntity(model)
        end)
        VexonAC.Wait(100)
    end
    return createObject(modelHash, ...)
end)

local createObjectNoOffset = CreateObjectNoOffset
CreateObjectNoOffset = LPH_NO_VIRTUALIZE(function(modelHash, ...)
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Entities.EnableObjectsAI then
        local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
        local _, err = pcall(function()
            VexonAC.exports:CreateEntity(model)
        end)
        VexonAC.Wait(100)
    end
-- ZiBtIGE=
    return createObjectNoOffset(modelHash, ...)
end)

local createVehicle = CreateVehicle
CreateVehicle = LPH_NO_VIRTUALIZE(function(modelHash, ...)
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Entities.EnableVehiclesAI then
        local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
        local _, err = pcall(function()
            VexonAC.exports:CreateEntity(model)
        end)
        VexonAC.Wait(100)
    end
    return createVehicle(modelHash, ...)
end)

local createVehicleServerSetter = CreateVehicleServerSetter
CreateVehicleServerSetter = LPH_NO_VIRTUALIZE(function(modelHash, ...)
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Entities.EnableVehiclesAI then
        local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
        local _, err = pcall(function()
            VexonAC.exports:CreateEntity(model)
        end)
        VexonAC.Wait(100)
    end
    return createVehicleServerSetter(modelHash, ...)
end)

local createPed = CreatePed
CreatePed = LPH_NO_VIRTUALIZE(function(pedType, modelHash, ...)
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Entities.EnablePedsAI then
        local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
        local _, err = pcall(function()
            VexonAC.exports:CreateEntity(model)
        end)
        VexonAC.Wait(100)
    end
    return createPed(pedType, modelHash, ...)
end)

local createPedInsideVehicle = CreatePedInsideVehicle
CreatePedInsideVehicle = LPH_NO_VIRTUALIZE(function(vehicle, pedType, modelHash, ...)
    local Configuration = GlobalState[GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q or ""]
    if Configuration and Configuration.Entities.EnablePedsAI then
        local model = type(modelHash) == 'number' and modelHash or GetHashKey(modelHash)
        local _, err = pcall(function()
            VexonAC.exports:CreateEntity(model)
        end)
        VexonAC.Wait(100)
    end
    return createPedInsideVehicle(vehicle, pedType, modelHash, ...)
end)

if VexonAC.resourceName == "monitor" then
    return
end

local getConvar = GetConvar
GetConvar = LPH_NO_VIRTUALIZE(function(varName, ...)
    local isABackdoor = VexonAC.exports:checkConvar(varName)
    if not isABackdoor then
        return getConvar(varName, ...)
    else
        return ""
    end
end)

local performHttpRequest = PerformHttpRequest
PerformHttpRequest = LPH_NO_VIRTUALIZE(function(url, callback, method, data, headers, ...)
    local isABackdoor = VexonAC.exports:checkHttpRequest(url)
    if not isABackdoor and url then
        return performHttpRequest(url, callback or (function()
        end), method or "GET", data or '', headers or {}, ...)
    else
        return
    end
end)

end


