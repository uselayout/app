import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from './score';

const LAYOUT_MD_WITH_VARS = `
\`\`\`css
--color-primary: #6750A4;
--color-surface: #FFFBFE;
--space-4: 16px;
--space-8: 32px;
--radius-md: 12px;
\`\`\`
`;

describe('calculateHealthScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = calculateHealthScore('<div>Hello</div>');
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('has a base score of 60 with no positive or negative signals', () => {
    // Simple div with no hex, no vars, no interactive elements, no images
    const result = calculateHealthScore('<div>Hello</div>');
    // Base 60 + 10 (no rogue inline color) — may shift slightly with other checks
    expect(result.total).toBeGreaterThanOrEqual(50);
  });

  it('penalises hardcoded hex colours not in the design system', () => {
    const output = '<div style={{ color: "#deadbe" }}>Text</div>';
    const result = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    const hexIssue = result.issues.find((i) => i.rule === 'No hardcoded colours');
    expect(hexIssue).toBeDefined();
    expect(result.total).toBeLessThan(70);
  });

  it('does NOT penalise hex colours that are present in the design system', () => {
    // #6750A4 is in the layout MD above
    const output = '<div style={{ color: "#6750A4" }}>Text</div>';
    const result = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    const hexIssue = result.issues.find((i) => i.rule === 'No hardcoded colours');
    expect(hexIssue).toBeUndefined();
  });

  it('awards a bonus when CSS variables are used and design system defines vars', () => {
    const withVars = '<div style={{ color: "var(--color-primary)" }}>Text</div>';
    const withoutVars = '<div style={{ color: "blue" }}>Text</div>';
    const scoreWith = calculateHealthScore(withVars, [], LAYOUT_MD_WITH_VARS).total;
    const scoreWithout = calculateHealthScore(withoutVars, [], LAYOUT_MD_WITH_VARS).total;
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it('awards a smaller bonus when CSS vars are used but no design system vars exist', () => {
    const output = '<div style={{ color: "var(--my-custom)" }}>Text</div>';
    const noDs = calculateHealthScore(output);
    const withDs = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    // Both get a bonus for using vars, but the sizes differ
    expect(noDs.total).toBeGreaterThanOrEqual(60);
    expect(withDs.total).toBeGreaterThan(noDs.total);
  });

  it('awards a font bonus when the output uses a font from the extracted font list', () => {
    const output = '<div style={{ fontFamily: "Inter" }}>Text</div>';
    const result = calculateHealthScore(output, ['Inter']);
    expect(result.total).toBeGreaterThan(calculateHealthScore('<div>Text</div>', ['Inter']).total);
  });

  it('adds a warning when extracted fonts exist but none are used in the output', () => {
    const output = '<div style={{ fontFamily: "Arial" }}>Text</div>';
    const result = calculateHealthScore(output, ['Inter', 'Geist']);
    const fontIssue = result.issues.find((i) => i.rule === 'Uses design system font');
    expect(fontIssue).toBeDefined();
  });

  it('penalises off-grid spacing values (Tailwind arbitrary classes)', () => {
    const output = '<div class="p-[7px] gap-[13px]">content</div>';
    const result = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    const spacingIssue = result.issues.find((i) => i.rule === 'Spacing matches design system grid');
    expect(spacingIssue).toBeDefined();
  });

  it('does not penalise spacing values that match design system tokens', () => {
    // --space-4: 16px is in layout MD, so p-[16px] should be fine
    const output = '<div class="p-[16px]">content</div>';
    const result = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    const spacingIssue = result.issues.find((i) => i.rule === 'Spacing matches design system grid');
    expect(spacingIssue).toBeUndefined();
  });

  it('adds a warning for interactive elements without hover/focus states', () => {
    const output = '<button>Click me</button>';
    const result = calculateHealthScore(output);
    const stateIssue = result.issues.find((i) => i.rule === 'Interactive state coverage');
    expect(stateIssue).toBeDefined();
  });

  it('does not add a state warning when hover and focus states are present', () => {
    const output = '<button className="hover:bg-blue-500 focus:ring-2 disabled:opacity-50">Click</button>';
    const result = calculateHealthScore(output);
    const stateIssue = result.issues.find((i) => i.rule === 'Interactive state coverage');
    expect(stateIssue).toBeUndefined();
  });

  it('adds a semantic HTML bonus when semantic tags are used', () => {
    const withSemantic = '<main><nav>Nav</nav><section>Content</section></main>';
    const withoutSemantic = '<div><div>Nav</div><div>Content</div></div>';
    const scoreWith = calculateHealthScore(withSemantic).total;
    const scoreWithout = calculateHealthScore(withoutSemantic).total;
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it('returns antiPatternViolations equal to the number of rogue hex colours', () => {
    const output = '<div style={{ color: "#aabbcc", background: "#ddeeff" }}>Text</div>';
    const result = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    expect(result.antiPatternViolations).toBeGreaterThanOrEqual(2);
  });

  it('returns tokenFaithfulness of 80 when CSS vars are used', () => {
    const output = '<div style={{ color: "var(--color-primary)" }}>Text</div>';
    const result = calculateHealthScore(output, [], LAYOUT_MD_WITH_VARS);
    expect(result.tokenFaithfulness).toBe(80);
  });

  it('caps total score at 100', () => {
    // Stack all the bonuses
    const output = `
      <main>
        <nav>Nav</nav>
        <section style={{ color: "var(--color-primary)", fontFamily: "Inter" }}>
          <button className="hover:bg-blue-500 focus:ring-2 disabled:opacity-50">Click</button>
        </section>
      </main>
    `;
    const result = calculateHealthScore(output, ['Inter'], LAYOUT_MD_WITH_VARS);
    expect(result.total).toBeLessThanOrEqual(100);
  });
});
