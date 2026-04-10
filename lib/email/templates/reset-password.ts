export function resetPasswordEmailHtml(resetUrl: string): string {
  const body = `
<p style="margin:0 0 16px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">
  You requested a password reset for your Layout account. Click the button below to choose a new password.
</p>

<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background:#E0E0E6;border-radius:6px;padding:12px 28px;">
      <a href="${resetUrl}" style="color:#08090a;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
        Reset password
      </a>
    </td>
  </tr>
</table>

<p style="margin:0 0 16px;font-size:13px;color:rgba(237,237,244,0.5);line-height:1.5;">
  This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
</p>

<p style="margin:0;font-size:13px;color:rgba(237,237,244,0.5);line-height:1.5;">
  If the button doesn't work, copy and paste this URL into your browser:<br />
  <a href="${resetUrl}" style="color:#e4f222;text-decoration:underline;word-break:break-all;">${resetUrl}</a>
</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
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
            <td style="padding:0 32px 32px;">${body}</td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:rgba(237,237,244,0.3);">
          Layout &ndash; The compiler between design systems and AI coding agents.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
