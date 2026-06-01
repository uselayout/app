// The showcase ships as a TSX-as-string transpiled at runtime, so tsc/eslint
// never see its internals. These tests transpile it to a temp CommonJS module,
// require it, and render the App in jsdom — catching transpile failures,
// runtime exceptions, React hook-order errors (#310), and invalid style values
// (e.g. a NaN fontWeight) that the string-assertion tests can't see.
//
// They also exercise the bespoke compose path: a kit prepends a global
// `BESPOKE_BLOCKS` object whose section bodies override the generic ones, and a
// throwing bespoke block must fall back to the generic block (SectionErrorBoundary).
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

let counter = 0;

// Transpile `prefix + shell`, load it as a temp module (require, no eval),
// render it in jsdom, and return the container + any console.error output.
async function renderShowcase(prefix = ""): Promise<{ container: HTMLElement; errors: string[] }> {
  const js = await transpileTsx(prefix + KIT_SHOWCASE_TSX);
  const file = join(tmpdir(), `showcase-${process.pid}-${counter++}.cjs`);
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
  const errors: string[] = [];
  const spy = vi.spyOn(console, "error").mockImplementation((...a) => errors.push(a.join(" :: ")));
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(App as React.FC));
  });
  await act(async () => {}); // flush the mount effect that loads CSS vars
  spy.mockRestore();
  // Intentionally not unmounting: callers assert against the live container.
  return { container, errors };
}

describe("kit-showcase-source — uniform render", () => {
  it("transpiles and mounts the full navigable reference cleanly", async () => {
    const { container, errors } = await renderShowcase();
    expect(errors).toEqual([]);
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelectorAll("main section[id]").length).toBeGreaterThan(8);
    expect(container.textContent).toContain("Buttons");
    // Generic buttons block renders its standard labels.
    expect(container.textContent).toContain("Primary");
  });
});

describe("kit-showcase-source — bespoke compose path", () => {
  it("renders a bespoke block when BESPOKE_BLOCKS overrides a section", async () => {
    const prefix = `const BESPOKE_BLOCKS = {
      buttons: function (ctx) {
        return React.createElement("button", { style: { background: ctx.accent, color: ctx.onAccent } }, "BESPOKE_BTN_MARKER");
      }
    };
`;
    const { container, errors } = await renderShowcase(prefix);
    expect(errors).toEqual([]);
    // The bespoke buttons body is used...
    expect(container.textContent).toContain("BESPOKE_BTN_MARKER");
    // ...and the shell (nav + sections + generic foundations) is intact.
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelectorAll("main section[id]").length).toBeGreaterThan(8);
    expect(container.textContent).toContain("Data table"); // generic section still present
  });

  it("falls back to the generic block when a bespoke block throws", async () => {
    const prefix = `const BESPOKE_BLOCKS = {
      buttons: function () { throw new Error("intentional bespoke failure"); }
    };
`;
    // React logs the caught boundary error to console.error, so we don't assert
    // zero errors here — we assert the page survived and fell back to generic.
    const { container } = await renderShowcase(prefix);
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelectorAll("main section[id]").length).toBeGreaterThan(8);
    // Generic ButtonsBlock fallback rendered its standard labels.
    expect(container.textContent).toContain("Primary");
    // Other sections still rendered.
    expect(container.textContent).toContain("Data table");
  });
});
