import type { NextFunction, Request, Response } from 'express';

const SLOW_MS = Math.max(
  100,
  parseInt(process.env.SLOW_REQUEST_MS ?? '500', 10) || 500,
);

function slowLoggingEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.SLOW_REQUEST_LOGGING_ENABLED === 'true';
}

/** Slow request logging (no sensitive data). Dev always on; prod opt-in via env. */
export function requestTimingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!slowLoggingEnabled()) {
    next();
    return;
  }

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms >= SLOW_MS) {
      const requestId =
        (req.headers['x-request-id'] as string | undefined) ??
        (res.getHeader('x-request-id') as string | undefined);

      console.warn(
        `[slow] ${req.method} ${req.path} ${res.statusCode} ${ms}ms requestId=${requestId ?? '-'}`,
      );
    }
  });
  next();
}
