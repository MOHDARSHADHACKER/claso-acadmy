import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore, type UserRole } from "@/stores/auth.store";

export const RequireAuth: React.FC = () => { const { user, initialized } = useAuthStore(); if (!initialized) return <div className="p-6 text-sm">Loading session...</div>; if (!user) return <Navigate to="/login" replace />; return <Outlet />; };
export const RequireRole: React.FC<{ role: UserRole }> = ({ role }) => { const user = useAuthStore((s) => s.user); if (!user) return <Navigate to="/login" replace />; if (user.role !== role) return <Navigate to="/403" replace />; return <Outlet />; };
