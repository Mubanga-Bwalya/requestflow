import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

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
    let row = await this.prisma.systemSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (!row) {
      row = await this.prisma.systemSettings.create({
        data: { id: DEFAULT_ID },
      });
    }
    return this.map(row);
  }

  async update(dto: UpdateSystemSettingsDto) {
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
    return this.map(row);
  }
}
