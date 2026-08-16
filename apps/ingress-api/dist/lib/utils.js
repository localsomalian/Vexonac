export function parseIdentifierType(identifier) {
    if (identifier.startsWith("steam:"))
        return "STEAM";
    if (identifier.startsWith("license:"))
        return "ROCKSTAR";
    if (identifier.startsWith("license2:"))
        return "ROCKSTAR2";
    if (identifier.startsWith("discord:"))
        return "DISCORD";
    if (identifier.startsWith("xbox:"))
        return "XBOX";
    if (identifier.startsWith("xbl:"))
        return "XBOX";
    if (identifier.startsWith("live:"))
        return "MICROSOFT";
    if (identifier.startsWith("fivem:"))
        return "FIVEM";
    if (identifier.startsWith("fid:"))
        return "FINGERPRINT";
    if (identifier.startsWith("sid:") || identifier.startsWith("sid2:"))
        return "STORAGE";
    if (identifier.includes("ip:"))
        return "IP";
    return "HWID"; // Default for hardware IDs
}
