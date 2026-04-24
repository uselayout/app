import Anthropic from "@anthropic-ai/sdk";

export interface KitMetaSuggestion {
  description: string;
  tags: string[];
}

// Curated tag taxonomy. Haiku is instructed to pick from this list so kits
// stay filterable in the gallery. New tags appear over time if the model
// consistently adds them.
const TAG_TAXONOMY = [
  "dark",
  "light",
  "minimal",
  "bold",
  "saas",
  "ecomm",
  "fintech",
  "developer-tool",
  "content-first",
  "landing-page",
  "dashboard",
  "mobile",
  "ios",
  "android",
  "illustrated",
  "editorial",
  "marketing",
];

const SYSTEM = `You generate concise metadata for a design-system kit that will appear in a public gallery.

Output rules:
- Description: ONE sentence. Maximum 180 characters. British English. Describes the aesthetic and who it suits, not a list of features. No trailing full stop required if the sentence reads fine without it.
- Tags: 3 to 5 tags chosen from this taxonomy only: ${TAG_TAXONOMY.join(", ")}. Pick the ones that genuinely describe the kit. Do not invent new tags.

Return ONLY a JSON object of the form:
{"description": "...", "tags": ["...", "..."]}

No markdown, no prose outside the JSON.`;

function extractColours(tokensCss: string, limit = 12): string {
  const lines: string[] = [];
  for (const match of tokensCss.matchAll(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gm)) {
    const name = match[1];
    const value = match[2];
    if (name && value) lines.push(`${name}: ${value}`);
    if (lines.length >= limit) break;
  }
  return lines.join("\n");
}

function stripMarkdown(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return raw;
  return raw.slice(firstBrace, lastBrace + 1);
}

export async function suggestKitMeta(input: {
  projectName: string;
  layoutMd: string;
  tokensCss: string;
  apiKey?: string;
  modelId?: string;
}): Promise<KitMetaSuggestion> {
  const anthropic = new Anthropic(input.apiKey ? { apiKey: input.apiKey } : {});

  const coloursPreview = extractColours(input.tokensCss, 12);
  const layoutMdHead = input.layoutMd.slice(0, 2500);

  const userMessage = [
    `Project name: ${input.projectName}`,
    "",
    "First ~2500 chars of layout.md:",
    "```",
    layoutMdHead || "(empty)",
    "```",
    "",
    "Core colour tokens:",
    "```",
    coloursPreview || "(none extracted)",
    "```",
  ].join("\n");

  const response = await anthropic.messages.create({
    model: input.modelId ?? "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdown(raw));
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response was not an object");
  }

  const record = parsed as { description?: unknown; tags?: unknown };
  const description = typeof record.description === "string" ? record.description.trim() : "";
  const tagsRaw = Array.isArray(record.tags) ? record.tags : [];
  const tags = tagsRaw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => TAG_TAXONOMY.includes(t))
    .slice(0, 5);

  if (!description || tags.length === 0) {
    throw new Error("AI response missing description or tags");
  }

  return {
    description: description.length > 300 ? description.slice(0, 300) : description,
    tags,
  };
}
