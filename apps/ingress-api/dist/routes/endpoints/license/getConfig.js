import { mergeRawConfig } from "@vexonac/config";
import prisma from "../../../lib/prisma";
export const getConfigHandler = async (req, res) => {
    try {
        const licenseKey = req.params.licenseKey;
        const clientIp = req.clientIp;
        if (!licenseKey || licenseKey.trim().length === 0) {
            res.status(400).json({
                error: "License key is required in URL",
                code: 400,
            });
            return;
        }
        const license = await prisma.license.findUnique({
            where: {
                licenseKey: licenseKey.trim(),
                serverIp: clientIp,
                expiresAt: { gt: new Date() },
                isBanned: false,
            },
            select: {
                configuration: true,
            },
        });
        if (!license) {
            res.status(400).json({ error: "Invalid license data" });
            return;
        }
        const configuration = mergeRawConfig(license.configuration || {});
        res.status(200).json({
            success: true,
            configuration: configuration,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(400).json({ error: "Invalid request data" });
    }
};
