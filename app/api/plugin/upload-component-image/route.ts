import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { uploadToBucket } from "@/lib/supabase/storage";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB per component thumbnail
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Accepts a single component thumbnail from the Figma plugin and stores it in
 * the layout-images bucket. The plugin POSTs each thumbnail individually so a
 * single push payload doesn't balloon when libraries have many components.
 *
 * FormData fields:
 *   file        the image (PNG/JPEG/WebP, ≤4 MB)
 *   fileKey     Figma file key — used as a folder so deletes can scope by file
 *   componentName
 *   variantName? if present, the upload is treated as a per-variant thumbnail
 *
 * Returns: { url: "/api/storage/layout-images/components/..." }
 */
export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400, headers: CORS });
  }

  const file = form.get("file");
  const fileKey = form.get("fileKey");
  const componentName = form.get("componentName");
  const variantName = form.get("variantName");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400, headers: CORS });
  }
  if (typeof fileKey !== "string" || !fileKey) {
    return NextResponse.json({ error: "Missing fileKey" }, { status: 400, headers: CORS });
  }
  if (typeof componentName !== "string" || !componentName) {
    return NextResponse.json({ error: "Missing componentName" }, { status: 400, headers: CORS });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large or empty" }, { status: 413, headers: CORS });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415, headers: CORS });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const variantSegment = typeof variantName === "string" && variantName ? `-${safe(variantName)}` : "";
  // Cache-bust on every push so updated thumbnails replace old ones in browsers.
  const path = `components/${auth.orgId}/${safe(fileKey)}/${safe(componentName)}${variantSegment}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToBucket("layout-images", path, buffer, file.type, { upsert: true });

  if (!url) {
    return NextResponse.json({ error: "Upload failed" }, { status: 502, headers: CORS });
  }

  return NextResponse.json({ url }, { headers: CORS });
}
