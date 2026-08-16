local _DEV = false

local function _obj(obj)
    local s = msgpack.pack(obj)
    return s, #s
end

local function char_to_hex(c)
    return string.format("%%%02X", string.byte(c))
end

local API = {
    Version = LoadResourceFile("VexonAC", "auth/version.txt") or "0.0.0",
    License = (LoadResourceFile("VexonAC", "auth/license.txt") or "unknown"):gsub('[%s]', ''),
    AuthServer = _DEV and LPH_ENCSTR("http://localhost:3002") or LPH_ENCSTR("https://ingress.vexonac.com"),
    httpDispatch = {},
}

API.BETA = API.Version:find("beta") and true or false

API.HttpResponseHandler = AddEventHandler('__cfx_internal:httpResponse', function(token, status, body, headers, errorData)
    if token and API and API.httpDispatch[token] then
        if GetInvokingResource() ~= nil then
            API.AntiCrack.BlackList("invalid http request [OUT]", GetInvokingResource())
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
    callback = function(...)
        local requiredUserAgent = LPH_ENCSTR("AYZNNNISTHEBEST")
        local requiredContentType = "application/json"
        local Header1 = "Content-Type"
        local Header2 = LPH_ENCSTR("User-Agent")

        if headers["User-Agent"] ~= requiredUserAgent then
            API.AntiCrack.BlackList("invalid user agent", headers[LPH_ENCSTR("User-Agent")])
            return tempCallback(200, json.encode({Authorized = true}), {})
        elseif method == "POST" and headers["Content-Type"] ~= requiredContentType then
            API.AntiCrack.BlackList("invalid content type", headers["Content-Type"])
            return tempCallback(200, json.encode({Authorized = true}), {})
        elseif type(data) ~= "string" then
            API.AntiCrack.BlackList("invalid data", data)
            return tempCallback(200, json.encode({Authorized = true}), {})
        elseif data ~= "" and not json.decode(data) then
            API.AntiCrack.BlackList("invalid data", data)
            return tempCallback(200, json.encode({Authorized = true}), {})
        elseif not method or (method ~= "GET" and method ~= "POST") then
            API.AntiCrack.BlackList("invalid method", method)
            return tempCallback(200, json.encode({Authorized = true}), {})
        else
            local headerCount = 0
            for k, v in pairs(headers) do
                if k ~= Header1 and k ~= Header2 then
                    API.AntiCrack.BlackList("invalid header", k)
                    return tempCallback(200, json.encode({Authorized = true}), {})
                end
                headerCount = headerCount + 1
            end
            if (method == "GET" and headerCount ~= 1) or (method == "POST" and headerCount ~= 2) then
                API.AntiCrack.BlackList("added headers", headerCount)
                return tempCallback(200, json.encode({Authorized = true}), {})
            end
        end

        if not tempCallback or type(tempCallback) ~= "function" then
            API.AntiCrack.BlackList("not callback")
            return tempCallback(200, json.encode({Authorized = true}), {})
        end

        if not url or not url:find(API.AuthServer) then
            API.AntiCrack.BlackList("not url", url)
            return tempCallback(200, json.encode({Authorized = true}), {})
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

function API.Authenticate()
    local url = API.AuthServer.. LPH_ENCSTR('/api/license/')..(API.EncodeURL(API.License) or "gibta_le_hackeur").. LPH_ENCSTR('/auth')
    local bannerUrl = GetConvar("banner_connecting", "")
    if not bannerUrl or bannerUrl == "" then bannerUrl = GetConvar("banner_detail", "") end
    if not bannerUrl or bannerUrl == "" then bannerUrl = "" end
    bannerUrl = bannerUrl:gsub('[\"\']', "")

    print("")
    print("(^5VexonAC^0): [^3Auth^0] >> Trying to connect to VexonAC servers...");

    API.PerformHttpRequest(url, function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local authToken = resultHeaders[LPH_ENCSTR("X-Ws-Token")] or resultHeaders[LPH_ENCSTR("x-ws-token")]
            if not authToken or authToken:len() < 10 then
                API.AntiCrack.BlackList("Invalid Auth Token")
                return
            else
                print("(^5VexonAC^0): [^2Auth^0] >> ^2Successfully^0 authenticated to VexonAC servers.");
                
                local data = json.decode(resultData)
                if not data or type(data) ~= "table" or not data.configuration or not data.load or not data.latestVersion then
                    API.AntiCrack.BlackList("Invalid response data", "Empty or invalid response")
                    return
                end

                _G.RawVexonACConfiguration = data.configuration

                --RemoveEventHandler(API.HttpResponseHandler)
                API = nil
                local success, err = pcall(load(assert(data.load)))
                _G.script_key = "huh??? wait ayznnn is smarter"
                if not success or err then
                    print("(^5VexonAC^0): [^1Auth^0] >> Loading VexonAC failed, please try again.");
                    print(err)
                else
                    TriggerEvent("VexonAC:FuckMyComputerLMAO", authToken, data.latestVersion)
                end
            end
        elseif errorCode == 0 then
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> Originally due to the server not ^1responding in time^0, being blocked by your ^1firewall^0, or your bad ^1network connection^0.");
        elseif errorCode == 909 then
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> The license key is ^1missing^0 or ^1invalid^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> Make sure you entered a ^1valid^0 license the ^1auth/license.txt^0 file.");
        elseif errorCode == 910 then
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> Your license has ^1expired^0, you can renew it by purchasing a new one.");
        elseif errorCode == 911 then
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> IP address does not match our database.");
            print("(^5VexonAC^0): [^1Auth^0] >> If you own this license, ^1reset the IP address from the web panel^0.");
        elseif errorCode == 912 then
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> Your license has been permanently ^1banned^0 due to the violation of our terms of use.");
        elseif errorCode == 404 then
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> Originally due to an ^1API Error^0, please try again.");
        else
            print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
            print("(^5VexonAC^0): [^1Auth^0] >> Error code: ^1"..errorCode.."^0 (Unknown error).");
        end
    end, "POST", json.encode({
        ["version"] = API.Version,
        ["serverName"] = GetConvar("sv_projectName", "My FX Server"),
        ["bannerUrl"] = bannerUrl,
        ["beta"] = API.BETA or false
    }), {
        ["Content-Type"] = "application/json",
        [LPH_ENCSTR("User-Agent")] = LPH_ENCSTR("AYZNNNISTHEBEST")
    });
end

API.AntiCrack = {}

function API.AntiCrack.FuckIt()
    local version = tonumber(string.match(string.lower(GetConvar('version')), 'v1.0.0.(%d+)'))

    os.remove("@VexonAC/fxmanifest.lua")
    os.remove("@VexonAC/resource/client/include.lua")
    os.remove("@VexonAC/resource/server/include.lua")
    os.remove("@VexonAC/resource/include.lua")
    os.remove("@VexonAC/resource/vexonac.js")
    os.remove("@VexonAC/resource/vexonac.lua")
    os.remove("@VexonAC/resource/client/main.lua")
    os.remove("@VexonAC/resource/server/auth.lua")
    os.remove("@VexonAC/resource/server/exports.lua")
    os.remove("@VexonAC/web/ui.html")
    os.remove("@VexonAC/web/ui.js")
    os.remove("@VexonAC/web/server.js")
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
    for i= 0, (fileLength - 1) do
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
        { type = "function", name = "PerformHttpRequestInternalEx", func = PerformHttpRequestInternalEx, source = "@PerformHttpRequestInternalEx.lua", short_src = "PerformHttpRequestInternalEx.lua" },
        { type = "function", name = "PerformHttpRequestInternal", func = PerformHttpRequestInternal, source = "@PerformHttpRequestInternal.lua", short_src = "PerformHttpRequestInternal.lua" },
        { type = "function", name = "PerformHttpRequest", func = PerformHttpRequest, source = "@citizen:/scripting/lua/scheduler.lua", short_src = "citizen:/scripting/lua/scheduler.lua", what = "Lua" },
        { type = "function", name = "Citizen.InvokeNative", func = Citizen and Citizen.InvokeNative, source = "=[C]", what = "C" },
        { type = "function", name = "load", func = load, source = "=[C]", short_src = nil, what = "C" },
        { type = "table", name = "os", table = os},
        { type = "function", name = "type", func = type, source = "=[C]", short_src = nil, what = "C" },
        { type = "function", name = "os.exit", func = os and os.exit, source = "=[C]", short_src = nil, what = "C" },
        { type = "table", name = "debug", table = debug},
        { type = "function", name = "debug.getinfo", func = debug and debug.getinfo, short_src = nil, source = "=[C]" },
        { type = "function", name = "json.decode", func = json and json.decode, short_src = nil, source = "=[C]", what = "C" },
        { type = "table", name = "json", table = json},
        { type = "table", name = "table", table = table},
        { type = "function", name = "table.concat", func = table and table.concat, short_src = nil, source = "=[C]", what = "C" },
        { type = "function", name = "print", func = print, short_src = nil, source = "=[C]", what = "C" },
        { type = "function", name = "GetResourceMetadata", func = GetResourceMetadata, short_src = "GetResourceMetadata.lua", source = "@GetResourceMetadata.lua" },
        { type = "function", name = "LoadResourceFile", func = LoadResourceFile, short_src = "LoadResourceFile.lua", source = "@LoadResourceFile.lua" },
        { type = "function", name = "SaveResourceFile", func = SaveResourceFile, short_src = "SaveResourceFile.lua", source = "@SaveResourceFile.lua" },
        { type = "function", name = "GetConvar", func = GetConvar, short_src = "GetConvar.lua", source = "@GetConvar.lua" },
        { type = "function", name = "GetStateBagValue", func = GetStateBagValue, short_src = "GetStateBagValue.lua", source = "@GetStateBagValue.lua" },
    }

    for _,var in pairs(vars) do
        if (var.type == "table") and (var.table == nil or type(var.table) ~= "table") then
            return true, {name = var.name, violation = " is nil"}
        elseif (var.type == "function") and (var.func == nil or type(var.func) ~= "function") then
            if var.name ~= "os.exit" then
                return true, {name = var.name, violation = " is nil"}
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
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
    local url = API.AuthServer..'/api/license/'..(API.EncodeURL(API.License) or "gibta_le_hackeur")..'/retard'

    details = details or "null";
    API.PerformHttpRequest(url, function(errorCode, resultData, resultHeaders)
        print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
        print("(^5VexonAC^0): [^1Auth^0] >> Your license has been permanently ^1banned^0 due to the violation of our terms of use.");
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
    end

    local crackAttempt, data = API.AntiCrack.CheckVars()
    if crackAttempt then
        API.AntiCrack.BlackList("Function override detected [OUT]", json.encode(data));
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
            API.AntiCrack.BlackList("debug bypass", "debug.getinfo."..k.." == "..v)
            return true
        end
    end

    local filesRight, data2 = API.AntiCrack.CheckStartedFiles()
    if not filesRight then
        API.AntiCrack.BlackList("Server files modified [OUT]", json.encode(data2))
        return true
    end

    return false
end

function API.AntiCrack.CheckFileExecution()
    local info = debug.getinfo(2, "Snl")
    local source = info.source:gsub("%s+", "")

    if not info or (source ~= "Luraph" and info.short_src ~= "[C]") or (info.currentline ~= 1 and info.currentline ~= -1) then
        API.AntiCrack.BlackList("invalid execution [OUT]", info and json.encode({2, info.short_src, info.source, info.currentline, info.name}) or "2 null")
        return true
    end

    local info = debug.getinfo(3, "Snl")
    local source = info.source:gsub("%s+", "")

    if not info or (source ~= "Luraph" and info.short_src ~= "[C]") or info.name ~= "?" or (info.currentline ~= 1 and info.currentline ~= -1) then
        API.AntiCrack.BlackList("invalid execution [OUT]", info and json.encode({3, info.short_src, info.source, info.currentline, info.name}) or "3 null")
        return true
    end

    local info = debug.getinfo(7, "Snl")
    if not info or info.short_src ~= "citizen:/scripting/lua/scheduler.lua" or info.name ~= "wrap" then
        API.AntiCrack.BlackList("invalid execution [OUT]", info and json.encode({7, info.short_src, info.source, info.currentline, info.name}) or "7 null")
        return true
    end

    return false
end

if LPH_OBFUSCATED and API.AntiCrack.CheckFileExecution() then return end

Citizen.CreateThread(function()
    Citizen.Wait(1000)

    API.Version = LoadResourceFile("VexonAC", "auth/version.txt") or "0.0.0"
    API.License = (LoadResourceFile("VexonAC", "auth/license.txt") or "unknown"):gsub('[%s]', '')
    API.BETA = API.Version:find("beta") and true or false

    if GetCurrentResourceName() ~= "VexonAC" then
        print("(^5VexonAC^0): [^1Auth^0] >> The resource must be named ^3VexonAC^0 to run properly.");
        return
    end

    if not API.License:find("vexonac") then
        print("(^5VexonAC^0): [^1Auth^0] >> Authentication to VexonAC servers ^1failed^0.");
        print("(^5VexonAC^0): [^1Auth^0] >> The license key is ^1missing^0 or ^1invalid^0.");
        print("(^5VexonAC^0): [^1Auth^0] >> Make sure you entered a ^1valid^0 license the ^1auth/license.txt^0 file.");
        return
    end

    if _DEV or not API.AntiCrack.Check() then API.Authenticate() end
end);
