import { BadRequestException } from '@nestjs/common';
import type { TemplateField } from '@prisma/client';

type FieldAnswerInput = {
  fieldKey: string;
  answerText?: string;
  answerJson?: unknown;
  fileUrl?: string;
};

function hasAnswer(
  field: TemplateField,
  ans: FieldAnswerInput | undefined,
): boolean {
  if (!ans) return false;
  if (ans.fileUrl?.trim()) return true;
  if (ans.answerJson !== undefined && ans.answerJson !== null) return true;
  const text = ans.answerText?.trim();
  if (!text) return false;
  if (field.fieldType === 'CHECKBOX') {
    return text === 'true' || text === '1' || text.toLowerCase() === 'yes';
  }
  return true;
}

export function validateRequiredTemplateFields(
  fields: TemplateField[],
  answers: FieldAnswerInput[],
): void {
  const byKey = new Map(answers.map((a) => [a.fieldKey, a]));
  const missing: string[] = [];

  for (const field of fields) {
    if (!field.isRequired) continue;
    const ans = byKey.get(field.fieldKey);
    if (!hasAnswer(field, ans)) {
      missing.push(field.label);
    }
  }

  if (missing.length) {
    throw new BadRequestException(
      `Missing required fields: ${missing.join(', ')}`,
    );
  }
}

export function assertKnownFieldKeys(
  fields: TemplateField[],
  answers: FieldAnswerInput[],
): void {
  const known = new Set(fields.map((f) => f.fieldKey));
  for (const ans of answers) {
    if (!known.has(ans.fieldKey)) {
      throw new BadRequestException(`Unknown field key: ${ans.fieldKey}`);
    }
  }
}
