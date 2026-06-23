import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { resolveJwtSecret } from '../../config/jwt-secret';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { ConditionalThrottlerGuard } from '../../common/guards/conditional-throttler.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { ZamtelStaffAuthService } from './zamtel-auth.service';
import { DevAuthService } from './dev-auth.service';
import { StaffTokenStore } from './staff-token.store';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('JWT_EXPIRES_IN')?.trim();
        const expiresIn = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : 28800;
        return {
          secret: resolveJwtSecret(),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ZamtelStaffAuthService,
    DevAuthService,
    StaffTokenStore,
    JwtStrategy,
    AdminRoleGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ConditionalThrottlerGuard },
  ],
  exports: [AuthService, JwtModule, AdminRoleGuard, StaffTokenStore],
})
export class AuthModule {}
