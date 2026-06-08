import { BadRequestException } from '@nestjs/common';
import { FieldType } from '@prisma/client';
import { assertOptionsForFieldType } from './template-field-options.util';

describe('template-field-options.util', () => {
  it('requires options for dropdown fields', () => {
    expect(() => assertOptionsForFieldType(FieldType.DROPDOWN, [])).toThrow(
      BadRequestException,
    );
  });

  it('rejects empty option values', () => {
    expect(() =>
      assertOptionsForFieldType(FieldType.MULTI_SELECT, ['Good', '  ']),
    ).toThrow(BadRequestException);
  });

  it('allows text fields without options', () => {
    expect(() =>
      assertOptionsForFieldType(FieldType.TEXT, undefined),
    ).not.toThrow();
  });
});
