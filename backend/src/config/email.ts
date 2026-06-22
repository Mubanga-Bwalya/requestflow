export type SmtpConfig = {
  host: string;
  port: number;
  /** true for implicit TLS (SMTPS, usually port 465); false for plain/STARTTLS */
  secure: boolean;
  user?: string;
  pass?: string;
};

export type EmailConfig = {
  enabled: boolean;
  /** null when SMTP_HOST is unset — emails are logged instead of sent. */
  smtp: SmtpConfig | null;
  /** RFC 5322 sender, e.g. '"RequestFlow" <no-reply@zamtel.co.zm>' */
  from: string;
  /** User portal base URL used for deep links in emails. */
  appBaseUrl: string;
};

function asBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function resolveEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  const enabled = process.env.EMAIL_ENABLED === 'true';
  const fromAddress = process.env.SMTP_FROM?.trim() || 'no-reply@zamtel.co.zm';
  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'RequestFlow';

  return {
    enabled,
    smtp: host
      ? {
          host,
          port: Number.parseInt(process.env.SMTP_PORT ?? '25', 10) || 25,
          secure: asBool(process.env.SMTP_SSL, false),
          user: process.env.SMTP_USER?.trim() || undefined,
          pass: process.env.SMTP_PASS?.trim() || undefined,
        }
      : null,
    from: `"${fromName}" <${fromAddress}>`,
    appBaseUrl:
      process.env.APP_BASE_URL?.trim()?.replace(/\/+$/, '') ||
      'http://localhost:3000',
  };
}
