import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { resolveEmailConfig } from '../../config/email';
import { SystemEventsService } from '../system-events/system-events.service';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends transactional email via Zamtel's internal SMTP (nodemailer).
 *
 * When EMAIL_ENABLED is not 'true' the service is inert. When enabled but
 * SMTP_HOST is unset, each email is logged instead of sent — local dev and CI
 * keep working without any SMTP plumbing. Failed sends are recorded as system
 * events and swallowed: email is auxiliary and must never break the request
 * path that triggered it.
 */
@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly config = resolveEmailConfig();
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly systemEvents: SystemEventsService) {
    if (!this.config.enabled || !this.config.smtp) {
      if (this.config.enabled) {
        this.logger.warn(
          'EMAIL_ENABLED is true but SMTP_HOST is unset — emails will be logged, not sent.',
        );
      }
      this.transporter = null;
      return;
    }

    const { host, port, secure, user, pass } = this.config.smtp;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      pool: true,
      maxConnections: 3,
      // Internal Zamtel SMTP typically presents a self-signed cert.
      tls: { rejectUnauthorized: false },
    });

    this.transporter
      .verify()
      .then(() =>
        this.logger.log(`SMTP ready (${host}:${port}${secure ? ' SSL' : ''})`),
      )
      .catch((err) =>
        this.logger.warn(`SMTP verify failed: ${(err as Error).message}`),
      );
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  appBaseUrl(): string {
    return this.config.appBaseUrl;
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.config.enabled) return;

    if (!this.transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[stub email] to=${input.to} subject=${input.subject}`);
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`Email sent to ${input.to}: ${input.subject}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.recordFailure(input.to, msg);
    }
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }

  private async recordFailure(to: string, detail: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`Email to ${to} failed: ${detail}`);
    }
    await this.systemEvents.record({
      level: 'WARN',
      code: 'EMAIL_SEND_FAILED',
      message: `Could not send notification email to ${to}: ${detail}`,
      path: '/email',
    });
  }
}
