import { BadRequestException } from '@nestjs/common';
import { FieldType } from '@prisma/client';

const OPTION_FIELD_TYPES = new Set<FieldType>([
  FieldType.DROPDOWN,
  FieldType.MULTI_SELECT,
]);

export function assertOptionsForFieldType(
  fieldType: FieldType,
  options: unknown,
): void {
  if (!OPTION_FIELD_TYPES.has(fieldType)) return;

  if (!Array.isArray(options) || options.length === 0) {
    throw new BadRequestException(
      'Options are required for dropdown and multi-select fields.',
    );
  }

  for (const option of options) {
    if (typeof option !== 'string' || !option.trim()) {
      throw new BadRequestException('Options cannot be empty.');
    }
    if (option.trim().length > 120) {
      throw new BadRequestException(
        'Each option must be 120 characters or fewer.',
      );
    }
  }
}
