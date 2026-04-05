"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Trash2, Type, Globe } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store/project";
import type { FontDeclaration, UploadedFont, ExtractedToken } from "@/lib/types";

interface FontManagerProps {
  projectId: string;
  orgId?: string;
  extractedFonts: FontDeclaration[];
  uploadedFonts: UploadedFont[];
  /** Typography tokens to parse font families from when extractedFonts is empty */
  typographyTokens?: ExtractedToken[];
  /** Called after a font is uploaded (e.g. to show regeneration prompt) */
  onFontUploaded?: () => void;
}

/** Extract unique font families from typography token values. */
function parseFontsFromTypography(tokens: ExtractedToken[]): FontDeclaration[] {
  const families = new Map<string, Set<string>>();
  for (const t of tokens) {
    // Typography tokens have values like "font-family: 'Circular', -apple-system, ..."
    const match = t.value.match(/font-family:\s*([^;]+)/i);
    if (!match) continue;
    // Get the first font in the stack (primary family)
    const raw = match[1].trim().split(",")[0].trim().replace(/['"]/g, "");
    if (!raw || raw === "Unknown") continue;

    // Try to extract weight from the same token value
    const weightMatch = t.value.match(/font-weight:\s*(\d+|normal|bold)/i);
    const weight = weightMatch?.[1] === "bold" ? "700" : weightMatch?.[1] === "normal" ? "400" : weightMatch?.[1] ?? "400";

    const existing = families.get(raw) ?? new Set<string>();
    existing.add(weight);
    families.set(raw, existing);
  }

  const result: FontDeclaration[] = [];
  for (const [family, weights] of families) {
    for (const weight of weights) {
      result.push({ family, weight, style: "normal", display: "swap" });
    }
  }
  return result;
}

/** Parse font weight and style from filename conventions. */
function parseWeightFromName(name: string): { weight: string; style: string } {
  const lower = name.toLowerCase();
  const styleMap: Record<string, string> = {
    thin: "100", hairline: "100",
    extralight: "200", ultralight: "200",
    light: "300",
    regular: "400", normal: "400",
    medium: "500",
    semibold: "600", demibold: "600",
    bold: "700",
    extrabold: "800", ultrabold: "800",
    black: "900", heavy: "900",
  };

  let weight = "400";
  let style = "normal";

  if (lower.includes("italic")) style = "italic";

  for (const [key, val] of Object.entries(styleMap)) {
    if (lower.includes(key)) {
      weight = val;
      break;
    }
  }

  return { weight, style };
}

export function FontManager({ projectId, orgId, extractedFonts, uploadedFonts, typographyTokens, onFontUploaded }: FontManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [familyInput, setFamilyInput] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const updateUploadedFonts = useProjectStore((s) => s.updateUploadedFonts);

  // Use extractedFonts if available, otherwise parse from typography tokens
  const effectiveFonts = extractedFonts.length > 0
    ? extractedFonts
    : parseFontsFromTypography(typographyTokens ?? []);

  // Group extracted fonts by family
  const extractedFamilies = new Map<string, FontDeclaration[]>();
  for (const f of effectiveFonts) {
    const existing = extractedFamilies.get(f.family) ?? [];
    existing.push(f);
    extractedFamilies.set(f.family, existing);
  }

  // Group uploaded fonts by family
  const uploadedFamilies = new Map<string, UploadedFont[]>();
  for (const f of uploadedFonts) {
    const existing = uploadedFamilies.get(f.family) ?? [];
    existing.push(f);
    uploadedFamilies.set(f.family, existing);
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["woff2", "woff", "ttf", "otf"].includes(ext)) {
      toast.error("Invalid file type. Use .woff2, .woff, .ttf, or .otf");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    // Pre-fill family name from filename
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    // Remove weight/style words
    const cleaned = baseName
      .replace(/\b(thin|hairline|extralight|ultralight|light|regular|normal|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|italic)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    setPendingFile(file);
    setFamilyInput(cleaned || baseName);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!pendingFile || !familyInput.trim()) return;

    setUploading(true);
    try {
      const { weight, style } = parseWeightFromName(pendingFile.name);
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("family", familyInput.trim());
      formData.append("weight", weight);
      formData.append("style", style);
      formData.append("projectId", projectId);
      if (orgId) formData.append("orgId", orgId);

      const res = await fetch("/api/fonts/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        toast.error(err.error ?? "Upload failed");
        return;
      }

      const newFont: UploadedFont = await res.json();
      const updated = [...uploadedFonts, newFont];
      updateUploadedFonts(projectId, updated);
      toast.success(`Uploaded ${familyInput.trim()} (${weight})`);
      setPendingFile(null);
      setFamilyInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onFontUploaded?.();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [pendingFile, familyInput, projectId, orgId, uploadedFonts, updateUploadedFonts]);

  const handleDelete = useCallback((fontId: string) => {
    const updated = uploadedFonts.filter((f) => f.id !== fontId);
    updateUploadedFonts(projectId, updated);
    toast.success("Font removed");
  }, [uploadedFonts, projectId, updateUploadedFonts]);

  const hasAnyFonts = extractedFamilies.size > 0 || uploadedFamilies.size > 0;

  return (
    <div className="space-y-4">
      {/* Extracted fonts (read-only) */}
      {extractedFamilies.size > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Extracted fonts
            </span>
          </div>
          <div className="space-y-1">
            {[...extractedFamilies.entries()].map(([family, variants]) => (
              <div
                key={family}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--studio-border)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Type className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="text-sm text-[var(--text-primary)] truncate">
                    {family}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)] shrink-0 ml-2">
                  {variants.map((v) => v.weight).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded fonts (editable) */}
      {uploadedFamilies.size > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Upload className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Custom fonts
            </span>
          </div>
          <div className="space-y-1">
            {[...uploadedFamilies.entries()].map(([family, variants]) =>
              variants.map((font) => (
                <div
                  key={font.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--studio-border)] group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Type className="w-3.5 h-3.5 text-[var(--studio-accent)] shrink-0" />
                    <span className="text-sm text-[var(--text-primary)] truncate">
                      {family}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {font.weight} {font.style !== "normal" ? font.style : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(font.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-hover)] transition-all"
                    title="Remove font"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload section */}
      <div className="border border-dashed border-[var(--studio-border)] rounded-md p-3">
        {!pendingFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload custom font (.woff2, .woff, .ttf, .otf)
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[var(--studio-accent)]" />
              <span className="text-sm text-[var(--text-primary)] truncate">
                {pendingFile.name}
              </span>
            </div>
            <input
              type="text"
              value={familyInput}
              onChange={(e) => setFamilyInput(e.target.value)}
              placeholder="Font family name"
              className="w-full px-2 py-1.5 text-sm bg-[var(--bg-surface)] border border-[var(--studio-border)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--studio-border-focus)]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading || !familyInput.trim()}
                className="flex-1 px-3 py-1.5 text-sm font-medium rounded bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => {
                  setPendingFile(null);
                  setFamilyInput("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-3 py-1.5 text-sm rounded border border-[var(--studio-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".woff2,.woff,.ttf,.otf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {!hasAnyFonts && !pendingFile && (
        <p className="text-xs text-[var(--text-muted)] text-center py-2">
          No fonts detected. Extract a design system or upload custom fonts.
        </p>
      )}
    </div>
  );
}
