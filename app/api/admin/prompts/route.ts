import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  return `${local[0]}***@${domain}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = Math.min(Math.max(parseInt(daysParam ?? "30", 10) || 30, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [eventsRes, usersRes] = await Promise.all([
    supabase
      .from("layout_platform_event")
      .select("user_id, metadata, created_at")
      .eq("event", "variant.generated")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("layout_user")
      .select("id, email")
      .limit(500),
  ]);

  const events = eventsRes.data ?? [];
  const users = usersRes.data ?? [];

  const userMap = new Map<string, string>();
  for (const u of users) {
    if (u.id && u.email) userMap.set(u.id, u.email);
  }

  const prompts = events.map((e) => {
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    return {
      prompt: (meta.prompt as string) ?? null,
      modelId: (meta.modelId as string) ?? null,
      variantCount: (meta.variantCount as number) ?? null,
      isRefinement: (meta.isRefinement as boolean) ?? false,
      hasImageUpload: (meta.hasImageUpload as boolean) ?? false,
      userId: e.user_id,
      userEmail: e.user_id ? maskEmail(userMap.get(e.user_id) ?? "unknown") : "***",
      createdAt: e.created_at,
    };
  });

  return NextResponse.json({ prompts }, { headers: { "Cache-Control": "no-store, private" } });
}
