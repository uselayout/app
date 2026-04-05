import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { nanoid } from "nanoid";
import type { UploadedFont, FontFormat } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS: Record<string, FontFormat> = {
  ".woff2": "woff2",
  ".woff": "woff",
  ".ttf": "ttf",
  ".otf": "otf",
};

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const family = formData.get("family") as string | null;
  const weight = (formData.get("weight") as string) || "400";
  const style = (formData.get("style") as string) || "normal";
  const projectId = formData.get("projectId") as string | null;
  const orgId = formData.get("orgId") as string | null;

  if (!file || !family || !projectId) {
    return Response.json(
      { error: "Missing required fields: file, family, projectId" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  // Validate file extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const format = ALLOWED_EXTENSIONS[ext];
  if (!format) {
    return Response.json(
      { error: `Invalid file type. Allowed: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}` },
      { status: 400 }
    );
  }

  const id = nanoid();
  const safeName = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `layout-fonts/${orgId ?? "personal"}/${projectId}/${safeName}-${weight}-${style}.${format}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("layout-fonts")
    .upload(filename, buffer, {
      contentType: `font/${format}`,
      upsert: true,
    });

  if (uploadError) {
    return Response.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Return proxy URL (not direct Supabase URL) for mixed-content safety
  const url = `/api/storage/layout-fonts/${filename}`;

  const uploadedFont: UploadedFont = {
    id,
    family,
    weight,
    style,
    format,
    url,
    projectId,
    orgId: orgId ?? undefined,
  };

  return Response.json(uploadedFont);
}
