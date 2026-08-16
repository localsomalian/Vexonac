#!/usr/bin/env python3
"""
VexonAC Lua obfuscator — FiveM-safe, zero deps beyond stdlib.
Techniques:
  1. Strip -- and --[[ ]] comments
  2. Encode string literals as string.char(byte, ...)
  3. Rename local variables to random hex names
  4. XOR-encrypt full source + emit self-decoding loader
"""

import sys, re, os, secrets, json

# ── 1. strip comments ─────────────────────────────────────────────────────────

def strip_comments(src: str) -> str:
    # Long comments first
    src = re.sub(r'--\[\[.*?\]\]', '', src, flags=re.DOTALL)
    lines = []
    for line in src.split('\n'):
        result = []
        in_str, str_char, i = False, '', 0
        while i < len(line):
            c = line[i]
            if not in_str and c in ('"', "'"):
                in_str, str_char = True, c
                result.append(c); i += 1; continue
            if in_str and c == str_char and (i == 0 or line[i-1] != '\\'):
                in_str = False
                result.append(c); i += 1; continue
            if not in_str and c == '-' and i+1 < len(line) and line[i+1] == '-':
                break
            result.append(c); i += 1
        lines.append(''.join(result))
    return '\n'.join(lines)

# ── 2. encode string literals ─────────────────────────────────────────────────

def encode_strings(src: str) -> str:
    def replacer(m):
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        try:
            # Decode Lua escape sequences
            decoded = raw.replace(r'\\', '\x00BACKSLASH\x00')
            decoded = decoded.replace(r'\n', '\n').replace(r'\t', '\t')
            decoded = decoded.replace(r"\'", "'").replace(r'\"', '"')
            decoded = decoded.replace('\x00BACKSLASH\x00', '\\')
        except Exception:
            return m.group(0)
        if not decoded:
            return '""'
        bytes_list = [str(ord(c)) for c in decoded]
        return 'string.char(' + ','.join(bytes_list) + ')'

    # Match double-quoted strings
    src = re.sub(r'"((?:[^"\\]|\\.)*)"', replacer, src)
    # Match single-quoted strings
    src = re.sub(r"'((?:[^'\\]|\\.)*)'", replacer, src)
    return src

# ── 3. rename locals ──────────────────────────────────────────────────────────

def rename_locals(src: str) -> str:
    name_map = {}

    def make_name():
        return '_' + secrets.token_hex(8)

    def map_name(original):
        if original not in name_map:
            name_map[original] = make_name()
        return name_map[original]

    # Find all `local <name>` declarations
    def replace_decl(m):
        return 'local ' + map_name(m.group(1))
    src = re.sub(r'\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\b', replace_decl, src)

    # Replace usages (word boundary, not after a dot)
    for original, renamed in name_map.items():
        src = re.sub(r'(?<!\.)(?<![a-zA-Z0-9_])\b' + re.escape(original) + r'\b(?![a-zA-Z0-9_])', renamed, src)

    return src

# ── 4. XOR-wrap ───────────────────────────────────────────────────────────────

def xor_wrap(src: str) -> str:
    key = list(secrets.token_bytes(64))
    data = list(src.encode('utf-8'))
    encoded = [(b ^ key[i % len(key)]) for i, b in enumerate(data)]

    kv  = '_' + secrets.token_hex(6)
    dv  = '_' + secrets.token_hex(6)
    iv  = '_' + secrets.token_hex(6)
    ov  = '_' + secrets.token_hex(6)
    fv  = '_' + secrets.token_hex(6)
    lv  = '_' + secrets.token_hex(6)

    lines = [
        f'local {kv}={{{",".join(map(str,key))}}}',
        f'local {dv}={{{",".join(map(str,encoded))}}}',
        f'local {ov}={{}}',
        f'for {iv}=1,#{dv} do',
        f'  {ov}[{iv}]=string.char({dv}[{iv}]~{kv}[(({iv}-1)%#{kv})+1])',
        f'end',
        f'local {lv}=table.concat({ov})',
        f'local {fv},{lv}=load({lv})',
        f'if {fv} then {fv}() end',
    ]
    return '\n'.join(lines)

# ── main ──────────────────────────────────────────────────────────────────────

def obfuscate(src: str) -> str:
    src = strip_comments(src)
    src = encode_strings(src)
    src = rename_locals(src)
    src = xor_wrap(src)
    return src

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python3 lua-obfuscator.py <input.lua> <output.lua>')
        sys.exit(1)
    inp, out = sys.argv[1], sys.argv[2]
    src = open(inp, 'r', encoding='utf-8').read()
    result = obfuscate(src)
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    open(out, 'w', encoding='utf-8').write(result)
    print(f'  obfuscated: {os.path.basename(inp)} → {os.path.basename(out)}')
