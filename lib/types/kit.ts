// Public Kit types for the Kit Gallery.
//
// A Kit is an immutable snapshot of a design system published from a Studio
// project (or seeded from the CLI's bundled kits). Anyone can browse kits at
// /gallery. One-click import clones the kit into a new project in the caller's
// org.

export type KitTier = "minimal" | "rich";

export type KitLicence = "MIT" | "CC-BY-4.0" | "custom";

export type KitSort = "featured" | "new" | "top";

export type KitStatus = "pending" | "approved";

export type KitCardImagePref = "auto" | "custom" | "hero" | "preview";

export interface KitAuthor {
  orgId: string;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * JSON blob shipped as kit.json inside the minimal kit bundle and written to
 * layout_public_kit.kit_json. Compatible with the CLI's existing kits in
 * layout-context/kits (linear-lite, stripe-lite, notion-lite).
 */
export interface KitJson {
  schemaVersion: 1;
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  licence: KitLicence;
  licenceCustom?: string;
  author: KitAuthor;
  tier: KitTier;
  publishedAt: string;
  parentKitId?: string;
}

/**
 * Optional rich bundle stored in the DB (never mirrored to GitHub). Contains
 * components, fonts metadata, and branding refs so a logged-in user importing
 * from Studio gets a fully-populated project.
 */
export interface KitRichBundle {
  components?: Array<{
    name: string;
    slug: string;
    description?: string;
    category?: string;
    tags?: string[];
    code: string;
    props?: unknown;
    variants?: unknown;
    states?: unknown;
    tokensUsed?: string[];
  }>;
  fonts?: Array<{
    family: string;
    url: string;
    weight?: number;
    style?: string;
  }>;
  brandingAssets?: Array<{
    slot: string;
    variant?: string;
    url: string;
    name: string;
    mimeType: string;
  }>;
  contextDocuments?: Array<{
    name: string;
    content: string;
    mimeType: string;
  }>;
}

export interface PublicKit {
  id: string;
  slug: string;
  name: string;
  description?: string;
  tags: string[];

  author: KitAuthor;

  licence: KitLicence;
  licenceCustom?: string;

  previewImageUrl?: string;

  layoutMd: string;
  tokensCss: string;
  tokensJson: Record<string, unknown>;
  kitJson: KitJson;

  tier: KitTier;
  richBundle?: KitRichBundle;

  sourceProjectId?: string;
  parentKitId?: string;

  /** 'pending' kits are excluded from public listings until an admin approves. */
  status: KitStatus;
  /** Override for which image shows on the gallery card. 'auto' = hero → preview → gradient. */
  cardImagePref: KitCardImagePref;

  featured: boolean;
  hidden: boolean;
  unlisted: boolean;
  /** Admin-curated "New" badge. Surfaces on KitCard when true. */
  isNew: boolean;

  upvoteCount: number;
  importCount: number;
  viewCount: number;

  githubFolder?: string;
  githubSyncedAt?: string;

  /** Claude-generated bespoke showcase TSX. Falls back to the uniform template when null. */
  showcaseCustomTsx?: string;
  /** Pre-transpiled JS for the bespoke showcase, used by the iframe. */
  showcaseCustomJs?: string;
  /** Timestamp of the last successful AI showcase generation. */
  showcaseGeneratedAt?: string;
  /** Timestamp of the last successful Playwright PNG preview generation. */
  previewGeneratedAt?: string;
  /** GPT Image 2-generated stylised hero cover for the gallery card. Preferred over previewImageUrl when set. */
  heroImageUrl?: string;
  /** Timestamp of the last successful hero image generation. */
  heroGeneratedAt?: string;
  /** Admin-uploaded card image (1440x1080). Wins the fallback chain when present. */
  customCardImageUrl?: string;

  createdAt: string;
  updatedAt: string;
}

/** Card-shaped projection for gallery listings. Excludes heavy fields. */
export interface PublicKitSummary {
  id: string;
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  author: KitAuthor;
  licence: KitLicence;
  previewImageUrl?: string;
  heroImageUrl?: string;
  customCardImageUrl?: string;
  tier: KitTier;
  featured: boolean;
  isNew: boolean;
  status: KitStatus;
  cardImagePref: KitCardImagePref;
  upvoteCount: number;
  importCount: number;
  createdAt: string;
  updatedAt: string;
}

export function kitSummary(kit: PublicKit): PublicKitSummary {
  return {
    id: kit.id,
    slug: kit.slug,
    name: kit.name,
    description: kit.description,
    tags: kit.tags,
    author: kit.author,
    licence: kit.licence,
    previewImageUrl: kit.previewImageUrl,
    heroImageUrl: kit.heroImageUrl,
    customCardImageUrl: kit.customCardImageUrl,
    tier: kit.tier,
    featured: kit.featured,
    isNew: kit.isNew,
    status: kit.status,
    cardImagePref: kit.cardImagePref,
    upvoteCount: kit.upvoteCount,
    importCount: kit.importCount,
    createdAt: kit.createdAt,
    updatedAt: kit.updatedAt,
  };
}

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "kit";
}
