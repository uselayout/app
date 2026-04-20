import type { StepKey } from "@/lib/store/onboarding";

export type StepPhase = "keys" | "explore" | "tools" | "learn";

export interface StepDef {
  key: StepKey;
  phase: StepPhase;
  label: string;
  description: string;
  /** Step counts toward progress but isn't required for 100% completion. */
  optional?: boolean;
}

export const PHASE_LABELS: Record<StepPhase, string> = {
  keys: "Connect your keys",
  explore: "Extract and explore",
  tools: "Wire it into your tools",
  learn: "Learn more",
};

export const PHASE_ORDER: StepPhase[] = ["keys", "explore", "tools", "learn"];

export const STEP_DEFS: StepDef[] = [
  {
    key: "apiKeyAdded",
    phase: "keys",
    label: "Add your Anthropic API key",
    description: "Powers variant generation. Stored locally in your browser.",
    optional: true,
  },
  {
    key: "figmaTokenAdded",
    phase: "keys",
    label: "Add your Figma personal access token",
    description: "Required to extract design systems from Figma files.",
    optional: true,
  },
  {
    key: "geminiKeyAdded",
    phase: "keys",
    label: "Add your Gemini API key (optional)",
    description: "Unlocks AI image generation inside variants.",
    optional: true,
  },
  {
    key: "extracted",
    phase: "explore",
    label: "Extract your first design system",
    description: "Pull tokens and components from Figma or any website.",
  },
  {
    key: "viewedLayoutMd",
    phase: "explore",
    label: "Review your layout.md",
    description: "See the context your AI agent will consume.",
  },
  {
    key: "generatedVariant",
    phase: "explore",
    label: "Generate your first variant",
    description: "Open Explore and prompt a component into existence.",
  },
  {
    key: "componentSaved",
    phase: "explore",
    label: "Save a component to the library",
    description: "Promote a variant so you can reuse it across projects.",
  },
  {
    key: "cliInstalled",
    phase: "tools",
    label: "Install the CLI",
    description: "One command in Claude Code, Cursor or Windsurf.",
  },
  {
    key: "figmaPluginInstalled",
    phase: "tools",
    label: "Install the Figma plugin",
    description: "Push tokens and pull designs without leaving Figma.",
  },
  {
    key: "extensionInstalled",
    phase: "tools",
    label: "Install the Chrome extension",
    description: "Capture authenticated pages the Figma REST API can't reach.",
  },
  {
    key: "readDocs",
    phase: "learn",
    label: "Read the docs",
    description: "Ten minutes to understand how the pieces fit together.",
    optional: true,
  },
];

export function groupStepsByPhase(
  steps: StepDef[]
): Array<{ phase: StepPhase; steps: StepDef[] }> {
  const groups = new Map<StepPhase, StepDef[]>();
  for (const step of steps) {
    const list = groups.get(step.phase) ?? [];
    list.push(step);
    groups.set(step.phase, list);
  }
  return PHASE_ORDER.filter((p) => groups.has(p)).map((phase) => ({
    phase,
    steps: groups.get(phase) ?? [],
  }));
}
