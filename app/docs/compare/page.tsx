"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const COMPETITORS = [
  "Layout",
  "Claude Design",
  "Google design.md",
  "Paper.design",
  "Magic Patterns",
  "MagicPath",
  "Variant",
  "Figma Dev Mode",
  "Pencil.dev",
] as const;

type Competitor = (typeof COMPETITORS)[number];
type CellValue = true | false | string;

interface ComparisonRow {
  feature: string;
  values: Record<Competitor, CellValue>;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: "Extract from Figma",
    values: {
      Layout: true,
      "Claude Design": "Onboarding only",
      "Google design.md": false,
      "Paper.design": false,
      "Magic Patterns": "Import only",
      MagicPath: "Import only",
      Variant: false,
      "Figma Dev Mode": "Native",
      "Pencil.dev": false,
    },
  },
  {
    feature: "Extract from live websites",
    values: {
      Layout: true,
      "Claude Design": "Web capture",
      "Google design.md": "Manual (Stitch)",
      "Paper.design": false,
      "Magic Patterns": "Chrome Ext",
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": false,
    },
  },
  {
    feature: "LLM-optimised context output",
    values: {
      Layout: "layout.md",
      "Claude Design": "Claude-only bundle",
      "Google design.md": "DESIGN.md",
      "Paper.design": false,
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": "Partial",
    },
  },
  {
    feature: "Works in your IDE / terminal",
    values: {
      Layout: true,
      "Claude Design": false,
      "Google design.md": "CLI + skills",
      "Paper.design": "Desktop app",
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": "VS Code",
    },
  },
  {
    feature: "MCP server for AI agents",
    values: {
      Layout: "20 tools",
      "Claude Design": false,
      "Google design.md": false,
      "Paper.design": "24 tools",
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": "~25 tools",
      "Pencil.dev": true,
    },
  },
  {
    feature: "Gates AI edits to design tokens",
    values: {
      Layout: "Layout Live",
      "Claude Design": "Checks own output",
      "Google design.md": false,
      "Paper.design": false,
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": false,
    },
  },
  {
    feature: "Design system structuring",
    values: {
      Layout: "9-section file",
      "Claude Design": "Internal only",
      "Google design.md": "8-section file",
      "Paper.design": "Roadmap",
      "Magic Patterns": "Style presets",
      MagicPath: "Token presets",
      Variant: false,
      "Figma Dev Mode": "Raw JSON",
      "Pencil.dev": "Partial",
    },
  },
  {
    feature: "Custom font support",
    values: {
      Layout: "Upload + auto-detect",
      "Claude Design": false,
      "Google design.md": false,
      "Paper.design": false,
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": false,
    },
  },
  {
    feature: "Multi-agent support",
    values: {
      Layout: "All major",
      "Claude Design": "Claude only",
      "Google design.md": "Agent Skills",
      "Paper.design": "All major",
      "Magic Patterns": "Own platform",
      MagicPath: "Own platform",
      Variant: "Own platform",
      "Figma Dev Mode": "Figma only",
      "Pencil.dev": "VS Code",
    },
  },
  {
    feature: "Open source",
    values: {
      Layout: "AGPL-3.0",
      "Claude Design": false,
      "Google design.md": "Apache 2.0",
      "Paper.design": false,
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": false,
    },
  },
];

// Layout Live competes in a different category to Studio: visual-edit tools
// that touch a running app. Kept as its own data set so the Studio table above
// stays focused on design-system / context tooling.
const LIVE_COMPETITORS = [
  "Layout Live",
  "Cursor Design Mode",
  "Onlook",
  "stagewise",
  "Figma Make",
  "Figma Make (local)",
] as const;

type LiveCompetitor = (typeof LIVE_COMPETITORS)[number];

interface LiveComparisonRow {
  feature: string;
  values: Record<LiveCompetitor, CellValue>;
}

