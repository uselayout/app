/**
 * Upload a reference image (data URI) to Supabase Storage and return the URL.
 * The URL is what gets persisted on the ExplorationSession — the data URI is
 * too large to round-trip through the project save payload (was previously
 * stripped by stripBloatForSave, which meant images vanished on refresh).
 */
export async function uploadReferenceImage(
  orgId: string,
  projectId: string,
  dataUri: string
): Promise<string | null> {
  // Already a URL — nothing to do.
  if (!dataUri.startsWith("data:")) return dataUri;

  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mime, base64] = match;

  // Decode base64 to a Blob in the browser without streaming.
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = mime.split("/")[1] ?? "png";
  const file = new File([bytes], `reference.${ext}`, { type: mime });

  const form = new FormData();
  form.set("kind", "explorer-reference");
  form.set("file", file);

  try {
    const res = await fetch(
      `/api/organizations/${orgId}/projects/${projectId}/assets`,
      { method: "POST", body: form }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  } catch {
    return null;
  }
}
