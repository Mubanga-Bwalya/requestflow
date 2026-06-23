import { Injectable } from '@nestjs/common';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { UsersMutationService } from './users-mutation.service';
import { UsersQueryService } from './users-query.service';

/** Facade — keeps controller stable while query and mutation logic stay separate. */
@Injectable()
export class UsersService {
  constructor(
    private readonly query: UsersQueryService,
    private readonly mutation: UsersMutationService,
  ) {}

  findAll(
    actorId?: string,
    departmentName?: string,
    page?: number,
    limit?: number,
    refreshDirectory?: boolean,
    search?: string,
    status?: 'active' | 'inactive',
  ) {
    return this.query.findAll(
      actorId,
      departmentName,
      page,
      limit,
      refreshDirectory,
      search,
      status,
    );
  }

  syncDirectory(actorId: string) {
    return this.query.syncDirectory(actorId);
  }

  findByEmail(email: string, actorId?: string) {
    return this.query.findByEmail(email, actorId);
  }

  findByDepartment(
    departmentName: string,
    page?: number,
    limit?: number,
    actorId?: string,
  ) {
    return this.query.findByDepartment(departmentName, page, limit, actorId);
  }

  create(dto: CreateUserDto, actorId?: string) {
    return this.mutation.create(dto, actorId);
  }

  update(id: string, dto: UpdateUserDto, actorId?: string) {
    return this.mutation.update(id, dto, actorId);
  }
}
