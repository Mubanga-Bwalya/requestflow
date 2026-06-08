import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-error-format';

describe('validationExceptionFactory', () => {
  it('flattens nested class-validator errors', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
        children: [],
      },
    ];

    const ex = validationExceptionFactory(errors);
    expect(ex).toBeInstanceOf(BadRequestException);
    const res = ex.getResponse();
    expect(res).toEqual({ message: ['email: email must be an email'], error: 'Bad Request', statusCode: 400 });
  });
});
