import { describe, it, expect } from 'vitest';
import { analyseCompleteness } from './completeness';

const FULL_LAYOUT_MD = `
# 0. Quick Reference

- NEVER use hardcoded hex colours — always use CSS variables
- NEVER use spacing values not on the 4px grid
- ALWAYS use Geist font, not Arial

\`\`\`css
--color-primary: #6750A4;
--space-4: 16px;
\`\`\`

\`\`\`tsx
const Button = () => <button style={{ background: 'var(--color-primary)' }}>Click</button>;
\`\`\`

NEVER ignore these rules.

## 1. Colours

Primary: #6750A4, Surface: #FFFBFE, Error: #B3261E

--color-primary: #6750A4;
--color-surface: #FFFBFE;
--color-error: #B3261E;

Use primary for CTAs. /* Primary CTA backgrounds */

Supports dark mode and light mode variants.

## 2. Typography

font-family: "Inter", sans-serif;
font-size: 1rem (16px base)
font-weight: 400 (regular), 700 (bold)
line-height: 1.5
letter-spacing: 0.01em

font-family: "Inter"; font-size: 16px; font-weight: 400; line-height: 1.5;

## 3. Spacing

Base unit: 4px grid

--space-4: 16px;
--space-8: 32px;
--space-12: 48px;

Use padding for inside elements, gap for flex/grid layouts.

4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

## 4. Components

Button, Card, Input, Modal, Dropdown

Variants: primary, secondary, ghost. Size props: sm, md, lg.

States: default, hover, focus, active, disabled, loading, error

\`\`\`tsx
<Button variant="primary" disabled>Click</Button>
\`\`\`

Use var(--color-primary) for button background.

## 5. Anti-patterns

- NEVER hardcode #6750A4 — use var(--color-primary) instead
- DON'T use system fonts instead of Inter
- AVOID arbitrary spacing values outside the 4px grid
- Do not mix tonal and filled button variants because it fails brand consistency
- Use this instead: var(--color-primary)

## 6. Motion

--duration-fast: 150ms;
ease: cubic-bezier(0.0, 0.0, 0.2, 1);

Animations should be subtle and purposeful.

## 7. Accessibility

WCAG AA contrast ratio 4.5:1 for normal text.

Focus rings: visible keyboard focus outline.

Use aria attributes and semantic HTML: nav, main, section.

## 8. Icons

Use Lucide icons. Size: sm 16px, md 20px, lg 24px.

## 9. Grid & Layout

Breakpoints: sm 640px, md 768px, lg 1024px.
max-width: 1280px container.
Use flex and grid layout patterns.
`;

describe('analyseCompleteness', () => {
  it('returns a totalScore between 0 and 100', () => {
    const report = analyseCompleteness(FULL_LAYOUT_MD);
    expect(report.totalScore).toBeGreaterThanOrEqual(0);
    expect(report.totalScore).toBeLessThanOrEqual(100);
  });

  it('returns a high score for a well-formed layout.md', () => {
    const report = analyseCompleteness(FULL_LAYOUT_MD);
    expect(report.totalScore).toBeGreaterThan(60);
  });

  it('returns a low score for an empty string', () => {
    const report = analyseCompleteness('');
    expect(report.totalScore).toBeLessThan(20);
  });

  it('includes a sections array with a result per defined section', () => {
    const report = analyseCompleteness(FULL_LAYOUT_MD);
    expect(report.sections.length).toBeGreaterThan(0);
    for (const s of report.sections) {
      expect(s).toHaveProperty('section');
      expect(s).toHaveProperty('score');
      expect(s).toHaveProperty('found');
      expect(s).toHaveProperty('missing');
    }
  });

  it('marks a section as found when the heading is present', () => {
    const report = analyseCompleteness(FULL_LAYOUT_MD);
    const colours = report.sections.find((s) => s.section === 'Colours');
    expect(colours).toBeDefined();
    expect(colours!.found.some((f) => f.toLowerCase().includes('colour'))).toBe(true);
  });

  it('scores a missing section at 0 (or near 0)', () => {
    const md = '# Some Unrelated Content\n\nNo sections here.';
    const report = analyseCompleteness(md);
    const colourSection = report.sections.find((s) => s.section === 'Colours');
    expect(colourSection?.score).toBe(0);
  });

  it('adds a suggestion when a section is missing', () => {
    const md = '# Colours\n\n--color-primary: #6750A4; #aabbcc #112233\n\nSemantic primary colour. Used on CTAs. /* used for */\n\nDark mode and light mode variants.';
    const report = analyseCompleteness(md);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });

  it('includes a length suggestion when layout.md is very short', () => {
    const report = analyseCompleteness('# Title\nShort.');
    expect(report.suggestions.some((s) => s.includes('short'))).toBe(true);
  });

  it('includes a code block suggestion when no fenced blocks exist', () => {
    const md = '# Colours\n\nPrimary is blue. No code here.';
    const report = analyseCompleteness(md);
    expect(report.suggestions.some((s) => s.toLowerCase().includes('code block'))).toBe(true);
  });

  it('detects anti-pattern content even without a dedicated section heading', () => {
    const md = `# Colours\n\nUse NEVER hardcoded colours.\nDON'T use system fonts.\n`;
    const report = analyseCompleteness(md);
    const antiSection = report.sections.find((s) => s.section === 'Anti-patterns');
    // Global check should find the NEVER/DON'T keywords and give a partial score
    expect(antiSection?.score).toBeGreaterThan(0);
  });

  it('section score is 100 when all sub-checks pass', () => {
    const report = analyseCompleteness(FULL_LAYOUT_MD);
    const motion = report.sections.find((s) => s.section === 'Motion');
    // Motion section has 3 checks; FULL_LAYOUT_MD has all three
    expect(motion?.score).toBe(100);
  });

  it('each section score is between 0 and 100', () => {
    const report = analyseCompleteness(FULL_LAYOUT_MD);
    for (const s of report.sections) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });
});
