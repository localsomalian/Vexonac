import { Router } from "express";
import { serverMiddleware } from "../middleware/auth.middleware";
import { sendEvent } from "./endpoints/server/sendEvent";
const serverRouter = Router();
// Apply server middleware
serverRouter.use(serverMiddleware);
// Server routes (note: these will be mounted at /api/server so we don't need /server prefix here)
serverRouter.post("/:serverId/event", sendEvent);
export { serverRouter };
