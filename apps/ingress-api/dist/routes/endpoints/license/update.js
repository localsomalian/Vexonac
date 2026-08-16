import { z } from "zod";
import fileService from "../../../services/file.service";
import licenseService from "../../../services/license.service";
const schema = z.object({
    fileName: z.string().min(1, "file name to update is required"),
    beta: z
        .union([z.boolean(), z.string()])
        .optional()
        .transform((val) => {
        if (typeof val === "string") {
            return val.toLowerCase() === "true";
        }
        return val;
    }),
});
const updateHandler = async (req, res) => {
    try {
        const licenseKey = req.params.licenseKey;
        const clientIp = req.clientIp;
        const { fileName, beta } = schema.parse(req.query);
        const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
        if (!valid || !license) {
            res.status(400).json({
                error: "Error validating server authentication",
            });
            return;
        }
        const fileContent = await fileService.getFile(fileName, beta);
        if (!fileContent) {
            res.status(400).json({ error: "Invalid file name" });
            return;
        }
        res.status(200).json({
            success: true,
            file: fileContent,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(400).json({ error: "Invalid request data" });
    }
};
export default updateHandler;
