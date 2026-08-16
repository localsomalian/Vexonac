import express from "express";
import { batchUpdateService } from "../services/batch-update.service";
import { websocketService } from "../services/websocket.service";
const router = express.Router();
router.get("/health", (req, res) => {
    const batchStats = batchUpdateService.getStats();
    const connectedServers = websocketService.getConnectedServersCount();
    const connectedServerIds = websocketService.getConnectedServerIds();
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
            batch: {
                ...batchStats,
                isHealthy: batchStats?.totalErrors < (batchStats?.totalBatches || 0) * 0.1, // Less than 10% error rate
            },
            websocket: {
                connectedServers,
                connectedServerIds,
                isHealthy: true,
            },
        },
    });
});
// Debug endpoint to check server connection
router.get("/debug/server/:serverId", (req, res) => {
    const serverId = req.params.serverId;
    const isConnected = websocketService.isServerConnected(serverId);
    const connectedServers = websocketService.getConnectedServerIds();
    res.json({
        serverId,
        isConnected,
        connectedServers,
        totalConnected: connectedServers.length,
    });
});
export default router;
