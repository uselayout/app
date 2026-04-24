import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Layout vs Google's design.md | Layout",
  description:
    "Google just open-sourced design.md. Here's how Layout compares: a full-stack product vs a format spec, with interop baked in. Multi-source extraction, Figma sync, MCP server, AI variant generation, and a Kit Gallery.",
  openGraph: {
    title: "Layout vs Google's design.md",
    description:
      "Google shipped a format. Layout shipped the product around it. Side-by-side comparison, with credit where due.",
    type: "website",
  },
};

const SAME = [
  "Dual-layer format: machine-readable tokens plus human-readable prose",
  "W3C DTCG tokens.json as a portable export target",
  "Tailwind config as an export target",
  "Agent-first positioning",
  "Open-source CLI (@layoutdesign/context on npm, @google/design.md on npm)",
  "Covers colours, typography, spacing, shapes, elevation, components, do's and don'ts",
  "Community kit collections",
  "Preserved extensibility — unknown sections survive round-trips",
];

const BETTER_LAYOUT = [
  {
    title: "Full product, not just a format",
    body:
      "Layout ships a browser Studio (AGPL-3.0), a CLI and MCP server (MIT), a Figma plugin, and a Chrome extension. Google shipped a spec and a CLI.",
  },
  {
    title: "Multi-source extraction",
    body:
      "Figma REST API, live Playwright websites, an inspect-as-you-browse Chrome extension, and a codebase scanner that reads Storybook CSF3 stories. design.md relies on hand-writing or a Google-only stitch-skills path.",
  },
  {
    title: "Bidirectional Figma sync",
    body:
      "Layout's Figma plugin pushes and pulls tokens, subscribes to FILE_UPDATE webhooks, and auto-regenerates the design system on change. design.md has no Figma integration.",
  },
  {
    title: "Multi-mode tokens shipped",
    body:
      "Light and dark tokens co-exist in Layout's layout.md, tokens.json ($extensions.mode), tokens.css ([data-theme=\"dark\"]), and Tailwind config (darkMode). In design.md this is still open issue #13.",
  },
  {
    title: "14-tool MCP server",
    body:
      "get-design-system, get-tokens, get-component, check-compliance, preview, push-to-figma, design-in-figma, url-to-figma, update-tokens, scan-project, check-setup, and more. Works in Claude Code, Cursor, Windsurf, Copilot. design.md distributes through Google's Agent Skills standard only.",
  },
  {
    title: "Live preview + AI variant generation",
    body:
      "Layout's Explorer generates 2–6 variants per prompt, refines via image uploads, scores compliance, promotes to a component library, and pushes to Figma. A local preview server renders transpiled TSX at :4321. design.md has no generation or preview surface.",
  },
  {
    title: "Three-tier token system",
    body:
      "Primitive → Semantic → Component tokens, each with confidence annotations (/* extracted: high */ vs /* reconstructed: moderate */). design.md is flat: one level, no provenance.",
  },
  {
    title: "Richer component format",
    body:
      "Layout components carry props, variants, states, tokensUsed, versioning, status (draft|approved|deprecated), and source (manual|explorer|extraction|figma). design.md components are variant names in YAML.",
  },
  {
    title: "Design-in-Figma and URL-to-Figma",
    body:
      "Prompt → editable Figma frames with auto-layout and token-mapped styles. Capture a live URL as a Figma frame. Neither exists in design.md.",
  },
  {
    title: "Community Kit Gallery",
    body:
      "Layout's gallery at layout.design/gallery is a first-party platform where anyone can publish a kit from a Studio project and anyone else can import it in one click. design.md relies on an external awesome-list repo and PR-driven contributions.",
  },
];

const BETTER_GOOGLE = [
  {
    title: "Seven-rule CLI linter",
    body:
      "Broken refs, missing primaries, WCAG AA contrast, orphans, circular aliases, section ordering, property validation. Layout's check-compliance runs on generated code; design.md's lint runs on the file itself. We're adopting this.",
  },
  {
    title: "diff command in the CLI",
    body:
      "Token-level change detection between versions, JSON output for agents. Layout has extraction-diff in the UI but not the CLI. We're adopting this.",
  },
  {
    title: "import command (DTCG → DESIGN.md)",
    body:
      "Reverse of export, so existing DTCG-only projects can migrate. Layout exports but doesn't yet import the same way. We're adopting this.",
  },
  {
    title: "Formal published spec",
    body:
      "Google shipped a clean docs/spec.md. Layout's spec lives inside a synthesise.ts system prompt today, which is fine for generation and weak for SEO. We're publishing a formal spec.",
  },
  {
    title: "Distribution via awesome-design-md",
    body:
      "64k stars on a curated list of 69 brand DESIGN.md files. Layout has three kits and a gallery; we're building an adjacent awesome-layout-md repo with nightly sync from the gallery.",
  },
];

