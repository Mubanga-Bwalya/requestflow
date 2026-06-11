export type EmailConfig = {
  enabled: boolean;
  resendApiKey: string;
  /** RFC 5322 sender, e.g. "RequestFlow <onboarding@resend.dev>" */
  from: string;
  /** User portal base URL used for deep links in emails. */
  appBaseUrl: string;
};

export function resolveEmailConfig(): EmailConfig {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const enabled =
    process.env.EMAIL_ENABLED === 'true' && resendApiKey.length > 0;
  return {
    enabled,
    resendApiKey,
    from:
      process.env.EMAIL_FROM?.trim() || 'RequestFlow <onboarding@resend.dev>',
    appBaseUrl:
      process.env.APP_BASE_URL?.trim()?.replace(/\/+$/, '') ||
      'http://localhost:3000',
  };
}
