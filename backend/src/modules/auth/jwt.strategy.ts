import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { resolveJwtSecret } from '../../config/jwt-secret';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload, RequestUser } from '../../common/auth.types';

type CachedAuthUser = RequestUser & { isActive: boolean };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(),
    });
  }

  /**
   * Authoritative identity: always load role and department from DB.
   * JWT role claims are not trusted (prevents demoted admins retaining access).
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const cacheKey = CacheKeys.authUser(payload.sub);
    const cached = await this.cache.getJson<CachedAuthUser>(cacheKey);
    if (cached?.isActive) {
      return {
        id: cached.id,
        email: cached.email,
        roleName: cached.roleName,
        departmentName: cached.departmentName,
        departmentId: cached.departmentId,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const requestUser: RequestUser = {
      id: user.id,
      email: user.email,
      roleName: user.role?.name ?? null,
      departmentName: user.department?.name ?? null,
      departmentId: user.department?.id ?? null,
    };

    await this.cache.setJson(
      cacheKey,
      { ...requestUser, isActive: true },
      CacheTtl.authUserSeconds,
    );

    return requestUser;
  }
}
