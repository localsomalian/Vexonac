import { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../../../lib/env";
import prisma from "../../../lib/prisma";

const schema = z.object({
  reason: z.string().min(1, "reason is required"),
  details: z.string().min(1, "details is required"),
  version: z.string().min(1, "version is required"),
});

const retardHandler: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;
  const { reason, details, version } = schema.parse(req.body);

  await prisma.license.update({
    where: {
      licenseKey: (licenseKey || "unknown").trim(),
    },
    data: {
      isBanned: true,
      banReason: reason,
    },
  });

  const hookObject = {
    content: "@everyone",
    username: "Anti Crackar",
    tts: true,
    embeds: [
      {
        title: "VexonAC Crack Attempt",
        type: "rich",
        description: `**License: ${licenseKey || "unknown"}\nIP: ${clientIp}\nVersion: ${version}\nReason: ${reason}\nDetails: \`\`\`${details}\`\`\`**`,
        color: parseInt("FFFFFF", 16),
        timestamp: new Date().toISOString(),
      },
    ],
  };

  fetch(env.ANTI_CRACK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(hookObject),
  });

  res.status(404).send();
};

export default retardHandler;

