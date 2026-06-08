export const SESSION_EXPIRED_EVENT = "rf:session-expired";

export function emitSessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}
