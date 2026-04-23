interface ReminderEmailParams {
  name: string;
  inviteCode: string;
  isFinal: boolean;
}

export function reminderEmailSubject(isFinal: boolean): string {
  return isFinal
    ? "Last chance: your Layout access code"
    : "Your Layout access code is waiting";
}

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">${text}</p>`;

const link = (url: string, label: string) =>
  `<a href="${url}" style="color:#e4f222;text-decoration:underline;">${label}</a>`;

export function reminderEmailHtml({
  name,
  inviteCode,
  isFinal,
}: ReminderEmailParams): string {
  const firstName = esc(name.split(" ")[0]);
  const code = esc(inviteCode);

  const body = isFinal
    ? `
${p(`Hey ${firstName},`)}

${p("This is a final nudge. Your Layout alpha access code is still unused, and we wanted to make sure it didn't slip through the cracks.")}

<table cellpadding="0" cellspacing="0" style="background:rgba(224,224,230,0.08);border:1px solid rgba(224,224,230,0.15);border-radius:8px;width:100%;margin:0 0 20px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0;font-size:12px;color:rgba(237,237,244,0.5);text-transform:uppercase;letter-spacing:0.5px;">Your access code</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#EDEDF4;font-family:monospace;letter-spacing:2px;">${code}</p>
    </td>
  </tr>
</table>

${p(`Sign up at ${link("https://layout.design/signup", "layout.design/signup")} and enter your code. Takes about two minutes.`)}

${p("We're keeping the alpha small, so spots are limited. If you're no longer interested, no worries at all. But if you've just been busy, your code is ready when you are.")}

${p("Reply to this email if you have any questions.")}

<p style="margin:16px 0 4px;font-size:15px;font-weight:600;color:#EDEDF4;">Matt &amp; Ben</p>
<p style="margin:0 0 4px;font-size:13px;color:rgba(237,237,244,0.5);">Co-Founders, Layout</p>
<p style="margin:0;font-size:13px;">
  ${link("https://layout.design", "layout.design")} &middot;
  ${link("https://layout.design/discord", "Discord")}
</p>`
    : `
${p(`Hey ${firstName},`)}

${p("Just a quick one. We sent you a Layout alpha access code a few days ago and noticed you haven't signed up yet.")}

<table cellpadding="0" cellspacing="0" style="background:rgba(224,224,230,0.08);border:1px solid rgba(224,224,230,0.15);border-radius:8px;width:100%;margin:0 0 20px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0;font-size:12px;color:rgba(237,237,244,0.5);text-transform:uppercase;letter-spacing:0.5px;">Your access code</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#EDEDF4;font-family:monospace;letter-spacing:2px;">${code}</p>
    </td>
  </tr>
</table>

${p(`Head to ${link("https://layout.design/signup", "layout.design/signup")}, enter your code, and you'll be set up in a couple of minutes.`)}

${p("Layout extracts your design system from Figma or live websites and compiles it into structured context that AI coding agents understand. The result: on-brand UI code instead of generic output, from any MCP-compatible tool.")}

${p("If you have any questions or ran into trouble, just reply to this email.")}

<p style="margin:16px 0 4px;font-size:15px;font-weight:600;color:#EDEDF4;">Matt &amp; Ben</p>
<p style="margin:0 0 4px;font-size:13px;color:rgba(237,237,244,0.5);">Co-Founders, Layout</p>
<p style="margin:0;font-size:13px;">
  ${link("https://layout.design", "layout.design")} &middot;
  ${link("https://layout.design/discord", "Discord")}
</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;font-size:1px;color:#0C0C0E;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${isFinal ? "Last chance to claim your Layout alpha access." : "Your Layout alpha access code is still waiting for you."}&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;</span>
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
