/**
 * Gemini 3.1 Pro variant generation for the Explorer Canvas.
 *
 * Mirrors the Claude explore.ts interface but uses the Google GenAI SDK.
 * Uses the same system prompts and output format (### Variant N:) so the
 * existing variant parser works without modification.
 */

import { GoogleGenAI } from "@google/genai";
import type { StreamWithUsage, TokenUsageResult } from "@/lib/types/billing";

const GEMINI_MODEL = "gemini-3.1-pro-preview";

// Re-use the same system prompts as Claude — the output format (### Variant N:)
// is defined there and the parser depends on it.
import { EXPLORE_SYSTEM, REFINE_SYSTEM } from "@/lib/claude/explore";

export function createGeminiExploreStream(
  prompt: string,
  layoutMd: string,
  variantCount: number,
  apiKey?: string,
  imageDataUrl?: string,
  contextFiles?: Array<{ name: string; content: string }>,
): StreamWithUsage {
  const systemPrompt = `${EXPLORE_SYSTEM}\n\nGenerate exactly ${variantCount} variants.\n\n${layoutMd}`;
  const userContent = buildGeminiContent(prompt, imageDataUrl, contextFiles);

  return runGeminiStream(systemPrompt, userContent, apiKey);
}

export function createGeminiRefineStream(
  baseCode: string,
  refinementPrompt: string,
  layoutMd: string,
  variantCount: number,
  apiKey?: string,
  contextFiles?: Array<{ name: string; content: string }>,
  imageDataUrl?: string,
): StreamWithUsage {
  const systemPrompt = `${REFINE_SYSTEM}\n\nGenerate exactly ${variantCount} refined variants.\n\n${layoutMd}`;

  const contextBlock = contextFiles?.length
    ? contextFiles.map((f) => `--- context: ${f.name} ---\n${f.content}\n--- end ---`).join("\n\n") + "\n\n"
    : "";

  const textPrompt = `${contextBlock}Here is the base component to refine:

\`\`\`tsx
${baseCode}
\`\`\`

Refinement request: ${refinementPrompt}`;

  const userContent = buildGeminiContent(textPrompt, imageDataUrl);

  return runGeminiStream(systemPrompt, userContent, apiKey);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

function buildGeminiContent(
  prompt: string,
  imageDataUrl?: string,
  contextFiles?: Array<{ name: string; content: string }>,
): GeminiPart[] {
  const contextBlock = contextFiles?.length
    ? contextFiles.map((f) => `--- context: ${f.name} ---\n${f.content}\n--- end ---`).join("\n\n") + "\n\n"
    : "";
  const fullPrompt = contextBlock + prompt;

  if (!imageDataUrl) {
    return [{ text: fullPrompt }];
  }

  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) {
    return [{ text: fullPrompt }];
  }

  return [
    { text: "REFERENCE IMAGE — Replicate this design's layout, structure, spacing, and visual hierarchy as closely as possible, adapting colours/tokens to the design system:" },
    { inlineData: { mimeType: parsed.mediaType, data: parsed.data } },
    { text: fullPrompt },
  ];
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], data: match[3] };
}

function getApiKey(userKey?: string): string {
  const key = userKey || process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("Google AI API key is required for Gemini models. Add one in Settings or set GOOGLE_AI_API_KEY.");
  return key;
}

function runGeminiStream(
  systemPrompt: string,
  userContent: GeminiPart[],
  apiKey?: string,
): StreamWithUsage {
  let resolveUsage: (u: TokenUsageResult) => void;
  const usage = new Promise<TokenUsageResult>((resolve) => {
    resolveUsage = resolve;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const ai = new GoogleGenAI({ apiKey: getApiKey(apiKey) });

        const responseStream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: [{ role: "user", parts: userContent }],
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 65_536,
          },
        });

        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
          // Track usage from the final chunk
          if (chunk.usageMetadata) {
            totalInputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
            totalOutputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
          }
        }

        resolveUsage({
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        resolveUsage({ inputTokens: 0, outputTokens: 0 });
      } finally {
        controller.close();
      }
    },
  });

  return { stream, usage };
}
