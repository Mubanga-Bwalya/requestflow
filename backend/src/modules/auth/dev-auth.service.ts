import {
  Injectable,
  Logger,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { isProduction } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Dev-only login by email (no password). Used when the Zamtel staff service is
 * unreachable (offline local dev), for the demo accounts, and to bootstrap the
 * seed admin before any real staff member has signed in.
 *
 * Hard-disabled in production by an explicit NODE_ENV check.
 */
@Injectable()
export class DevAuthService {
  private readonly logger = new Logger(DevAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Resolve an active user by email and return its id. */
  async authenticate(email: string): Promise<string> {
    if (isProduction()) {
      throw new NotImplementedException(
        'Dev login is disabled in production. Use POST /auth/login instead.',
      );
    }
    const normalized = email?.toLowerCase().trim();
    if (!normalized) {
      throw new UnauthorizedException('Missing email');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalized, mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('Unknown or inactive user');
    }
    this.logger.warn(`[dev-login] issuing session for ${normalized}`);
    return user.id;
  }
}
