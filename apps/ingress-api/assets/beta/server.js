'use strict';
// VexonAC dev build — panel connector
// Set convar in server.cfg: set vexonac_ingress_url "https://ingress.vexonac.com"

const { io } = require('socket.io-client');

const resourceName = GetCurrentResourceName();
const licenseKey   = (LoadResourceFile(resourceName, 'auth/license.txt') || '').trim();
const version      = (LoadResourceFile(resourceName, 'auth/version.txt') || '0.0.0').trim();
const ingressUrl   = GetConvar('vexonac_ingress_url', 'https://ingress.vexonac.com');

const socket = io(ingressUrl, {
  extraHeaders: { 'user-agent': 'VexonAC_Server' },
  query: { licenseKey, version },
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling'],
});

let isConnected = false;
let consoleSubscribed = false;

// Track how long each player has been online (server ID -> join timestamp ms)
const playerJoinTimes = {};

on('playerJoining', function() {
  playerJoinTimes[source] = Date.now();
});

on('playerDropped', function() {
  delete playerJoinTimes[source];
});

function getLicenseId(playerId) {
  const count = GetNumPlayerIdentifiers(playerId);
  for (let i = 0; i < count; i++) {
    const id = GetPlayerIdentifier(playerId, i);
    if (id && id.startsWith('license:')) return id.replace('license:', '');
  }
  return '';
}

function getPlayerList() {
  const players = [];
  for (const pid of Object.keys(playerJoinTimes)) {
    try {
      const id = parseInt(pid, 10);

      let name = 'Unknown';
      try { name = GetPlayerName(pid) || 'Unknown'; } catch (_) {}

      let ping = 0;
      try { ping = GetPlayerPing(pid) || 0; } catch (_) {}

      let health = 100;
      let coords = { x: 0, y: 0 };
      let inVehicle = false;
      try {
        const ped = GetPlayerPed(pid);
        try { const raw = GetEntityHealth(ped); health = Math.min(100, Math.max(0, raw - 100)); } catch (_) {}
        try { const c = GetEntityCoords(ped, true); coords = { x: Math.round(c[0] || 0), y: Math.round(c[1] || 0) }; } catch (_) {}
        try { inVehicle = GetVehiclePedIsIn(ped, false) !== 0; } catch (_) {}
      } catch (_) {}

      const joinTime = playerJoinTimes[id] || Date.now();
      const timeOnline = Math.floor((Date.now() - joinTime) / 1000);

      players.push({
        id,
        name,
        license: getLicenseId(pid),
        ping,
        health,
        admin: false,
        timeOnline,
        playTime: 0,
        threatScore: 0,
        status: health <= 0 ? 'DEAD' : inVehicle ? 'IN_VEHICLE' : 'ON_FOOT',
        coords,
      });
    } catch (_) {}
  }
  return players;
}

// Take a screenshot of a player using screenshot-basic and return the public URL.
async function takeScreenshot(playerId) {
  const pidStr = String(playerId);

  // Step 1: get a presign token from the ingress API using FiveM's PerformHttpRequest
  let uploadUrl, publicUrl;
  try {
    const presignResult = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('presign timeout')), 10000);
      PerformHttpRequest(
        ingressUrl + '/api/screenshot/presign?licenseKey=' + encodeURIComponent(licenseKey),
        (statusCode, body) => {
          clearTimeout(t);
          if (statusCode >= 200 && statusCode < 300) {
            try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('invalid json')); }
          } else {
            reject(new Error('presign http ' + statusCode));
          }
        },
        'POST',
        '',
        { 'Content-Type': 'application/json' }
      );
    });
    uploadUrl = presignResult.uploadUrl;
    publicUrl = presignResult.publicUrl;
  } catch (e) {
    console.error('[VexonAC] screenshot presign failed:', e.message);
    return null;
  }

  // Step 2: use screenshot-basic to capture and upload to the presign upload URL
  const uploaded = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 20000);
    try {
      exports['screenshot-basic'].requestClientScreenshotUpload(
        parseInt(pidStr, 10),
        uploadUrl,
        'files[]',
        () => { clearTimeout(timeout); resolve(true); }
      );
    } catch (e) {
      clearTimeout(timeout);
      console.error('[VexonAC] screenshot-basic unavailable:', e.message);
      resolve(false);
    }
  });

  if (!uploaded) return null;

  // screenshot-basic callback fires after the upload HTTP response is sent,
  // so by here the ingress has already stored the file and publicUrl is live.
  if (typeof publicUrl === 'string' && !publicUrl.startsWith('pending:')) {
    return publicUrl;
  }

  // Legacy fallback: pending token that needs socket resolution
  if (typeof publicUrl === 'string' && publicUrl.startsWith('pending:')) {
    const token = publicUrl.slice(8);
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 400));
      const resolved = await new Promise((resolve) => {
        const t = setTimeout(() => resolve(null), 2000);
        socket.emit('screenshot:resolve', { token }, (result) => {
          clearTimeout(t);
          resolve(result && result.url ? result.url : null);
        });
      });
      if (resolved) return resolved;
    }
  }

  return null;
}

