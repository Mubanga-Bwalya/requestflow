import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { isAuthenticatedAdmin } from '../throttle-helpers';

/**
 * Rate limits abusive traffic while exempting authenticated admins from caps
 * (bulk user/config work in the admin portal).
 * Registered after JwtAuthGuard so request.user is available.
 */
@Injectable()
export class ConditionalThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (process.env.E2E_DISABLE_THROTTLE === 'true') {
      return true;
    }
    return isAuthenticatedAdmin(context);
  }
}
