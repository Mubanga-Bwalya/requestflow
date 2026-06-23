import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  paginatedResult,
  resolveListPagination,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffTokenStore } from '../auth/staff-token.store';
import { mapUserToResponse } from './user-response.mapper';
import { userDepartmentInclude } from './user-department.include';
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
  private async maybeSyncDirectory(actorId?: string, force = false): Promise<void> {
    if (!actorId) return;
    const token = await this.staffTokens.get(actorId);
    await this.directory.ensureSynced(token, force);
  }

  /** Force LDAP directory sync (admin). Requires Zamtel GN login token. */
  async syncDirectory(actorId: string): Promise<{ ok: boolean; message: string }> {
    const token = await this.staffTokens.get(actorId);
    if (!token) {
      return {
        ok: false,
        message:
          'No Zamtel staff session — log out and sign in again with your GN and AD password.',
      };
    }
    await this.directory.ensureSynced(token, true);
    return { ok: true, message: 'Directory sync started.' };
  }

  async findAll(
    actorId?: string,
    departmentName?: string,
    page?: number,
    limit?: number,
    refreshDirectory = false,
    search?: string,
    status?: 'active' | 'inactive',
  ) {
    // Directory sync is expensive — only run on explicit refresh or unfiltered browse.
    if (refreshDirectory) {
      await this.maybeSyncDirectory(actorId, true);
    } else if (!search?.trim()) {
      await this.maybeSyncDirectory(actorId, false);
    }
    const where = this.buildListWhere(departmentName, search, status);
    const include = {
      department: userDepartmentInclude,
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

  private buildListWhere(
    departmentName?: string,
    search?: string,
    status?: 'active' | 'inactive',
  ): Prisma.UserWhereInput {
    const and: Prisma.UserWhereInput[] = [];

    const dept = departmentName?.trim();
    if (dept) {
      and.push({
        OR: [
          {
            department: {
              name: { equals: dept, mode: Prisma.QueryMode.insensitive },
              parentDepartmentId: null,
            },
          },
          {
            department: {
              parent: {
                name: { equals: dept, mode: Prisma.QueryMode.insensitive },
              },
            },
          },
        ],
      });
    }

    const q = search?.trim();
    if (q) {
      and.push({
        OR: [
          { fullName: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { jobTitle: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { gn: { contains: q, mode: Prisma.QueryMode.insensitive } },
          {
            role: {
              name: { contains: q, mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            department: {
              OR: [
                { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
                {
                  parent: {
                    name: { contains: q, mode: Prisma.QueryMode.insensitive },
                  },
                },
              ],
            },
          },
        ],
      });
    }

    if (status === 'active') and.push({ isActive: true });
    if (status === 'inactive') and.push({ isActive: false });

    return and.length ? { AND: and } : {};
  }

  async findByEmail(email: string, actorId?: string) {
    await this.maybeSyncDirectory(actorId);
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      include: {
        department: userDepartmentInclude,
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
    await this.maybeSyncDirectory(actorId);
    const dept = departmentName.trim();
    const where: Prisma.UserWhereInput = {
      isActive: true,
      OR: [
        {
          department: {
            name: { equals: dept, mode: Prisma.QueryMode.insensitive },
            parentDepartmentId: null,
          },
        },
        {
          department: {
            parent: { name: { equals: dept, mode: Prisma.QueryMode.insensitive } },
          },
        },
      ],
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
