import { Router } from "express";
import { getClientIp } from "../middleware/auth.middleware";
import { fivemBanHandler } from "./endpoints/fivem/ban";
import { fivemBansHandler } from "./endpoints/fivem/bans";
import { detectionHandler } from "./endpoints/fivem/detection";
import { hwidHandler } from "./endpoints/fivem/hwid";
import { joinHandler } from "./endpoints/fivem/join";
import { leaveHandler } from "./endpoints/fivem/leave";
import { ragequitHandler } from "./endpoints/fivem/ragequit";
import { rejectedHandler } from "./endpoints/fivem/rejected";
import { fivemScreenshotHandler } from "./endpoints/fivem/screenshot";

const fivemRouter = Router();
fivemRouter.use(getClientIp);

fivemRouter.get("/bans",        fivemBansHandler);
fivemRouter.post("/detection",  detectionHandler);
fivemRouter.post("/ban",        fivemBanHandler);
fivemRouter.post("/hwid",       hwidHandler);
fivemRouter.post("/screenshot", fivemScreenshotHandler);
fivemRouter.post("/join",       joinHandler);
fivemRouter.post("/leave",      leaveHandler);
fivemRouter.post("/ragequit",   ragequitHandler);
fivemRouter.post("/rejected",   rejectedHandler);

export { fivemRouter };
