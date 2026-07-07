import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkCompliance, complianceScore, defaultRules } from "./rules";
import type { ComplianceKit } from "./rules";

// ── Sync contract with the CLI ───────────────────────────────────────────────
// lib/compliance/rules.ts is a port of layout-context (uselayout/cli)
// src/compliance/{rules,checker}.ts. The CLI is canonical. This hash pins the
// rule inventory (id + name + severity, in order); if it fails you have
// changed the rule set here without going through the CLI first. Update the
// CLI, re-port, then recompute:
//   node -e "const c=require('crypto');console.log(c.createHash('sha256')
//     .update(JSON.stringify(INVENTORY)).digest('hex'))"
const EXPECTED_INVENTORY_HASH =
  "4c4f459590c142f164031aec3f85c3384513b60b3d4b58607ffdd9be0c7a6b17";

describe("compliance rules stay in sync with the CLI", () => {
  it("rule inventory (ids, names, severities) matches the pinned CLI hash", () => {
    const inventory = defaultRules.map((r) => [r.id, r.name, r.severity]);
    const hash = createHash("sha256")
      .update(JSON.stringify(inventory))
      .digest("hex");
    expect(hash).toBe(EXPECTED_INVENTORY_HASH);
  });
});

const emptyKit: ComplianceKit = { components: [] };

describe("checkCompliance", () => {
  it("flags hardcoded hex colours with line numbers", () => {
    const code = `const s = {\n  color: "#ff0000",\n};`;
    const result = checkCompliance(code, emptyKit);
    const hexIssues = result.issues.filter((i) => i.ruleId === "hardcoded-colours");
    expect(hexIssues).toHaveLength(1);
    expect(hexIssues[0]!.line).toBe(2);
    expect(hexIssues[0]!.message).toContain("#ff0000");
  });

  it("flags rgb() values and hardcoded spacing", () => {
    const code = `.card { background: rgb(255, 0, 0); padding: 13px; }`;
    const result = checkCompliance(code, emptyKit);
    expect(result.issues.some((i) => i.ruleId === "hardcoded-colours")).toBe(true);
    expect(result.issues.some((i) => i.ruleId === "hardcoded-spacing")).toBe(true);
  });

  it("flags var() references to tokens not in the kit", () => {
    const kit: ComplianceKit = {
      tokensCss: ":root { --color-primary: #123456; }",
      components: [],
    };
    const result = checkCompliance("color: var(--color-primry);", kit);
    const issues = result.issues.filter((i) => i.ruleId === "missing-token-reference");
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("--color-primry");
  });

  it("flags unknown JSX components when the kit lists components", () => {
    const kit: ComplianceKit = { components: [{ name: "Button" }] };
    const result = checkCompliance("<Button /><Widget />", kit);
    const issues = result.issues.filter((i) => i.ruleId === "unknown-component");
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("<Widget>");
  });

  it("passes clean, token-driven code", () => {
    const kit: ComplianceKit = {
      tokensCss: ":root { --color-primary: #123456; }",
      components: [],
    };
    const result = checkCompliance("color: var(--color-primary);", kit);
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.summary).toContain("No issues found");
  });
});

describe("complianceScore", () => {
  it("returns 100 for no issues and clamps at 0", () => {
    expect(complianceScore([])).toBe(100);
    const many = Array.from({ length: 20 }, () => ({
      ruleId: "hardcoded-colours",
      ruleName: "Hardcoded Colours",
      severity: "warning" as const,
      message: "x",
    }));
    expect(complianceScore(many)).toBe(0);
  });
});
