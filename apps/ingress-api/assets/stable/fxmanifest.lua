fx_version 'cerulean'
game 'gta5'
lua54 'yes'

version '4.0.0'
author 'VexonAC'
description 'VexonAC, The Best FiveM Anti-Cheat'
discord 'https://discord.gg/vexonac'
website 'https://vexonac.com'

ui_page 'web/ui.html'

client_scripts {
    "resource/include.lua",
    "resource/vexonac.js",
    "resource/client/main.lua",
}

server_scripts {
    "resource/include.lua",
    "resource/vexonac.js",
    "resource/server/exports.lua",
    "resource/server/auth.lua",
    "web/server.js",
}

files {
    'web/ui.html',
    'web/ui.js'
}

dependencies {
    "/server:14317",
-- Zm1hLnd0Zg==
    "/onesync",
-- V1dXV1dXV1dXV1dXV1dXV1cgZm1h
}
