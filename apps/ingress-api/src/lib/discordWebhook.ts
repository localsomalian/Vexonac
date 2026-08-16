function versionFooter(version?: string | null): string {
  const v = version || "1.0.0";
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day   = days[now.getUTCDay()];
  const date  = `${String(now.getUTCDate()).padStart(2, "0")} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
  const time  = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
  return `VexonAC ${v} — ${day}, ${date} — ${time}`;
}

/** Formats an array of FiveM identifiers into readable Discord lines, one per identifier. */
export function formatIdentifiers(identifiers: string[], showIp = true): string {
  const lines: string[] = [];
  for (const id of identifiers) {
    if (id.startsWith("steam:"))    lines.push(`🟦 **Steam:** \`${id.slice(6)}\``);
    else if (id.startsWith("license2:")) lines.push(`🔑 **License2:** \`${id.slice(9)}\``);
    else if (id.startsWith("license:"))  lines.push(`🔑 **License:** \`${id.slice(8)}\``);
    else if (id.startsWith("discord:"))  lines.push(`💬 **Discord:** <@${id.slice(8)}>`);
    else if (id.startsWith("fivem:"))    lines.push(`🎮 **FiveM:** \`${id.slice(6)}\``);
    else if (id.startsWith("fid:"))      lines.push(`🆔 **HWID:** \`${id.slice(4)}\``);
    else if (id.startsWith("xbox:"))     lines.push(`🎯 **Xbox:** \`${id.slice(5)}\``);
    else if (id.startsWith("live:"))     lines.push(`📱 **Live:** \`${id.slice(5)}\``);
    else if (id.startsWith("ip:") && showIp) lines.push(`🌐 **IP:** \`${id.slice(3)}\``);
  }
  return lines.join("\n");
}

/** Extracts Discord webhook URLs from a stored license configuration object. */
export interface DiscordConfig {
  enabled:            boolean;
  showIp:             boolean;
  mainWebhook:        string;
  entitiesWebhook:    string;
  explosionsWebhook:  string;
  weaponsWebhook:     string;
  unbansWebhook:      string;
  connectionsWebhook: string;
  communityWebhook:   string;
  globalBanWebhook:   string;
  screenshotsWebhook: string;
}

export function getDiscordConfig(configuration: Record<string, any> | null | undefined): DiscordConfig {
  const s = (configuration as any)?.Settings ?? {};
  return {
    enabled:            s.EnableDiscordLogs !== false,
    showIp:             s.ShowIpAddress !== false,
    mainWebhook:        s.MainWebhook          || "",
    entitiesWebhook:    s.EntitiesWebhook       || "",
    explosionsWebhook:  s.ExplosionsWebhook     || "",
    weaponsWebhook:     s.WeaponsWebhook        || "",
    unbansWebhook:      s.UnbansWebhook         || "",
    connectionsWebhook: s.ConnectionsWebhook    || "",
    communityWebhook:   s.CommunityLogsWebhook  || "",
    globalBanWebhook:   s.GlobalBanWebhook      || "",
    screenshotsWebhook: s.ScreenshotsWebhook    || "",
  };
}

export function sendWebhook(url: string, payload: object): void {
  if (!url) return;
  fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  }).catch(() => {});
}

export function buildBanEmbed(opts: {
  serverName:   string;
  playerName:   string;
  reason:       string;
  banId:        string;
  expiryText:   string;
  identifiers?: string[];
  showIp?:      boolean;
  version?:     string | null;
  imageUrl?:    string;
}) {
  const idBlock = opts.identifiers?.length
    ? formatIdentifiers(opts.identifiers, opts.showIp !== false)
    : "";
  return {
    title: "🔨 Player Banned",
    color: 0xed4245,
    description: [
      `🖥️ **Server:** ${opts.serverName}`,
      `👤 **Player:** ${opts.playerName}`,
      `📝 **Reason:** ${opts.reason}`,
      `⏱️ **Duration:** ${opts.expiryText}`,
      `🆔 **Ban ID:** #${opts.banId}`,
      idBlock ? `\n${idBlock}` : null,
    ].filter(Boolean).join("\n"),
    ...(opts.imageUrl ? { image: { url: opts.imageUrl } } : {}),
    footer:    { text: versionFooter(opts.version) },
    timestamp: new Date().toISOString(),
  };
}

export function buildUnbanEmbed(opts: {
  serverName:  string;
  banId:       string;
  reason?:     string;
  unbannedBy?: string;
  version?:    string | null;
}) {
  return {
    title: "✅ Player Unbanned",
    color: 0x57f287,
    description: [
      `🖥️ **Server:** ${opts.serverName}`,
      `🆔 **Ban ID:** #${opts.banId}`,
      opts.reason     ? `📝 **Ban Reason:** ${opts.reason}`      : null,
      opts.unbannedBy ? `👮 **Unbanned By:** ${opts.unbannedBy}` : null,
    ].filter(Boolean).join("\n"),
    footer:    { text: versionFooter(opts.version) },
    timestamp: new Date().toISOString(),
  };
}

