import { describe, expect, it } from "vitest";
import { convertAvatarDivsToImgs } from "./pipeline";

describe("convertAvatarDivsToImgs — initials detection (I6 regression)", () => {
  it("matches two-letter ASCII initials (existing behaviour)", () => {
    const out = convertAvatarDivsToImgs(
      '<div className="w-10 h-10 rounded-full">SC</div>'
    );
    expect(out).toContain('<img');
    expect(out).toContain('alt="SC"');
    expect(out).toContain("data-generate-image");
  });

  it("matches non-ASCII initials (CJK, accented)", () => {
    const cjk = convertAvatarDivsToImgs(
      '<div className="rounded-full">李明</div>'
    );
    expect(cjk).toContain('<img');
    expect(cjk).toContain('alt="李明"');

    const accented = convertAvatarDivsToImgs(
      '<div className="rounded-full">Éø</div>'
    );
    expect(accented).toContain('alt="Éø"');
  });

  it("matches a first name longer than five letters (previously truncated to 5)", () => {
    const out = convertAvatarDivsToImgs(
      '<div className="rounded-full">Santiago</div>'
    );
    expect(out).toContain('alt="Santiago"');
    expect(out).toContain('<img');
  });

  it("matches mixed alphanumerics", () => {
    const out = convertAvatarDivsToImgs(
      '<div className="rounded-full">JD1</div>'
    );
    expect(out).toContain('alt="JD1"');
  });

  it("still respects the upper bound (20 chars) to avoid swallowing long paragraphs", () => {
    const long = "ThisIsTooLongToBeInitialsReally";
    const out = convertAvatarDivsToImgs(
      `<div className="rounded-full">${long}</div>`
    );
    // Too long — the content is left as a div, not converted to img.
    expect(out).toContain(`<div className="rounded-full">${long}</div>`);
    expect(out).not.toContain('<img');
  });
});

describe("convertAvatarDivsToImgs — same-initials collision (I11 regression)", () => {
  it("generates distinct prompts for two avatars with identical initials", () => {
    const html =
      '<div className="rounded-full">AA</div>' +
      '<div className="rounded-full">AA</div>' +
      '<div className="rounded-full">MJ</div>';
    const out = convertAvatarDivsToImgs(html);

    const prompts = [...out.matchAll(/data-generate-image="([^"]+)"/g)].map(
      (m) => m[1]
    );
    expect(prompts).toHaveLength(3);
    // All three prompts must be unique — the old behaviour produced two
    // identical "professional headshot portrait of a person, AA" prompts.
    expect(new Set(prompts).size).toBe(3);
    // First two still share the initials "AA" in their prompts, but differ
    // via the position counter.
    expect(prompts[0]).toContain("AA");
    expect(prompts[1]).toContain("AA");
    expect(prompts[0]).not.toBe(prompts[1]);
  });

  it("counter restarts per call (idempotent on re-invocation)", () => {
    const html =
      '<div className="rounded-full">AA</div><div className="rounded-full">BB</div>';
    const first = convertAvatarDivsToImgs(html);
    const second = convertAvatarDivsToImgs(html);
    expect(second).toBe(first);
  });
});
