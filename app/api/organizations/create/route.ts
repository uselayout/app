import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-context";
import {
  createOrganization,
  getOrganizationBySlug,
  isValidSlug,
  nameToSlug,
} from "@/lib/supabase/organization";

const createOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(3).max(48).optional(),
});

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  const body: unknown = await request.json();
  const parsed = createOrgSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name } = parsed.data;
  const slug = parsed.data.slug ?? nameToSlug(name);

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      {
        error:
          "Invalid slug. Must be 3-48 characters, lowercase alphanumeric and hyphens only.",
      },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await getOrganizationBySlug(slug);
  if (existing) {
    return NextResponse.json(
      { error: "An organisation with this slug already exists" },
      { status: 409 }
    );
  }

  const org = await createOrganization(name, slug, userId);

  if (!org) {
    return NextResponse.json(
      { error: "Failed to create organisation" },
      { status: 500 }
    );
  }

  return NextResponse.json(org, { status: 201 });
}
