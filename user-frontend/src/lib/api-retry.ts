import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const RETRY_DELAYS_MS = [400, 800, 1600];

type RetryConfig = InternalAxiosRequestConfig & { _retryCount?: number };

export function isRetryableNetworkError(error: AxiosError): boolean {
  if (error.response) return false;
  if (error.code === "ERR_CANCELED" || error.name === "CanceledError") return false;
  return true;
}

/** Retry idempotent GET requests when the API is temporarily unreachable (e.g. cold start). */
export async function retryGetOnNetworkError<T>(
  api: { request: (config: InternalAxiosRequestConfig) => Promise<T> },
  error: AxiosError,
): Promise<T> {
  const config = error.config as RetryConfig | undefined;
  if (!config || !isRetryableNetworkError(error)) {
    return Promise.reject(error);
  }

  const method = (config.method ?? "get").toLowerCase();
  if (method !== "get") return Promise.reject(error);

  const retryCount = config._retryCount ?? 0;
  if (retryCount >= RETRY_DELAYS_MS.length) return Promise.reject(error);

  config._retryCount = retryCount + 1;
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[retryCount]));
  if (config.signal?.aborted) return Promise.reject(error);

  return api.request(config);
}
