import { describe, it, expect } from "vitest";
import { kitToRow, rowToKit } from "./kits";
import type { PublicKit } from "@/lib/types/kit";

// The kit-gallery feature suffered silently in past Project work when
// projectToRow and rowToProject drifted (see feedback_verify_db_roundtrip_
// before_shipping). Lock the contract from day one.

function makeKit(overrides: Partial<PublicKit> = {}): PublicKit {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "test-kit",
    name: "Test Kit",
    description: "A dark, minimal starter kit for SaaS products.",
    tags: ["dark", "minimal", "saas"],
    author: {
      orgId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      displayName: "Acme",
      avatarUrl: "https://example.com/avatar.png",
    },
    licence: "MIT",
    previewImageUrl: "https://example.com/preview.png",
    layoutMd: "# Test\n\nHello",
    tokensCss: ":root { --bg: #000; }",
    tokensJson: { color: { bg: { $type: "color", $value: "#000" } } },
    kitJson: {
      schemaVersion: 1,
      slug: "test-kit",
      name: "Test Kit",
      tags: ["dark", "minimal", "saas"],
      licence: "MIT",
      author: { orgId: "11111111-1111-1111-1111-111111111111" },
      tier: "minimal",
      publishedAt: "2026-04-24T00:00:00.000Z",
    },
    tier: "minimal",
    unlisted: false,
    featured: false,
    hidden: false,
    upvoteCount: 0,
    importCount: 0,
    viewCount: 0,
    createdAt: "2026-04-24T00:00:00.000Z",
    updatedAt: "2026-04-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("kits round-trip", () => {
  it("preserves all publisher-supplied fields through kitToRow -> rowToKit", () => {
    const kit = makeKit();
    const row = kitToRow(kit);

    // Simulate what the DB adds on insert so rowToKit sees a full KitRow shape.
    const fullRow = {
      ...row,
      featured: false,
      hidden: false,
      upvote_count: 0,
      import_count: 0,
      view_count: 0,
      github_folder: null,
      github_synced_at: null,
      showcase_custom_tsx: null,
      showcase_custom_js: null,
      showcase_generated_at: null,
      preview_generated_at: null,
      hero_image_url: null,
      hero_generated_at: null,
      created_at: kit.createdAt,
      updated_at: kit.updatedAt,
    };

    const roundTripped = rowToKit(fullRow);

    expect(roundTripped.slug).toBe(kit.slug);
    expect(roundTripped.name).toBe(kit.name);
    expect(roundTripped.description).toBe(kit.description);
    expect(roundTripped.tags).toEqual(kit.tags);
    expect(roundTripped.author).toEqual(kit.author);
    expect(roundTripped.licence).toBe(kit.licence);
    expect(roundTripped.previewImageUrl).toBe(kit.previewImageUrl);
    expect(roundTripped.layoutMd).toBe(kit.layoutMd);
    expect(roundTripped.tokensCss).toBe(kit.tokensCss);
    expect(roundTripped.tokensJson).toEqual(kit.tokensJson);
    expect(roundTripped.kitJson).toEqual(kit.kitJson);
    expect(roundTripped.tier).toBe(kit.tier);
    expect(roundTripped.unlisted).toBe(kit.unlisted);
  });

  it("handles rich-tier bundles without dropping fields", () => {
    const kit = makeKit({
      tier: "rich",
      richBundle: {
        components: [
          {
            name: "Button",
            slug: "button",
            code: "export const Button = () => null;",
            tokensUsed: ["--accent"],
          },
        ],
        fonts: [{ family: "Inter", url: "https://example.com/inter.woff2" }],
        brandingAssets: [
          {
            slot: "primary",
            variant: "colour",
            url: "https://example.com/logo.svg",
            name: "logo.svg",
            mimeType: "image/svg+xml",
          },
        ],
        contextDocuments: [
          { name: "voice.md", content: "# Voice", mimeType: "text/markdown" },
        ],
      },
    });

    const row = kitToRow(kit);
    const fullRow = {
      ...row,
      featured: false,
      hidden: false,
      upvote_count: 0,
      import_count: 0,
      view_count: 0,
      github_folder: null,
      github_synced_at: null,
      showcase_custom_tsx: null,
      showcase_custom_js: null,
      showcase_generated_at: null,
      preview_generated_at: null,
      hero_image_url: null,
      hero_generated_at: null,
      created_at: kit.createdAt,
      updated_at: kit.updatedAt,
    };
    const roundTripped = rowToKit(fullRow);

    expect(roundTripped.tier).toBe("rich");
    expect(roundTripped.richBundle).toEqual(kit.richBundle);
  });

  it("handles custom licence text", () => {
    const kit = makeKit({ licence: "custom", licenceCustom: "All rights reserved." });
    const row = kitToRow(kit);
    expect(row.licence_custom).toBe("All rights reserved.");
  });

  it("defaults unlisted to false when omitted in overrides", () => {
    const kit = makeKit({ unlisted: false });
    expect(kitToRow(kit).unlisted).toBe(false);
  });
});
