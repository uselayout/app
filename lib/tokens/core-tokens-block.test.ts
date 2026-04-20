import { describe, expect, it } from "vitest";
import { CORE_TOKENS_BLOCK_REGEX, CORE_TOKENS_BLOCK_SPLIT_REGEX } from "./core-tokens-block";

const block = (decorated: string) =>
  "```css\n" + decorated + "\n--color-primary: #fff;\n```";

describe("CORE_TOKENS_BLOCK_REGEX", () => {
  it("matches em-dash delimiters (curated sync format)", () => {
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* ── CORE TOKENS ── */"))).toBe(true);
  });

  it("matches equals delimiters (Claude synthesis format)", () => {
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* === CORE TOKENS === */"))).toBe(true);
  });

  it("matches equals delimiters with a trailing project name", () => {
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* === CORE TOKENS — Perplexity === */"))).toBe(
      true
    );
  });

  it("matches hyphen delimiters", () => {
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* -- CORE TOKENS -- */"))).toBe(true);
  });

  it("matches no delimiters at all", () => {
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* CORE TOKENS */"))).toBe(true);
  });

  it("matches mixed/long runs of decorators", () => {
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* ──── CORE TOKENS ──── */"))).toBe(true);
    expect(CORE_TOKENS_BLOCK_REGEX.test(block("/* ==== CORE TOKENS ==== */"))).toBe(true);
  });

  it("does not match an unrelated CSS block", () => {
    const unrelated = "```css\n/* QUICK NOTES */\n--x: 1;\n```";
    expect(CORE_TOKENS_BLOCK_REGEX.test(unrelated)).toBe(false);
  });
});

describe("CORE_TOKENS_BLOCK_SPLIT_REGEX", () => {
  it("captures body and closing fence as separate groups across delimiter formats", () => {
    for (const decorated of [
      "/* === CORE TOKENS === */",
      "/* ── CORE TOKENS ── */",
      "/* -- CORE TOKENS -- */",
      "/* CORE TOKENS */",
    ]) {
      const match = block(decorated).match(CORE_TOKENS_BLOCK_SPLIT_REGEX);
      expect(match, `expected to match: ${decorated}`).not.toBeNull();
      expect(match![2]).toBe("\n```");
      expect(match![1]).toContain("CORE TOKENS");
    }
  });
});
