import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingMessage } from "http";
import prisma from "../../prisma";
import { auth } from "./auth";
import { parseCookies, verifyAdminJwt, type AdminPayload } from "./adminJwt";
import { env } from "./env";

// Define a custom context type for internal route handlers
export interface InternalContextOptions {
  req: IncomingMessage & {
    ip?: string;
    clientIp?: string;
    headers: IncomingMessage["headers"];
  };
  res: any;
}

// Generic context creator for both tRPC and internal routes
export async function createContext(
  opts: CreateExpressContextOptions | InternalContextOptions
) {
  // Check if this is a demo request by examining the request body or URL
  let isDemoRequest = false;
  
  try {
    // Check if the request contains demo server ID
    const url = (opts.req as any).url || "";
    const body = (opts.req as any).body;
    // Check URL for demo server references
    if (url.includes("demo") || url.includes('"serverId":"demo"')) {
      isDemoRequest = true;
    }
    
    // Check request body for demo server ID (for POST requests)
    if (body && typeof body === "string") {
      if (body.includes('"serverId":"demo"') || body.includes("serverId=demo")) {
        isDemoRequest = true;
      }
    } else if (body && typeof body === "object") {
      if (body.serverId === "demo" || (body.input && body.input.serverId === "demo")) {
        isDemoRequest = true;
      }
    }
  } catch (error) {
    // If there's an error parsing, continue with normal auth
  }

  let session;
  
  if (isDemoRequest) {
    // For demo requests, create a fake session
    session = {
      user: {
        id: "demo-user-123456789",
        discordId: "123456789123456789",
        username: "Demo User",
        name: "Demo User",
        image: "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } else {
    // For normal requests, get real session
    session = await auth.api.getSession({
      headers: fromNodeHeaders(opts.req.headers),
    });
  }

  // Extract client IP if available in the request
  const clientIp =
    (opts.req as any).clientIp ||
    (opts.req as any).ip ||
    (opts.req.headers["x-forwarded-for"] as string)?.split(",").shift() ||
    opts.req.socket?.remoteAddress ||
    "";

  // Extract admin JWT from cookie
  let adminUser: AdminPayload | null = null;
  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const token = cookies["_vadmin_token"];
    if (token && env.TOKEN_SECRET_KEY) {
      adminUser = verifyAdminJwt(token, env.TOKEN_SECRET_KEY);
    }
  } catch {}

  return {
    session,
    discordId: session?.user.discordId,
    db: prisma,
    req: {
      ip: clientIp,
      clientIp,
    },
    res: (opts as CreateExpressContextOptions).res ?? null,
    adminUser,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
