import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../../common/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { DevLoginDto, StaffLoginDto } from './dto/login.dto';

function isAdminOnly(value?: string): boolean {
  return value === 'true' || value === '1';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Zamtel staff login. Forwards { gn, password } to the central staff auth
   * service, mirrors the payload locally, and issues our own JWT.
   */
  @Public()
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() body: StaffLoginDto, @Query('adminOnly') adminOnly?: string) {
    return this.authService.loginWithStaff(body.gn, body.password, {
      adminOnly: isAdminOnly(adminOnly),
    });
  }

  /**
   * Dev-only login by email (no password). Disabled in production. Used for
   * demo accounts and offline local development.
   */
  @Public()
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @Post('dev-login')
  devLogin(@Body() body: DevLoginDto, @Query('adminOnly') adminOnly?: string) {
    return this.authService.loginAsDev(body.email, {
      adminOnly: isAdminOnly(adminOnly),
    });
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user.id);
  }
}
