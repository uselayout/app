import {
  ImageSafetyError,
  RateLimitError,
  buildPrompt,
  type AspectRatio,
  type ProviderGenerateOptions,
  type ProviderResult,
} from "./types";

const OPENAI_MODEL = "gpt-image-2";
const OPENAI_GENERATE_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_EDIT_URL = "https://api.openai.com/v1/images/edits";

function mapSize(ratio: AspectRatio | undefined): "1024x1024" | "1024x1536" | "1536x1024" {
  switch (ratio) {
    case "9:16":
    case "3:4":
      return "1024x1536";
    case "16:9":
    case "21:9":
    case "3:2":
    case "4:3":
      return "1536x1024";
    case "1:1":
    default:
      return "1024x1024";
  }
}

async function handleErrorResponse(res: Response, originalPrompt: string): Promise<never> {
  if (res.status === 429) {
    throw new RateLimitError("OpenAI rate limit exceeded");
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    const message: string = body?.error?.message ?? "";
    if (/safety|policy|moderation/i.test(message)) {
      throw new ImageSafetyError(originalPrompt);
    }
    throw new Error(`OpenAI image generation failed (400): ${message || "Bad request"}`);
  }
  const errorBody = await res.text().catch(() => "Unknown error");
  throw new Error(`OpenAI image generation failed (${res.status}): ${errorBody}`);
}

async function generateTextToImage(
  options: ProviderGenerateOptions,
): Promise<ProviderResult> {
  const prompt = buildPrompt(options);
  const size = mapSize(options.aspectRatio);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(OPENAI_GENERATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt,
        n: 1,
        size,
        output_format: "png",
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) await handleErrorResponse(res, options.prompt);

  const result = await res.json();
  const first = result?.data?.[0];
  if (!first?.b64_json) {
    throw new Error("No inline image data in OpenAI response");
  }
  return { data: first.b64_json as string, mimeType: "image/png", provider: "openai" };
}

async function generateImageEdit(
  options: ProviderGenerateOptions,
): Promise<ProviderResult> {
  const prompt = buildPrompt(options);
  const size = mapSize(options.aspectRatio);
  const refs = options.referenceImages ?? [];

  const form = new FormData();
  form.append("model", OPENAI_MODEL);
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", size);
  for (const ref of refs) {
    // Copy to a fresh ArrayBuffer so Blob sees ArrayBuffer, not
    // ArrayBufferLike (which TS can't narrow for Node Buffer views).
    const ab = ref.buffer.buffer.slice(
      ref.buffer.byteOffset,
      ref.buffer.byteOffset + ref.buffer.byteLength,
    ) as ArrayBuffer;
    form.append("image[]", new Blob([ab], { type: ref.mimeType }), ref.filename);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(OPENAI_EDIT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${options.apiKey}` },
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) await handleErrorResponse(res, options.prompt);

  const result = await res.json();
  const first = result?.data?.[0];
  if (!first?.b64_json) {
    throw new Error("No inline image data in OpenAI /edits response");
  }
  return { data: first.b64_json as string, mimeType: "image/png", provider: "openai" };
}

export async function generateWithOpenAI(
  options: ProviderGenerateOptions,
): Promise<ProviderResult> {
  const hasRefs = (options.referenceImages?.length ?? 0) > 0;
  return hasRefs ? generateImageEdit(options) : generateTextToImage(options);
}
