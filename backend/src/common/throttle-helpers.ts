import type { ExecutionContext } from '@nestjs/common';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';
import type { RequestUser } from './auth.types';
import { ADMIN_ROLE_NAMES } from '../modules/auth/auth.service';

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

export function isAuthenticatedAdmin(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
  const roleName = request.user?.roleName;
  return !!roleName && ADMIN_ROLE_NAMES.has(roleName);
}
