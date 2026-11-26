import { z } from "zod";
export const loginSchema = z.object({ role: z.enum(["admin", "teacher", "student"]), identifier: z.string().min(2), password: z.string().min(6) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(8) });
export const resetPasswordSchema = z.object({ userId: z.coerce.number().int().positive(), newPassword: z.string().min(8) });