const ADOPTING = [
  "layout lint — CLI linter with the same seven rules plus a contrast-ratio annotator",
  "layout diff — version-to-version token diffing with CI-friendly JSON output",
  "layout import --from tokens.json — fully interoperable with DTCG",
  "Formal spec page at layout.design/spec",
  "uselayout/awesome-layout-md — curated public kit index",
  "Companion design.md in the export bundle so agents trained on Google's format pick us up too",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-[28px] leading-[32px] font-normal tracking-[-0.7px] text-[var(--mkt-text-primary)]">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Row({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--mkt-border)] bg-[#101014] p-5">
      <h3 className="text-[16px] leading-[22px] text-[var(--mkt-text-primary)] font-medium">{title}</h3>
      <p className="text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">{body}</p>
    </div>
  );
}

export default function VsDesignMdPage() {
  return (
    <main className="min-h-screen bg-[var(--mkt-bg)] text-[var(--mkt-text-primary)]">
      <section className="pt-[100px] pb-12 lg:pt-[140px]">
        <div className="max-w-[900px] mx-auto px-6 flex flex-col gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--mkt-text-secondary)] hover:text-white self-start"
          >
            ← Back
          </Link>
          <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full border border-[var(--mkt-border)] text-[12px] text-[var(--mkt-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--mkt-accent)]" />
            Competitive analysis
          </div>
          <h1 className="text-[40px] leading-[44px] md:text-[56px] md:leading-[60px] tracking-[-1.4px] font-normal">
            Layout vs Google&apos;s design.md
          </h1>
          <p className="text-[18px] leading-[26px] text-[var(--mkt-text-secondary)]">
            Google just open-sourced{" "}
            <a
              href="https://github.com/google-labs-code/design.md"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white"
            >
              design.md
            </a>
            : a YAML and Markdown format for describing design systems to AI coding agents. It is a clean, well-scoped spec, and it validates the category publicly. Here is how it compares to Layout, with credit where credit is due.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/gallery"
              className="px-5 py-2.5 rounded-full bg-white text-[#08090a] text-[14px] font-medium hover:bg-white/90 transition-colors"
            >
              Browse the Kit Gallery
            </Link>
            <a
              href="https://www.npmjs.com/package/@layoutdesign/context"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full border border-[var(--mkt-border)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-white/5 transition-colors"
            >
              Install the CLI
            </a>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="max-w-[900px] mx-auto px-6">
          <p className="text-[13px] uppercase tracking-wide text-[var(--mkt-text-muted)] mb-3">TL;DR</p>
          <p className="text-[20px] leading-[30px] text-[var(--mkt-text-primary)]">
            design.md is a well-crafted <em>format</em>. Layout is the <em>product</em> around a superset of it — with multi-source extraction, bidirectional Figma sync, a 14-tool MCP server, an AI variant generator, a Kit Gallery, and full interoperability with Google&apos;s format through a companion export and matching DTCG tokens.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-[900px] mx-auto px-6">
          <Section title="Where Layout and design.md agree">
            <ul className="flex flex-col gap-2 text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
              {SAME.map((s) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mkt-accent)]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-[900px] mx-auto px-6">
          <Section title="Where Layout goes further">
            {BETTER_LAYOUT.map((row) => (
              <Row key={row.title} {...row} />
            ))}
          </Section>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-[900px] mx-auto px-6">
          <Section title="What design.md does well">
            {BETTER_GOOGLE.map((row) => (
              <Row key={row.title} {...row} />
            ))}
          </Section>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-[900px] mx-auto px-6">
          <Section title="What we are adopting from them">
            <ul className="flex flex-col gap-2 text-[14px] leading-[22px] text-[var(--mkt-text-secondary)]">
              {ADOPTING.map((s) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mkt-accent)]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </section>

      <section className="pb-32">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="rounded-3xl border border-[var(--mkt-border)] bg-[#101014] p-10">
            <h2 className="text-[28px] leading-[32px] font-normal tracking-[-0.7px] mb-3">
              design.md is a good spec. Layout is a product.
            </h2>
            <p className="text-[16px] leading-[24px] text-[var(--mkt-text-secondary)] mb-6">
              If you want to hand-author a file that describes your design system to an agent, design.md will serve you well. If you want the design system extracted from your Figma, inspected live in Chrome, synced bidirectionally, generated into variants, exported to every agent ecosystem, and published in a community gallery — that is Layout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-full bg-white text-[#08090a] text-[14px] font-medium hover:bg-white/90 transition-colors"
              >
                Try Layout
              </Link>
              <Link
                href="/docs/compare"
                className="px-5 py-2.5 rounded-full border border-[var(--mkt-border)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-white/5 transition-colors"
              >
                Compare to other tools
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
