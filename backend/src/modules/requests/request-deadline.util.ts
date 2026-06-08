import { BadRequestException } from '@nestjs/common';
import type { TemplateField } from '@prisma/client';

type FieldAnswerInput = {
  fieldKey: string;
  answerText?: string;
};

const PREFERRED_DEADLINE_KEYS = [
  'deadline',
  'required_by',
  'publish_date',
  'go_live_date',
  'preferred_date',
  'target_start_date',
] as const;

export function parseRequestDeadline(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(
      'Deadline must be a valid date in YYYY-MM-DD format.',
    );
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid deadline date.');
  }
  return parsed;
}

export function resolveRequestDeadline(
  explicitDeadline: string | undefined,
  templateFields: TemplateField[],
  fieldAnswers: FieldAnswerInput[],
): Date | null {
  if (explicitDeadline?.trim()) {
    return parseRequestDeadline(explicitDeadline.trim());
  }

  const answersByKey = new Map(fieldAnswers.map((a) => [a.fieldKey, a]));
  const fieldsByKey = new Map(templateFields.map((f) => [f.fieldKey, f]));

  for (const key of PREFERRED_DEADLINE_KEYS) {
    const field = fieldsByKey.get(key);
    if (!field || field.fieldType !== 'DATE') continue;
    const text = answersByKey.get(key)?.answerText?.trim();
    if (text) return parseRequestDeadline(text);
  }

  for (const field of templateFields) {
    if (field.fieldType !== 'DATE' || !field.isRequired) continue;
    const text = answersByKey.get(field.fieldKey)?.answerText?.trim();
    if (text) return parseRequestDeadline(text);
  }

  return null;
}
