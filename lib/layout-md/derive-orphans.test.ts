import { describe, expect, it } from "vitest";
import {
  deriveLayoutMd,
  renderBrandAssetsSection,
  renderIconsSection,
  renderComponentInventorySection,
  renderProductContextSection,
} from "./derive";
import type {
  BrandingAsset,
  ContextDocument,
  Project,
  ScannedComponent,
} from "@/lib/types";

const baseProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "p1",
    orgId: "org1",
    name: "X",
    sourceType: "figma",
    layoutMd: "# layout\n\n## 1. Design Direction\n\nprose\n",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  }) as Project;

describe("renderBrandAssetsSection", () => {
  it("returns empty string when no assets", () => {
    expect(renderBrandAssetsSection(undefined)).toBe("");
    expect(renderBrandAssetsSection([])).toBe("");
  });

  it("renders assets grouped by slot", () => {
    const assets: BrandingAsset[] = [
      {
        id: "1",
        slot: "primary",
        variant: "colour",
        url: "https://cdn/primary.svg",
        name: "Primary mark",
        mimeType: "image/svg+xml",
        size: 1000,
        uploadedAt: "2026-04-20",
      },
      {
        id: "2",
        slot: "favicon",
        url: "https://cdn/favicon.ico",
        name: "Favicon",
        mimeType: "image/x-icon",
        size: 500,
        uploadedAt: "2026-04-20",
      },
    ];
    const out = renderBrandAssetsSection(assets);
    expect(out).toContain("## Brand Assets");
    expect(out).toContain("### primary");
    expect(out).toContain("### favicon");
    expect(out).toContain("Primary mark");
    expect(out).toContain("(colour)");
    expect(out).toContain("https://cdn/primary.svg");
  });
});

describe("renderIconsSection", () => {
  it("returns empty string when no packs selected", () => {
    expect(renderIconsSection(undefined)).toBe("");
    expect(renderIconsSection([])).toBe("");
  });

  it("ignores unknown pack ids without throwing", () => {
    const out = renderIconsSection(["definitely-not-a-real-pack"]);
    expect(out).toBe("");
  });

  it("renders a section with import syntax and common icons for known packs", () => {
    const out = renderIconsSection(["lucide"]);
    expect(out).toContain("## Icons");
    expect(out).toContain("Lucide");
    expect(out).toContain("lucide-react");
    expect(out).toContain("Common icons:");
  });
});

describe("renderComponentInventorySection", () => {
  const storybookComponent: ScannedComponent = {
    name: "Button",
    filePath: "src/components/Button.tsx",
    exportType: "named",
    props: ["variant", "size", "children"],
    usesForwardRef: false,
    importPath: "@/components/Button",
    source: "storybook",
    stories: ["Primary", "Secondary", "Disabled"],
    args: [
      { name: "variant", options: ["primary", "secondary"] },
      { name: "size", options: ["sm", "md", "lg"] },
    ],
  };

  const codebaseComponent: ScannedComponent = {
    name: "Card",
    filePath: "src/components/Card.tsx",
    exportType: "default",
    props: ["title", "body"],
    usesForwardRef: false,
    importPath: "@/components/Card",
    source: "codebase",
  };

  it("returns empty when no components", () => {
    expect(renderComponentInventorySection(undefined)).toBe("");
    expect(renderComponentInventorySection([])).toBe("");
  });

  it("renders Storybook components with stories + args", () => {
    const out = renderComponentInventorySection([storybookComponent]);
    expect(out).toContain("## Component Inventory");
    expect(out).toContain("### Button");
    expect(out).toContain('import { Button } from "@/components/Button"');
    expect(out).toContain("Stories: Primary, Secondary, Disabled");
    expect(out).toContain("variant (primary|secondary)");
  });

  it("differentiates default vs named export in the import line", () => {
    const out = renderComponentInventorySection([codebaseComponent]);
    expect(out).toContain('import Card from "@/components/Card"');
  });

  it("groups storybook and codebase components separately", () => {
    const out = renderComponentInventorySection([storybookComponent, codebaseComponent]);
    expect(out.indexOf("Storybook components")).toBeLessThan(out.indexOf("Codebase components"));
  });
});

