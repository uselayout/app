import sharp from "sharp";

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 4000;

/**
 * Resize a base64 PNG screenshot for Claude's vision API.
 * Caps at 1200px wide and 4000px tall to keep token costs reasonable
 * while preserving enough detail for page structure analysis.
 *
 * Returns a base64 data URI, or null if the input is invalid.
 */
export async function resizeScreenshot(
  dataUri: string
): Promise<string | null> {
  const match = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;

  const [, format, base64Data] = match;
  const buffer = Buffer.from(base64Data, "base64");

  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    // Skip resize if already within bounds
    if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
      return dataUri;
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

    const outputBuffer = await pipeline.png().toBuffer();
    const outputFormat = format === "png" ? "png" : format;
    return `data:image/${outputFormat};base64,${outputBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}
