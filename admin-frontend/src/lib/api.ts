import axios from "axios";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { reportClientApiFailure } from "@/lib/report-client-error";
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
    if (axios.isAxiosError(error)) {
      const url = error.config?.url ?? "";
      if (error.response?.status === 401 && !url.includes("/auth/login")) {
        clearSession();
        invalidateApiCache();
        emitSessionExpired();
      }
      reportClientApiFailure(error);
    }
    return Promise.reject(error);
  },
);
