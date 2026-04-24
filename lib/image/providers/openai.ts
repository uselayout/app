import {
  ImageSafetyError,
  RateLimitError,
  buildPrompt,
  type AspectRatio,
  type ProviderGenerateOptions,
  type ProviderResult,
} from "./types";

const OPENAI_MODEL = "gpt-image-2";
const OPENAI_URL = "https://api.openai.com/v1/images/generations";

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

export async function generateWithOpenAI(
  options: ProviderGenerateOptions,
): Promise<ProviderResult> {
  const prompt = buildPrompt(options);
  const size = mapSize(options.aspectRatio);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
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

  if (res.status === 429) {
    throw new RateLimitError("OpenAI rate limit exceeded");
  }

  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    const message: string = body?.error?.message ?? "";
    if (/safety|policy|moderation/i.test(message)) {
      throw new ImageSafetyError(options.prompt);
    }
    throw new Error(`OpenAI image generation failed (400): ${message || "Bad request"}`);
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`OpenAI image generation failed (${res.status}): ${errorBody}`);
  }

  const result = await res.json();
  const first = result?.data?.[0];
  if (!first?.b64_json) {
    throw new Error("No inline image data in OpenAI response");
  }

  return {
    data: first.b64_json as string,
    mimeType: "image/png",
    provider: "openai",
  };
}
