interface WelcomeEmailParams {
  name: string;
  inviteCode: string;
}

export function welcomeEmailSubject(): string {
  return "Your Layout alpha access is ready";
}

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">${text}</p>`;

const heading = (text: string) =>
  `<p style="margin:24px 0 8px;font-size:15px;font-weight:600;color:#EDEDF4;">${text}</p>`;

const link = (url: string, label: string) =>
  `<a href="${url}" style="color:#e4f222;text-decoration:underline;">${label}</a>`;

export function welcomeEmailHtml({
  name,
  inviteCode,
}: WelcomeEmailParams): string {
  const firstName = esc(name.split(" ")[0]);
  const code = esc(inviteCode);

  const body = `
${p(`Hey ${firstName},`)}

${p("Welcome to the Layout alpha. You're one of a small group of people with early access, and we're genuinely glad you're here.")}

<table cellpadding="0" cellspacing="0" style="background:rgba(224,224,230,0.08);border:1px solid rgba(224,224,230,0.15);border-radius:8px;width:100%;margin:0 0 20px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0;font-size:12px;color:rgba(237,237,244,0.5);text-transform:uppercase;letter-spacing:0.5px;">Your access code</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#EDEDF4;font-family:monospace;letter-spacing:2px;">${code}</p>
    </td>
  </tr>
</table>

${p(`Layout extracts your design system from Figma files or live websites and compiles it into a structured context bundle (layout.md) that AI coding agents actually understand. The result: Claude Code, Cursor, Codex, Windsurf, Antigravity, and any MCP-compatible agent produce on-brand UI code instead of generic output.`)}

${p("This is alpha software. Things will break. But the core loop works, and the people using it are already seeing a real difference in what their AI tools produce.")}

${heading("Get started:")}

<ol style="margin:0 0 16px;padding-left:20px;font-size:15px;color:rgba(237,237,244,0.85);line-height:1.6;">
  <li style="margin-bottom:10px;">Sign up at ${link("https://layout.design/signup", "layout.design/signup")} and enter your invite code to create your account.</li>
  <li style="margin-bottom:10px;">Create a project by pasting a Figma file URL or any live website URL. Layout will extract your tokens, typography, colours, spacing, components, and patterns automatically.</li>
  <li style="margin-bottom:10px;">Review your layout.md in the Studio editor. It shows your complete design system context. Edit, refine, or use it as-is.</li>
  <li style="margin-bottom:10px;">Install the CLI by running <code style="background:rgba(224,224,230,0.1);padding:2px 6px;border-radius:4px;font-size:13px;color:#e4f222;">npx @layoutdesign/context install</code> in your project directory to connect Layout to your AI coding tool as an MCP server. Your agent now has your full design system as context.</li>
  <li>Try the Explorer. This is where it gets interesting. Generate multiple component variants from a single prompt, all using your design system tokens. Compare, refine, and save the ones you like to your component library.</li>
</ol>

${p("That's it. Next time you ask your AI tool to build a component, it will use your actual design system, not its own defaults.")}

${p(`Full docs and guides: ${link("https://layout.design/docs", "layout.design/docs")}`)}

${heading("A note on API keys")}

${p("Your free account comes with a few credits to get started: 2 extractions and 5 AI queries per month. For unlimited use, we recommend BYOK (bring your own key). Add your API keys in Settings &gt; API Keys. Your keys stay in your browser, never hit our servers.")}

${p("Two keys to add:")}
<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:rgba(237,237,244,0.7);line-height:1.6;">
  <li style="margin-bottom:8px;"><strong style="color:#EDEDF4;">Anthropic API key</strong> (${link("https://console.anthropic.com", "console.anthropic.com")}) powers layout.md generation and the Explorer. When active, no credits are consumed.</li>
  <li><strong style="color:#EDEDF4;">Google AI API key</strong> (${link("https://aistudio.google.com/apikey", "aistudio.google.com")}) enables AI image generation within your components. This is BYOK-only and not included in free credits.</li>
</ul>

${heading("Early alpha extras")}

${p(`There's also a Chrome extension and Figma plugin available from the ${link("https://layout.design/docs", "docs page")}. Both are very early (expect bugs) but we'd love your feedback on them. They're the kind of thing that gets better fast with real usage.`)}

${p("<strong style=\"color:#EDEDF4;\">You can shape this product.</strong> At this stage, your feedback doesn't go into a backlog to be triaged. It directly changes what we build next. If something is broken, missing, or not quite right for your workflow, I want to hear about it.")}

${p(`We've just set up a Discord for alpha members: ${link("https://layout.design/discord", "layout.design/discord")}`)}

${p("It's early days and you'll be one of the first in there, but that's the point. This is where you can talk directly to me, Ben and the other people shaping what Layout becomes. Feature requests, bug reports, or just sharing what you're building with it.")}

${p("You can also just reply to this email. We read everything.")}

${p("Thanks for being early.")}

<p style="margin:16px 0 4px;font-size:15px;font-weight:600;color:#EDEDF4;">Matt &amp; Ben</p>
<p style="margin:0 0 4px;font-size:13px;color:rgba(237,237,244,0.5);">Co-Founders, Layout</p>
<p style="margin:0;font-size:13px;">
  ${link("https://layout.design", "layout.design")} &middot;
  ${link("https://x.com/uselayoutdesign", "X/Twitter")} &middot;
  ${link("https://github.com/uselayout", "GitHub")} &middot;
  ${link("https://layout.design/discord", "Discord")}
</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;font-size:1px;color:#0C0C0E;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your invite code is inside. Get started with Layout in 2 minutes.&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0C0E;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A20;border-radius:12px;border:1px solid rgba(255,255,255,0.12);">
          <tr>
            <td style="padding:32px 32px 24px;">
              <img src="https://layout.design/layout-logo-white.svg" alt="Layout" width="100" style="display:block;" />
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
