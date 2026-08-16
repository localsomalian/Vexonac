-- ============================================================
--  VexonAC | resource/client/hwid.lua
--  Hardware fingerprinting — composite token generation
-- ============================================================

-- FiveM's Lua sandbox doesn't allow direct hardware reads.
-- We build the best composite fingerprint possible from:
--   1. GetPlayerToken (CFX token — account/machine bound)
--   2. GetCurrentResourceName runtime address (memory layout)
--   3. GetHashKey fingerprint sequence (CPU-characteristic timing)
--   4. GetConvar combinations
--   5. Unique numerical identifiers available via FiveM APIs

local function sha256_simple(str)
    -- FiveM exposes GetHashKey as a deterministic hash for strings.
    -- We chain multiple known inputs to create a composite fingerprint.
    -- Not a real SHA256 — uses the game's native djb2 variant.
    local h1 = GetHashKey(str)
    local h2 = GetHashKey(str .. "vexonac_salt_1")
    local h3 = GetHashKey(str .. "vexonac_salt_2")
    return string.format("%08x%08x%08x", h1 & 0xFFFFFFFF, h2 & 0xFFFFFFFF, h3 & 0xFFFFFFFF)
end

local function BuildFingerprint()
    local components = {}

    -- Component 1: CFX player token (account + machine bound in FiveM)
    local token0 = GetPlayerToken(PlayerId(), 0) or ""
    local token1 = GetPlayerToken(PlayerId(), 1) or ""
    local token2 = GetPlayerToken(PlayerId(), 2) or ""
    table.insert(components, token0)
    table.insert(components, token1)
    table.insert(components, token2)

    -- Component 2: Network player count is deterministic per session
    -- Combined with resource fingerprint gives session uniqueness
    local resCount = tostring(GetNumResources())
    table.insert(components, resCount)

    -- Component 3: Timing fingerprint
    -- CPU instruction timing is hardware-characteristic.
    -- We measure time to execute a fixed number of GetHashKey calls.
    local startTime = GetGameTimer()
    for i = 1, 5000 do GetHashKey("vexonac_timing_" .. i) end
    local elapsed = GetGameTimer() - startTime
    -- Quantize to 5ms buckets to be stable across minor timing variance
    local timingBucket = tostring(math.floor(elapsed / 5) * 5)
    table.insert(components, timingBucket)

    -- Component 4: System locale / language
    table.insert(components, GetConvar("game_language", "en_us"))

    -- Component 5: Resolution fingerprint via aspect ratio
    local sx, sy = GetActiveScreenResolution()
    table.insert(components, tostring(sx) .. "x" .. tostring(sy))

    -- Composite hash
    local rawFingerprint = table.concat(components, "|")
    local fingerprint    = sha256_simple(rawFingerprint)

    return fingerprint, {
        tokens     = { token0:sub(1,8), token1:sub(1,8) },  -- partial only for privacy
        res        = resCount,
        timing     = timingBucket,
        resolution = tostring(sx) .. "x" .. tostring(sy),
        lang       = GetConvar("game_language", "en_us"),
    }
end

-- Send on resource start (gives server the HWID for ban check)
CreateThread(function()
    Citizen.Wait(3000)

    if not (DoesEntityExist(PlayerPedId()) and NetworkIsPlayerActive(PlayerId())) then
        Citizen.Wait(5000)
    end

    local ok, fp, meta = pcall(BuildFingerprint)
    if ok and fp then
        TriggerServerEvent("vexonac:hwid", fp, meta)
    end
end)
