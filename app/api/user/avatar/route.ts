import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { uploadToBucket } from "@/lib/supabase/storage";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Accepts a multipart upload from the profile settings page, stores the image
// in the user-avatars bucket, and updates user.image via Better Auth so the
// new URL flows everywhere session.user.image is read (publish flow, UserMenu,
// kit cards, etc.).
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, or WEBP." },
      { status: 400 },
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${session.user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToBucket("user-avatars", path, buffer, file.type, { upsert: true });
  if (!url) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Persist the new URL on the user row via Better Auth's server API. This
  // surfaces it on session.user.image everywhere without a reload.
  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: { image: url },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "update-user failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ url });
}

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: { image: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "update-user failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
