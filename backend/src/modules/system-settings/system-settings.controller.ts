import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../../common/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  get() {
    return this.systemSettingsService.get();
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Patch()
  @UseGuards(AdminRoleGuard)
  update(
    @Body() body: UpdateSystemSettingsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.systemSettingsService.update(body, actor.id);
  }
}
