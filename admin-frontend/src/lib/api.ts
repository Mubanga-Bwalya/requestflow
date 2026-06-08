import axios from "axios";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { clearSession, getAccessToken } from "@/lib/session";
import { emitSessionExpired } from "@/lib/session-events";
import { invalidateApiCache } from "@/lib/query-cache";

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl();
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.includes("/auth/login")) {
        clearSession();
        invalidateApiCache();
        emitSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);
