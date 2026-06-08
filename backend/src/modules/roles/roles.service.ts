import { Injectable } from '@nestjs/common';
import { ASSIGNABLE_USER_ROLE_NAMES } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true, assignableOnly = false) {
    const rows = await this.prisma.role.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(assignableOnly
          ? { name: { in: [...ASSIGNABLE_USER_ROLE_NAMES] } }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
    }));
  }
}
