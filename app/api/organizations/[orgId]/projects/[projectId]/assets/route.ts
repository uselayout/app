import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { supabase } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/supabase/storage";
import { syncBrandingSectionToLayoutMd } from "@/lib/branding/sync-to-layout-md";
import type {
  BrandingAsset,
  BrandingSlot,
  BrandingVariant,
  ContextDocument,
} from "@/lib/types";

type Params = { params: Promise<{ orgId: string; projectId: string }> };

const MAX_BRANDING_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CONTEXT_BYTES = 50 * 1024; // 50 KB
const MAX_BRANDING_ITEMS = 10;
const MAX_CONTEXT_ITEMS = 10;

const ALLOWED_BRANDING_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const ALLOWED_CONTEXT_MIME = new Set([
  "text/markdown",
  "text/plain",
  "text/x-markdown",
  "application/octet-stream", // browsers sometimes send .md as this
]);

const VALID_SLOTS: ReadonlySet<BrandingSlot> = new Set<BrandingSlot>([
  "primary",
  "secondary",
  "wordmark",
  "favicon",
  "mark",
  "other",
]);

const VALID_VARIANTS: ReadonlySet<BrandingVariant> = new Set<BrandingVariant>([
  "colour",
  "white",
  "black",
  "mono",
]);

function safeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extensionFor(mime: string, fallback: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "image/gif":
      return "gif";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return "ico";
    default:
      return fallback;
  }
}

/**
 * GET — list branding assets + context documents for a project.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params;

  const auth = await requireOrgAuth(orgId, "viewProject");
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabase
    .from("layout_projects")
    .select("branding_assets, context_documents")
    .eq("id", projectId)
    .eq("org_id", auth.orgId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    brandingAssets: (data.branding_assets as BrandingAsset[]) ?? [],
    contextDocuments: (data.context_documents as ContextDocument[]) ?? [],
  });
}

/**
 * POST — upload a new asset (branding image or context document).
 *
 * FormData fields:
 *   kind: "branding" | "context-doc"
 *   file: the uploaded file
 *   slot?: BrandingSlot (only when kind === "branding")
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params;

  const auth = await requireOrgAuth(orgId, "editProject");
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const kind = formData.get("kind");
  const file = formData.get("file");

  if (kind !== "branding" && kind !== "context-doc") {
    return NextResponse.json(
      { error: "kind must be 'branding' or 'context-doc'" },
      { status: 400 }
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Load existing project to verify ownership and enforce per-project caps
  const { data: project, error: fetchError } = await supabase
    .from("layout_projects")
    .select("branding_assets, context_documents, layout_md")
    .eq("id", projectId)
    .eq("org_id", auth.orgId)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const existingBranding = (project.branding_assets as BrandingAsset[]) ?? [];
  const existingContext = (project.context_documents as ContextDocument[]) ?? [];
  const existingLayoutMd = (project.layout_md as string) ?? "";

  if (kind === "branding") {
    return handleBrandingUpload({
      file,
      slot: formData.get("slot"),
      variant: formData.get("variant"),
      projectId,
      orgId: auth.orgId,
      existing: existingBranding,
      layoutMd: existingLayoutMd,
    });
  }

  return handleContextUpload({
    file,
    projectId,
    orgId: auth.orgId,
    existing: existingContext,
  });
}

async function handleBrandingUpload(opts: {
  file: File;
  slot: FormDataEntryValue | null;
  variant: FormDataEntryValue | null;
  projectId: string;
  orgId: string;
  existing: BrandingAsset[];
  layoutMd: string;
}): Promise<NextResponse> {
  const { file, projectId, orgId, existing, layoutMd } = opts;

  if (existing.length >= MAX_BRANDING_ITEMS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_BRANDING_ITEMS} branding assets per project` },
      { status: 413 }
    );
  }
  if (file.size > MAX_BRANDING_BYTES) {
    return NextResponse.json(
      { error: "Branding image must be 5 MB or smaller" },
      { status: 413 }
    );
  }
  if (!ALLOWED_BRANDING_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type || "unknown"}` },
      { status: 400 }
    );
  }

  const slotRaw = typeof opts.slot === "string" ? opts.slot : "other";
  const slot: BrandingSlot = VALID_SLOTS.has(slotRaw as BrandingSlot)
    ? (slotRaw as BrandingSlot)
    : "other";

  const variantRaw = typeof opts.variant === "string" ? opts.variant : "colour";
  const variant: BrandingVariant = VALID_VARIANTS.has(
    variantRaw as BrandingVariant
  )
    ? (variantRaw as BrandingVariant)
    : "colour";

  const id = nanoid();
  const ext = extensionFor(file.type, "bin");
  const storagePath = `${orgId}/${projectId}/${slot}-${variant}-${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToBucket("branding", storagePath, buffer, file.type);
  if (!url) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const asset: BrandingAsset = {
    id,
    slot,
    variant,
    url,
    name: safeFilename(file.name || `${slot}.${ext}`),
    mimeType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  const next = [...existing, asset];
  const nextLayoutMd = syncBrandingSectionToLayoutMd(layoutMd, next);

  const { error: updateError } = await supabase
    .from("layout_projects")
    .update({
      branding_assets: next,
      layout_md: nextLayoutMd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("org_id", orgId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to save asset: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    asset,
    brandingAssets: next,
    layoutMd: nextLayoutMd,
  });
}

async function handleContextUpload(opts: {
  file: File;
  projectId: string;
  orgId: string;
  existing: ContextDocument[];
}): Promise<NextResponse> {
  const { file, projectId, orgId, existing } = opts;

  if (existing.length >= MAX_CONTEXT_ITEMS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_CONTEXT_ITEMS} context documents per project` },
      { status: 413 }
    );
  }
  if (file.size > MAX_CONTEXT_BYTES) {
    return NextResponse.json(
      { error: "Context document must be 50 KB or smaller" },
      { status: 413 }
    );
  }

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const extensionOk = ext === "md" || ext === "markdown" || ext === "txt";
  const mimeOk = ALLOWED_CONTEXT_MIME.has(file.type);
  if (!extensionOk && !mimeOk) {
    return NextResponse.json(
      { error: "Only .md or .txt files are supported" },
      { status: 400 }
    );
  }

  const content = await file.text();
  const doc: ContextDocument = {
    id: nanoid(),
    name: safeFilename(file.name || "document.md"),
    content,
    mimeType: file.type || "text/markdown",
    size: content.length,
    addedAt: new Date().toISOString(),
  };

  const next = [...existing, doc];

  const { error: updateError } = await supabase
    .from("layout_projects")
    .update({ context_documents: next, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("org_id", orgId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to save document: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ document: doc, contextDocuments: next });
}
