import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import type { Request, Response } from "express";
import { appRouter } from "../routers/index";
import { createContext } from "./context";

/**
 * Helper function to create a tRPC caller with proper context
 */
export async function createTRPCCaller(req: Request, res: Response): Promise<TRPCCaller> {
  const context = await createContext({ req, res });
  return appRouter.createCaller(context);
}

/**
 * Higher-order function to wrap tRPC procedure calls with error handling
 */
export function withTRPCErrorHandling<T>(procedureCall: () => Promise<T>) {
  return async (req: Request, res: Response) => {
    try {
      const result = await procedureCall();
      res.json(result);
    } catch (cause) {
      if (cause instanceof TRPCError) {
        const httpStatusCode = getHTTPStatusCodeFromError(cause);
        res.status(httpStatusCode).json({
          error: {
            message: cause.message,
            code: cause.code,
          },
        });
        return;
      }

      console.error("Unexpected error:", cause);
      res.status(500).json({
        error: { message: "Internal server error" },
      });
    }
  };
}

/**
 * Helper to safely call any tRPC procedure from an Express route
 */
export async function callTRPCProcedure<T>(
  req: Request,
  res: Response,
  procedureCall: (
    caller: ReturnType<typeof appRouter.createCaller>
  ) => Promise<T>
): Promise<void> {
  try {
    const caller = await createTRPCCaller(req, res);
    const result = await procedureCall(caller);
    res.json(result);
  } catch (cause) {
    if (cause instanceof TRPCError) {
      const httpStatusCode = getHTTPStatusCodeFromError(cause);
      res.status(httpStatusCode).json({
        error: {
          message: cause.message,
          code: cause.code,
        },
      });
      return;
    }

    console.error("Unexpected error:", cause);
    res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
}

/**
 * Utility to validate UUID parameters
 */
export function validateUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export type TRPCCaller = ReturnType<typeof appRouter.createCaller>;
