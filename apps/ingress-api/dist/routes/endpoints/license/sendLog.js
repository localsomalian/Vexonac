import { z } from "zod";
import { logger } from "../../../lib/logger";
import prisma from "../../../lib/prisma";
import licenseService from "../../../services/license.service";
const schema = z.object({
    type: z.enum(["EXPLOSION", "ENTITY_CREATE", "KILL"]),
    playerLicense: z.string().min(1, "Player license is required"),
    playerId: z.string().min(1, "Player ID is required").optional(),
    details: z
        .union([
        z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
        z.array(z.string()),
    ])
        .optional(),
});
export const sendLogHandler = async (req, res) => {
    try {
        const validatedData = schema.parse(req.body);
        const { type, playerLicense, playerId, details } = validatedData;
        const licenseKey = req.params.licenseKey;
        const clientIp = req.clientIp;
        const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
        if (!valid || !license) {
            res.status(400).json({
                error: "Error validating server authentication",
            });
            return;
        }
        await prisma.serverLog.create({
            data: {
                licenseId: license.id,
                serverType: type,
                details: details || {},
                playerLicense: playerLicense,
                playerId: playerId || null,
            },
        });
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: "Invalid request data",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        logger.error("Server Log Error", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            clientIp: req.clientIp,
        });
        res.status(500).json({
            error: "Internal server error",
            message: "An unexpected error occurred during server log sending",
        });
    }
};
