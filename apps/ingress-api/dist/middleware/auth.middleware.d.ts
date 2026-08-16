import { NextFunction, Request, Response } from "express";
declare global {
    namespace Express {
        interface Request {
            clientIp?: string;
        }
    }
}
export declare const validateUserAgent: (req: Request, res: Response, next: NextFunction) => void;
export declare const getClientIp: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateServerAuthorization: (req: Request, res: Response, next: NextFunction) => void;
export declare const apiMiddleware: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const serverMiddleware: ((req: Request, res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=auth.middleware.d.ts.map