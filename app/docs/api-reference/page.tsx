import type { Metadata } from "next";
import Link from "next/link";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "API Reference | Layout Docs",
  description:
    "Complete reference for the 10 MCP tools exposed by the Layout CLI for AI coding agents.",
};

const tools = [
  {
    name: "get_design_system",
    description:
      "Returns the full layout.md file, or a specific named section of it. Use this as the first call when starting any UI task. It gives the agent the complete design context it needs to produce on-brand code.",
    parameters: [
      {
        name: "section",
        type: "string (optional)",
        description:
          'Named section to return. One of: "quick-reference", "colour", "typography", "spacing", "components", "elevation", "motion", "anti-patterns". Omit to return the full file.',
      },
    ],
    example: `// Agent calls this at the start of a UI task
const designSystem = await mcp.call("get_design_system");

// Or fetch a specific section to reduce token usage
const colourSystem = await mcp.call("get_design_system", {
  section: "colour"
});`,
  },
  {
    name: "get_tokens",
    description:
      "Returns design tokens in a specific format and optionally filtered by token type. Use this when you need raw token values for a stylesheet, Tailwind config, or JSON exchange.",
    parameters: [
      {
        name: "format",
        type: '"css" | "json" | "tailwind"',
        description:
          "Output format. css returns CSS custom properties, json returns W3C DTCG format, tailwind returns a theme extension object.",
      },
      {
        name: "type",
        type: '"colour" | "typography" | "spacing" | "radius" | "effect" (optional)',
        description: "Filter tokens by type. Omit to return all token types.",
      },
    ],
    example: `// Get all CSS tokens
const tokens = await mcp.call("get_tokens", { format: "css" });

// Get only colour tokens as JSON
const colours = await mcp.call("get_tokens", {
  format: "json",
  type: "colour"
});

// Get Tailwind theme extension
const tailwindTheme = await mcp.call("get_tokens", {
  format: "tailwind"
});`,
  },
  {
    name: "get_component",
    description:
      "Returns the full specification for a named component, including its anatomy, token mappings for all states, and a working TSX code example. Use this before building or modifying any component that exists in the design system.",
    parameters: [
      {
        name: "name",
        type: "string",
        description:
          'Component name, case-insensitive. Examples: "Button", "Card", "Input", "Modal". Use list_components to discover available names.',
      },
    ],
    example: `// Get the Button component spec before building it
const buttonSpec = await mcp.call("get_component", {
  name: "Button"
});

// Returns: anatomy, token mappings for default/hover/focus/active/disabled/loading/error,
// and a full TSX example using the design system tokens`,
  },
  {
    name: "list_components",
    description:
      "Returns an inventory of all components available in the design system, with name, description, variant count, and property definitions for each. Use this to discover what components exist before calling get_component.",
    parameters: [],
    example: `// Discover all available components
const components = await mcp.call("list_components");

// Returns an array like:
// [
//   { name: "Button", description: "Primary action element", variants: 4 },
//   { name: "Card", description: "Content container", variants: 2 },
//   ...
// ]`,
  },
  {
    name: "check_compliance",
    description:
      "Validates a code snippet against the design system rules defined in the Anti-Patterns section of layout.md. Returns a compliance score, a list of violations with line references, and suggested fixes. Run this before submitting any UI code.",
    parameters: [
      {
        name: "code",
        type: "string",
        description: "The TSX or CSS code snippet to validate.",
      },
      {
        name: "rules",
        type: "string[] (optional)",
        description:
          "Specific rule IDs to check against. Omit to run all rules.",
      },
    ],
    example: `const result = await mcp.call("check_compliance", {
  code: \`
    <div style={{ color: "#6366f1" }}>
      <button className="bg-blue-500 text-white px-4 py-2">
        Submit
      </button>
    </div>
  \`
});

// Returns:
// {
//   score: 42,
//   violations: [
//     { rule: "no-hardcoded-colours", line: 2, fix: "Use var(--color-primary) instead of #6366f1" },
//     { rule: "use-design-tokens", line: 3, fix: "Replace bg-blue-500 with bg-[var(--color-primary)]" }
//   ]
// }`,
  },
  {
    name: "preview",
    description:
      "Renders a TSX component snippet live in a local browser canvas at localhost:4321. The component is transpiled server-side and displayed in a sandboxed iframe with React and Tailwind loaded. Use this to visually confirm a component looks correct before committing the code.",
    parameters: [
      {
        name: "code",
        type: "string",
        description:
          "The TSX component code to render. Must be a valid React component.",
      },
      {
        name: "props",
        type: "Record<string, unknown> (optional)",
        description: "Props to pass to the rendered component.",
      },
    ],
    example: `// Render a component for visual review
await mcp.call("preview", {
  code: \`
    export default function PricingCard({ plan, price }: { plan: string; price: string }) {
      return (
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">{plan}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{price}</p>
        </div>
      );
    }
  \`,
  props: { plan: "Pro", price: "£19/mo" }
});
// Opens/refreshes localhost:4321 with the rendered component`,
  },
  {
    name: "push_to_figma",
    description:
      "Sends a rendered component to Figma as a set of editable frames via the Figma MCP plugin. The component is first rendered by the preview tool, then captured and pushed as vector-compatible frames that designers can inspect and modify. Requires the Figma MCP plugin to be installed.",
    parameters: [
      {
        name: "code",
        type: "string",
        description: "The TSX component code to render and push.",
      },
      {
        name: "pageName",
        type: "string (optional)",
        description:
          'Figma page to push the frame to. Defaults to "AI Components".',
      },
      {
        name: "frameName",
        type: "string (optional)",
        description:
          "Name for the created frame. Defaults to the component function name.",
      },
    ],
    example: `// Push a generated component to Figma for designer review
await mcp.call("push_to_figma", {
  code: \`
    export default function HeroBanner() {
      return (
        <section className="bg-[var(--color-bg-surface)] px-8 py-16">
          <h1 className="text-5xl font-black text-[var(--text-primary)]">
            Your AI builds on-brand.
          </h1>
        </section>
      );
    }
  \`,
  pageName: "Sprint 3 -  Components",
  frameName: "HeroBanner / Desktop"
});`,
  },
  {
    name: "url_to_figma",
    description:
      "Captures a public URL (a live webpage or web app) into Figma as a set of editable frames. Each capture includes both a full-page screenshot and a viewport-cropped version. Useful for documenting reference designs or snapshotting production UI alongside component work.",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "The public URL to capture.",
      },
      {
        name: "pageName",
        type: "string (optional)",
        description:
          'Figma page to push the frames to. Defaults to "URL Captures".',
      },
      {
        name: "viewports",
        type: "Array<{ width: number; height: number }> (optional)",
        description:
          "Viewport dimensions to capture. Defaults to desktop (1440×900) and mobile (390×844).",
      },
    ],
    example: `// Capture a reference site into Figma
await mcp.call("url_to_figma", {
  url: "https://linear.app",
  pageName: "Reference -  Linear",
  viewports: [
    { width: 1440, height: 900 },
    { width: 390, height: 844 }
  ]
});
// Creates annotated frames in Figma with the captured screenshots`,
  },
  {
    name: "design_in_figma",
    description:
      "Designs UI directly in Figma using your extracted design tokens. Takes a natural language prompt describing what to design, extracts the relevant colour, typography, and spacing tokens from your loaded kit, and returns structured instructions for the Figma MCP generate_figma_design tool.",
    parameters: [
      {
        name: "prompt",
        type: "string (required)",
        description:
          "Natural language description of what to design, e.g. 'A settings page with sidebar navigation'.",
      },
      {
        name: "fileKey",
        type: "string (optional)",
        description:
          "Figma file key to design into. If omitted, instructions are returned without a target file.",
      },
      {
        name: "viewports",
        type: "Array<{ width: number; height: number }> (optional)",
        description:
          "Viewport dimensions for the design. Defaults to desktop (1440×900).",
      },
    ],
    example: `// Design a dashboard directly in Figma using your tokens
await mcp.call("design_in_figma", {
  prompt: "A settings page with sidebar navigation and dark theme",
  fileKey: "EHmQZ1wq5qHUcifyRYtiBC"
});
// Returns token palette + Figma MCP instructions`,
  },
  {
    name: "update_tokens",
    description:
      "Updates or adds design tokens in the currently loaded kit. Accepts new token values and merges them into the existing token set, persisting changes to the kit files.",
    parameters: [
      {
        name: "tokens",
        type: "Record<string, string> (required)",
        description:
          "Object of token name-value pairs to add or update, e.g. { '--color-primary': '#6366F1' }.",
      },
      {
        name: "format",
        type: "'css' | 'json' | 'tailwind' (optional)",
        description:
          "Which token file to update. Defaults to 'css' (tokens.css).",
      },
    ],
    example: `// Add a new brand colour token
await mcp.call("update_tokens", {
  tokens: { "--color-brand": "#6366F1", "--color-brand-hover": "#7577F3" },
  format: "css"
});`,
  },
];

