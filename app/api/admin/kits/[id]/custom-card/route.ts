import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { fetchKitById, setCustomCardImage } from "@/lib/supabase/kits";
import { uploadToBucket, deleteFromBucket } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

const REQUIRED_W = 1440;
const REQUIRED_H = 1080;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

interface Dimensions {
  width: number;
  height: number;
}

// Magic-byte dimension readers for the three allowed formats. Avoids pulling
// in sharp just for a one-off width/height check.
function readPngDimensions(buf: Buffer): Dimensions | null {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  // IHDR chunk starts at byte 16: width (4 BE), height (4 BE)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readJpegDimensions(buf: Buffer): Dimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    i += 2;
    // SOF markers: C0–C3, C5–C7, C9–CB, CD–CF
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      // length(2), precision(1), height(2), width(2)
      return { height: buf.readUInt16BE(i + 3), width: buf.readUInt16BE(i + 5) };
    }
    if (marker === 0xd8 || marker === 0xd9) return null;
    const segLen = buf.readUInt16BE(i);
    i += segLen;
  }
  return null;
}

function readWebpDimensions(buf: Buffer): Dimensions | null {
  if (buf.length < 30) return null;
  if (buf.subarray(0, 4).toString("ascii") !== "RIFF") return null;
  if (buf.subarray(8, 12).toString("ascii") !== "WEBP") return null;
  const tag = buf.subarray(12, 16).toString("ascii");
  if (tag === "VP8 ") {
    // Lossy: width/height at byte 26/28
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (tag === "VP8L") {
    // Lossless: 14-bit width-1, 14-bit height-1 packed at byte 21
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  if (tag === "VP8X") {
    // Extended: 24-bit width-1, 24-bit height-1 at byte 24
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }
  return null;
}

function readDimensions(buf: Buffer, mime: string): Dimensions | null {
  if (mime === "image/png") return readPngDimensions(buf);
  if (mime === "image/jpeg") return readJpegDimensions(buf);
  if (mime === "image/webp") return readWebpDimensions(buf);
  return null;
}

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

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }
  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, or WEBP." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dims = readDimensions(buffer, file.type);
  if (!dims) {
    return NextResponse.json(
      { error: "Could not read image dimensions. Try a different file." },
      { status: 400 },
    );
  }
  if (dims.width !== REQUIRED_W || dims.height !== REQUIRED_H) {
    return NextResponse.json(
      {
        error: `Image must be exactly ${REQUIRED_W}\u00d7${REQUIRED_H} (4:3). Yours is ${dims.width}\u00d7${dims.height}.`,
      },
      { status: 400 },
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // Timestamp the path so the proxied URL bypasses CDN cache after re-upload.
  const path = `kit-custom-cards/${kit.id}-${Date.now()}.${ext}`;
  const url = await uploadToBucket("layout-images", path, buffer, file.type, { upsert: true });
  if (!url) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const ok = await setCustomCardImage(kit.id, url);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save image URL" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url });
}

export async function DELETE(
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

  // Best-effort delete the bucket object too, but never block on it.
  if (kit.customCardImageUrl) {
    const match = kit.customCardImageUrl.match(/\/api\/storage\/layout-images\/(.+)$/);
    if (match) {
      await deleteFromBucket("layout-images", [match[1]]).catch(() => undefined);
    }
  }

  const ok = await setCustomCardImage(kit.id, null);
  if (!ok) {
    return NextResponse.json({ error: "Failed to clear image" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
