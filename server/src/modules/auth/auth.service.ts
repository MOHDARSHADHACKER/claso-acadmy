import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import type { JwtPayloadUser, UserRole } from "../../middleware/auth.middleware";
import { authRepository } from "./auth.repository";
export const authService = {
  async login(role: UserRole, identifier: string, password: string) {
    const user = await authRepository.findByIdentifier(role, identifier);
    if (!user || !user.is_active) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials or inactive account");
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    const payload: JwtPayloadUser = { id: user.id, role: user.role, name: user.name, mustChangePw: Boolean(user.must_change_pw) };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "24h" });
    return { token, user: { id: user.id, role: user.role, name: user.name, email: user.email, admissionNo: user.admission_no, mustChangePw: Boolean(user.must_change_pw) } };
  },
  async me(userId: number) { const user = await authRepository.findById(userId); if (!user) throw new AppError(401, "UNAUTHENTICATED", "User not found"); return { id: user.id, role: user.role, name: user.name, email: user.email, admissionNo: user.admission_no, mustChangePw: Boolean(user.must_change_pw) }; },
  async changePassword(userId: number, currentPassword: string, newPassword: string) { const user = await authRepository.findById(userId); if (!user) throw new AppError(404, "NOT_FOUND", "User not found"); const valid = await bcrypt.compare(currentPassword, user.password_hash); if (!valid) throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect"); const hash = await bcrypt.hash(newPassword, 12); await authRepository.updatePassword(userId, hash, false); await authRepository.writeAudit(userId, "CHANGE_PASSWORD", "users", String(userId), { mustChangePw: false }); },
  async adminResetPassword(adminId: number, targetUserId: number, newPassword: string) { const target = await authRepository.findById(targetUserId); if (!target) throw new AppError(404, "NOT_FOUND", "Target user not found"); const hash = await bcrypt.hash(newPassword, 12); await authRepository.updatePassword(targetUserId, hash, true); await authRepository.writeAudit(adminId, "ADMIN_RESET_PASSWORD", "users", String(targetUserId), { mustChangePw: true }); },
};
