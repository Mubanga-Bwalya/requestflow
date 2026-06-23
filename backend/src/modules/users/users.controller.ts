import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../../common/auth.types';
import { assertDepartmentTeamAccess } from '../../common/auth-helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { parsePagination, wantsPagination } from '../../common/pagination';
import { ADMIN_ROLE_NAMES } from '../auth/auth.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('departmentName') departmentName?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('refreshDirectory') refreshDirectory?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const isAdmin = !!user.roleName && ADMIN_ROLE_NAMES.has(user.roleName);
    const dept = departmentName?.trim();
    const forceDirectorySync =
      refreshDirectory === '1' ||
      refreshDirectory === 'true' ||
      refreshDirectory === 'yes';
    const normalizedStatus =
      status?.toLowerCase() === 'active'
        ? 'active'
        : status?.toLowerCase() === 'inactive'
          ? 'inactive'
          : undefined;

    // Admins can list every user, optionally filtered by department — this backs
    // the admin user-management page (including its department filter), so it
    // must not be gated behind department-manager access.
    if (isAdmin) {
      const paginate = wantsPagination(page, limit);
      return this.usersService.findAll(
        user.id,
        dept || undefined,
        paginate ? parseInt(page ?? '1', 10) : undefined,
        paginate ? parseInt(limit ?? '20', 10) : undefined,
        forceDirectorySync,
        search?.trim() || undefined,
        normalizedStatus,
      );
    }

    // Non-admins may only fetch their own department's team (manager-gated),
    // used by the assignment / team-member pickers.
    if (dept) {
      assertDepartmentTeamAccess(user, dept);
      const pagination = parsePagination(page ?? '1', limit ?? '100');
      return this.usersService.findByDepartment(
        dept,
        pagination.page,
        pagination.limit,
        user.id,
      );
    }

    throw new ForbiddenException('Admin access required');
  }

  @Get('by-email/:email')
  @UseGuards(AdminRoleGuard)
  findByEmail(
    @Param('email') email: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.findByEmail(decodeURIComponent(email), user.id);
  }

  @Post('sync-directory')
  @UseGuards(AdminRoleGuard)
  @Throttle({ writes: { limit: 6, ttl: 60_000 } })
  syncDirectory(@CurrentUser() actor: RequestUser) {
    return this.usersService.syncDirectory(actor.id);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() body: CreateUserDto, @CurrentUser() actor: RequestUser) {
    return this.usersService.create(body, actor.id);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.usersService.update(id, body, actor.id);
  }
}
