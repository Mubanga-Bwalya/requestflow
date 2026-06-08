import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateTemplateFieldDto } from './dto/create-template-field.dto';
import type { UpdateTemplateFieldDto } from './dto/update-template-field.dto';
import { mapTemplateField, slugifyFieldKey } from './template-field.mapper';
import { assertOptionsForFieldType } from './template-field-options.util';
import { loadTemplateDetail } from './template-detail.loader';

@Injectable()
export class TemplateFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async createField(templateId: string, dto: CreateTemplateFieldDto) {
    const template = await this.prisma.requestTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template)
      throw new NotFoundException(`Request template not found: ${templateId}`);

    const fieldType = dto.fieldType as FieldType;
    assertOptionsForFieldType(fieldType, dto.options);

    const fieldKey = (
      dto.fieldKey?.trim() || slugifyFieldKey(dto.label)
    ).toLowerCase();
    const dup = await this.prisma.templateField.findFirst({
      where: { templateId, fieldKey },
    });
    if (dup)
      throw new BadRequestException(`Field key already exists: ${fieldKey}`);

    const maxOrder = await this.prisma.templateField.aggregate({
      where: { templateId },
      _max: { displayOrder: true },
    });
    const displayOrder =
      dto.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1;

    await this.prisma.templateField.create({
      data: {
        templateId,
        label: dto.label.trim(),
        fieldKey,
        fieldType,
        isRequired: dto.isRequired ?? false,
        options:
          dto.options === undefined
            ? Prisma.JsonNull
            : (dto.options as Prisma.InputJsonValue),
        helpText: dto.helpText?.trim() || null,
        displayOrder,
        isActive: true,
      },
    });

    return loadTemplateDetail(this.prisma, templateId, false);
  }

  async updateField(
    templateId: string,
    fieldId: string,
    dto: UpdateTemplateFieldDto,
  ) {
    const field = await this.prisma.templateField.findFirst({
      where: { id: fieldId, templateId },
    });
    if (!field)
      throw new NotFoundException(`Template field not found: ${fieldId}`);

    const nextFieldType = (dto.fieldType ?? field.fieldType) as FieldType;
    if (dto.options !== undefined || dto.fieldType !== undefined) {
      assertOptionsForFieldType(
        nextFieldType,
        dto.options !== undefined ? dto.options : field.options,
      );
    }

    if (dto.fieldKey && dto.fieldKey !== field.fieldKey) {
      const dup = await this.prisma.templateField.findFirst({
        where: { templateId, fieldKey: dto.fieldKey, NOT: { id: fieldId } },
      });
      if (dup)
        throw new BadRequestException(
          `Field key already exists: ${dto.fieldKey}`,
        );
    }

    await this.prisma.templateField.update({
      where: { id: fieldId },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.fieldKey !== undefined
          ? { fieldKey: dto.fieldKey.trim().toLowerCase() }
          : {}),
        ...(dto.fieldType !== undefined
          ? { fieldType: dto.fieldType as FieldType }
          : {}),
        ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
        ...(dto.options !== undefined
          ? { options: dto.options as Prisma.InputJsonValue }
          : {}),
        ...(dto.helpText !== undefined
          ? { helpText: dto.helpText?.trim() || null }
          : {}),
        ...(dto.displayOrder !== undefined
          ? { displayOrder: dto.displayOrder }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return loadTemplateDetail(this.prisma, templateId, false);
  }

  async deactivateField(templateId: string, fieldId: string) {
    return this.updateField(templateId, fieldId, { isActive: false });
  }

  async findFields(templateId: string, activeOnly = true) {
    const t = await this.prisma.requestTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, name: true },
    });

    if (!t) {
      throw new NotFoundException(`Request template not found: ${templateId}`);
    }

    const fields = await this.prisma.templateField.findMany({
      where: {
        templateId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { displayOrder: 'asc' },
    });

    return {
      templateId: t.id,
      templateName: t.name,
      fields: fields.map((f) => mapTemplateField(f)),
    };
  }
}
