// The showcase ships as a TSX-as-string transpiled at runtime, so tsc/eslint
// never see its internals. This test transpiles it to a temp CommonJS module,
// requires it, and renders the App in jsdom — catching transpile failures,
// runtime exceptions, React hook-order errors (#310), and invalid style values
// (e.g. a NaN fontWeight) that the string-assertion tests can't see.
import { describe, it, expect, vi, beforeAll } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createRequire } from "node:module";
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { KIT_SHOWCASE_TSX } from "./kit-showcase-source";
import { transpileTsx } from "@/lib/transpile";

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  g.IS_REACT_ACT_ENVIRONMENT = true;
  // The real showcase runs in a browser iframe; jsdom lacks these.
  g.React = React;
  g.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const proto = Element.prototype as unknown as { scrollIntoView?: () => void };
  if (!proto.scrollIntoView) {
    proto.scrollIntoView = () => {};
  }
});

describe("kit-showcase-source — renders without throwing", () => {
  it("transpiles and mounts the full navigable reference cleanly", async () => {
    const js = await transpileTsx(KIT_SHOWCASE_TSX);

    // Load the CommonJS output via a temp module file + require (no eval).
    const file = join(tmpdir(), `showcase-render-${process.pid}.cjs`);
    writeFileSync(file, js, "utf8");
    let App: unknown;
    try {
      const req = createRequire(import.meta.url);
      delete req.cache[file];
      const mod = req(file);
      App = (mod as { default?: unknown }).default ?? mod;
    } finally {
      rmSync(file, { force: true });
    }
    expect(typeof App).toBe("function");

    const container = document.createElement("div");
    document.body.appendChild(container);

    // Any console.error here means a React warning (hook order, invalid style
    // value, key warning, etc.) — treat all as failures.
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => errors.push(a.join(" :: ")));

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(App as React.FC));
    });
    // Flush the mount effect that loads CSS vars and renders the sections.
    await act(async () => {});
    spy.mockRestore();

    expect(errors).toEqual([]);
    // Two-pane navigable shell with anchored sections actually rendered.
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelectorAll("main section[id]").length).toBeGreaterThan(8);
    expect(container.textContent).toContain("Buttons");

    root.unmount();
  });
});
