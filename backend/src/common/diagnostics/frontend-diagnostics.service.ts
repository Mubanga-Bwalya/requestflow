import { Injectable } from '@nestjs/common';
import { SystemEventsService } from '../system-events/system-events.service';
import type { ClientEventDto } from './client-event.dto';

@Injectable()
export class FrontendDiagnosticsService {
  constructor(private readonly systemEvents: SystemEventsService) {}

  async record(dto: ClientEventDto, userId?: string) {
    const code = `${dto.portal.toUpperCase()}_${dto.code}`
      .replace(/[^A-Z0-9_]/g, '_')
      .slice(0, 64);
    const detail = [
      `[${dto.portal} portal] ${dto.message}`,
      dto.apiPath ? `API: ${dto.apiPath}` : null,
      `page: ${dto.pagePath}`,
    ]
      .filter(Boolean)
      .join(' · ');

    await this.systemEvents.record({
      level: dto.level === 'ERROR' ? 'ERROR' : 'WARN',
      code,
      message: detail.slice(0, 2000),
      httpMethod: 'CLIENT',
      path: dto.apiPath ?? dto.pagePath,
      statusCode: dto.statusCode,
      userId,
      context: {
        portal: dto.portal,
        ...(dto.stack ? { stack: dto.stack.slice(0, 4000) } : {}),
      },
    });
    return { ok: true };
  }
}
