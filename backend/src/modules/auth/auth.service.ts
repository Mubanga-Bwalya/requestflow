import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditLogService } from '../../common/audit-log/audit-log.service';
import { SystemEventsService } from '../../common/system-events/system-events.service';
import { allowDemoDefaultPassword } from '../../config/env';
import { ActivityAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/auth.types';
import { mapUserToResponse } from '../users/user-response.mapper';
import { loadManagedDepartments } from '../../common/department-manager';
import type { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

export const ADMIN_ROLE_NAMES = new Set(['Admin', 'System Admin']);
const DEMO_DEFAULT_PASSWORD = 'requestflow';

export type LoginResult = {
  user: ReturnType<typeof mapUserToResponse> & {
    inboxDepartmentName: string | null;
    managedDepartmentIds: string[];
    managedDepartmentNames: string[];
  };
  accessToken: string;
  /** Token lifetime in seconds */
  expiresIn: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly audit: AuditLogService,
    private readonly systemEvents: SystemEventsService,
  ) {}

  async login(
    dto: LoginDto,
    options?: { adminOnly?: boolean },
  ): Promise<LoginResult> {
    const email = dto.email?.trim();
    const password = dto.password;

    if (!email || !password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, isActive: true },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      void this.systemEvents.record({
        level: 'WARN',
        code: 'LOGIN_FAILED',
        message: `Failed login for ${email}`,
        path: '/auth/login',
        httpMethod: 'POST',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const stored = user.passwordHash?.trim();
    if (!stored) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwords.verify(password, stored);
    if (!valid) {
      void this.systemEvents.record({
        level: 'WARN',
        code: 'LOGIN_FAILED',
        message: `Failed login for ${email}`,
        path: '/auth/login',
        httpMethod: 'POST',
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!this.passwords.isBcryptHash(stored)) {
      const passwordHash = await this.passwords.hashUnsafe(password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    const roleName = user.role?.name ?? null;
    if (options?.adminOnly) {
      if (!roleName || !ADMIN_ROLE_NAMES.has(roleName)) {
        void this.systemEvents.record({
          level: 'WARN',
          code: 'ADMIN_LOGIN_DENIED',
          message: `Non-admin user attempted admin portal sign-in (${user.email}).`,
          path: '/auth/login',
          httpMethod: 'POST',
          userId: user.id,
        });
        throw new ForbiddenException('Admin access required');
      }
    }

    const profile = mapUserToResponse(user);
    const managed = await loadManagedDepartments(this.prisma, user.id);
    const inboxDepartmentName = managed.names[0] ?? null;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleName,
      departmentName: profile.departmentName,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const expiresInSec =
      parseInt(process.env.JWT_EXPIRES_IN?.trim() ?? '', 10) || 28800;

    const portal = options?.adminOnly ? 'admin portal' : 'user portal';
    void this.audit.record({
      userId: user.id,
      action: ActivityAction.USER_SIGNED_IN,
      description: `Signed in to ${portal} (${user.email}).`,
    });

    return {
      user: {
        ...profile,
        inboxDepartmentName,
        managedDepartmentIds: managed.ids,
        managedDepartmentNames: managed.names,
      },
      accessToken,
      expiresIn: expiresInSec,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const managed = await loadManagedDepartments(this.prisma, user.id);
    return {
      ...mapUserToResponse(user),
      inboxDepartmentName: managed.names[0] ?? null,
      managedDepartmentIds: managed.ids,
      managedDepartmentNames: managed.names,
    };
  }

  /** Demo-only; not used in production user provisioning. */
  static defaultPassword(): string | null {
    return allowDemoDefaultPassword() ? DEMO_DEFAULT_PASSWORD : null;
  }

  static resolveNewUserPassword(plain?: string): string {
    const trimmed = plain?.trim();
    if (trimmed) return trimmed;
    const demo = AuthService.defaultPassword();
    if (demo) return demo;
    throw new BadRequestException('Password is required.');
  }
}
