import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export class AppError extends Error {
  statusCode: number; code: string; fieldErrors?: Record<string, string>;
  constructor(statusCode: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message); this.statusCode = statusCode; this.code = code; this.fieldErrors = fieldErrors;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) { res.status(err.statusCode).json({ code: err.code, message: err.message, fieldErrors: err.fieldErrors }); return; }
  logger.error({ err }, "Unhandled server error");
  res.status(500).json({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
}
