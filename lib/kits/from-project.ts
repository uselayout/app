import { generateTokensCss } from "@/lib/export/tokens-css";
import { generateTokensJson } from "@/lib/export/tokens-json";
import { deriveLayoutMd } from "@/lib/layout-md/derive";
import type {
  BrandingAsset,
  BrandingSlot,
  BrandingVariant,
  ContextDocument,
  Project,
  UploadedFont,
} from "@/lib/types";
import type { PublishKitInput } from "@/lib/supabase/kits";
import type {
  KitJson,
  KitLicence,
  KitRichBundle,
  KitTier,
  PublicKit,
} from "@/lib/types/kit";

export interface BuildKitInput {
  project: Project;
  name: string;
  description?: string;
  tags: string[];
  licence: KitLicence;
  licenceCustom?: string;
  tier: KitTier;
  unlisted?: boolean;
  parentKitId?: string;
  previewImageUrl?: string;
  author: {
    orgId: string;
    userId: string;
    displayName?: string;
    avatarUrl?: string;
  };
  include: {
    components: boolean;
    fonts: boolean;
    branding: boolean;
    context: boolean;
  };
}

/**
 * Freeze a Studio project into a publishable kit payload. Caller passes the
 * result to publishKit() in lib/supabase/kits.ts. Kept separate from the API
 * route so it can be unit-tested and reused by the seeder.
 */
export function buildKitFromProject(input: BuildKitInput): PublishKitInput {
  const { project } = input;

  const tokensCss = project.extractionData
    ? generateTokensCss(project.extractionData.tokens)
    : "";
  const tokensJson = project.extractionData
    ? (JSON.parse(generateTokensJson(project.extractionData.tokens)) as Record<string, unknown>)
    : {};

  const layoutMd = deriveLayoutMd(project);

  const kitJson: KitJson = {
    schemaVersion: 1,
    slug: "",
    name: input.name,
    description: input.description,
    tags: input.tags,
    licence: input.licence,
    licenceCustom: input.licenceCustom,
    author: {
      orgId: input.author.orgId,
      userId: input.author.userId,
      displayName: input.author.displayName,
      avatarUrl: input.author.avatarUrl,
    },
    tier: input.tier,
    publishedAt: new Date().toISOString(),
    parentKitId: input.parentKitId,
  };

  let richBundle: KitRichBundle | undefined;
  if (input.tier === "rich") {
    richBundle = {};
    if (input.include.fonts && project.uploadedFonts?.length) {
      richBundle.fonts = project.uploadedFonts.map((f) => ({
        family: f.family,
        url: f.url,
        weight: Number.parseInt(String(f.weight), 10) || undefined,
        style: f.style,
      }));
    }
    if (input.include.branding && project.brandingAssets?.length) {
      richBundle.brandingAssets = project.brandingAssets.map((a) => ({
        slot: a.slot,
        variant: a.variant,
        url: a.url,
        name: a.name,
        mimeType: a.mimeType,
      }));
    }
    if (input.include.context && project.contextDocuments?.length) {
      richBundle.contextDocuments = project.contextDocuments.map((d) => ({
        name: d.name,
        content: d.content,
        mimeType: d.mimeType,
      }));
    }
    // Components live in a separate org-scoped table (layout_components). The
    // publish endpoint fetches and attaches them when include.components is
    // true, keeping this helper DB-free for testability.
  }

  return {
    slug: input.name,
    name: input.name,
    description: input.description,
    tags: input.tags,
    author: input.author,
    licence: input.licence,
    licenceCustom: input.licenceCustom,
    previewImageUrl: input.previewImageUrl,
    layoutMd,
    tokensCss,
    tokensJson,
    kitJson,
    tier: input.tier,
    richBundle,
    sourceProjectId: project.id,
    parentKitId: input.parentKitId,
    unlisted: input.unlisted ?? false,
  };
}

/** Clone a kit into a fresh Project row destined for the caller's org. */
export function projectFromKit(
  kit: Pick<PublicKit, "id" | "name" | "layoutMd" | "tokensCss" | "tokensJson" | "tier" | "richBundle" | "author">,
  orgId: string,
  newProjectId: string
): Project {
  const now = new Date().toISOString();
  const fonts: UploadedFont[] | undefined = kit.richBundle?.fonts?.map((f, i) => ({
    id: `${newProjectId}-font-${i}`,
    family: f.family,
    weight: String(f.weight ?? 400),
    style: f.style ?? "normal",
    format: detectFontFormat(f.url),
    url: f.url,
    projectId: newProjectId,
    orgId,
  }));
  const branding: BrandingAsset[] | undefined = kit.richBundle?.brandingAssets?.map((a, i) => ({
    id: `${newProjectId}-brand-${i}`,
    slot: a.slot as BrandingSlot,
    variant: (a.variant as BrandingVariant | undefined),
    url: a.url,
    name: a.name,
    mimeType: a.mimeType,
    size: 0,
    uploadedAt: now,
  }));
  const context: ContextDocument[] | undefined = kit.richBundle?.contextDocuments?.map((d, i) => ({
    id: `${newProjectId}-ctx-${i}`,
    name: d.name,
    content: d.content,
    mimeType: d.mimeType,
    size: d.content.length,
    addedAt: now,
  }));

  return {
    id: newProjectId,
    orgId,
    name: kit.name,
    sourceType: "manual",
    layoutMd: kit.layoutMd,
    tokenCount: countTokensFromTokensJson(kit.tokensJson),
    uploadedFonts: fonts,
    brandingAssets: branding,
    contextDocuments: context,
    createdAt: now,
    updatedAt: now,
  };
}

function countTokensFromTokensJson(json: Record<string, unknown>): number {
  let count = 0;
  for (const category of Object.values(json)) {
    if (category && typeof category === "object") {
      count += Object.keys(category as Record<string, unknown>).length;
    }
  }
  return count;
}

function detectFontFormat(url: string): "woff2" | "woff" | "ttf" | "otf" {
  const lower = url.toLowerCase();
  if (lower.endsWith(".woff2")) return "woff2";
  if (lower.endsWith(".woff")) return "woff";
  if (lower.endsWith(".ttf")) return "ttf";
  return "otf";
}
