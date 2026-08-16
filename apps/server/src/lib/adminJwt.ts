import { createHmac, scryptSync, timingSafeEqual, randomBytes } from "crypto";

export interface AdminPayload {
  sub: string;
  username: string;
  role: string;
  exp: number;
}

export function signAdminJwt(
  payload: Omit<AdminPayload, "exp">,
  secret: string,
  ttlSeconds = 7 * 24 * 3600,
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const data = `${header}.${body}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyAdminJwt(token: string, secret: string): AdminPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AdminPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, storedHash] = stored.split(":");
    const hash = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(storedHash, "hex"), hash);
  } catch {
    return false;
  }
}

export function parseCookies(header: string | string[] | undefined): Record<string, string> {
  if (!header) return {};
  const raw = Array.isArray(header) ? header.join("; ") : header;
  return Object.fromEntries(
    raw.split(";").map((c) => {
      const idx = c.indexOf("=");
      if (idx === -1) return [c.trim(), ""];
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    }),
  );
}
