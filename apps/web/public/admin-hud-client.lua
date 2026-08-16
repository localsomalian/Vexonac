--[[
  VexonAC Admin HUD — Client Script

  Add this file to your VexonAC FiveM resource:
    1. Copy admin-hud.html  → <resource>/web/admin-hud.html
    2. Copy admin-hud-client.lua → <resource>/resource/client/admin_hud.lua
    3. In fxmanifest.lua:
         Add 'web/admin-hud.html' to the files{} block
         Add 'resource/client/admin_hud.lua' to client_scripts{}
    4. If you want it as a separate NUI page, set:
         ui_page 'web/admin-hud.html'
       Or SendNUIMessage from your existing UI controller.
]]

local isHudOpen = false
local hudReady   = false  -- set to true when NUI page signals back

-- ── Open / Close helpers ──────────────────────────────────────────────────────

local function OpenHud()
  if isHudOpen then return end
  isHudOpen = true
  hudReady  = false
  SetNuiFocus(true, true)
  SendNUIMessage({ type = "openHud" })

  -- Safety: if the NUI page errors and never responds, release focus after 6s
  Citizen.CreateThread(function()
    Citizen.Wait(6000)
    if isHudOpen and not hudReady then
      isHudOpen = false
      SetNuiFocus(false, false)
      print("^1[VexonAC] Admin HUD did not respond — check web/admin-hud.html is installed. Focus released.^7")
    end
  end)
end

local function CloseHud()
  if not isHudOpen then return end
  isHudOpen = false
  hudReady  = false
  SetNuiFocus(false, false)
  SendNUIMessage({ type = "closeHud" })
end

local function ToggleHud()
  if isHudOpen then CloseHud() else OpenHud() end
end

-- ── /vadmin command ───────────────────────────────────────────────────────────

RegisterCommand("vadmin", function(source, args, rawCommand)
  ToggleHud()
end, false)

-- ── Configurable keybind ──────────────────────────────────────────────────────
-- Players can rebind this in GTA V > Settings > Key Bindings > FiveM

RegisterKeyMapping("vadmin", "VexonAC Admin HUD", "keyboard", "F2")

-- ── NUI Callbacks (actions sent from the HTML panel) ─────────────────────────

RegisterNUICallback("hudClosed", function(data, cb)
  isHudOpen = false
  SetNuiFocus(false, false)
  cb({ ok = true })
end)

RegisterNUICallback("hudOpened", function(data, cb)
  isHudOpen = true
  hudReady  = true
  cb({ ok = true })
end)

RegisterNUICallback("teleport", function(data, cb)
  local targetId = tonumber(data.playerId)
  if not targetId then cb({ ok = false }); return end

  -- Get target ped coords and teleport local player to them
  local target = GetPlayerPed(GetPlayerFromServerId(targetId))
  if DoesEntityExist(target) then
    local coords = GetEntityCoords(target)
    SetEntityCoords(PlayerPedId(), coords.x + 2.0, coords.y + 2.0, coords.z, false, false, false, false)
    TriggerServerEvent("vexonac:adminLog", "TELEPORT", { to = data.playerName })
    cb({ ok = true })
  else
    cb({ ok = false, err = "Player not found" })
  end
end)

RegisterNUICallback("heal", function(data, cb)
  local targetId = tonumber(data.playerId)
  if not targetId then cb({ ok = false }); return end
  TriggerServerEvent("vexonac:healPlayer", targetId)
  cb({ ok = true })
end)

RegisterNUICallback("kick", function(data, cb)
  local targetId = tonumber(data.playerId)
  if not targetId then cb({ ok = false }); return end
  TriggerServerEvent("vexonac:kickPlayer", targetId, "Kicked by admin")
  cb({ ok = true })
end)

RegisterNUICallback("ban", function(data, cb)
  TriggerServerEvent("vexonac:banPlayer", data.playerName, data.reason)
  cb({ ok = true })
end)

RegisterNUICallback("unban", function(data, cb)
  TriggerServerEvent("vexonac:unbanPlayer", data.banId)
  cb({ ok = true })
end)

