import { env } from "../lib/env";
import { logger } from "../lib/logger";
export const validateUserAgent = (req, res, next) => {
    const userAgent = req.headers["user-agent"];
    if (userAgent !== env.FIVEM_USER_AGENT) {
        logger.warn("Invalid user agent detected", {
            ip: req.clientIp || req.ip,
            userAgent,
            path: req.path,
        });
        res.status(667).send();
        return;
    }
    next();
};
export const getClientIp = (req, res, next) => {
    let clientIp = req.ip || "";
    // console.log("req.ip", req.ip);
    // console.log("x-forwarded-for", req.headers["x-forwarded-for"]);
    // console.log("x-real-ip", req.headers["x-real-ip"]);
    // console.log("cf-connecting-ip", req.headers["cf-connecting-ip"]);
    // console.log("cf-pseudo-ipv4", req.headers["cf-pseudo-ipv4"]);
    if (req.headers["cf-connecting-ip"] &&
        typeof req.headers["cf-connecting-ip"] === "string") {
        clientIp = req.headers["cf-connecting-ip"];
    }
    else {
        // If IPv6-mapped IPv4, strip the prefix
        if (clientIp.startsWith("::ffff:")) {
            clientIp = clientIp.replace("::ffff:", "");
        }
        // Optionally, fallback to 127.0.0.1 for localhost
        if (clientIp === "::1") {
            clientIp = "127.0.0.1";
        }
    }
    req.clientIp = clientIp;
    next();
};
export const validateServerAuthorization = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization || authorization !== `Bearer ${env.INGRESS_API_KEY}`) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
};
// Combined middleware for API routes
export const apiMiddleware = [getClientIp, validateUserAgent];
export const serverMiddleware = [getClientIp, validateServerAuthorization];
