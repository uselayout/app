interface InviteEmailParams {
  orgName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}

export function inviteEmailHtml({
  orgName,
  inviterName,
  role,
  acceptUrl,
}: InviteEmailParams): string {
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
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1A1A20;border-radius:12px;border:1px solid rgba(255,255,255,0.12);">
          <tr>
            <td style="padding:32px 32px 24px;">
              <img src="https://layout.design/layout-logo-white.svg" alt="Layout" width="100" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <h1 style="margin:0;font-size:20px;font-weight:600;color:#EDEDF4;">
                You've been invited to join ${orgName}
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:rgba(237,237,244,0.7);line-height:1.5;">
                ${inviterName} has invited you to join <strong style="color:#EDEDF4;">${orgName}</strong> as ${article(role)} <strong style="color:#EDEDF4;">${role}</strong> on Layout.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <a href="${acceptUrl}" style="display:inline-block;background:#e4f222;color:#08090a;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
                Accept invitation
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0;font-size:12px;color:rgba(237,237,244,0.5);line-height:1.5;">
                This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:rgba(237,237,244,0.3);">
          Layout &mdash; The compiler between design systems and AI coding agents.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function article(role: string): string {
  return /^[aeiou]/i.test(role) ? "an" : "a";
}

export function inviteEmailSubject(orgName: string): string {
  return `You've been invited to join ${orgName} on Layout`;
}