socket.on('connect', () => {
  isConnected = true;
  console.log('[VexonAC] Connected to panel (' + socket.id + ')');
  sendHeartbeat();
});

socket.on('connect_error', () => {
  // Silenced — retries automatically
});

socket.on('disconnect', () => {
  isConnected = false;
  consoleSubscribed = false;
});

// Push webhook URLs from panel config so Lua can send Discord logs
socket.on('serverWebhooks', (data) => {
  try { TriggerEvent('__VexonAC:webhooksUpdated', JSON.stringify(data)); } catch (_) {}
});

// --- Panel action handlers ---

socket.on('kickPlayer', (data, callback) => {
  try {
    const playerId = String(data.playerId);
    const reason = data.reason || 'Kicked by admin';
    DropPlayer(playerId, reason);
    if (typeof callback === 'function') callback({ success: true });
  } catch (err) {
    if (typeof callback === 'function') callback({ success: false, error: String(err) });
  }
});

socket.on('banPlayer', async (data, callback) => {
  const playerId = String(data.playerId);
  const reason = data.reason || 'Banned by admin';
  const by = data.by || 'Panel';

  // Step 1: resolve the FiveM license identifier and all identifiers for this player
  const rawLicense = getLicenseId(playerId);
  const playerLicense = rawLicense ? 'license:' + rawLicense : null;

  let playerNameForBan = 'Unknown';
  try { playerNameForBan = GetPlayerName(playerId) || 'Unknown'; } catch (_) {}

  const identifiersForBan = [];
  try {
    const count = GetNumPlayerIdentifiers(playerId);
    for (let i = 0; i < count; i++) {
      const id = GetPlayerIdentifier(playerId, i);
      if (id) identifiersForBan.push(id);
    }
  } catch (_) {}

  // Step 2: register the ban and kick immediately — screenshot happens async after
  let banId = null;
  let banDbId = null;
  let kickMsg = 'You have been banned from this server.\nReason: ' + reason;

  if (playerLicense && isConnected) {
    try {
      const result = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 10000);
        socket.emit('banPlayer:register', {
          playerLicense,
          reason,
          bannedBy: 'Panel - ' + by,
          playerName: playerNameForBan,
          identifiers: identifiersForBan,
        }, (response) => {
          clearTimeout(t);
          resolve(response);
        });
      });
      if (result && result.success && result.ban) {
        banId = result.ban.banId;
        banDbId = result.ban.banDbId;
        kickMsg = result.ban.kickMessage;
      }
    } catch (_) {}
  }

  // Fallback: use the obfuscated export if the socket call failed
  if (!banId) {
    try { exports[resourceName].banPlayer(playerId, reason, 'Panel - ' + by); } catch (_) {}
  }

  // Kick immediately — don't wait for screenshot
  try { DropPlayer(playerId, kickMsg); } catch (_) {}
  if (typeof callback === 'function') callback({ success: true, banId });

  // Take screenshot async and attach as evidence
  if (banDbId && isConnected) {
    takeScreenshot(playerId).then((url) => {
      if (url) socket.emit('banPlayer:setEvidence', { banDbId, evidenceUrl: url });
    }).catch(() => {});
  }
});

