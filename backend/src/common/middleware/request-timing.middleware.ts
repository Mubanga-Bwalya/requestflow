import type { NextFunction, Request, Response } from 'express';

const SLOW_MS = 500;

/** Development-only slow request logging (no sensitive data). */
export function requestTimingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.NODE_ENV === 'production') {
    next();
    return;
  }

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms >= SLOW_MS) {
      // eslint-disable-next-line no-console
      console.warn(`[slow] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
}
