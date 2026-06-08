import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(AdminRoleGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('assignableOnly') assignableOnly?: string,
  ) {
    return this.rolesService.findAll(
      activeOnly !== 'false',
      assignableOnly === 'true',
    );
  }
}
