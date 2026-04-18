"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, Trash2, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store/project";
import type { ContextDocument } from "@/lib/types";

interface ContextDocsTabProps {
  projectId: string;
  orgId: string;
  documents: ContextDocument[];
}

const ACCEPT = ".md,.markdown,.txt,text/markdown,text/plain";
const MAX_BYTES = 50 * 1024;
const MAX_DOCS = 10;

export function ContextDocsTab({
  projectId,
  orgId,
  documents,
}: ContextDocsTabProps) {
  const updateContextDocuments = useProjectStore(
    (s) => s.updateContextDocuments
  );
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (documents.length + files.length > MAX_DOCS) {
        toast.error(`Max ${MAX_DOCS} context documents per project`);
        return;
      }

      setBusy(true);
      try {
        let latest = documents;
        for (const file of Array.from(files)) {
          if (file.size > MAX_BYTES) {
            toast.error(`${file.name} is larger than 50 KB`);
            continue;
          }
          const form = new FormData();
          form.set("kind", "context-doc");
          form.set("file", file);

          const response = await fetch(
            `/api/organizations/${orgId}/projects/${projectId}/assets`,
            { method: "POST", body: form }
          );

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            toast.error(err.error ?? `Failed to upload ${file.name}`);
            continue;
          }

          const payload = (await response.json()) as {
            document: ContextDocument;
            contextDocuments: ContextDocument[];
          };
          latest = payload.contextDocuments;
          toast.success(`Added ${file.name}`);
        }
        updateContextDocuments(projectId, latest);
      } finally {
        setBusy(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [documents, orgId, projectId, updateContextDocuments]
  );

  const remove = useCallback(
    async (id: string, name: string) => {
      setBusy(true);
      try {
        const response = await fetch(
          `/api/organizations/${orgId}/projects/${projectId}/assets/${id}?kind=context-doc`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          toast.error(`Failed to delete ${name}`);
          return;
        }
        const payload = (await response.json()) as {
          contextDocuments: ContextDocument[];
        };
        updateContextDocuments(projectId, payload.contextDocuments);
      } finally {
        setBusy(false);
      }
    },
    [orgId, projectId, updateContextDocuments]
  );

  const togglePinned = useCallback(
    async (doc: ContextDocument) => {
      setBusy(true);
      try {
        const response = await fetch(
          `/api/organizations/${orgId}/projects/${projectId}/assets/${doc.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "context-doc",
              pinned: !doc.pinned,
            }),
          }
        );
        if (!response.ok) {
          toast.error("Failed to update pin");
          return;
        }
        const payload = (await response.json()) as {
          contextDocuments: ContextDocument[];
        };
        updateContextDocuments(projectId, payload.contextDocuments);
      } finally {
        setBusy(false);
      }
    },
    [orgId, projectId, updateContextDocuments]
  );

  const atLimit = documents.length >= MAX_DOCS;

  return (
    <div className="p-3">
      <div className="mb-3">
        <h3 className="text-xs font-medium text-[var(--text-primary)]">
          Context documents
        </h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--text-muted)]">
          Brand voice, product descriptions, copy guidelines. Attached to every
          variant generation as supplementary context.
        </p>
      </div>

      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--studio-border)] px-3 py-4 text-xs text-[var(--text-muted)] transition-colors ${
          atLimit || busy
            ? "pointer-events-none opacity-50"
            : "hover:border-[var(--studio-border-strong)] hover:bg-[var(--studio-accent-subtle)] hover:text-[var(--text-secondary)]"
        }`}
      >
        <Upload size={14} />
        {atLimit
          ? `Maximum ${MAX_DOCS} documents reached`
          : "Upload .md or .txt file"}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy || atLimit}
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </label>

      {documents.length > 0 && (
        <ul className="mt-3 space-y-1">
          {documents.map((doc) => {
            const isExpanded = expandedId === doc.id;
            return (
              <li
                key={doc.id}
                className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)]"
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <FileText
                    size={12}
                    className="shrink-0 text-[var(--text-muted)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : doc.id)
                    }
                    className="flex-1 truncate text-left text-xs text-[var(--text-primary)] hover:text-[var(--text-secondary)]"
                    title={doc.name}
                  >
                    {doc.name}
                  </button>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {Math.ceil(doc.size / 1024)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePinned(doc)}
                    title={doc.pinned ? "Unpin" : "Pin to top"}
                    disabled={busy}
                    className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                  >
                    {doc.pinned ? <Pin size={12} /> : <PinOff size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(doc.id, doc.name)}
                    disabled={busy}
                    title="Delete"
                    className="rounded p-1 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <pre className="max-h-48 overflow-auto border-t border-[var(--studio-border)] p-2 text-[10px] text-[var(--text-muted)]">
                    {doc.content}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
