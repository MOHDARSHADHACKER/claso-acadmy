import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { RequireAuth, RequireRole } from "./guards";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { AdminDashboardPage } from "@/features/academic/pages/AdminDashboardPage";
import { TeacherDashboardPage } from "@/features/academic/pages/TeacherDashboardPage";
import { StudentDashboardPage } from "@/features/academic/pages/StudentDashboardPage";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

const Bootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser, setInitialized } = useAuthStore();
  useEffect(() => {
    apiClient
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setInitialized(true));
  }, [setUser, setInitialized]);
  return <>{children}</>;
};

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Bootstrap>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<div className="p-8 text-center">403 — Access Denied</div>} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>
            <Route element={<RequireRole role="teacher" />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
            </Route>
            <Route element={<RequireRole role="student" />}>
              <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div className="p-8 text-center">404 — Not Found</div>} />
        </Routes>
      </Bootstrap>
    </BrowserRouter>
  </QueryClientProvider>
);
