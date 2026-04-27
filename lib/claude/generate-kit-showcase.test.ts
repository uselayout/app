import { describe, it, expect } from "vitest";
import { stripFakeBrandingWhenNoLogo } from "./generate-kit-showcase";

describe("stripFakeBrandingWhenNoLogo", () => {
  it("returns the code unchanged when a primary logo is provided", () => {
    const code = `
      function App() {
        return <div><img src="logo.png" /><h1>Acme</h1></div>;
      }
    `;
    const out = stripFakeBrandingWhenNoLogo(code, true);
    expect(out).toBe(code);
  });

  it("strips <img> tags when no logo is provided", () => {
    const code = `<div><img src="bogus.png" /><h1>Acme</h1></div>`;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    expect(out).not.toMatch(/<img\b/);
    expect(out).toMatch(/<h1\b/);
  });

  it("strips <svg> blocks before the first <h1 (hero region)", () => {
    const code = `
      function App() {
        return (
          <div>
            <svg width="32" height="32"><rect /></svg>
            <h1>Acme</h1>
            <svg width="14" height="14"><path d="M0 0" /></svg>
          </div>
        );
      }
    `;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    // The hero-region SVG (before <h1) is gone
    const heroPart = out.slice(0, out.search(/<h1\b/i));
    expect(heroPart).not.toMatch(/<svg\b/);
    // The body-region SVG (after <h1) survives — those are legitimate icons
    const bodyPart = out.slice(out.search(/<h1\b/i));
    expect(bodyPart).toMatch(/<svg\b/);
  });

  it("strips a styled 'Design System' eyebrow span", () => {
    const code = `
      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Design System</span>
      <h1>Supabase</h1>
    `;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    expect(out).not.toMatch(/Design System/);
    expect(out).toMatch(/<h1>Supabase<\/h1>/);
  });

  it("strips a 'Design Tokens' div with eyebrow styling", () => {
    const code = `<div style={{ textTransform: 'uppercase', fontSize: '11px' }}>Design Tokens</div><h1>Linear</h1>`;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    expect(out).not.toMatch(/Design Tokens/);
  });

  it("preserves a normal paragraph that mentions 'Design System' in body copy", () => {
    // Long body text — over 40 chars — must not be stripped even if it contains the phrase
    const code = `<p style={{ fontSize: '16px' }}>This kit captures the Supabase Design System extracted from supabase.com.</p>`;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    expect(out).toMatch(/Design System/);
  });

  it("preserves a 'Design System' span without eyebrow styling (defensive — unlikely to be intentional but won't false-strip)", () => {
    const code = `<span>Design System</span>`;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    // No eyebrow CSS signals → leave it. The prompt is the primary defence;
    // the stripper only fires when CSS signals confirm the intent.
    expect(out).toMatch(/Design System/);
  });

  it("strips the eyebrow even when the keyword is uppercased in JSX", () => {
    const code = `<span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>DESIGN SYSTEM</span><h1>Acme</h1>`;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    expect(out).not.toMatch(/DESIGN SYSTEM/);
  });

  it("strips multiple fake elements in one call", () => {
    const code = `
      <svg width="40" height="40"><rect /></svg>
      <span style={{ textTransform: 'uppercase', fontSize: '11px' }}>Design System</span>
      <h1>Supabase</h1>
      <p>Body copy.</p>
    `;
    const out = stripFakeBrandingWhenNoLogo(code, false);
    expect(out).not.toMatch(/<svg\b/);
    expect(out).not.toMatch(/Design System/);
    expect(out).toMatch(/<h1>Supabase<\/h1>/);
    expect(out).toMatch(/<p>Body copy/);
  });
});
