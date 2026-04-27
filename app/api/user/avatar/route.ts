import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { uploadToBucket } from "@/lib/supabase/storage";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Better Auth's updateUser API validates `image` as an absolute URL and
// rejects our /api/storage/... proxy paths, so we write directly to the
// layout_user row. The session cookie cache picks it up on next refetch.
let _pool: Pool | null = null;
function pool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return _pool;
}

async function setUserImage(userId: string, image: string | null): Promise<void> {
  await pool().query(
    `UPDATE layout_user SET image = $1, "updatedAt" = NOW() WHERE id = $2`,
    [image, userId],
  );
}

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

  try {
    await setUserImage(session.user.id, url);
  } catch (err) {
    console.error("[avatar] failed to write user.image:", err);
    const message = err instanceof Error ? err.message : "Failed to save avatar URL";
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
    await setUserImage(session.user.id, null);
  } catch (err) {
    console.error("[avatar] failed to clear user.image:", err);
    const message = err instanceof Error ? err.message : "Failed to remove avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
