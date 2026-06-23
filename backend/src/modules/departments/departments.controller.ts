import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { wantsPagination } from '../../common/pagination';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AssignSectionMembersDto } from './dto/assign-section-members.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(body);
  }

  @Get()
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('parentDepartmentId') parentDepartmentId?: string,
  ) {
    const onlyActive = activeOnly !== 'false';
    const paginate = wantsPagination(page, limit);
    return this.departmentsService.findAll(
      onlyActive,
      paginate ? parseInt(page ?? '1', 10) : undefined,
      paginate ? parseInt(limit ?? '20', 10) : undefined,
      parentDepartmentId?.trim() || undefined,
    );
  }

  @Get(':id/roster')
  @UseGuards(AdminRoleGuard)
  getRoster(@Param('id') id: string) {
    return this.departmentsService.getRoster(id);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post(':id/sections/:sectionId/members')
  @UseGuards(AdminRoleGuard)
  assignSectionMembers(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() body: AssignSectionMembersDto,
  ) {
    return this.departmentsService.assignSectionMembers(
      id,
      sectionId,
      body.userIds,
    );
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post(':id/sections/:sectionId/members/remove')
  @UseGuards(AdminRoleGuard)
  unassignSectionMembers(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() body: AssignSectionMembersDto,
  ) {
    return this.departmentsService.unassignSectionMembers(
      id,
      sectionId,
      body.userIds,
    );
  }

  @Get(':id')
  @UseGuards(AdminRoleGuard)
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    return this.departmentsService.update(id, body);
  }
}
