import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getCandidate,
  updateCandidateStatus,
  selectCandidateVariant,
} from "@/lib/supabase/candidates";
import {
  createComponent,
  updateComponentCode,
  nameToComponentSlug,
} from "@/lib/supabase/components";

const ApproveSchema = z.object({
  selectedVariantIndex: z.number().int().min(0),
  changeSummary: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; candidateId: string }> }
) {
  const { orgId, candidateId } = await params;

  const authResult = await requireOrgAuth(orgId, "reviewCandidate");
  if (authResult instanceof NextResponse) return authResult;

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.orgId !== orgId) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { selectedVariantIndex, changeSummary } = parsed.data;

  if (selectedVariantIndex >= candidate.variants.length) {
    return NextResponse.json(
      { error: "Invalid variant index" },
      { status: 400 }
    );
  }

  const variant = candidate.variants[selectedVariantIndex];

  // Transpile the selected variant's code
  let compiledJs: string | null = null;
  try {
    const transpileRes = await fetch(
      new URL("/api/transpile", request.url),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: variant.code }),
      }
    );

    if (transpileRes.ok) {
      const transpileData = (await transpileRes.json()) as { js?: string };
      compiledJs = transpileData.js ?? null;
    }
  } catch {
    // Transpilation failure is non-fatal — continue without compiledJs
  }

  let component;

  if (candidate.componentId) {
    // Update existing component
    await updateComponentCode(
      candidate.componentId,
      variant.code,
      compiledJs,
      authResult.userId,
      changeSummary ?? "Approved from candidate"
    );
    component = { id: candidate.componentId };
  } else {
    // Create new component
    const slug = nameToComponentSlug(candidate.name);
    component = await createComponent({
      orgId,
      name: candidate.name,
      slug,
      code: variant.code,
      compiledJs: compiledJs ?? undefined,
      description: candidate.description ?? undefined,
      category: candidate.category,
      source: "candidate",
      createdBy: authResult.userId,
    });

    if (!component) {
      return NextResponse.json(
        { error: "Failed to create component" },
        { status: 500 }
      );
    }
  }

  // Mark candidate as approved
  await selectCandidateVariant(candidateId, selectedVariantIndex);
  await updateCandidateStatus(candidateId, "approved", authResult.userId);

  return NextResponse.json(component, { status: 200 });
}
