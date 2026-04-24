import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod/v4";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { supabase } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/supabase/storage";
import { syncBrandingSectionToLayoutMd } from "@/lib/branding/sync-to-layout-md";
import { generateImageRaw } from "@/lib/image/generate";
import { ImageSafetyError } from "@/lib/image/providers/router";
import type {
  AspectRatio,
  ImageStyle,
  ProviderName,
} from "@/lib/image/providers/types";
import type {
  BrandingAsset,
  BrandingSlot,
  BrandingVariant,
} from "@/lib/types";

export const maxDuration = 120;

type Params = { params: Promise<{ orgId: string; projectId: string }> };

const MAX_BRANDING_ITEMS = 10;

const GenerateBrandAssetSchema = z.object({
  slot: z.enum(["primary", "secondary", "wordmark", "favicon", "mark", "other"]),
  variant: z.enum(["colour", "white", "black", "mono"]).default("colour"),
  prompt: z.string().min(3).max(1000),
  brandColours: z.array(z.string()).optional(),
  brandStyle: z.string().optional(),
});

const SLOT_ASPECT: Record<BrandingSlot, AspectRatio> = {
  primary: "1:1",
  secondary: "1:1",
  mark: "1:1",
  favicon: "1:1",
  wordmark: "16:9",
  other: "1:1",
};

const TEXT_CRITICAL_SLOTS: ReadonlySet<BrandingSlot> = new Set([
  "primary",
  "secondary",
  "wordmark",
  "mark",
]);

function styleForSlot(slot: BrandingSlot): ImageStyle {
  return slot === "favicon" ? "icon" : "illustration";
}

function brandPromptFor(
  slot: BrandingSlot,
  variant: BrandingVariant,
  userPrompt: string,
): string {
  const variantHint: Record<BrandingVariant, string> = {
    colour: "full colour",
    white: "all-white fill on transparent background — for use on dark surfaces",
    black: "all-black fill on transparent background — for use on light surfaces",
    mono: "single-colour monochrome treatment",
  };
  const slotHint: Record<BrandingSlot, string> = {
    primary: "primary logo lockup (mark + text if appropriate)",
    secondary: "alternate logo lockup",
    wordmark: "wordmark (typography only, no symbol), clean legible type",
    mark: "icon mark (symbol only, no text)",
    favicon: "square app icon / favicon, bold silhouette readable at 16px",
    other: "brand asset",
  };
  return `${userPrompt}. Rendered as a ${slotHint[slot]} in ${variantHint[variant]}. Transparent background. Vector-style, clean edges, minimal, professional. Centered. No surrounding UI or mockup.`;
}

function maybeSafetyError(err: unknown): { isSafety: boolean; message: string } {
  if (err instanceof ImageSafetyError) {
    return {
      isSafety: true,
      message: `Image blocked by safety policy — try a more abstract description.`,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { isSafety: false, message };
}

export async function POST(request: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params;

  const auth = await requireOrgAuth(orgId, "editProject");
  if (auth instanceof NextResponse) return auth;

  const googleApiKey =
    request.headers.get("X-Google-Api-Key") ||
    process.env.GOOGLE_AI_API_KEY ||
    undefined;
  const openaiApiKey =
    request.headers.get("X-OpenAI-Api-Key") ||
    process.env.OPENAI_API_KEY ||
    undefined;

  if (!googleApiKey && !openaiApiKey) {
    return NextResponse.json(
      {
        error:
          "Image generation requires a Google AI or OpenAI API key. Add one in API Keys settings.",
        code: "NO_API_KEY",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = GenerateBrandAssetSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return NextResponse.json({ error: `Invalid request: ${fields}` }, { status: 400 });
  }

  const { slot, variant, prompt, brandColours, brandStyle } = parsed.data;

  const { data: project, error: fetchError } = await supabase
    .from("layout_projects")
    .select("branding_assets, layout_md")
    .eq("id", projectId)
    .eq("org_id", auth.orgId)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const existing = (project.branding_assets as BrandingAsset[]) ?? [];
  if (existing.length >= MAX_BRANDING_ITEMS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_BRANDING_ITEMS} branding assets per project` },
      { status: 413 },
    );
  }

  // Text-critical slots must use OpenAI when available; fall back to Gemini
  // with a warning if only Google is configured.
  const forced: ProviderName | undefined =
    TEXT_CRITICAL_SLOTS.has(slot) && openaiApiKey ? "openai" : undefined;

  const composedPrompt = brandPromptFor(slot, variant, prompt);

  let imageBytes: string;
  let mimeType: string;
  let provider: ProviderName;
  try {
    const result = await generateImageRaw({
      prompt: composedPrompt,
      style: styleForSlot(slot),
      aspectRatio: SLOT_ASPECT[slot],
      brandColours,
      brandStyle,
      googleApiKey,
      openaiApiKey,
      forcedProvider: forced,
    });
    imageBytes = result.data;
    mimeType = result.mimeType;
    provider = result.provider;
  } catch (err) {
    const { isSafety, message } = maybeSafetyError(err);
    return NextResponse.json(
      { error: message, code: isSafety ? "SAFETY_BLOCK" : "GENERATION_FAILED" },
      { status: isSafety ? 422 : 500 },
    );
  }

  const id = nanoid();
  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
  const storagePath = `${auth.orgId}/${projectId}/${slot}-${variant}-${id}.${ext}`;
  const buffer = Buffer.from(imageBytes, "base64");

  const url = await uploadToBucket("branding", storagePath, buffer, mimeType);
  if (!url) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const asset: BrandingAsset = {
    id,
    slot,
    variant,
    url,
    name: `${slot}-${variant}-${provider}.${ext}`,
    mimeType,
    size: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
  };

  const next = [...existing, asset];
  const existingLayoutMd = (project.layout_md as string) ?? "";
  const nextLayoutMd = syncBrandingSectionToLayoutMd(existingLayoutMd, next);

  const { error: updateError } = await supabase
    .from("layout_projects")
    .update({
      branding_assets: next,
      layout_md: nextLayoutMd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("org_id", auth.orgId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to save asset: ${updateError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    asset,
    brandingAssets: next,
    layoutMd: nextLayoutMd,
    provider,
  });
}
