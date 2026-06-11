import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  buildApiErrorBody,
  isServerErrorStatus,
  normalizeExceptionMessage,
} from '../api-error-body';
import { shouldRecordHttpWarning } from '../system-events/should-record-http-event';
import { SystemEventsService } from '../system-events/system-events.service';
import type { RequestUser } from '../auth.types';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly systemEvents: SystemEventsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<
      Request & { user?: RequestUser; requestId?: string }
    >();
    const requestId = req.requestId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const { message, errors } = normalizeExceptionMessage(exception);
      const body = buildApiErrorBody(status, message, requestId, errors);

      if (isServerErrorStatus(status)) {
        void this.systemEvents.record({
          level: 'ERROR',
          code: `HTTP_${status}`,
          message,
          httpMethod: req.method,
          path: req.url,
          statusCode: status,
          userId: req.user?.id,
          requestId,
          context: { errors },
        });
      } else if (shouldRecordHttpWarning(status, req.url)) {
        void this.systemEvents.record({
          level: 'WARN',
          code: `HTTP_${status}`,
          message,
          httpMethod: req.method,
          path: req.url,
          statusCode: status,
          userId: req.user?.id,
          requestId,
          context: errors?.length ? { errors } : undefined,
        });
      }

      res.status(status).json(body);
      return;
    }

    const message =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : exception instanceof Error
          ? exception.message
          : 'Unexpected error';

    this.logger.error(exception);

    void this.systemEvents.record({
      level: 'ERROR',
      code: 'UNHANDLED',
      message:
        exception instanceof Error ? exception.message : String(exception),
      httpMethod: req.method,
      path: req.url,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      userId: req.user?.id,
      requestId,
    });

    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        buildApiErrorBody(HttpStatus.INTERNAL_SERVER_ERROR, message, requestId),
      );
  }
}
