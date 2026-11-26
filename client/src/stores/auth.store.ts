import { create } from "zustand";

export type UserRole = "admin" | "teacher" | "student";
export interface AuthUser { id: number; role: UserRole; name: string; email?: string | null; admissionNo?: string | null; mustChangePw?: boolean; }
interface AuthState { user: AuthUser | null; initialized: boolean; setUser: (u: AuthUser | null) => void; setInitialized: (v: boolean) => void; clearUser: () => void; }
export const useAuthStore = create<AuthState>((set) => ({ user: null, initialized: false, setUser: (user) => set({ user }), setInitialized: (initialized) => set({ initialized }), clearUser: () => set({ user: null }) }));
