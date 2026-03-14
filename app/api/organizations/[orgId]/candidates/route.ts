import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  createCandidate,
  getCandidatesByOrg,
} from "@/lib/supabase/candidates";
import type { CandidateStatus } from "@/lib/types/candidate";

const CreateCandidateSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  componentId: z.string().uuid().optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        code: z.string(),
        rationale: z.string().optional(),
      })
    )
    .min(1),
  designMdSnapshot: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as CandidateStatus | null;
  const search = url.searchParams.get("search");

  const candidates = await getCandidatesByOrg(orgId, {
    status: status ?? undefined,
    search: search ?? undefined,
  });

  return NextResponse.json(candidates);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateCandidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const candidate = await createCandidate({
    orgId,
    name: parsed.data.name,
    prompt: parsed.data.prompt,
    description: parsed.data.description,
    category: parsed.data.category,
    componentId: parsed.data.componentId,
    variants: parsed.data.variants,
    designMdSnapshot: parsed.data.designMdSnapshot,
    createdBy: authResult.userId,
  });

  if (!candidate) {
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }

  return NextResponse.json(candidate, { status: 201 });
}
