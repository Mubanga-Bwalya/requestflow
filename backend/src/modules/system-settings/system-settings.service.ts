import { Injectable } from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { AuditLogService } from '../../common/audit-log/audit-log.service';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditLogService,
  ) {}

  private map(row: {
    id: string;
    systemName: string;
    defaultPriority: string;
    allowUploads: boolean;
    notifyOnStatusChange: boolean;
    fileUploadLimitMb: number;
  }) {
    return {
      id: row.id,
      systemName: row.systemName,
      defaultPriority: row.defaultPriority,
      allowUploads: row.allowUploads,
      notifyOnStatusChange: row.notifyOnStatusChange,
      fileUploadLimitMb: row.fileUploadLimitMb,
    };
  }

  async get() {
    const cached = await this.cache.getJson<
      ReturnType<SystemSettingsService['map']>
    >(CacheKeys.settingsSystem);
    if (cached) return cached;

    let row = await this.prisma.systemSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (!row) {
      row = await this.prisma.systemSettings.create({
        data: { id: DEFAULT_ID },
      });
    }
    const mapped = this.map(row);
    await this.cache.setJson(
      CacheKeys.settingsSystem,
      mapped,
      CacheTtl.lookupSeconds,
    );
    return mapped;
  }

  async update(dto: UpdateSystemSettingsDto, actorId?: string) {
    await this.get();
    const row = await this.prisma.systemSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        ...(dto.systemName !== undefined
          ? { systemName: dto.systemName.trim() }
          : {}),
        ...(dto.defaultPriority !== undefined
          ? { defaultPriority: dto.defaultPriority }
          : {}),
        ...(dto.allowUploads !== undefined
          ? { allowUploads: dto.allowUploads }
          : {}),
        ...(dto.notifyOnStatusChange !== undefined
          ? { notifyOnStatusChange: dto.notifyOnStatusChange }
          : {}),
        ...(dto.fileUploadLimitMb !== undefined
          ? { fileUploadLimitMb: dto.fileUploadLimitMb }
          : {}),
      },
    });
    const mapped = this.map(row);
    await this.cache.del(CacheKeys.settingsSystem);
    await this.cache.setJson(
      CacheKeys.settingsSystem,
      mapped,
      CacheTtl.lookupSeconds,
    );
    void this.audit.record({
      userId: actorId,
      action: ActivityAction.ADMIN_SETTINGS_CHANGED,
      description: 'Admin updated system settings.',
    });
    return mapped;
  }
}
