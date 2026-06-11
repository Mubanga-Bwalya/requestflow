import type { ExecutionContext } from '@nestjs/common';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';

/** True when the route/class sets `@Throttle({ [name]: ... })`. */
export function routeUsesNamedThrottler(
  context: ExecutionContext,
  name: string,
): boolean {
  const handler = context.getHandler();
  const classRef = context.getClass();
  const key = THROTTLER_LIMIT + name;
  return (
    Reflect.getMetadata(key, handler) !== undefined ||
    Reflect.getMetadata(key, classRef) !== undefined
  );
}
