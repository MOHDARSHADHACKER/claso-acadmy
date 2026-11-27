// import { Request, Response, NextFunction } from "express";
// import { env } from "../../config/env";
// import { authService } from "./auth.service";
// export const authController = {
//   async login(req: Request, res: Response, next: NextFunction) { try { const { role, identifier, password } = req.body; const result = await authService.login(role, identifier, password); res.cookie(env.JWT_COOKIE_NAME, result.token, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }); res.json({ user: result.user }); } catch (err) { next(err); } },
//   async me(req: Request, res: Response, next: NextFunction) { try { const user = await authService.me(req.user!.id); res.json({ user }); } catch (err) { next(err); } },
//   async logout(_req: Request, res: Response) { res.clearCookie(env.JWT_COOKIE_NAME); res.json({ ok: true }); },
//   async changePassword(req: Request, res: Response, next: NextFunction) { try { await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword); res.json({ message: "Password updated" }); } catch (err) { next(err); } },
//   async resetPassword(req: Request, res: Response, next: NextFunction) { try { await authService.adminResetPassword(req.user!.id, req.body.userId, req.body.newPassword); res.json({ message: "User password reset" }); } catch (err) { next(err); } },
// };
import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, identifier, password } = req.body;
      const result = await authService.login(role, identifier, password);
      const isProd = env.NODE_ENV === "production";

      res.cookie(env.JWT_COOKIE_NAME, result.token, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ user: result.user });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.me(req.user!.id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response) {
    const isProd = env.NODE_ENV === "production";

    res.clearCookie(env.JWT_COOKIE_NAME, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });

    res.json({ ok: true });
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ message: "Password updated" });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.adminResetPassword(
        req.user!.id,
        req.body.userId,
        req.body.newPassword
      );
      res.json({ message: "User password reset" });
    } catch (err) {
      next(err);
    }
  },
};