socket.on('screenshotPlayer', async (data, callback) => {
  try {
    const url = await takeScreenshot(data.playerId);
    if (typeof callback === 'function') callback(url);
  } catch (e) {
    console.error('[VexonAC] screenshotPlayer error:', e.message);
    if (typeof callback === 'function') callback(null);
  }
});

// --- WebRTC: ingress-api → FiveM client ---

socket.on('webrtc:start_stream_request', (data) => {
  try { TriggerClientEvent('_WS:webrtc:start_stream_request', parseInt(data.playerId), data); } catch (_) {}
});

socket.on('webrtc:offer', (data) => {
  try { TriggerClientEvent('_WS:webrtc:offer', parseInt(data.playerId), data); } catch (_) {}
});

socket.on('webrtc:ice_candidate_remote', (data) => {
  try { TriggerClientEvent('_WS:webrtc:ice_candidate', parseInt(data.playerId), data); } catch (_) {}
});

// --- WebRTC: FiveM client → ingress-api ---

RegisterNetEvent('_WS:webrtc:answer');
RegisterNetEvent('_WS:webrtc:ice_candidate');
RegisterNetEvent('_WS:webrtc:stream_started');
RegisterNetEvent('_WS:webrtc:stream_stopped');

on('_WS:webrtc:answer', (data) => {
  if (!isConnected) return;
  try { socket.emit('webrtc:answer', Object.assign({}, data, { playerId: String(source) })); } catch (_) {}
});

on('_WS:webrtc:ice_candidate', (data) => {
  if (!isConnected) return;
  try { socket.emit('webrtc:ice_candidate', Object.assign({}, data, { playerId: String(source) })); } catch (_) {}
});

on('_WS:webrtc:stream_started', (data) => {
  if (!isConnected) return;
  try {
    const pid = String(source);
    socket.emit('webrtc:stream_started', Object.assign({}, data, { playerId: pid, playerName: GetPlayerName(pid) || 'Unknown' }));
  } catch (_) {}
});

on('_WS:webrtc:stream_stopped', (data) => {
  if (!isConnected) return;
  try { socket.emit('webrtc:stream_stopped', Object.assign({}, data, { playerId: String(source) })); } catch (_) {}
});

// --- Console handlers ---

socket.on('console:subscribe', (data, callback) => {
  consoleSubscribed = true;
  socket.emit('console:connected', {});
  if (typeof callback === 'function') callback({ success: true });
});

socket.on('console:unsubscribe', (data, callback) => {
  consoleSubscribed = false;
  if (typeof callback === 'function') callback({ success: true });
});

socket.on('console:command', (data, callback) => {
  try {
    const cmd = (data && data.command) ? String(data.command) : '';
    if (cmd) ExecuteCommand(cmd);
    if (typeof callback === 'function') callback({ success: true, output: '' });
  } catch (err) {
    if (typeof callback === 'function') callback({ success: false, error: String(err) });
  }
});

// Forward Lua print output to console subscribers
on('__cfx_internal:serverPrint', function(str) {
  if (!consoleSubscribed || !isConnected) return;
  try {
    socket.emit('console:output', { output: str, timestamp: Date.now() });
  } catch (_) {}
});

function sendHeartbeat() {
  if (!isConnected) return;
  const slots = parseInt(GetConvar('sv_maxclients', '32'), 10) || 32;
  const players = getPlayerList();
  socket.emit('updateServerInfos', { players, slots });
}

setInterval(sendHeartbeat, 10000);

exports('js_loaded', () => true);
exports('SaveResourceFile', (resource, file, data) => SaveResourceFile(resource, file, data, -1));
exports('DeleteFile', () => false);
exports('CreateDirectory', () => true);
exports('StopServer', () => { console.log('[VexonAC] StopServer called'); });
