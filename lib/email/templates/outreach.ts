/**
 * Outreach email template for cold outreach.
 * Clean, personal, minimal branding. Includes unsubscribe link.
 */
export function outreachEmailHtml({
  name,
  bodyHtml,
  unsubscribeUrl,
  senderName,
}: {
  name: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  senderName?: string;
}): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  const sender = senderName || "The Layout team";
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
              <img src="https://layout.design/marketing/logo-white.svg" alt="Layout" width="80" style="display:block;opacity:0.7;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;">
              <p style="margin:0 0 16px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">
                ${greeting}
              </p>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px;">
              <p style="margin:0;font-size:14px;color:rgba(237,237,244,0.6);line-height:1.5;">
                ${sender}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:rgba(237,237,244,0.25);text-align:center;">
          ${senderName || "We"} thought Layout might be useful for you.<br />
          <a href="${unsubscribeUrl}" style="color:rgba(237,237,244,0.35);text-decoration:underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function outreachEmailSubject(subject: string): string {
  return subject;
}
