import { z } from "zod";
import { WebSocketService } from "../../../services/websocket.service";
const schema = z.object({
    eventName: z.string(),
    data: z.any().optional(),
    shouldAwait: z.boolean().optional().default(true),
});
const socket = WebSocketService.getInstance();
export const sendEvent = async (req, res) => {
    try {
        const serverId = req.params.serverId;
        const body = schema.parse(req.body);
        const { eventName, data, shouldAwait } = body;
        if (!serverId || serverId.length === 0) {
            res.status(400).json({
                error: "Server ID is required in URL",
                code: 400,
            });
            return;
        }
        const response = await socket.emitToServer(serverId, eventName, data, shouldAwait);
        res.status(200).json({
            message: "Event sent successfully",
            code: 200,
            response,
        });
    }
    catch (err) {
        const status = err.message === "Socket response timed out" ? 504 : 500;
        res.status(status).json({
            error: err.message || "Internal Server Error",
            code: status,
        });
    }
};
