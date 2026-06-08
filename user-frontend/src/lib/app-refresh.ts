export type AppRefreshScope =
  | "notifications"
  | "workspace"
  | "requests"
  | "assignments"
  | "all";

type Listener = (scope: AppRefreshScope) => void;

const listeners = new Set<Listener>();

export function emitAppRefresh(scope: AppRefreshScope = "all"): void {
  listeners.forEach((listener) => listener(scope));
}

export function subscribeAppRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function matchesRefreshScope(
  eventScope: AppRefreshScope,
  watchedScopes: AppRefreshScope[],
): boolean {
  return (
    eventScope === "all" ||
    watchedScopes.includes("all") ||
    watchedScopes.includes(eventScope)
  );
}
