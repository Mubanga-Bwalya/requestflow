import axios from "axios";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { retryGetOnNetworkError } from "@/lib/api-retry";
import { clearSession, getAccessToken } from "@/lib/session";
import { emitSessionExpired } from "@/lib/session-events";
import { invalidateApiCache } from "@/lib/query-cache";
import { reportClientApiFailure } from "@/lib/report-client-error";

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
  async (error) => {
    if (axios.isAxiosError(error)) {
      try {
        return await retryGetOnNetworkError(api, error);
      } catch (retryError) {
        error = retryError;
      }

      const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
      if (axios.isAxiosError(error) && error.response?.status === 401 && !url.includes("/auth/login")) {
        clearSession();
        invalidateApiCache();
        emitSessionExpired();
      }
      if (axios.isAxiosError(error)) {
        reportClientApiFailure(error);
      }
    }
    return Promise.reject(error);
  },
);
