// import axios, { AxiosError } from "axios";
// import { useAuthStore } from "@/stores/auth.store";

// export interface ApiError { code: string; message: string; fieldErrors?: Record<string, string>; }
// export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1", withCredentials: true });
// apiClient.interceptors.response.use((res) => res, (error: AxiosError<ApiError>) => { const status = error.response?.status; if (status === 401 && !error.config?.url?.includes("/auth/me")) { useAuthStore.getState().clearUser(); if (window.location.pathname !== "/login") window.location.assign("/login?expired=1"); } else if (status === 403 && window.location.pathname !== "/403") { window.location.assign("/403"); } return Promise.reject(error.response?.data ?? { code: "NETWORK_ERROR", message: error.message || "Request failed" }); });



import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth.store";

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    if (status === 401 && !error.config?.url?.includes("/auth/me")) {
      useAuthStore.getState().clearUser();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login?expired=1");
      }
    } else if (status === 403 && window.location.pathname !== "/403") {
      window.location.assign("/403");
    }
    return Promise.reject(
      error.response?.data ?? {
        code: "NETWORK_ERROR",
        message: error.message || "Request failed",
      }
    );
  }
);