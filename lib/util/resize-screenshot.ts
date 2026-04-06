import sharp from "sharp";

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 4000;
const MAX_BYTES = 4_500_000; // 4.5MB — leaves margin below Claude's 5MB image limit

/**
 * Resize a screenshot for Claude's vision API.
 * Accepts base64 data URIs or HTTP URLs (Supabase Storage).
 * Caps at 1200px wide and 4000px tall to keep token costs reasonable
 * while preserving enough detail for page structure analysis.
 *
 * Returns a base64 data URI, or null if the input is invalid.
 */
export async function resizeScreenshot(
  source: string
): Promise<string | null> {
  let buffer: Buffer;
  let format = "png";

  if (source.startsWith("data:")) {
    const match = source.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return null;
    format = match[1];
    buffer = Buffer.from(match[2], "base64");
  } else if (source.startsWith("http")) {
    try {
      const res = await fetch(source);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  } else {
    return null;
  }

  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    // Skip resize if already within bounds AND under size limit
    if (width <= MAX_WIDTH && height <= MAX_HEIGHT && buffer.length <= MAX_BYTES) {
      return `data:image/${format};base64,${buffer.toString("base64")}`;
    }

    let pipeline = sharp(buffer);

    // Resize width first (maintaining aspect ratio)
    if (width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH });
    }

    // Crop height if still too tall after width resize
    const resizedMeta = await pipeline.toBuffer().then((b) => sharp(b).metadata());
    if ((resizedMeta.height ?? 0) > MAX_HEIGHT) {
      pipeline = sharp(await pipeline.toBuffer()).extract({
        left: 0,
        top: 0,
        width: resizedMeta.width ?? MAX_WIDTH,
        height: MAX_HEIGHT,
      });
    }

    let outputBuffer = await pipeline.png().toBuffer();
    let outputFormat = format === "png" ? "png" : format;

    // If PNG is too large for Claude's 5MB limit, convert to JPEG
    if (outputBuffer.length > MAX_BYTES) {
      outputBuffer = await sharp(outputBuffer).jpeg({ quality: 80 }).toBuffer();
      outputFormat = "jpeg";
    }

    // If still too large, halve dimensions and reduce quality
    if (outputBuffer.length > MAX_BYTES) {
      const meta = await sharp(outputBuffer).metadata();
      outputBuffer = await sharp(outputBuffer)
        .resize({ width: Math.round((meta.width ?? 600) / 2) })
        .jpeg({ quality: 70 })
        .toBuffer();
      outputFormat = "jpeg";
    }

    return `data:image/${outputFormat};base64,${outputBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}
