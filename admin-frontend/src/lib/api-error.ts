import axios from "axios";

type ApiErrorPayload = {
  message?: string | string[];
  errors?: string[];
  requestId?: string;
};

function extractPayload(err: import("axios").AxiosError): ApiErrorPayload | undefined {
  const data = err.response?.data;
  if (!data || typeof data !== "object") return undefined;
  return data as ApiErrorPayload;
}

function formatMessage(msg: string | string[] | undefined): string | null {
  if (Array.isArray(msg)) {
    const parts = msg.map((s) => String(s).trim()).filter(Boolean);
    return parts.length ? parts.join(". ") : null;
  }
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  return null;
}

/** User-facing text from API validation and domain errors (safe in production). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }

  if (!err.response) {
    if (err.code === "ECONNABORTED") {
      return "The request timed out. Please check that the API is running and try again.";
    }
    return "Cannot reach the RequestFlow API. Make sure the backend is running on port 4000.";
  }

  const status = err.response?.status;
  const payload = extractPayload(err);

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return "The item you requested could not be found.";
  }

  const fromErrors = payload?.errors?.filter(Boolean).join(". ");
  const fromMessage = formatMessage(payload?.message);
  const detail = fromErrors || fromMessage;

  if (status === 409) {
    return (
      detail ??
      "This item was updated by someone else. Please refresh and try again."
    );
  }

  if (detail) {
    if (status === 400 || status === 422) {
      return detail;
    }
    if (process.env.NODE_ENV === "development") {
      return detail;
    }
  }

  if (status && status >= 500) {
    const ref = payload?.requestId ? ` Reference: ${payload.requestId}.` : "";
    return `Something went wrong on our side. Please try again.${ref}`;
  }

  return fallback;
}