export function buildDetectionEmbed(opts: {
  serverName:  string;
  playerName:  string;
  code:        string;
  severity:    string;
  pts:         number;
  total:       number;
  identifiers?: string[];
  showIp?:     boolean;
  version?:    string | null;
  imageUrl?:   string;
}) {
  const colors: Record<string, number> = {
    CRITICAL: 0xed4245,
    HIGH:     0xf96854,
    MEDIUM:   0xfee75c,
    LOW:      0x57f287,
  };
  const sevEmoji: Record<string, string> = {
    CRITICAL: "🔴",
    HIGH:     "🟠",
    MEDIUM:   "🟡",
    LOW:      "🟢",
  };
  const idBlock = opts.identifiers?.length
    ? formatIdentifiers(opts.identifiers, opts.showIp !== false)
    : "";
  return {
    title: `${sevEmoji[opts.severity] ?? "⚪"} ${opts.code} Detected`,
    color: colors[opts.severity] ?? 0xaaaaaa,
    description: [
      `🖥️ **Server:** ${opts.serverName}`,
      `👤 **Player:** ${opts.playerName}`,
      `🔍 **Detection:** ${opts.code}`,
      `⚠️ **Severity:** ${opts.severity}`,
      `📊 **Score:** +${opts.pts} pts (total: ${opts.total})`,
      idBlock ? `\n${idBlock}` : null,
    ].filter(Boolean).join("\n"),
    ...(opts.imageUrl ? { image: { url: opts.imageUrl } } : {}),
    footer:    { text: versionFooter(opts.version) },
    timestamp: new Date().toISOString(),
  };
}

export function buildEntityEmbed(opts: {
  serverName:    string;
  playerName:    string;
  playerLicense: string;
  type:          string;
  details:       Record<string, any>;
}) {
  return {
    title: "📦 Entity Created",
    color: 0x5865f2,
    description: [
      `🖥️ **Server:** ${opts.serverName}`,
      `👤 **Player:** ${opts.playerName}`,
      `🔑 **License:** \`${opts.playerLicense.replace("license:", "")}\``,
      `🗂️ **Type:** ${opts.type}`,
      opts.details && Object.keys(opts.details).length
        ? `\`\`\`json\n${JSON.stringify(opts.details, null, 2).slice(0, 600)}\`\`\``
        : null,
    ].filter(Boolean).join("\n"),
    footer:    { text: "VexonAC Anti-Cheat" },
    timestamp: new Date().toISOString(),
  };
}

export function buildExplosionEmbed(opts: {
  serverName:    string;
  playerName:    string;
  playerLicense: string;
  details:       Record<string, any>;
}) {
  return {
    title: "💥 Explosion Detected",
    color: 0xfee75c,
    description: [
      `🖥️ **Server:** ${opts.serverName}`,
      `👤 **Player:** ${opts.playerName}`,
      `🔑 **License:** \`${opts.playerLicense.replace("license:", "")}\``,
      opts.details && Object.keys(opts.details).length
        ? `\`\`\`json\n${JSON.stringify(opts.details, null, 2).slice(0, 600)}\`\`\``
        : null,
    ].filter(Boolean).join("\n"),
    footer:    { text: "VexonAC Anti-Cheat" },
    timestamp: new Date().toISOString(),
  };
}

export function buildConnectionEmbed(opts: {
  serverName:    string;
  playerName:    string;
  playerLicense: string;
  identifiers?:  string[];
  action:        "joined" | "left";
  showIp?:       boolean;
  version?:      string | null;
}) {
  const isJoin = opts.action === "joined";
  const ids = opts.identifiers?.length ? opts.identifiers : [opts.playerLicense];
  const idBlock = formatIdentifiers(ids, opts.showIp !== false);
  return {
    title: isJoin ? "🟢 Player Connected" : "🔴 Player Disconnected",
    color: isJoin ? 0x57f287 : 0xed4245,
    description: [
      `👤 **Player:** ${opts.playerName}`,
      `🖥️ **Server:** ${opts.serverName}`,
      idBlock ? `\n${idBlock}` : null,
    ].filter(Boolean).join("\n"),
    footer:    { text: versionFooter(opts.version) },
    timestamp: new Date().toISOString(),
  };
}

export function buildRejectedConnectionEmbed(opts: {
  serverName:   string;
  playerName:   string;
  identifiers?: string[];
  reason:       string;
  banId?:       string;
  showIp?:      boolean;
  version?:     string | null;
}) {
  const ids = opts.identifiers ?? [];
  const idBlock = ids.length ? formatIdentifiers(ids, opts.showIp !== false) : "";
  return {
    title: "🚫 Connection Rejected",
    color: 0xf96854,
    description: [
      `👤 **Player:** ${opts.playerName}`,
      `🖥️ **Server:** ${opts.serverName}`,
      `📝 **Reason:** ${opts.reason}`,
      opts.banId ? `🆔 **Ban ID:** #${opts.banId}` : null,
      idBlock ? `\n${idBlock}` : null,
    ].filter(Boolean).join("\n"),
    footer:    { text: versionFooter(opts.version) },
    timestamp: new Date().toISOString(),
  };
}
