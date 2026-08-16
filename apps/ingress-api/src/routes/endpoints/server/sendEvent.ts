import { createHmac } from "crypto";
import { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../../../lib/env";
import { WebSocketService } from "../../../services/websocket.service";

const schema = z.object({
  eventName: z.string(),
  data: z.any().optional(),
  shouldAwait: z.boolean().optional().default(true),
});

const SCREENSHOT_TIMEOUT_MS = 45_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const SCREENSHOT_EVENTS = new Set(["screenshotPlayer"]);

// Events that carry enforcement authority — sign these so FiveM can reject forgeries.
const SIGNED_EVENTS = new Set(["banPlayer", "kickPlayer", "screenshotPlayer", "console:command"]);

function signPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (!env.WS_SIGNING_SECRET) return payload;
  const ts = Date.now();
  const sig = createHmac("sha256", env.WS_SIGNING_SECRET)
    .update(ts + ":" + JSON.stringify(payload))
    .digest("hex");
  return { ...payload, _ts: ts, _sig: sig };
}

const socket = WebSocketService.getInstance();

export const sendEvent: RequestHandler = async (req, res) => {
  try {
    const serverId = req.params.serverId as string;
    const body = schema.parse(req.body);
    const { eventName, shouldAwait } = body;
    let { data } = body;

    if (!serverId || serverId.length === 0) {
      res.status(400).json({
        error: "Server ID is required in URL",
        code: 400,
      });
      return;
    }

    if (SIGNED_EVENTS.has(eventName)) {
      data = signPayload(data ?? {});
    }

    const timeoutMs = SCREENSHOT_EVENTS.has(eventName)
      ? SCREENSHOT_TIMEOUT_MS
      : DEFAULT_TIMEOUT_MS;

    const response = await socket.emitToServer(
      serverId,
      eventName,
      data,
      shouldAwait,
      timeoutMs
    );

    res.status(200).json({
      message: "Event sent successfully",
      code: 200,
      response,
    });
  } catch (err: any) {
    const status = err.message === "Socket response timed out" ? 504 : 500;
    res.status(status).json({
      error: err.message || "Internal Server Error",
      code: status,
    });
  }
};
