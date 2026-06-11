import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import type { RequestUser } from '../../common/auth.types';
import { AdminService } from './admin.service';
import { ClientEventDto } from '../../common/diagnostics/client-event.dto';

/** Higher read cap for admin aggregate pages (still rate-limited). */
@Throttle({ default: { limit: 600, ttl: 60_000 } })
@Controller('admin')
@UseGuards(AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(@Query('activityLimit') activityLimit?: string) {
    const n = activityLimit ? parseInt(activityLimit, 10) : undefined;
    return this.adminService.getDashboard(
      n !== undefined && !Number.isNaN(n)
        ? Math.min(Math.max(n, 1), 50)
        : undefined,
    );
  }

  @Get('reports')
  getReports(@Query('departmentName') departmentName?: string) {
    return this.adminService.getReports(departmentName);
  }

  @Get('activity')
  getActivity(@Query('limit') limit?: string, @Query('page') page?: string) {
    if (page !== undefined) {
      return this.adminService.getActivityPaginated(page, limit);
    }
    const n = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getActivity(Number.isNaN(n) ? 10 : n);
  }

  @Get('system-events')
  getSystemEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
  ) {
    return this.adminService.getSystemEvents(page, limit, level);
  }

  @Post('client-events')
  @Throttle({ writes: { limit: 30, ttl: 60_000 } })
  recordClientEvent(
    @Req() req: Request & { user: RequestUser },
    @Body() dto: ClientEventDto,
  ) {
    return this.adminService.recordClientEvent(req.user.id, {
      ...dto,
      portal: 'admin',
    });
  }
}