describe("renderProductContextSection", () => {
  const doc = (overrides: Partial<ContextDocument> = {}): ContextDocument => ({
    id: "d1",
    name: "Brand voice",
    content: "We speak like a friendly editor.",
    mimeType: "text/markdown",
    size: 40,
    addedAt: "2026-04-20",
    ...overrides,
  });

  it("returns empty when no docs", () => {
    expect(renderProductContextSection([])).toBe("");
    expect(renderProductContextSection(undefined)).toBe("");
  });

  it("renders doc headings with content", () => {
    const out = renderProductContextSection([doc()]);
    expect(out).toContain("## Product Context");
    expect(out).toContain("### Brand voice");
    expect(out).toContain("We speak like a friendly editor.");
  });

  it("orders pinned docs first", () => {
    const out = renderProductContextSection([
      doc({ id: "a", name: "First unpinned", content: "one" }),
      doc({ id: "b", name: "Pinned", content: "two", pinned: true }),
    ]);
    expect(out.indexOf("Pinned (pinned)")).toBeLessThan(out.indexOf("First unpinned"));
  });

  it("truncates content past the per-doc cap", () => {
    const long = "x".repeat(10_000);
    const out = renderProductContextSection([doc({ content: long })]);
    expect(out).toContain("…(truncated)");
    // Cap is 4000 — a full 10k would be far more characters than the output.
    expect(out.length).toBeLessThan(10_000);
  });
});

describe("deriveLayoutMd — orphan injection integration", () => {
  it("injects all four orphan sections in canonical order before Appendix B", () => {
    const layoutMd = `# layout

## 1. Design Direction

prose

## Appendix B: Token Source Metadata

tokenSource: figma
`;

    const out = deriveLayoutMd(
      baseProject({
        layoutMd,
        brandingAssets: [
          {
            id: "1",
            slot: "primary",
            url: "https://cdn/logo.svg",
            name: "Logo",
            mimeType: "image/svg+xml",
            size: 1,
            uploadedAt: "2026-04-20",
          },
        ],
        iconPacks: ["lucide"],
        contextDocuments: [
          {
            id: "d1",
            name: "Voice",
            content: "friendly",
            mimeType: "text/markdown",
            size: 8,
            addedAt: "2026-04-20",
          },
        ],
        scannedComponents: [
          {
            name: "Button",
            filePath: "src/Button.tsx",
            exportType: "named",
            props: [],
            usesForwardRef: false,
            importPath: "@/components/Button",
            source: "storybook",
          },
        ],
      })
    );

    // All four sections present
    expect(out).toContain("## Brand Assets");
    expect(out).toContain("## Icons");
    expect(out).toContain("## Component Inventory");
    expect(out).toContain("## Product Context");
    // Authored prose preserved + Appendix B untouched
    expect(out).toContain("## 1. Design Direction");
    expect(out).toContain("prose");
    expect(out).toContain("## Appendix B: Token Source Metadata");
    expect(out).toContain("tokenSource: figma");
    // All derived sections appear BEFORE Appendix B
    const appendixBIdx = out.indexOf("## Appendix B");
    for (const section of ["## Brand Assets", "## Icons", "## Component Inventory", "## Product Context"]) {
      expect(out.indexOf(section)).toBeLessThan(appendixBIdx);
    }
  });

  it("is idempotent across re-derives", () => {
    const project = baseProject({
      iconPacks: ["lucide"],
      brandingAssets: [
        {
          id: "1",
          slot: "primary",
          url: "https://cdn/logo.svg",
          name: "Logo",
          mimeType: "image/svg+xml",
          size: 1,
          uploadedAt: "2026-04-20",
        },
      ],
    });
    const first = deriveLayoutMd(project);
    const second = deriveLayoutMd({ ...project, layoutMd: first });
    expect(second).toBe(first);
  });

  it("skipOrphanSections short-circuits the orphan render pass", () => {
    const out = deriveLayoutMd(
      baseProject({ iconPacks: ["lucide"] }),
      { skipOrphanSections: true }
    );
    expect(out).not.toContain("## Icons");
  });
});
