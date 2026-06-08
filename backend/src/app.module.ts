import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { SystemEventsModule } from './common/system-events/system-events.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { routeUsesNamedThrottler } from './common/throttle-helpers';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RequestTemplatesModule } from './modules/request-templates/request-templates.module';
import { RequestsModule } from './modules/requests/requests.module';
import { RolesModule } from './modules/roles/roles.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AccessPolicyModule } from './common/access-policy.module';
import { CacheModule } from './common/cache/cache.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ttl: 60_000, limit: 200 },
        {
          name: 'login',
          ttl: 60_000,
          limit: 5,
          skipIf: (ctx) => !routeUsesNamedThrottler(ctx, 'login'),
        },
        {
          name: 'writes',
          ttl: 60_000,
          limit: 60,
          skipIf: (ctx) => !routeUsesNamedThrottler(ctx, 'writes'),
        },
      ],
    }),
    PrismaModule,
    CacheModule,
    SystemEventsModule,
    AccessPolicyModule,
    HealthModule,
    AuthModule,
    DepartmentsModule,
    RequestTemplatesModule,
    UsersModule,
    RolesModule,
    RequestsModule,
    AssignmentsModule,
    NotificationsModule,
    SystemSettingsModule,
    AdminModule,
    WorkspaceModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