RegisterNUICallback("adminChat", function(data, cb)
  -- Broadcast to all admins via server event
  TriggerServerEvent("vexonac:adminChatMessage", {
    sender  = data.sender or GetPlayerName(-1),
    message = data.message or "",
    evidence = data.evidence or false,
  })
  cb({ ok = true })
end)

RegisterNUICallback("toggle", function(data, cb)
  local t = data.type
  local v = data.value

  if t == "noclip" then
    -- Toggle noclip (implement via your noclip resource or inline)
    TriggerEvent("vexonac:toggleNoclip", v)
  elseif t == "freecam" then
    TriggerEvent("vexonac:toggleFreecam", v)
  elseif t == "invisible" then
    local ped = PlayerPedId()
    SetEntityVisible(ped, not v, false)
    SetEntityAlpha(ped, v and 0 or 255, false)
  elseif t == "godmode" then
    local ped = PlayerPedId()
    SetEntityInvincible(ped, v)
    if v then SetEntityHealth(ped, GetEntityMaxHealth(ped)) end
  elseif t == "chat" then
    TriggerServerEvent("vexonac:toggleAdminChat", v)
  end

  cb({ ok = true })
end)

-- ── Track session start times for timeOnline calculation ─────────────────────

local playerJoinTime = {}

AddEventHandler("playerJoining", function()
  local src = source
  playerJoinTime[src] = GetGameTimer()
end)

local function GetTimeOnlineMinutes(serverId)
  local joinedAt = playerJoinTime[serverId]
  if not joinedAt then return 0 end
  return math.floor((GetGameTimer() - joinedAt) / 60000)
end

-- ── Push live player data to the HUD (every 5 seconds) ───────────────────────

local function GetPlayerStatus(ped)
  if IsEntityDead(ped) then return "DEAD" end
  if IsPedInAnyVehicle(ped, false) then return "IN_VEHICLE" end
  if IsPedSwimming(ped) then return "SWIMMING" end
  if IsPedArmed(ped, 7) then return "ARMED" end
  return "ON_FOOT"
end

local function GetPing(playerId)
  local ok, result = pcall(function()
    -- NetworkGetPlayerLatency returns seconds; convert to ms
    return math.floor(NetworkGetPlayerLatency(playerId) * 1000)
  end)
  return (ok and result and result >= 0) and result or 0
end

local function PushPlayerList()
  if not isHudOpen then return end

  local playerList = {}
  for _, playerId in ipairs(GetActivePlayers()) do
    local ped    = GetPlayerPed(playerId)
    local coords = GetEntityCoords(ped)
    local servId = GetPlayerServerId(playerId)
    table.insert(playerList, {
      id          = servId,
      name        = GetPlayerName(playerId),
      ping        = GetPing(playerId),
      health      = GetEntityHealth(ped),
      timeOnline  = GetTimeOnlineMinutes(servId),
      playTime    = 0,
      threatScore = 0,
      admin       = false,
      status      = GetPlayerStatus(ped),
      coords      = { x = coords.x, y = coords.y },
    })
  end

  SendNUIMessage({ type = "setPlayers", data = playerList })
end

CreateThread(function()
  -- Push admin identity and server info once on load
  Citizen.Wait(1500)
  SendNUIMessage({
    type = "setAdmin",
    data = { name = GetPlayerName(-1) }
  })
  SendNUIMessage({
    type = "setServer",
    data = { name = GetConvar("sv_projectName", "FiveM Server"), version = "live", maxSlots = 64, isOnline = true }
  })

  while true do
    PushPlayerList()
    Citizen.Wait(5000)
  end
end)

-- ── Receive server-side events and forward to HUD ────────────────────────────

AddEventHandler("vexonac:hudActivity", function(actType, text)
  if not isHudOpen then return end
  SendNUIMessage({ type = "addActivity", data = { type = actType, text = text } })
end)

AddEventHandler("vexonac:hudBan", function(banData)
  if not isHudOpen then return end
  SendNUIMessage({ type = "addBan", data = banData })
end)

-- ── Close HUD on ESC ─────────────────────────────────────────────────────────

CreateThread(function()
  while true do
    Citizen.Wait(0)
    if isHudOpen and IsControlJustPressed(0, 322) then -- ESC key
      CloseHud()
    end
  end
end)
