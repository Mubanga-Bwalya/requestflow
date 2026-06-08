import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../../common/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() body: LoginDto, @Query('adminOnly') adminOnly?: string) {
    return this.authService.login(body, {
      adminOnly: adminOnly === 'true' || adminOnly === '1',
    });
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user.id);
  }
}
