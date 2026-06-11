import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId?: string };

/** Correlates logs, API error bodies, and admin system events. */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header('x-request-id')?.trim();
  const requestId =
    incoming && incoming.length <= 64 && !incoming.includes('*')
      ? incoming
      : randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
