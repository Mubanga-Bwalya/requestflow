import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  paginatedResult,
  resolveListPagination,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffTokenStore } from '../auth/staff-token.store';
import { mapUserToResponse } from './user-response.mapper';
import { ZamtelDirectoryService } from './zamtel-directory.service';

@Injectable()
export class UsersQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly directory: ZamtelDirectoryService,
    private readonly staffTokens: StaffTokenStore,
  ) {}

  /**
   * Refresh the local users table from the LDAP directory before reading it,
   * using the requesting user's captured staff token. Throttled and failure-safe
   * inside the directory service, so this is cheap to call on every list.
   */
  private async syncDirectory(actorId?: string): Promise<void> {
    if (!actorId) return;
    const token = await this.staffTokens.get(actorId);
    await this.directory.ensureSynced(token);
  }

  async findAll(
    actorId?: string,
    departmentName?: string,
    page?: number,
    limit?: number,
  ) {
    await this.syncDirectory(actorId);
    const where: Prisma.UserWhereInput | undefined = departmentName
      ? {
          department: {
            name: {
              equals: departmentName.trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          },
        }
      : undefined;
    const include = {
      department: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    } as const;

    const pagination = resolveListPagination(page, limit);
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
        include,
      }),
    ]);
    return paginatedResult(
      rows.map((u) => mapUserToResponse(u)),
      total,
      pagination,
    );
  }

  async findByEmail(email: string, actorId?: string) {
    await this.syncDirectory(actorId);
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException(`User not found: ${email}`);
    }
    return mapUserToResponse(user);
  }

  async findByDepartment(
    departmentName: string,
    page?: number,
    limit?: number,
    actorId?: string,
  ) {
    await this.syncDirectory(actorId);
    const where: Prisma.UserWhereInput = {
      isActive: true,
      department: {
        name: {
          equals: departmentName.trim(),
          mode: Prisma.QueryMode.insensitive,
        },
      },
    };
    const pagination = resolveListPagination(page, limit);
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: { role: { select: { name: true } } },
      }),
    ]);
    return paginatedResult(
      rows.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        jobTitle: u.jobTitle,
        roleName: u.role?.name ?? null,
      })),
      total,
      pagination,
    );
  }
}
