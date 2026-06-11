import { Injectable, Logger } from '@nestjs/common';
import { resolveEmailConfig } from '../../config/email';
import { SystemEventsService } from '../system-events/system-events.service';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10_000;

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/** Sends transactional email via Resend; never throws to callers. */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config = resolveEmailConfig();

  constructor(private readonly systemEvents: SystemEventsService) {}

  isEnabled(): boolean {
    return this.config.enabled;
  }

  appBaseUrl(): string {
    return this.config.appBaseUrl;
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        await this.recordFailure(
          input.to,
          `Resend API ${res.status}: ${body.slice(0, 300)}`,
          res.status,
        );
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`Email sent to ${input.to}: ${input.subject}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.recordFailure(input.to, msg);
    }
  }

  private async recordFailure(
    to: string,
    detail: string,
    statusCode?: number,
  ): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`Email to ${to} failed: ${detail}`);
    }
    await this.systemEvents.record({
      level: 'WARN',
      code: 'EMAIL_SEND_FAILED',
      message: `Could not send notification email to ${to}: ${detail}`,
      path: '/email',
      statusCode,
    });
  }
}
