import { logger } from "../lib/logger";
import prisma from "../lib/prisma";
function isCloudflarePseudoIPv4(ip) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => isNaN(n)))
        return false;
    if (!parts[0] || !parts[1] || !parts[2] || !parts[3])
        return false;
    // Class D: 224.0.0.0 - 239.255.255.255
    if (parts[0] >= 224 && parts[0] <= 239)
        return true;
    // Class E: 240.0.0.0 - 255.255.255.254
    if (parts[0] >= 240 && parts[0] <= 255)
        return true;
    // TEST-NET-1: 192.0.2.0/24
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2)
        return true;
    // TEST-NET-2: 198.51.100.0/24
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100)
        return true;
    // TEST-NET-3: 203.0.113.0/24
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113)
        return true;
    return false;
}
class LicenseService {
    async validateServer(licenseKey, clientIp) {
        try {
            // Check if the key exists at all (ignore expiry/ban for diagnostic)
            const rawLicense = await prisma.license.findUnique({
                where: { licenseKey },
                select: { id: true, serverIp: true, isBanned: true, expiresAt: true },
            });
            if (!rawLicense) {
                logger.warn("[Validation] License key not found in database — key may not have been redeemed yet", { licenseKey: licenseKey.slice(0, 8) + "...", clientIp });
                return;
            }
            if (rawLicense.isBanned) {
                logger.warn("[Validation] License is banned", { licenseId: rawLicense.id, clientIp });
                return;
            }
            if (rawLicense.expiresAt <= new Date()) {
                logger.warn("[Validation] License is expired", { licenseId: rawLicense.id, expiresAt: rawLicense.expiresAt, clientIp });
                return;
            }
            // First connection — no IP registered yet, auto-set it
            if (!rawLicense.serverIp) {
                await prisma.license.update({
                    where: { id: rawLicense.id },
                    data: { serverIp: clientIp },
                });
                logger.info("[Validation] First connection — registered server IP", { licenseId: rawLicense.id, clientIp });
                return rawLicense;
            }
            // Subsequent connections — validate IP matches (skip Cloudflare pseudo-IPs)
            if (!isCloudflarePseudoIPv4(clientIp) &&
                !isCloudflarePseudoIPv4(rawLicense.serverIp) &&
                rawLicense.serverIp !== clientIp) {
                logger.warn("[Validation] IP mismatch — use Reset IP on the dashboard", { licenseId: rawLicense.id, registered: rawLicense.serverIp, connecting: clientIp });
                return;
            }
            return rawLicense;
        }
        catch (error) {
            logger.error("Error validating server", { error, licenseKey, clientIp });
            return;
        }
    }
    async validateServerQuery(licenseKey, clientIp) {
        try {
            if (!licenseKey || licenseKey.trim().length === 0) {
                return {
                    valid: false,
                };
            }
            if (!clientIp || clientIp.trim().length === 0) {
                return {
                    valid: false,
                };
            }
            const license = await prisma.license.findUnique({
                where: {
                    licenseKey,
                    isBanned: false,
                    expiresAt: {
                        gt: new Date(),
                    },
                    serverIp: clientIp,
                },
                select: {
                    id: true,
                },
            });
            return {
                valid: license !== null,
                license: license,
            };
        }
        catch (error) {
            logger.error("Error validating server query", { error, licenseKey, clientIp });
            return {
                valid: false,
            };
        }
    }
}
export default new LicenseService();
