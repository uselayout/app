import { describe, expect, it, vi } from "vitest";

// Mock generateImage before importing the module under test.
vi.mock("./generate", () => ({
  generateImage: vi.fn(),
}));

import { generateImage } from "./generate";
import { resolveJsxImages, hasJsxImageExpressions } from "./resolve-jsx-images";
import { FALLBACK_SVG } from "./fallback";

const mockedGenerate = generateImage as unknown as ReturnType<typeof vi.fn>;

describe("injectUrlMap scope (I1 regression)", () => {
  it("places __imageUrls at module scope even when the component has an inner return (", async () => {
    // Component whose useMemo returns JSX — so the FIRST `return (` in the
    // file is inside a callback, not the component's main render. The items
    // are defined at module scope so eval can resolve prompts without props.
    const code = `
import { useMemo } from "react";

const items = [{ prompt: "a mountain", label: "Mountain" }];

export default function Gallery() {
  const rendered = useMemo(() => {
    return (
      items.map(i => i.label)
    );
  }, []);

  return (
    <div>
      {items.map(m => (
        <img data-generate-image={m.prompt} alt={m.label} />
      ))}
    </div>
  );
}
`.trim();

    mockedGenerate.mockResolvedValue({ url: "https://example.com/a.png" });

    const result = await resolveJsxImages(code);

    const mapDeclIdx = result.code.indexOf("const __imageUrls");
    const useMemoIdx = result.code.indexOf("useMemo(");
    const defaultExportIdx = result.code.indexOf("export default");

    // The map declaration must exist and land BEFORE the component function —
    // not nested inside the useMemo callback where the first `return (` is.
    expect(mapDeclIdx).toBeGreaterThan(-1);
    expect(mapDeclIdx).toBeLessThan(defaultExportIdx);
    expect(mapDeclIdx).toBeLessThan(useMemoIdx);
  });

  it("inserts after a leading 'use client' directive (not before)", async () => {
    const code = `
"use client";

export default function X() {
  return (
    <img data-generate-image={"p"} />
  );
}
`.trim();

    mockedGenerate.mockResolvedValue({ url: "https://example.com/a.png" });

    const result = await resolveJsxImages(code);

    const useClientIdx = result.code.indexOf('"use client"');
    const mapDeclIdx = result.code.indexOf("const __imageUrls");
    expect(useClientIdx).toBe(0);
    expect(mapDeclIdx).toBeGreaterThan(useClientIdx);
  });
});

describe("prompt collection fallback (I2 regression)", () => {
  it("prefers regex-extracted prompts when eval collapses a shared prompt variable", async () => {
    const code = `
const members = [
  { name: "Alex", avatar: "portrait of Alex with glasses" },
  { name: "Amy",  avatar: "portrait of Amy smiling" },
  { name: "Ana",  avatar: "portrait of Ana with curly hair" },
];

export default function Team() {
  return (
    <ul>
      {members.map(m => <img key={m.name} data-generate-image={m.avatar} alt={m.name} />)}
    </ul>
  );
}
`.trim();

    mockedGenerate.mockImplementation(async ({ prompt }: { prompt: string }) => ({
      url: `https://example.com/${encodeURIComponent(prompt)}.png`,
    }));

    const result = await resolveJsxImages(code);

    // All three distinct avatars must appear in the generated url map —
    // no shared URL across members.
    for (const avatar of [
      "portrait of Alex with glasses",
      "portrait of Amy smiling",
      "portrait of Ana with curly hair",
    ]) {
      const encoded = encodeURIComponent(avatar);
      expect(result.code).toContain(`https://example.com/${encoded}.png`);
    }
  });
});

describe("src attribute stripping on re-run (I4 regression)", () => {
  it("does not stack src attributes when called on already-resolved source", async () => {
    const code = `
export default function A() {
  return (
    <img src={__imageUrls["stale"]} data-generate-image={"fresh"} />
  );
}
`.trim();

    mockedGenerate.mockResolvedValue({ url: "https://example.com/fresh.png" });

    const result = await resolveJsxImages(code);

    // Count src attributes per img tag — must be exactly one.
    const imgMatches = result.code.match(/<img\s[^>]*>/g) ?? [];
    for (const img of imgMatches) {
      const srcCount = (img.match(/\bsrc=/g) ?? []).length;
      expect(srcCount).toBe(1);
    }
  });

  it("strips string-literal src alongside JSX-expression src", async () => {
    const code = `
export default function A() {
  return (
    <img src="https://old.example.com/a.png" data-generate-image={"fresh"} />
  );
}
`.trim();

    mockedGenerate.mockResolvedValue({ url: "https://new.example.com/a.png" });

    const result = await resolveJsxImages(code);

    expect(result.code).not.toContain("old.example.com");
    expect(result.code).toContain("__imageUrls[");
  });
});

describe("failed-image fallback (I7 regression)", () => {
  it("maps rejected prompts to the shared FALLBACK_SVG so src is never undefined", async () => {
    const code = `
export default function A() {
  return <img data-generate-image={"will-fail"} />;
}
`.trim();

    mockedGenerate.mockRejectedValue(new Error("Gemini is on fire"));

    const result = await resolveJsxImages(code);

    // The declaration block should contain the fallback SVG URL.
    expect(result.code).toContain("const __imageUrls");
    expect(result.code).toContain("data:image/svg+xml");
    expect(result.failedCount).toBe(1);
    expect(result.errors).toContain("Gemini is on fire");

    // Spot-check: FALLBACK_SVG is a usable data URI
    expect(FALLBACK_SVG.startsWith("data:image/svg+xml,")).toBe(true);
  });
});

describe("hasJsxImageExpressions (existing behaviour guard)", () => {
  it("detects JSX expression attributes", () => {
    expect(hasJsxImageExpressions('<img data-generate-image={x} />')).toBe(true);
  });
  it("does not flag string-literal attributes", () => {
    expect(hasJsxImageExpressions('<img data-generate-image="x" />')).toBe(false);
  });
});
