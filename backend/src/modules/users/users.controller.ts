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
  ) {
    if (departmentName?.trim()) {
      assertDepartmentTeamAccess(user, departmentName);
      const pagination = parsePagination(page ?? '1', limit ?? '100');
      return this.usersService.findByDepartment(
        departmentName,
        pagination.page,
        pagination.limit,
      );
    }
    if (!user.roleName || !ADMIN_ROLE_NAMES.has(user.roleName)) {
      throw new ForbiddenException('Admin access required');
    }
    const paginate = wantsPagination(page, limit);
    return this.usersService.findAll(
      undefined,
      paginate ? parseInt(page ?? '1', 10) : undefined,
      paginate ? parseInt(limit ?? '20', 10) : undefined,
    );
  }

  @Get('by-email/:email')
  @UseGuards(AdminRoleGuard)
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(decodeURIComponent(email));
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