const loopDiagram = `Developer prompts Claude Code / Cursor
  │
  ▼
Claude calls get_design_system
  │  (loads colour, typography, spacing, component specs)
  ▼
Claude generates on-brand TSX
  │
  ▼
Claude calls preview
  │  (renders live at localhost:4321)
  ▼
Developer reviews in browser, requests tweaks
  │
  ▼
Claude calls push_to_figma
  │  (sends editable frames to Figma via Figma MCP)
  ▼
Designer reviews and tweaks in Figma
  │
  ▼
Developer asks Claude to read Figma changes
  │  (via Figma MCP read tools)
  ▼
Claude updates TSX to match designer's changes
  │
  ▼
Commit. Design and code are in sync.`;

export default function ApiReferencePage() {
  const { prev, next } = getAdjacentPages("/docs/api-reference");

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">API Reference</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout CLI exposes 10 MCP tools that AI agents call during
          development. These tools give your agent structured access to design
          tokens, component specs, compliance checking, live preview, and a
          two-way Figma bridge: everything needed to build UI that stays on
          brand.
        </p>
        <Callout type="info">
          All tools are available after running{" "}
          <code className="font-mono text-gray-900 text-xs bg-gray-50 px-1.5 py-0.5 rounded">
            npx @layoutdesign/context init
          </code>{" "}
          and adding the MCP server config to your agent&apos;s settings. See
          the{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            CLI guide
          </Link>{" "}
          for setup instructions.
        </Callout>
      </div>

      {/* The Full Loop */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          The Full Code-to-Design Loop
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The MCP tools are designed to work together across the full
          development workflow, from the first prompt to a Figma-reviewed,
          production-ready component. No other open-source tool closes this
          loop.
        </p>
        <CopyBlock code={loopDiagram} language="plaintext" />
        <Callout type="tip">
          The loop works best when Claude calls{" "}
          <code className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
            get_design_system
          </code>{" "}
          automatically at the start of every UI task. Add a rule to your{" "}
          <code className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
            CLAUDE.md
          </code>{" "}
          or{" "}
          <code className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
            .cursorrules
          </code>{" "}
          instructing the agent to fetch design context before writing any UI
          code. The exported bundle from AI Studio includes this instruction
          pre-written.
        </Callout>
      </section>

      {/* Tool Reference */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tools</h2>

        {tools.map((tool) => (
          <div
            key={tool.name}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Tool header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#0a0a0a] font-mono">
                {tool.name}
              </h3>
            </div>

            <div className="px-6 py-5 space-y-5">
              <p className="text-base text-gray-600 leading-relaxed">
                {tool.description}
              </p>

              {/* Parameters */}
              {tool.parameters.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wide">
                    Parameters
                  </h4>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left font-medium text-[#0a0a0a] py-3 px-4">
                            Name
                          </th>
                          <th className="text-left font-medium text-[#0a0a0a] py-3 px-4">
                            Type
                          </th>
                          <th className="text-left font-medium text-[#0a0a0a] py-3 px-4">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tool.parameters.map((param, i) => (
                          <tr
                            key={param.name}
                            className={
                              i < tool.parameters.length - 1
                                ? "border-b border-gray-200"
                                : ""
                            }
                          >
                            <td className="py-3 px-4 font-mono text-gray-900 text-xs align-top">
                              {param.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-500 text-xs align-top whitespace-nowrap">
                              {param.type}
                            </td>
                            <td className="py-3 px-4 text-gray-600 align-top">
                              {param.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No parameters. Call with no arguments.
                </p>
              )}

              {/* Example */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wide">
                  Example
                </h4>
                <CopyBlock code={tool.example} language="typescript" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between pt-8 border-t border-gray-200">
        {prev ? (
          <Link
            href={prev.href}
            className="flex flex-col gap-1 text-gray-900 hover:underline"
          >
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Previous
            </span>
            <span className="text-sm font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            className="flex flex-col gap-1 text-right text-gray-900 hover:underline"
          >
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Next
            </span>
            <span className="text-sm font-medium">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
