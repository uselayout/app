import { describe, it, expect } from "vitest";
import {
  formatScannedComponentForPrompt,
  summariseStorybookMetadata,
} from "./scanned-component-prompt";
import type { ScannedComponent } from "@/lib/types";

function base(overrides: Partial<ScannedComponent> = {}): ScannedComponent {
  return {
    name: "Button",
    filePath: "src/components/ui/button.tsx",
    exportType: "named",
    props: ["variant", "size", "disabled"],
    usesForwardRef: true,
    importPath: "src/components/ui/button",
    source: "codebase",
    ...overrides,
  };
}

describe("formatScannedComponentForPrompt", () => {
  it("renders a codebase-only component with import + props", () => {
    const out = formatScannedComponentForPrompt(base());
    expect(out).toBe("- Button (import from '@/components/ui/button') props: variant, size, disabled");
  });

  it("preserves a non-src importPath verbatim", () => {
    const out = formatScannedComponentForPrompt(
      base({ importPath: "@/ui/button", props: [] })
    );
    expect(out).toBe("- Button (import from '@/ui/button')");
  });

  it("appends existing Storybook stories when present", () => {
    const out = formatScannedComponentForPrompt(
      base({
        source: "storybook",
        stories: ["Primary", "Secondary", "Disabled", "Loading"],
      })
    );
    expect(out).toContain("existing stories: Primary, Secondary, Disabled, Loading");
  });

  it("emits Storybook arg options as literal unions", () => {
    const out = formatScannedComponentForPrompt(
      base({
        source: "storybook",
        args: [
          { name: "variant", type: "string", options: ["default", "destructive", "outline"] },
          { name: "size", type: "string", options: ["sm", "md", "lg"] },
          { name: "disabled", type: "boolean" },
        ],
      })
    );
    expect(out).toContain('variant: "default" | "destructive" | "outline"');
    expect(out).toContain('size: "sm" | "md" | "lg"');
    expect(out).not.toContain("disabled:"); // no options → skipped
  });
});

describe("summariseStorybookMetadata", () => {
  it("returns an empty object for a plain codebase component", () => {
    expect(summariseStorybookMetadata(base())).toEqual({});
  });

  it("returns stories and argOptions for a Storybook component", () => {
    const meta = summariseStorybookMetadata(
      base({
        source: "storybook",
        stories: ["Primary", "Disabled"],
        args: [
          { name: "variant", type: "string", options: ["default", "destructive"] },
          { name: "disabled", type: "boolean" },
        ],
      })
    );
    expect(meta.stories).toEqual(["Primary", "Disabled"]);
    expect(meta.argOptions).toEqual({ variant: ["default", "destructive"] });
  });
});
