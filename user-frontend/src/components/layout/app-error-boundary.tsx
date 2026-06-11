"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportClientRuntimeError } from "@/lib/report-client-error";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientRuntimeError(
      "REACT_ERROR",
      error.message,
      [error.stack, info.componentStack].filter(Boolean).join("\n"),
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-semibold text-brand-dark">Something went wrong</p>
          <p className="mt-2 max-w-md text-sm text-zamtel-muted">
            The error was logged for administrators. Try refreshing the page.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
