/**
 * Zamtel-branded notification email (email-safe HTML).
 * Brand SVG assets do not render in mail clients, so the come-home device
 * and palette (#008542 / #015217 / #A9DD00 / #E73189) are recreated inline.
 */

export type NotificationEmailDetail = {
  label: string;
  value: string;
  /** Highlights the value (e.g. HIGH priority) in magenta. */
  emphasis?: boolean;
};

export type NotificationEmailInput = {
  recipientName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  /** Snapshot of the request so recipients see what's waiting. */
  details?: NotificationEmailDetail[];
};

const GREEN = '#008542';
const DARK = '#015217';
const LIME = '#A9DD00';
const MAGENTA = '#E73189';
const TEXT = '#1f2937';
const MUTED = '#6b7280';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderNotificationEmail(input: NotificationEmailInput): string {
  const name = escapeHtml(input.recipientName.split(' ')[0] || 'there');
  const title = escapeHtml(input.title);
  const message = escapeHtml(input.message);
  const actionLabel = escapeHtml(input.actionLabel ?? 'Open in RequestFlow');

  const button = input.actionUrl
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr>
          <td style="border-radius:9999px;background:${GREEN};">
            <a href="${input.actionUrl}"
               style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:9999px;">
              ${actionLabel}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const detailRows = (input.details ?? [])
    .map(
      (d) => `
        <tr>
          <td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;vertical-align:top;">
            ${escapeHtml(d.label)}
          </td>
          <td style="padding:7px 0 7px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${d.emphasis ? MAGENTA : TEXT};vertical-align:top;">
            ${escapeHtml(d.value)}
          </td>
        </tr>`,
    )
    .join('');

  const detailsCard = detailRows
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
             style="margin:22px 0 0;background:#f4f9f4;border:1px solid #dcebdc;border-left:4px solid ${GREEN};border-radius:10px;">
        <tr>
          <td style="padding:18px 22px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:${GREEN};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">
              Waiting for you in RequestFlow
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0">
              ${detailRows}
            </table>
          </td>
        </tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8e2;">

          <!-- magenta accent bar -->
          <tr><td style="height:5px;background:${MAGENTA};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- green brand header with come-home device -->
          <tr>
            <td style="background:${GREEN};padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="76" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" valign="middle"
                            style="width:64px;height:64px;border:2px solid #ffffff;border-radius:50%;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:#ffffff;font-size:13px;line-height:15px;">
                          come<br/>home
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:16px;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">
                      RequestFlow
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${LIME};margin-top:2px;">
                      Internal request tracking
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${MUTED};">
                Hi ${name},
              </p>
              <h1 style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;color:${DARK};">
                ${title}
              </h1>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};">
                ${message}
              </p>
              ${detailsCard}
              ${button}
              <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">
                You can also find this notification in the RequestFlow portal.
              </p>
            </td>
          </tr>

          <!-- brand footer band -->
          <tr>
            <td style="background:${DARK};padding:22px 32px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#ffffff;">
                create <span style="color:${LIME};">your</span> world
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#d7e8d7;margin-top:6px;">
                Together, we <span style="color:${LIME};">connect</span> ideas, people and possibilities.
              </div>
            </td>
          </tr>

          <!-- small print -->
          <tr>
            <td style="padding:16px 32px;background:#ffffff;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:${MUTED};">
                This is an automated message from RequestFlow (Zamtel internal). Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
