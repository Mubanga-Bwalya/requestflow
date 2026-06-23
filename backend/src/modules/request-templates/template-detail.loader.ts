import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapTemplateField } from './template-field.mapper';

export async function loadTemplateDetail(
  prisma: PrismaService,
  id: string,
  activeFieldsOnly = true,
) {
  const t = await prisma.requestTemplate.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          parent: { select: { name: true } },
        },
      },
      fields: {
        where: activeFieldsOnly ? { isActive: true } : undefined,
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!t) {
    throw new NotFoundException(`Request template not found: ${id}`);
  }

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    departmentId: t.departmentId,
    departmentName: t.department.parent
      ? `${t.department.parent.name} > ${t.department.name}`
      : t.department.name,
    isActive: t.isActive,
    fields: t.fields.map((f) => mapTemplateField(f)),
  };
}
