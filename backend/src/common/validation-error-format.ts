import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function flattenValidationErrors(
  errors: ValidationError[],
  prefix = '',
): string[] {
  const messages: string[] = [];
  for (const err of errors) {
    const path = prefix ? `${prefix}.${err.property}` : err.property;
    if (err.constraints) {
      for (const text of Object.values(err.constraints)) {
        messages.push(`${path}: ${text}`);
      }
    }
    if (err.children?.length) {
      messages.push(...flattenValidationErrors(err.children, path));
    }
  }
  return messages;
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const messages = flattenValidationErrors(errors);
  return new BadRequestException(
    messages.length ? messages : ['Validation failed'],
  );
}
