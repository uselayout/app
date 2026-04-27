import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById, setBespokeShowcase, updateKitShowcase } from "@/lib/supabase/kits";

// Accepts a pre-generated bespoke showcase (TSX + transpiled JS) from a
// trusted source — the local regen-bespoke.ts script. Stores both,
// auto-flips bespoke_showcase to true so the gallery page serves the
// new output.
//
// The server does ZERO work here beyond DB writes — no Claude call, no
// transpile. This is the offload that keeps the staging container
// stable while we generate per-brand bespoke kits.
//
// Bearer-admin auth required (script runs locally with ADMIN_API_KEY).

const Body = z.object({
  tsx: z.string().min(100).max(200_000),
  js: z.string().min(100).max(400_000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request as never);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const kit = await fetchKitById(id);
  if (!kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    const raw = await request.json();
    parsed = Body.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid body" },
      { status: 400 },
    );
  }

  const ok = await updateKitShowcase(kit.id, parsed.tsx, parsed.js);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save showcase" }, { status: 500 });
  }
  if (!kit.bespokeShowcase) await setBespokeShowcase(kit.id, true);

  return NextResponse.json({
    ok: true,
    kitId: kit.id,
    slug: kit.slug,
    tsxLen: parsed.tsx.length,
    jsLen: parsed.js.length,
  });
}
