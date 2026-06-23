import { Injectable } from '@nestjs/common';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsMutationService } from './departments-mutation.service';
import { DepartmentsQueryService } from './departments-query.service';

/** Facade — keeps controller stable while query and mutation logic stay separate. */
@Injectable()
export class DepartmentsService {
  constructor(
    private readonly query: DepartmentsQueryService,
    private readonly mutation: DepartmentsMutationService,
  ) {}

  findAll(
    activeOnly = true,
    page?: number,
    limit?: number,
    parentDepartmentId?: string | 'ALL',
  ) {
    return this.query.findAll(activeOnly, page, limit, parentDepartmentId);
  }

  findOne(id: string) {
    return this.query.findOne(id);
  }

  create(dto: CreateDepartmentDto) {
    return this.mutation.create(dto);
  }

  update(id: string, dto: UpdateDepartmentDto) {
    return this.mutation.update(id, dto);
  }
}
