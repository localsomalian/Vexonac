import { z } from "zod";
import prisma from "../../../lib/prisma";
import { r2DeleteService } from "../../../lib/r2-delete-service";
import licenseService from "../../../services/license.service";
const schema = z.object({
    banId: z.string().min(1, "Ban ID is required"),
    unbannedBy: z.string().optional(),
});
export const unbanPlayer = async (req, res) => {
    const licenseKey = req.params.licenseKey;
    const clientIp = req.clientIp;
    const body = schema.parse(req.body);
    const { banId, unbannedBy } = body;
    const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
    if (!valid || !license) {
        res.status(400).json({
            error: "Error validating server authentication",
        });
        return;
    }
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 2. Find the ban record
            const ban = await tx.ban.findUnique({
                where: {
                    licenseId_banId: {
                        licenseId: license.id,
                        banId,
                    },
                },
                include: {
                    identifiers: true,
                },
            });
            if (!ban) {
                throw new Error("BAN_NOT_FOUND");
            }
            // 3. Delete all banned identifiers associated with this ban
            await tx.bannedIdentifier.deleteMany({
                where: {
                    banId: ban.id,
                },
            });
            // 4. Delete the ban record
            await tx.ban.delete({
                where: {
                    id: ban.id,
                },
            });
            await tx.serverLog.create({
                data: {
                    licenseId: license.id,
                    serverType: "UNBAN_PLAYER",
                    details: { banId: banId, unbannedBy: unbannedBy },
                },
            });
            return {
                success: true,
                unban: {
                    banId,
                    reason: ban.reason,
                    evidenceUrl: ban.evidenceUrl,
                    identifiersUnbanned: ban.identifiers.length,
                    unbannedBy,
                    unbannedAt: new Date(),
                },
            };
        });
        // Delete evidence from R2 storage if it exists
        if (result.unban.evidenceUrl && result.unban.evidenceUrl.includes('r2.vexonac.com') && r2DeleteService) {
            try {
                const deleteResult = await r2DeleteService.deleteByUrls(result.unban.evidenceUrl);
                if (deleteResult.successCount > 0) {
                    console.log(`Successfully deleted evidence file for ban ${banId}`);
                }
                else {
                    console.warn(`Failed to delete evidence file for ban ${banId}`);
                }
            }
            catch (error) {
                console.error(`Failed to delete evidence file for ban ${banId}:`, error);
                // Don't affect the response as unban was successful
            }
        }
        res.status(200).json(result);
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
