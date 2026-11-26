import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type UserRole = "admin" | "teacher" | "student";
export interface JwtPayloadUser { id: number; role: UserRole; name: string; mustChangePw: boolean; }
declare global { namespace Express { interface Request { user?: JwtPayloadUser; } } }

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.JWT_COOKIE_NAME];
  if (!token) { res.status(401).json({ code: "UNAUTHENTICATED", message: "Authentication required" }); return; }
  try { req.user = jwt.verify(token, env.JWT_SECRET) as JwtPayloadUser; next(); }
  catch { res.status(401).json({ code: "INVALID_TOKEN", message: "Session expired or invalid" }); }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ code: "UNAUTHENTICATED", message: "Authentication required" }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ code: "FORBIDDEN", message: "Insufficient role permissions" }); return; }
    next();
  };
}
