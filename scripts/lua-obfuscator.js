#!/usr/bin/env node
/**
 * VexonAC Lua obfuscator — FiveM-safe, zero external dependencies.
 *
 * Techniques applied per file:
 *  1. Strip all comments (-- and --[[ ]])
 *  2. Encode every string literal as string.char(byte, byte, ...)
 *  3. Rename all local variables to random hex identifiers
 *  4. XOR-encode the processed source and emit a self-decoding loader
 *
 * Usage: node lua-obfuscator.js <input.lua> <output.lua>
 */

const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

// ─── helpers ────────────────────────────────────────────────────────────────

function randomIdent(len = 12) {
  return "_" + crypto.randomBytes(len).toString("hex");
}

function xorKey(len = 32) {
  return Array.from(crypto.randomBytes(len));
}

// ─── Step 1: strip comments ─────────────────────────────────────────────────

function stripComments(src) {
  // Remove long comments --[[ ... ]]
  src = src.replace(/--\[\[[\s\S]*?\]\]/g, "");
  // Remove short comments -- ... (not inside strings)
  const lines = src.split("\n");
  const out = [];
  for (const line of lines) {
    // Simple: remove anything after -- that isn't inside a string.
    // We walk char-by-char to be safe.
    let result = "";
    let inStr = false;
    let strChar = "";
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (!inStr && (c === '"' || c === "'")) {
        inStr = true; strChar = c; result += c; i++;
        continue;
      }
      if (inStr && c === strChar && line[i - 1] !== "\\") {
        inStr = false; result += c; i++;
        continue;
      }
      if (!inStr && c === "-" && line[i + 1] === "-") break; // comment starts
      result += c; i++;
    }
    out.push(result);
  }
  return out.join("\n");
}

// ─── Step 2: encode string literals as string.char(...) ─────────────────────

function encodeStrings(src) {
  // Match single or double quoted strings (non-multiline), avoid long strings [[ ]]
  return src.replace(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g, (match, d, s) => {
    const raw = d !== undefined ? d : s;
    // Decode escape sequences to actual characters
    let decoded;
    try {
      // Use JSON.parse for double-quoted; handle single-quoted manually
      decoded = d !== undefined
        ? JSON.parse('"' + raw.replace(/\n/g, "\\n") + '"')
        : raw.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    } catch {
      return match; // leave unchanged if we can't parse
    }
    const bytes = [];
    for (let i = 0; i < decoded.length; i++) {
      bytes.push(decoded.charCodeAt(i));
    }
    if (bytes.length === 0) return '""';
    return "string.char(" + bytes.join(",") + ")";
  });
}

// ─── Step 3: rename local variables ─────────────────────────────────────────

function renameLocals(src) {
  const map = new Map();
  // Match `local varName` and `local varName,` and function params
  src = src.replace(/\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, name) => {
    if (!map.has(name)) map.set(name, randomIdent());
    return "local " + map.get(name);
  });
  // Replace all usages of renamed vars
  for (const [original, renamed] of map.entries()) {
    // Only replace word-boundary matches that aren't preceded by a dot (method calls)
    const re = new RegExp("(?<!\\.)\\b" + original + "\\b", "g");
    src = src.replace(re, renamed);
  }
  return src;
}

// ─── Step 4: XOR-encode the entire source and emit a loader ─────────────────

function xorWrap(src) {
  const key = xorKey(64);
  const bytes = Buffer.from(src, "utf8");
  const encoded = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    encoded[i] = bytes[i] ^ key[i % key.length];
  }

  const encodedHex = Array.from(encoded).join(",");
  const keyHex     = key.join(",");

  // The loader is intentionally minimal and hard to follow
  const loaderVar   = randomIdent();
  const keyVar      = randomIdent();
  const dataVar     = randomIdent();
  const iVar        = randomIdent();
  const outVar      = randomIdent();
  const fnVar       = randomIdent();

  return [
    `local ${keyVar}={${keyHex}}`,
    `local ${dataVar}={${encodedHex}}`,
    `local ${outVar}={}`,
    `for ${iVar}=1,#${dataVar} do`,
    `  ${outVar}[${iVar}]=string.char(${dataVar}[${iVar}]~${keyVar}[((${iVar}-1)%#${keyVar})+1])`,
    `end`,
    `local ${loaderVar}=table.concat(${outVar})`,
    `local ${fnVar},${loaderVar}=load(${loaderVar})`,
    `if ${fnVar} then ${fnVar}() end`,
  ].join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function obfuscate(src) {
  let out = src;
  out = stripComments(out);
  out = encodeStrings(out);
  out = renameLocals(out);
  out = xorWrap(out);
  return out;
}

const [,, input, output] = process.argv;
if (!input || !output) {
  console.error("Usage: node lua-obfuscator.js <input.lua> <output.lua>");
  process.exit(1);
}

const src = fs.readFileSync(input, "utf8");
const result = obfuscate(src);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, result, "utf8");
console.log(`  obfuscated: ${path.basename(input)} → ${path.basename(output)}`);
