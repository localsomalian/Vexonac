#!/usr/bin/env bash
# VexonAC zip builder — builds from anticheat source + public overlays
# Run from any directory: bash /path/to/panel/scripts/build-zip.sh

set -euo pipefail

PANEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="$PANEL_DIR/apps/web/public"
ASSETS_DIR="$PANEL_DIR/apps/server/assets"
ANTICHEAT_DIR="$(dirname "$PANEL_DIR")/anticheat/VexonAC"
BUILD_DIR="/tmp/vexonac-build-$$"
OUTPUT_ZIP="$ASSETS_DIR/VexonAC.zip"

if ! command -v python3 &>/dev/null; then echo "ERROR: python3 not found"; exit 1; fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VexonAC ZIP Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Build directory structure from anticheat source ────────────────────────
echo "[1/5] Building from anticheat source..."
mkdir -p "$BUILD_DIR/resource/client"
mkdir -p "$BUILD_DIR/resource/server"
mkdir -p "$BUILD_DIR/web"
mkdir -p "$BUILD_DIR/auth"

# Core files from anticheat (not overridable from public/)
cp "$ANTICHEAT_DIR/fxmanifest.lua"                    "$BUILD_DIR/fxmanifest.lua"
cp "$ANTICHEAT_DIR/resource/server/auth.lua"          "$BUILD_DIR/resource/server/auth.lua"
cp "$ANTICHEAT_DIR/resource/vexonac.js"               "$BUILD_DIR/resource/vexonac.js" 2>/dev/null || true
cp "$ANTICHEAT_DIR/web/ui.html"                       "$BUILD_DIR/web/ui.html"         2>/dev/null || true
cp "$ANTICHEAT_DIR/web/ui.js"                         "$BUILD_DIR/web/ui.js"            2>/dev/null || true
echo "  copied: anticheat core files"

# ── 2. Overlay updated source files from public/ ─────────────────────────────
echo "[2/5] Overlaying source files from public/..."
copy_if_exists() { [ -f "$PUBLIC_DIR/$1" ] && cp "$PUBLIC_DIR/$1" "$BUILD_DIR/$2" && echo "  copied: $2"; }

copy_if_exists "resource/include.lua"              "resource/include.lua"
copy_if_exists "resource/client/main.lua"          "resource/client/main.lua"
copy_if_exists "resource/client/combat.lua"        "resource/client/combat.lua"
copy_if_exists "resource/client/hwid.lua"          "resource/client/hwid.lua"
copy_if_exists "resource/client/integrity.lua"     "resource/client/integrity.lua"
copy_if_exists "admin-hud-client.lua"              "resource/client/admin_hud.lua"
copy_if_exists "resource/server/bans.lua"          "resource/server/bans.lua"
copy_if_exists "resource/server/events.lua"        "resource/server/events.lua"
copy_if_exists "resource/server/exports.lua"       "resource/server/exports.lua"
copy_if_exists "admin-hud.html"                    "web/admin-hud.html"

# ── 2b. Bundle server.js (socket.io-client must be inlined for FiveM) ────────
echo "[2b/5] Bundling web/server.js..."
if [ -f "$ANTICHEAT_DIR/web/server.js" ]; then
  docker run --rm \
    -v "$ANTICHEAT_DIR:/app" \
    -w /app \
    node:20-alpine \
    sh -c "npx --yes esbuild web/server.js --bundle --platform=node --target=node16 --outfile=/tmp/server.bundled.js && cat /tmp/server.bundled.js" \
    > "$BUILD_DIR/web/server.js" 2>/dev/null
  echo "  bundled: web/server.js ($(wc -c < "$BUILD_DIR/web/server.js") bytes)"
else
  echo "  WARN: anticheat web/server.js not found"
fi

# ── 3. Strip LPH_* macros from auth.lua ──────────────────────────────────────
echo "[3/5] Stripping Luraph macros and patching auth.lua..."
python3 - "$BUILD_DIR/resource/server/auth.lua" <<'PYEOF'
import sys, re
path = sys.argv[1]
src  = open(path).read()
src  = re.sub(r'LPH_ENCSTR\("((?:[^"\\]|\\.)*)"\)', r'"\1"', src)
src  = re.sub(r"LPH_ENCSTR\('((?:[^'\\]|\\.)*)'\)", r"'\1'", src)
# Remove the _G.LPH_OBFUSCATED assignment line (using it as a var name would break Lua)
src  = re.sub(r'^_G\.LPH_OBFUSCATED\s*=.*\n?', '', src, flags=re.MULTILINE)
# Replace remaining uses of LPH_OBFUSCATED (as boolean expression) with false
src  = src.replace('LPH_OBFUSCATED', 'false')
# Fix auth.lua:2458 — guard 'details' so non-table/non-nil values don't crash the assert.
# The panel WebSocket can send wrong types for this parameter.
guard = 'if type(details) ~= "table" and details ~= nil then details = nil end\n    '
src = re.sub(
    r'(assert\(VexonAC\.TypeCheck\.isOptional\(VexonAC\.TypeCheck\.isTable\)\(details\)[^)]*\))',
    guard + r'\1',
    src,
)
open(path, 'w').write(src)
print("  stripped: auth.lua LPH_* macros + patched details assert")
PYEOF

echo "[4/5] Skipping obfuscation (ships clean source)..."

# ── 5. Package into zip ───────────────────────────────────────────────────────
echo "[5/5] Packaging VexonAC.zip..."
mkdir -p "$ASSETS_DIR"
rm -f "$OUTPUT_ZIP"
python3 -c "
import zipfile, os, sys
out = sys.argv[1]
src = sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(src):
        # Skip node_modules if accidentally included
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for file in sorted(files):
            abs_path = os.path.join(root, file)
            arc_name = os.path.relpath(abs_path, src)
            z.write(abs_path, arc_name)
print('  wrote:', out)
" "$OUTPUT_ZIP" "$BUILD_DIR"

rm -rf "$BUILD_DIR"

SIZE=$(du -sh "$OUTPUT_ZIP" | cut -f1)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done! VexonAC.zip — $SIZE"
echo "  Output: $OUTPUT_ZIP"
echo ""
echo "  Deploy to container:"
echo "    docker cp $OUTPUT_ZIP panel-server-1:/app/apps/server/assets/VexonAC.zip"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
