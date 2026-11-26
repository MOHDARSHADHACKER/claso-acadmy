import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) { fieldErrors[issue.path.join(".") || "root"] = issue.message; }
      res.status(400).json({ code: "VALIDATION_ERROR", message: "Invalid request payload", fieldErrors });
      return;
    }
    req.body = parsed.data;
    next();
  };
}
