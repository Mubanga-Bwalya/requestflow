import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ClientEventDto } from '../../common/diagnostics/client-event.dto';
import { FrontendDiagnosticsService } from '../../common/diagnostics/frontend-diagnostics.service';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../common/auth.types';
import { resolveDiagnosticsConfig } from '../../config/diagnostics';

const INGEST_SECRET_HEADER = 'x-diagnostics-ingest-secret';

@Controller('diagnostics')
export class DiagnosticsController {
  private readonly ingestSecret = resolveDiagnosticsConfig().ingestSecret;

  constructor(
    private readonly diagnostics: FrontendDiagnosticsService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Post('client-events')
  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  recordClientEvent(@Body() dto: ClientEventDto, @Req() req: Request) {
    const userId = this.resolveAuthorizedUserId(req);
    return this.diagnostics.record(dto, userId);
  }

  private resolveAuthorizedUserId(req: Request): string | undefined {
    const bearerUserId = this.optionalUserIdFromBearer(req);
    if (bearerUserId) return bearerUserId;

    const provided = req.headers[INGEST_SECRET_HEADER];
    const secret =
      typeof provided === 'string'
        ? provided.trim()
        : Array.isArray(provided)
          ? provided[0]?.trim()
          : '';
    if (this.ingestSecret && secret && secret === this.ingestSecret) {
      return undefined;
    }

    if (this.ingestSecret) {
      throw new UnauthorizedException(
        'Authentication or diagnostics ingest secret required.',
      );
    }

    throw new ForbiddenException(
      'Client diagnostics require an authenticated session.',
    );
  }

  private optionalUserIdFromBearer(req: Request): string | undefined {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return undefined;
    try {
      const payload = this.jwt.verify<JwtPayload>(auth.slice(7));
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