const LIVE_COMPARISON_DATA: LiveComparisonRow[] = [
  {
    feature: "Edits your real running dev server",
    values: {
      "Layout Live": true,
      "Cursor Design Mode": "Own browser",
      Onlook: "Cloud sandbox",
      stagewise: "Browser toolbar",
      "Figma Make": "Make app",
      "Figma Make (local)": "Mac-only beta",
    },
  },
  {
    feature: "Deterministic edit, no AI token cost",
    values: {
      "Layout Live": "AST rewrite",
      "Cursor Design Mode": "Agent-applied",
      Onlook: "AI-assisted",
      stagewise: "AI writes",
      "Figma Make": "Agent + PR",
      "Figma Make (local)": "AI-mediated, metered",
    },
  },
  {
    feature: "Design-token compliance score",
    values: {
      "Layout Live": true,
      "Cursor Design Mode": "Token-aware",
      Onlook: false,
      stagewise: false,
      "Figma Make": false,
      "Figma Make (local)": false,
    },
  },
  {
    feature: "Per-breakpoint non-destructive editing",
    values: {
      "Layout Live": true,
      "Cursor Design Mode": false,
      Onlook: false,
      stagewise: false,
      "Figma Make": false,
      "Figma Make (local)": false,
    },
  },
  {
    feature: "Two-way sync with your source",
    values: {
      "Layout Live": true,
      "Cursor Design Mode": true,
      Onlook: "Sandbox only",
      stagewise: "Via agent",
      "Figma Make": false,
      "Figma Make (local)": "One-way",
    },
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        className="mx-auto"
      >
        <path
          d="M5 10.5L8.5 14L15 7"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (value === false) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        className="mx-auto opacity-40"
      >
        <path
          d="M6 6L14 14M14 6L6 14"
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return <span>{value}</span>;
}

interface Objection {
  question: string;
  answer: string;
}

const OBJECTIONS: Objection[] = [
  {
    question:
      "Anthropic just shipped Claude Design \u2014 doesn\u2019t that make Layout redundant?",
    answer:
      "Claude Design is an Anthropic Labs product. Their own framing is \u201ca way for non-designers to make visuals,\u201d and it exports to Canva and PowerPoint. It\u2019s a chat-surface design tool competing with Figma and Canva, not a context layer feeding AI coding agents. Anthropic structurally can\u2019t be model-agnostic \u2014 their incentive is to make Claude the only agent that matters. Layout extracts your design system once and ships it as a portable bundle (layout.md + W3C DTCG tokens + .cursorrules + MCP) that Cursor, Copilot, Windsurf, Codex, Gemini CLI, and Claude Code all consume the same way. Different layer of the stack, different buyer. The right analogue is Cursor: same \u201cwon\u2019t the model lab kill them?\u201d objection 18 months ago, now a $9B company.",
  },
  {
    question:
      "Claude Design extracts design systems from Figma and codebases too. What\u2019s actually different?",
    answer:
      "Where the bundle goes. Claude Design\u2019s extracted design system stays inside Anthropic\u2019s walled garden \u2014 it powers their canvas and the handoff to Claude Code only. Layout\u2019s output is portable: tokens.css, tokens.json (W3C DTCG), CLAUDE.md, .cursor/rules, Windsurf rules, tailwind.config.js, plus an MCP server with 20 tools (compliance checking, drift detection, component lookup). It travels to every agent and every IDE the team uses. Layout also extracts from sources Claude Design doesn\u2019t \u2014 live websites via Playwright, Storybook CSF3 stories, Chrome extension capture, and a native Figma plugin with bidirectional Variables sync.",
  },
  {
    question:
      "Paper.design has 24 MCP tools \u2014 isn\u2019t that more powerful?",
    answer:
      "Paper is a design canvas with MCP write access \u2014 agents create and modify designs inside Paper. Layout is a design system compiler \u2014 agents consume your existing design system context to write better code in your codebase. Paper replaces Figma. Layout works with Figma. Different tools, actually complementary.",
  },
  {
    question:
      "Magic Patterns and MagicPath have design system import too.",
    answer:
      "They import your design system into their canvas. Layout exports it into your IDE. They generate prototypes you screenshot and hand off. Layout generates context that makes Claude Code, Cursor, Windsurf, Copilot, Codex, and Gemini CLI produce on-brand code directly in your codebase. No copy-paste. No handoff gap.",
  },
  {
    question: "Figma Dev Mode has an MCP server now.",
    answer:
      "Figma\u2019s MCP has grown to roughly 25 tools for accessing file-level design data: node trees, variables, screenshots, Code Connect mappings, and design generation. It\u2019s excellent for implementing a specific screen, and it\u2019s metered: free and view seats get 6 MCP calls a month. Layout solves a different problem: it extracts the design system itself (tokens, components, spacing rules, anti-patterns) from Figma or any website into files and an unmetered local MCP server, so your AI agent can build anything on-brand, and Layout Live gates the edits that land.",
  },
  {
    question:
      "Can\u2019t I just paste my design tokens into the AI prompt?",
    answer:
      "You could paste a colour palette. But LLMs also need typography scales, spacing grids, component naming conventions, border-radius rules, motion tokens, and anti-patterns. Layout extracts all of this automatically and keeps it updated. Manual prompts go stale on the first Figma change.",
  },
  {
    question:
      "Variant.ai generates beautiful designs \u2014 why do I need this?",
    answer:
      "Variant generates new designs. Layout ensures your existing design system is faithfully reproduced by AI coding agents. If you\u2019re building a product with an established brand, you need consistency, not novelty. They solve different problems.",
  },
  {
    question: "Pencil.dev does design-to-code in the IDE.",
    answer:
      "Pencil is an IDE-native design canvas \u2014 you design inside VS Code. Layout doesn\u2019t ask anyone to change tools. Designers stay in Figma, developers stay in their terminal. Layout is invisible infrastructure between them.",
  },
  {
    question:
      "Can\u2019t AI agents just use system fonts or Google Fonts?",
    answer:
      "They can \u2014 until your brand uses a custom typeface. Most design-to-code tools ignore fonts entirely, leaving AI agents to guess or fall back to system-ui. Layout extracts font declarations, lets you upload custom font files (.woff2, .ttf), and bundles them in the export. Your AI agent gets the actual font files alongside the design tokens, so generated components render with the right typeface from the start.",
  },
  {
    question: "We already have Storybook / Zeroheight.",
    answer:
      "Great for humans. Not built for LLMs. Storybook serves rendered component previews. Zeroheight serves prose documentation. Neither produces structured, token-level context that AI coding agents can consume. Layout bridges that gap.",
  },
  {
    question: "Is this just a wrapper around Figma\u2019s API?",
    answer:
      "Figma\u2019s API gives raw file data. Layout interprets it \u2014 resolving style references to actual values, grouping tokens by semantic role, generating spacing scales, identifying component patterns, and synthesising everything into a 9-section context file optimised for LLM consumption. Extraction + synthesis, not a passthrough.",
  },
];

export default function ComparePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          How Layout Compares
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Most tools below are design canvases or single-vendor coding agents
          &mdash; you generate UI inside their platform, or your design system
          context only works with one model. Layout is different: it extracts
          your design system once and ships it as a portable bundle that
          Cursor, Copilot, Windsurf, Codex, Gemini CLI, and Claude Code all
          consume the same way. Model-agnostic by design.
        </p>
      </div>

      {/* Comparison table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Feature Comparison
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a] w-[170px]">
                  Feature
                </th>
                {COMPETITORS.map((name) => (
                  <th
                    key={name}
                    className={`px-3 py-3 text-center font-semibold whitespace-nowrap ${
                      name === "Layout"
                        ? "text-[#0a0a0a] bg-gray-100"
                        : "text-gray-500"
                    }`}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COMPARISON_DATA.map((row) => (
                <tr key={row.feature} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {row.feature}
                  </td>
                  {COMPETITORS.map((name) => (
                    <td
                      key={name}
                      className={`px-3 py-3 text-center text-xs ${
                        name === "Layout"
                          ? "bg-gray-50 text-[#0a0a0a] font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      <CellContent value={row.values[name]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Competitor summaries */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Who Are These Tools?
        </h2>
        <div className="space-y-4">
          {[
            {
              name: "Claude Design",
              desc: "Anthropic Labs research preview launched April 2026. Chat-surface design tool that turns prompts into prototypes, reads existing Figma files or repos to set up a design system, and exports a structured handoff bundle to Claude Code. Bundled into Pro/Max/Team subscriptions.",
              relationship:
                "Different layer of the stack. Claude Design is a design tool competing with Figma and Canva (its own framing is \u201cvisuals for non-designers\u201d; exports go to Canva and PowerPoint). Layout is the context layer that feeds every AI coding agent \u2014 Cursor, Copilot, Windsurf, Codex, Gemini CLI, and Claude Code. Claude Design\u2019s extracted design system is locked to Anthropic\u2019s surfaces: it builds a design system from your codebase and checks its own output, but there is no agent-agnostic export and no gating of edits made by other agents. Layout\u2019s bundle is portable W3C DTCG tokens, layout.md, .cursorrules, and MCP that any agent can consume, with Layout Live gating the edits.",
            },
            {
              name: "Paper.design",
              desc: "Agent-first design canvas built on real HTML/CSS. 24 MCP tools with read and write access. Founded by Stephen Haney (built Radix/Modulz).",
              relationship:
                "Complementary. Paper is a canvas, Layout is a compiler. Layout ships a Push to Paper action on Explorer variants that sends HTML/CSS straight onto a Paper artboard via Paper\u2019s MCP.",
            },
            {
              name: "Magic Patterns",
              desc: "AI prototype generator for product teams. Full design system import from Figma, Storybook, and Chrome Extension. Enterprise customers include DoorDash and KPMG. SOC 2 + ISO 27001.",
              relationship:
                "Different category \u2014 Magic Patterns generates prototypes inside their platform. Layout feeds context to AI agents in your IDE.",
            },
            {
              name: "MagicPath.ai",
              desc: "AI infinite canvas with \u201CFigma Connect\u201D \u2014 paste Figma designs in, preserving layout and styles. Design system token presets. By Pietro Schirano (ex-Uber).",
              relationship:
                "Different category \u2014 MagicPath is a design canvas with Figma import. Layout extracts and packages design systems for AI agents.",
            },
            {
              name: "Variant.ai",
              desc: "Endless AI design generation from text prompts. Style Dropper extracts visual DNA from any design. HTML and React code export. No design system import.",
              relationship:
                "Different problem \u2014 Variant generates new designs. Layout ensures existing designs are faithfully reproduced by AI.",
            },
            {
              name: "Figma Dev Mode",
              desc: "Native Figma developer experience with inspect, code snippets, and an MCP server that has grown to roughly 25 tools with read and write access.",
              relationship:
                "Partial overlap \u2014 Figma MCP serves raw file data. Layout serves structured, LLM-optimised design system context.",
            },
            {
              name: "Pencil.dev",
              desc: "IDE-native design canvas with .pen format and MCP server. Design inside VS Code. Currently in free early access.",
              relationship:
                "Different approach \u2014 Pencil asks you to design in the IDE. Layout works with your existing Figma files.",
            },
          ].map(({ name, desc, relationship }) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 px-5 py-4 space-y-2"
            >
              <h3 className="text-base font-semibold text-[#0a0a0a]">
                {name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              <p className="text-sm text-gray-500 leading-relaxed italic">
                {relationship}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Layout Live comparison */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Layout Live vs Visual-Edit Tools
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout Live is a different product with a different competitive set. It
          is a desktop app that turns your running app into a direct-manipulation
          canvas &mdash; click an element, scrub a value, and the edit is written
          straight to your source as an on-token Tailwind class. Visually editing
          a running app is no longer rare. What nobody else combines is editing
          your <em>real</em> dev server, a deterministic write with <em>no AI
          token cost</em>, and a live design-system compliance score that keeps
          every edit on-system.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a] w-[170px]">
                  Capability
                </th>
                {LIVE_COMPETITORS.map((name) => (
                  <th
                    key={name}
                    className={`px-3 py-3 text-center font-semibold whitespace-nowrap ${
                      name === "Layout Live"
                        ? "text-[#0a0a0a] bg-gray-100"
                        : "text-gray-500"
                    }`}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LIVE_COMPARISON_DATA.map((row) => (
                <tr key={row.feature} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {row.feature}
                  </td>
                  {LIVE_COMPETITORS.map((name) => (
                    <td
                      key={name}
                      className={`px-3 py-3 text-center text-xs ${
                        name === "Layout Live"
                          ? "bg-gray-50 text-[#0a0a0a] font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      <CellContent value={row.values[name]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed italic">
          Cursor Design Mode is the closest, with the same sliders and
          token-awareness, but it edits inside Cursor&rsquo;s own browser, applies
          changes through its agent, and has no compliance score. Onlook pivoted
          to a cloud sandbox; stagewise pipes context to an AI that does the
          writing; Figma Make opens a pull request. Figma Make can now edit a
          local codebase too, but every edit is AI-mediated and metered, the
          beta is Mac-only, sync is one-way, and it has no design-token
          awareness. Layout Live is the only one that rewrites your real source
          deterministically, on your own dev server, gated to your design
          tokens.
        </p>
      </section>

      {/* Objections / FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Common Questions
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          How Layout fits alongside other tools in the design-to-code
          ecosystem.
        </p>

        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {OBJECTIONS.map((obj, i) => {
            const isOpen = openIndex === i;
            return (
              <button
                key={i}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full text-left py-4 group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`text-sm font-medium leading-relaxed transition-colors ${
                      isOpen
                        ? "text-[#0a0a0a]"
                        : "text-gray-700 group-hover:text-[#0a0a0a]"
                    }`}
                  >
                    {obj.question}
                  </span>
                  <span
                    className={`text-gray-400 text-lg leading-[22px] shrink-0 transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "max-h-[300px] mt-2 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-gray-600 pr-8">
                    {obj.answer}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bottom line */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
        <h3 className="text-base font-semibold text-[#0a0a0a]">
          The bottom line
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Layout is infrastructure that enforces your design system in any
          agent. It extracts the system from Figma or a live website, serves it
          unmetered to Claude Code, Cursor, Windsurf, Copilot, Codex and Gemini
          CLI, and gates every edit to your tokens with Layout Live. Designers
          stay in Figma. Developers stay in their terminal. Layout is the
          enforcement layer between them.
        </p>
      </section>

      {/* Prev / Next navigation */}
      <nav className="flex items-center justify-between border-t border-gray-200 pt-8">
        <div>
          <Link
            href="/docs/self-hosting"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Self-Hosting
          </Link>
        </div>
        <div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Introduction
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>
    </div>
  );
}
