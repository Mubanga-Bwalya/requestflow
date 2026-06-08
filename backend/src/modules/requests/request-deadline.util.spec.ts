import { BadRequestException } from '@nestjs/common';
import type { TemplateField } from '@prisma/client';
import {
  parseRequestDeadline,
  resolveRequestDeadline,
} from './request-deadline.util';

function dateField(
  fieldKey: string,
  isRequired = true,
): TemplateField {
  return {
    id: fieldKey,
    templateId: 'tpl',
    fieldKey,
    label: fieldKey,
    fieldType: 'DATE',
    isRequired,
    options: null,
    helpText: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('request-deadline.util', () => {
  it('parses valid ISO date strings', () => {
    const parsed = parseRequestDeadline('2026-12-31');
    expect(parsed.toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });

  it('rejects invalid deadline formats', () => {
    expect(() => parseRequestDeadline('31-12-2026')).toThrow(
      BadRequestException,
    );
    expect(() => parseRequestDeadline('not-a-date')).toThrow(
      BadRequestException,
    );
  });

  it('uses explicit deadline when provided', () => {
    const resolved = resolveRequestDeadline(
      '2026-06-15',
      [dateField('deadline')],
      [{ fieldKey: 'deadline', answerText: '2026-07-01' }],
    );
    expect(resolved?.toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  it('derives deadline from template date answers', () => {
    const resolved = resolveRequestDeadline(
      undefined,
      [dateField('deadline')],
      [{ fieldKey: 'deadline', answerText: '2026-08-01' }],
    );
    expect(resolved?.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('returns null when no deadline is available', () => {
    const resolved = resolveRequestDeadline(undefined, [], []);
    expect(resolved).toBeNull();
  });
});
