import versionService from "../../../services/version.service";
import licenseService from "../../../services/license.service";
export const getLatestVersionHandler = async (req, res) => {
    try {
        const licenseKey = req.params.licenseKey;
        const clientIp = req.clientIp;
        const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
        if (!valid || !license) {
            res.status(400).json({
                error: "Error validating server authentication",
            });
            return;
        }
        const latestVersion = await versionService.getLatestVersionString();
        if (!latestVersion) {
            res.status(404).json({
                error: "Failed to retrieve latest version",
                message: "An unexpected error occurred during authentication",
            });
            return;
        }
        res.status(200).json({
            success: true,
            latestVersion: latestVersion,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(400).json({ error: "Invalid request data" });
    }
};
