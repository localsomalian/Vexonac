const fs = require("fs");
const path = require("path");

const basePath = path.join(__dirname, "../apps/web/src/locales");
const files = {
  en: path.join(basePath, "en.ts"),
  de: path.join(basePath, "de.ts"),
  fr: path.join(basePath, "fr.ts"),
  es: path.join(basePath, "es.ts"),
  pt: path.join(basePath, "pt.ts"),
  it: path.join(basePath, "it.ts"),
  nl: path.join(basePath, "nl.ts"),
  ko: path.join(basePath, "ko.ts"),
};

function loadLocale(file) {
  const content = fs.readFileSync(file, "utf8");
  // Remove export and type lines, then eval as JS object
  const objStr = content
    .replace(/export default /, "")
    .replace(/as const;?/, "")
    .trim();
  // eslint-disable-next-line no-eval
  return eval("(" + objStr + ")");
}

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      keys = keys.concat(
        getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key)
      );
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return keys;
}

function findMissingKeys(base, compare) {
  const baseKeys = getAllKeys(base);
  const compareKeys = new Set(getAllKeys(compare));
  return baseKeys.filter((k) => !compareKeys.has(k));
}

function main() {
  const en = loadLocale(files.en);
  const de = loadLocale(files.de);
  const es = loadLocale(files.es);
  const fr = loadLocale(files.fr);
  const pt = loadLocale(files.pt);
  const ko = loadLocale(files.ko);
  const it = loadLocale(files.it);
  const nl = loadLocale(files.nl);

  const missingDe = findMissingKeys(en, de);
  const missingEs = findMissingKeys(en, es);
  const missingFr = findMissingKeys(en, fr);
  const missingPt = findMissingKeys(en, pt);
  const missingKo = findMissingKeys(en, ko);
  const missingIt = findMissingKeys(en, it);
  const missingNl = findMissingKeys(en, nl);

  if (missingDe.length === 0) {
    console.log("✅ All keys present in de.ts");
  } else {
    console.log("❌ Missing keys in de.ts:");
    missingDe.forEach((k) => console.log("  -", k));
  }

  if (missingEs.length === 0) {
    console.log("✅ All keys present in es.ts");
  } else {
    console.log("❌ Missing keys in es.ts:");
    missingEs.forEach((k) => console.log("  -", k));
  }

  if (missingFr.length === 0) {
    console.log("✅ All keys present in fr.ts");
  } else {
    console.log("❌ Missing keys in fr.ts:");
    missingFr.forEach((k) => console.log("  -", k));
  }

  if (missingKo.length === 0) {
    console.log("✅ All keys present in ko.ts");
  } else {
    console.log("❌ Missing keys in ko.ts:");
    missingKo.forEach((k) => console.log("  -", k));
  }

  if (missingPt.length === 0) {
    console.log("✅ All keys present in pt.ts");
  } else {
    console.log("❌ Missing keys in pt.ts:");
    missingPt.forEach((k) => console.log("  -", k));
  }

  if (missingIt.length === 0) {
    console.log("✅ All keys present in it.ts");
  } else {
    console.log("❌ Missing keys in it.ts:");
    missingIt.forEach((k) => console.log("  -", k));
  }

  if (missingNl.length === 0) {
    console.log("✅ All keys present in nl.ts");
  } else {
    console.log("❌ Missing keys in nl.ts:");
    missingNl.forEach((k) => console.log("  -", k));
  }
}
main();
