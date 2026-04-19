import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { supabase } from "@/lib/supabase/client";
import { deleteFromBucket } from "@/lib/supabase/storage";
import { syncBrandingSectionToLayoutMd } from "@/lib/branding/sync-to-layout-md";
import type {
  BrandingAsset,
  BrandingSlot,
  BrandingVariant,
  ContextDocument,
} from "@/lib/types";

type Params = {
  params: Promise<{ orgId: string; projectId: string; assetId: string }>;
};

const PatchSchema = z.object({
  kind: z.enum(["branding", "context-doc"]),
  slot: z.enum(["primary", "secondary", "wordmark", "favicon", "mark", "other"]).optional(),
  variant: z.enum(["colour", "white", "black", "mono"]).optional(),
  pinned: z.boolean().optional(),
  name: z.string().min(1).max(80).optional(),
});

function storagePathFromUrl(url: string): string | null {
  const prefix = "/api/storage/branding/";
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

/**
 * PATCH — update an asset. For branding, you can change `slot`. For context
 * documents, you can toggle `pinned` or rename.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { orgId, projectId, assetId } = await params;

  const auth = await requireOrgAuth(orgId, "editProject");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { kind, slot, variant, pinned, name } = parsed.data;

  const { data: project, error } = await supabase
    .from("layout_projects")
    .select("branding_assets, context_documents, layout_md")
    .eq("id", projectId)
    .eq("org_id", auth.orgId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (kind === "branding") {
    const assets = (project.branding_assets as BrandingAsset[]) ?? [];
    const next = assets.map((a) =>
      a.id === assetId
        ? {
            ...a,
            slot: (slot as BrandingSlot) ?? a.slot,
            variant: (variant as BrandingVariant) ?? a.variant,
            name: name ?? a.name,
          }
        : a
    );
    if (next.every((a) => a.id !== assetId)) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const layoutMd = (project.layout_md as string) ?? "";
    const nextLayoutMd = syncBrandingSectionToLayoutMd(layoutMd, next);

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
        { error: `Failed to update: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ brandingAssets: next, layoutMd: nextLayoutMd });
  }

  const docs = (project.context_documents as ContextDocument[]) ?? [];
  const next = docs.map((d) =>
    d.id === assetId
      ? {
          ...d,
          pinned: pinned ?? d.pinned,
          name: name ?? d.name,
        }
      : d
  );
  if (next.every((d) => d.id !== assetId)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("layout_projects")
    .update({ context_documents: next, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("org_id", auth.orgId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ contextDocuments: next });
}

/**
 * DELETE — remove an asset. For branding assets, also deletes the file from
 * Supabase storage.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { orgId, projectId, assetId } = await params;

  const auth = await requireOrgAuth(orgId, "editProject");
  if (auth instanceof NextResponse) return auth;

  const kind = request.nextUrl.searchParams.get("kind");
  if (kind !== "branding" && kind !== "context-doc") {
    return NextResponse.json(
      { error: "kind query param must be 'branding' or 'context-doc'" },
      { status: 400 }
    );
  }

  const { data: project, error } = await supabase
    .from("layout_projects")
    .select("branding_assets, context_documents, layout_md")
    .eq("id", projectId)
    .eq("org_id", auth.orgId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (kind === "branding") {
    const assets = (project.branding_assets as BrandingAsset[]) ?? [];
    const target = assets.find((a) => a.id === assetId);
    if (!target) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const storagePath = storagePathFromUrl(target.url);
    if (storagePath) await deleteFromBucket("branding", [storagePath]);

    const next = assets.filter((a) => a.id !== assetId);
    const layoutMd = (project.layout_md as string) ?? "";
    const nextLayoutMd = syncBrandingSectionToLayoutMd(layoutMd, next);

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
        { error: `Failed to delete: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ brandingAssets: next, layoutMd: nextLayoutMd });
  }

  const docs = (project.context_documents as ContextDocument[]) ?? [];
  const next = docs.filter((d) => d.id !== assetId);
  if (next.length === docs.length) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("layout_projects")
    .update({ context_documents: next, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("org_id", auth.orgId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to delete: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ contextDocuments: next });
}
