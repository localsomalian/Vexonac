import { z } from "zod";
import prisma from "../../../lib/prisma";
import { r2DeleteService } from "../../../lib/r2-delete-service";
import { filterR2Urls } from "@vexonac/utils";
import licenseService from "../../../services/license.service";
const schema = z.preprocess((input) => {
    return Array.isArray(input) || typeof input !== "object" ? {} : input;
}, z.object({
    unbannedBy: z.string().optional(),
}));
export const unbanAllPlayers = async (req, res) => {
    const licenseKey = req.params.licenseKey;
    const clientIp = req.clientIp;
    const body = schema.parse(req.body);
    const { unbannedBy } = body;
    const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
    if (!valid || !license) {
        res.status(400).json({
            error: "Error validating server authentication",
        });
        return;
    }
    try {
        const result = await prisma.$transaction(async (tx) => {
            // First, get all evidence URLs before deleting bans
            const bansWithEvidence = await tx.ban.findMany({
                where: {
                    licenseId: license.id,
                },
                select: {
                    evidenceUrl: true,
                },
            });
            const unbans = await tx.ban.deleteMany({
                where: {
                    licenseId: license.id,
                },
            });
            await tx.serverLog.create({
                data: {
                    licenseId: license.id,
                    serverType: "UNBAN_ALL",
                    details: { unbannedBy: unbannedBy },
                },
            });
            return {
                success: true,
                unbans: unbans.count,
                unbannedBy,
                unbannedAt: new Date(),
                evidenceUrls: bansWithEvidence.map((ban) => ban.evidenceUrl).filter(Boolean),
            };
        });
        // Delete evidence files from R2 storage
        const r2Urls = filterR2Urls(result.evidenceUrls);
        if (r2Urls.length > 0 && r2DeleteService) {
            try {
                const deleteResult = await r2DeleteService.deleteByUrls(r2Urls);
                if (deleteResult.failureCount > 0) {
                    console.warn(`Failed to delete ${deleteResult.failureCount} evidence files`);
                }
            }
            catch (error) {
                console.error(`Failed to delete evidence files for unban all:`, error);
                // Don't throw error here as the unban was successful
            }
        }
        // Remove evidenceUrls from response
        const { evidenceUrls, ...responseData } = result;
        res.status(200).json(responseData);
    }
    catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case "BAN_NOT_FOUND":
                    res.status(404).json({ error: "Ban not found", code: 404 });
                    return;
            }
        }
        res.status(500).json({ error: "Internal server error", code: 500 });
    }
};
