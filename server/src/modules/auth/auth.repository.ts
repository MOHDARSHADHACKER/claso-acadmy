import { db } from "../../config/db";
import type { UserRole } from "../../middleware/auth.middleware";
export interface UserRecord { id: number; role: UserRole; name: string; email: string | null; phone: string | null; admission_no: string | null; password_hash: string; is_active: boolean; must_change_pw: boolean; }
export const authRepository = {
  async findByIdentifier(role: UserRole, identifier: string): Promise<UserRecord | undefined> { return role === "student" ? db<UserRecord>("users").where({ role: "student", admission_no: identifier }).first() : db<UserRecord>("users").where({ role, email: identifier }).first(); },
  async findById(id: number): Promise<UserRecord | undefined> { return db<UserRecord>("users").where({ id }).first(); },
  async updatePassword(userId: number, passwordHash: string, mustChangePw: boolean): Promise<void> { await db("users").where({ id: userId }).update({ password_hash: passwordHash, must_change_pw: mustChangePw }); },
  async writeAudit(actorId: number | null, action: string, entity: string, entityId: string, newValue: unknown): Promise<void> { await db("audit_log").insert({ actor_id: actorId, action, entity, entity_id: entityId, new_value: JSON.stringify(newValue) }); },
};
