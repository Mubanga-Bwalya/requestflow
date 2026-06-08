import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { AdminService } from './admin.service';

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
  getActivity(@Query('limit') limit?: string) {
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
}
