import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById } from "@/lib/supabase/kits";
import { supabase } from "@/lib/supabase/client";
import { promoteKit, collectStorageRefs } from "@/lib/promote/promote-kit";
import { promoteLimit } from "@/lib/concurrency";

/**
 * Outbound side of the cross-environment kit promote.
 *
 * Reads the source kit from THIS environment's Supabase, calls the destination's
 * /api/admin/kits/import to land the row, then copies every storage object the
 * kit references from this env's storage proxy to the destination's Supabase.
 *
 * Required env vars on this environment:
 *   - PROD_API_BASE_URL              destination app origin (e.g. https://layout.design)
 *   - PROD_ADMIN_API_KEY             destination's ADMIN_API_KEY (their bearer token)
 *   - PROD_SUPABASE_URL              destination Supabase origin
 *   - PROD_SUPABASE_SERVICE_ROLE_KEY destination Supabase service-role JWT
 *   - NEXT_PUBLIC_APP_URL            this env's public origin (so the destination
 *                                    can fetch storage from us)
 *
 * Slug conflict on destination → 409 with `{existingProdUrl}`. Re-call with
 * `?overwrite=true` to upsert (idempotent — uses x-upsert on storage too).
 *
 * Pending kits (status !== 'approved') → 400. Promote only finished work.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await context.params;
  const overwrite = new URL(request.url).searchParams.get("overwrite") === "true";

  // Validate required env up-front so we fail fast with a clear message
  // instead of mid-flight network errors.
  const destAppUrl = process.env.PROD_API_BASE_URL;
  const destAdminApiKey = process.env.PROD_ADMIN_API_KEY;
  const destSupabaseUrl = process.env.PROD_SUPABASE_URL;
  const destServiceRole = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
  const sourceOrigin = process.env.NEXT_PUBLIC_APP_URL;

  const missing: string[] = [];
  if (!destAppUrl) missing.push("PROD_API_BASE_URL");
  if (!destAdminApiKey) missing.push("PROD_ADMIN_API_KEY");
  if (!destSupabaseUrl) missing.push("PROD_SUPABASE_URL");
  if (!destServiceRole) missing.push("PROD_SUPABASE_SERVICE_ROLE_KEY");
  if (!sourceOrigin) missing.push("NEXT_PUBLIC_APP_URL");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "promote_misconfigured", missingEnv: missing },
      { status: 500 },
    );
  }

  const kit = await fetchKitById(id);
  if (!kit) {
    return NextResponse.json({ error: "kit_not_found" }, { status: 404 });
  }

  if (kit.status !== "approved") {
    return NextResponse.json(
      {
        error: "kit_not_approved",
        message: "Only approved kits can be promoted to production.",
      },
      { status: 400 },
    );
  }

  const result = await promoteLimit(() =>
    promoteKit({
      kit,
      destAppUrl: destAppUrl!,
      destAdminApiKey: destAdminApiKey!,
      destSupabaseUrl: destSupabaseUrl!,
      destServiceRole: destServiceRole!,
      sourceOrigin: sourceOrigin!,
      overwrite,
    }),
  );

  // Audit log — write success or failure.
  try {
    await supabase.from("layout_kit_promote_log").insert({
      kit_id: kit.id,
      kit_slug: kit.slug,
      target_env: "production",
      target_url: result.prodUrl ?? `${destAppUrl}/gallery/${kit.slug}`,
      overwrite,
      files_copied: result.storage.failures.length === 0
        ? collectStorageRefs(kit).map((url) => ({ url, ok: true }))
        : [
            ...collectStorageRefs(kit)
              .filter((u) => !result.storage.failures.find((f) => f.url === u))
              .map((url) => ({ url, ok: true })),
            ...result.storage.failures.map((f) => ({ url: f.url, ok: false, reason: f.reason })),
          ],
      success: result.ok,
      error: result.error ?? null,
      duration_ms: result.durationMs,
      promoted_by: admin.email,
    });
  } catch {
    // Audit log is best-effort; don't fail the request because the log write threw.
  }

  if (result.conflict) {
    return NextResponse.json(
      {
        error: "slug_exists",
        existingProdUrl: result.conflict.existingProdUrl,
        canOverwrite: true,
      },
      { status: 409 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "promote_failed", storage: result.storage },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    prodKitId: result.prodKitId,
    prodSlug: result.prodSlug,
    prodUrl: result.prodUrl,
    storage: result.storage,
    durationMs: result.durationMs,
  });
}
