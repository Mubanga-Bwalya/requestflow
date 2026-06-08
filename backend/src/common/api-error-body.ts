import { HttpException, HttpStatus } from '@nestjs/common';

export type ApiErrorBody = {
  statusCode: number;
  message: string;
  errors?: string[];
  requestId?: string;
};

export function normalizeExceptionMessage(exception: HttpException): {
  message: string;
  errors?: string[];
} {
  const res = exception.getResponse();
  if (typeof res === 'string') {
    return { message: res };
  }
  if (typeof res === 'object' && res !== null) {
    const body = res as { message?: string | string[]; error?: string };
    const raw = body.message;
    if (Array.isArray(raw)) {
      const errors = raw.map(String).filter(Boolean);
      return {
        message: errors[0] ?? 'Validation failed',
        errors,
      };
    }
    if (typeof raw === 'string' && raw.trim()) {
      return { message: raw };
    }
    if (typeof body.error === 'string') {
      return { message: body.error };
    }
  }
  return { message: exception.message || 'Request failed' };
}

export function buildApiErrorBody(
  statusCode: number,
  message: string,
  requestId?: string,
  errors?: string[],
): ApiErrorBody {
  return {
    statusCode,
    message,
    ...(errors?.length ? { errors } : {}),
    ...(requestId ? { requestId } : {}),
  };
}

export function isServerErrorStatus(status: number): boolean {
  return status >= HttpStatus.INTERNAL_SERVER_ERROR;
}
