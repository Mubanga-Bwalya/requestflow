import { Injectable } from '@nestjs/common';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { ASSIGNABLE_USER_ROLE_NAMES } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll(activeOnly = true, assignableOnly = false) {
    const cacheKey = `${CacheKeys.rolesAll}:${activeOnly}:${assignableOnly}`;
    const cached = await this.cache.getJson<
      {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
      }[]
    >(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.role.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(assignableOnly
          ? { name: { in: [...ASSIGNABLE_USER_ROLE_NAMES] } }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
    const mapped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
    }));
    await this.cache.setJson(cacheKey, mapped, CacheTtl.lookupSeconds);
    return mapped;
  }
}
