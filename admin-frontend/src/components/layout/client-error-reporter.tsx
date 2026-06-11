"use client";

import { useEffect } from "react";
import { reportClientRuntimeError } from "@/lib/report-client-error";

export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientRuntimeError(
        "JS_ERROR",
        event.message || "Uncaught script error",
        event.error instanceof Error ? event.error.stack : undefined,
      );
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      reportClientRuntimeError("UNHANDLED_REJECTION", message, stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
