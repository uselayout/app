"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const COMPETITORS = [
  "Layout",
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
      Layout: "12 tools",
      "Paper.design": "24 tools",
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": "11 tools",
      "Pencil.dev": true,
    },
  },
  {
    feature: "Design system structuring",
    values: {
      Layout: "9-section file",
      "Paper.design": "Roadmap",
      "Magic Patterns": "Style presets",
      MagicPath: "Token presets",
      Variant: false,
      "Figma Dev Mode": "Raw JSON",
      "Pencil.dev": "Partial",
    },
  },
  {
    feature: "Multi-agent support",
    values: {
      Layout: "All major",
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
      "Paper.design": false,
      "Magic Patterns": false,
      MagicPath: false,
      Variant: false,
      "Figma Dev Mode": false,
      "Pencil.dev": false,
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
      "Paper.design has 24 MCP tools \u2014 isn\u2019t that more powerful?",
    answer:
      "Paper is a design canvas with MCP write access \u2014 agents create and modify designs inside Paper. Layout is a design system compiler \u2014 agents consume your existing design system context to write better code in your codebase. Paper replaces Figma. Layout works with Figma. Different tools, actually complementary.",
  },
  {
    question:
      "Magic Patterns and MagicPath have design system import too.",
    answer:
      "They import your design system into their canvas. Layout exports it into your IDE. They generate prototypes you screenshot and hand off. Layout generates context that makes Claude Code, Cursor, Antigravity, and Copilot produce on-brand code directly in your codebase. No copy-paste. No handoff gap.",
  },
  {
    question: "Figma Dev Mode has an MCP server now.",
    answer:
      "Figma\u2019s MCP has 11 tools for accessing file-level design data \u2014 node trees, variables, screenshots, and Code Connect mappings. It\u2019s excellent for implementing a specific screen. Layout solves a different problem: it extracts the design system itself (tokens, components, spacing rules, anti-patterns) from Figma or any website and serves it as structured context so your AI agent can build anything on-brand \u2014 not just reproduce an existing design.",
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
          Every tool below is a canvas or prototyping tool &mdash; you generate
          UI inside their platform. Layout is different: it&rsquo;s
          infrastructure that extracts and packages your design system so AI
          coding agents produce on-brand code in your own IDE.
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
              name: "Paper.design",
              desc: "Agent-first design canvas built on real HTML/CSS. 24 MCP tools with read and write access. Founded by Stephen Haney (built Radix/Modulz). $4.2M seed. $20/user/month Pro.",
              relationship:
                "Complementary \u2014 Paper is a canvas, Layout is a compiler. Layout context could feed into Paper\u2019s canvas.",
            },
            {
              name: "Magic Patterns",
              desc: "AI prototype generator for product teams. Full design system import from Figma, Storybook, and Chrome Extension. Enterprise customers include DoorDash and KPMG. $6M Series A. SOC 2 + ISO 27001.",
              relationship:
                "Different category \u2014 Magic Patterns generates prototypes inside their platform. Layout feeds context to AI agents in your IDE.",
            },
            {
              name: "MagicPath.ai",
              desc: "AI infinite canvas with \u201CFigma Connect\u201D \u2014 paste Figma designs in, preserving layout and styles. Design system token presets. By Pietro Schirano (ex-Uber). ~$14\u201320/month.",
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
              desc: "Native Figma developer experience with inspect, code snippets, and a 3-tool read-only MCP server. $12\u201335/seat/month.",
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
          Layout is infrastructure, not a canvas. It sits between your design
          system (in Figma or on a live website) and your AI coding agent (in
          Claude Code, Cursor, Antigravity, Copilot, or Windsurf). Your designers stay in
          Figma. Your developers stay in their terminal. Layout is invisible
          between them.
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
