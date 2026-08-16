#!/usr/bin/env node
/**
 * Simple JS obfuscator — no external deps.
 * Encodes the entire source as a self-evaluating hex-XOR string.
 *
 * Usage: node js-obfuscator.js <input.js> <output.js>
 */

const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

function obfuscate(src) {
  const key   = Array.from(crypto.randomBytes(64));
  const bytes = Buffer.from(src, "utf8");
  const enc   = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) enc[i] = bytes[i] ^ key[i % key.length];

  // Emit a loader using only basic JS primitives available in FiveM's v8
  const encArr = Array.from(enc).join(",");
  const keyArr = key.join(",");
  return [
    "(function(){",
    `var _k=[${keyArr}];`,
    `var _d=[${encArr}];`,
    `var _s="";`,
    `for(var _i=0;_i<_d.length;_i++)_s+=String.fromCharCode(_d[_i]^_k[_i%_k.length]);`,
    `(new Function(_s))();`,
    "})();"
  ].join("\n");
}

const [,, input, output] = process.argv;
if (!input || !output) {
  console.error("Usage: node js-obfuscator.js <input.js> <output.js>");
  process.exit(1);
}

const src = fs.readFileSync(input, "utf8");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, obfuscate(src), "utf8");
console.log(`  obfuscated: ${path.basename(input)} → ${path.basename(output)}`);
