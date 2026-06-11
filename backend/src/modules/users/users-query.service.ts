import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  paginatedResult,
  resolveListPagination,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { mapUserToResponse } from './user-response.mapper';

@Injectable()
export class UsersQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(departmentName?: string, page?: number, limit?: number) {
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

  async findByEmail(email: string) {
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
  ) {
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
