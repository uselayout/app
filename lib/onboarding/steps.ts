import type { StepKey } from "@/lib/store/onboarding";

export type StepPhase = "keys" | "explore" | "tools" | "learn";

export interface StepContext {
  hasWebsiteProject: boolean;
  hasFigmaProject: boolean;
}

export interface StepDef {
  key: StepKey;
  phase: StepPhase;
  label: string;
  description: string;
  /** Step counts toward progress but isn't required for 100% completion. */
  optional?: boolean;
  /** Hide the step entirely when this predicate returns false. */
  visibleWhen?: (ctx: StepContext) => boolean;
}

export const PHASE_LABELS: Record<StepPhase, string> = {
  keys: "Bring your own keys (optional)",
  explore: "Extract and explore",
  tools: "Wire it into your tools",
  learn: "Learn more",
};

export const PHASE_ORDER: StepPhase[] = ["keys", "explore", "tools", "learn"];

export const STEP_DEFS: StepDef[] = [
  {
    key: "apiKeyAdded",
    phase: "keys",
    label: "Bring your own Anthropic key",
    description: "Variants use Layout's hosted model by default. Add your own Anthropic key to use that instead. Stored locally in your browser.",
    optional: true,
  },
  {
    key: "figmaTokenAdded",
    phase: "keys",
    label: "Add your Figma personal access token",
    description: "Only needed if you want to extract a Figma file or push designs back to Figma.",
    optional: true,
  },
  {
    key: "geminiKeyAdded",
    phase: "keys",
    label: "Add your Gemini API key",
    description: "Only needed if you want AI image generation inside variants.",
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
    visibleWhen: (ctx) => ctx.hasWebsiteProject || !ctx.hasFigmaProject,
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

export function getVisibleSteps(ctx: StepContext): StepDef[] {
  return STEP_DEFS.filter((def) => !def.visibleWhen || def.visibleWhen(ctx));
}
