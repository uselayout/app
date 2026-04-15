/**
 * Wraps raw HTML body content in the standard Layout email chrome.
 * Used for broadcast/marketing emails where the admin pastes pre-styled HTML.
 */
export function wrapBroadcastHtml(bodyHtml: string, unsubscribeUrl?: string): string {
  const preheader = bodyHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 90);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;font-size:1px;color:#0C0C0E;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0C0E;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A20;border-radius:12px;border:1px solid rgba(255,255,255,0.12);">
          <tr>
            <td style="padding:32px 32px 24px;">
              <img src="https://layout.design/marketing/logo-white.svg" alt="Layout" width="100" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">${bodyHtml}</td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:rgba(237,237,244,0.3);">
          Layout &ndash; The compiler between design systems and AI coding agents.<br />
          You received this because you signed up for Layout.${unsubscribeUrl ? `<br /><a href="${unsubscribeUrl}" style="color:rgba(237,237,244,0.35);text-decoration:underline;">Unsubscribe</a>` : ""}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Inline style helpers matching the existing email template patterns.
 * Export these so they can be referenced in the admin UI as a style guide.
 */
export const EMAIL_STYLES = {
  p: 'style="margin:0 0 16px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;"',
  heading: 'style="margin:24px 0 8px;font-size:15px;font-weight:600;color:#EDEDF4;"',
  link: 'style="color:#e4f222;text-decoration:underline;"',
  list: 'style="margin:0 0 16px;padding-left:20px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;"',
  listItem: 'style="margin-bottom:10px;"',
} as const;
