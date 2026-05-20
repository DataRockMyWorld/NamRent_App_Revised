import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Inject access token on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silent token refresh on 401
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          const { refreshToken } = useAuthStore.getState();
          if (!refreshToken) throw new Error("No refresh token");

          refreshPromise = axios
            .post<{ access: string; refresh: string }>("/api/accounts/token/refresh/", {
              refresh: refreshToken,
            })
            .then((res) => {
              const { access, refresh } = res.data;
              useAuthStore.getState().setTokens(access, refresh);
              return access;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccess = await refreshPromise;
        if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
