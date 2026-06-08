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
  ) {
    const onlyActive = activeOnly !== 'false';
    const paginate = wantsPagination(page, limit);
    return this.departmentsService.findAll(
      onlyActive,
      paginate ? parseInt(page ?? '1', 10) : undefined,
      paginate ? parseInt(limit ?? '20', 10) : undefined,
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
