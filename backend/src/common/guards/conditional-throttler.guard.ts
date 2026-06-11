import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Global rate limiting. Login and write routes use named throttlers.
 * Admin portal GET routes use a higher limit via @Throttle on AdminController.
 * Registered after JwtAuthGuard so request.user is available.
 */
@Injectable()
export class ConditionalThrottlerGuard extends ThrottlerGuard {
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    void context;
    return Promise.resolve(process.env.E2E_DISABLE_THROTTLE === 'true');
  }
}
