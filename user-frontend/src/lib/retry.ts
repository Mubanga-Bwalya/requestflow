import axios from "axios";

/**
 * Whether an API failure is transient and worth retrying. We retry only on
 * conditions that are expected to clear on their own — a network blip, a request
 * timeout, or a 5xx while the backend is (re)starting. Auth/permission/not-found
 * and validation errors are definitive and surfaced immediately.
 *
 * Aborted requests (navigation/unmount) are never "transient" — the caller
 * cancelled them on purpose.
 */
export function isTransientError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (err.code === "ERR_CANCELED") return false;
  const status = err.response?.status;
  if (status === undefined) return true; // no HTTP response: network error / timeout
  return status >= 500;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Run `fn`, retrying transient failures with exponential backoff. Definitive
 * errors and aborts reject immediately. Default: up to 3 retries at
 * 500ms → 1s → 2s, so a momentary backend outage recovers without the user
 * seeing an error, while a real failure still surfaces after ~3.5s.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const { retries = 3, baseDelayMs = 500, signal } = opts;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (signal?.aborted || attempt >= retries || !isTransientError(err)) {
        throw err;
      }
      await sleep(baseDelayMs * 2 ** attempt, signal);
      attempt += 1;
    }
  }
}
