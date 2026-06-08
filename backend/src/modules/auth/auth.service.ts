import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { allowDemoDefaultPassword } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/auth.types';
import { mapUserToResponse } from '../users/user-response.mapper';
import type { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

export const ADMIN_ROLE_NAMES = new Set(['Admin', 'System Admin']);
const DEMO_DEFAULT_PASSWORD = 'requestflow';

export type LoginResult = {
  user: ReturnType<typeof mapUserToResponse>;
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
      throw new UnauthorizedException('Invalid email or password');
    }

    const stored = user.passwordHash?.trim();
    if (!stored) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwords.verify(password, stored);
    if (!valid) {
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
        throw new ForbiddenException('Admin access required');
      }
    }

    const profile = mapUserToResponse(user);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleName,
      departmentName: profile.departmentName,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const expiresInSec =
      parseInt(process.env.JWT_EXPIRES_IN?.trim() ?? '', 10) || 28800;

    return { user: profile, accessToken, expiresIn: expiresInSec };
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
    return mapUserToResponse(user);
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
