"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  buildSrcdoc,
  extractComponentName,
} from "@/lib/explore/preview-helpers";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { ComponentVersionHistory } from "./ComponentVersionHistory";
import type { Component } from "@/lib/types/component";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface ComponentDetailProps {
  component: Component;
  orgSlug: string;
  onUpdate: (updated: Component) => void;
}

const STATUS_COLOURS: Record<string, string> = {
  approved: "#22C55E",
  draft: "#F59E0B",
  deprecated: "#EF4444",
};

export function ComponentDetail({
  component,
  orgSlug,
  onUpdate,
}: ComponentDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editCode, setEditCode] = useState(component.code);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const componentName = extractComponentName(component.code);
  const srcdoc = component.compiledJs
    ? buildSrcdoc(component.compiledJs, componentName)
    : null;

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      const res = await fetch(
        `/api/organizations/${component.orgId}/components/${component.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) {
        const updated: Component = await res.json();
        onUpdate(updated);
      }
    },
    [component.orgId, component.id, onUpdate]
  );

  const handleCopy = useCallback(async () => {
    await copyToClipboard(component.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [component.code]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Transpile first
      const transpileRes = await fetch("/api/transpile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editCode }),
      });

      if (!transpileRes.ok) {
        const err = await transpileRes.json();
        alert(`Transpile error: ${err.error ?? "Unknown error"}`);
        return;
      }

      const { js } = await transpileRes.json();

      // PATCH the component
      const res = await fetch(
        `/api/organizations/${component.orgId}/components/${component.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: editCode,
            compiledJs: js,
            changeSummary: "Code updated via editor",
          }),
        }
      );

      if (res.ok) {
        const updated: Component = await res.json();
        onUpdate(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }, [editCode, component.orgId, component.id, onUpdate]);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <Link
          href={`/${orgSlug}/library`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:text-[var(--text-primary)]"
        >
          &larr; Library
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {component.name}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm">
              {component.category && (
                <span className="rounded bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-xs text-[var(--studio-accent)]">
                  {component.category}
                </span>
              )}
              <span className="text-[var(--text-muted)]">
                v{component.version}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      STATUS_COLOURS[component.status] ?? STATUS_COLOURS.draft,
                  }}
                />
                <span className="capitalize text-[var(--text-muted)]">
                  {component.status}
                </span>
              </span>
            </div>
            {component.description && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {component.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={component.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="deprecated">Deprecated</option>
            </select>

            {!editing && (
              <button
                onClick={() => {
                  setEditCode(component.code);
                  setEditing(true);
                }}
                className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
              >
                Edit Code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Preview
        </h2>
        <div className="h-[400px] overflow-hidden rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-elevated)]">
          {srcdoc ? (
            <iframe
              srcDoc={srcdoc}
              sandbox="allow-scripts"
              className="h-full w-full border-0"
              title={component.name}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
              No preview available
            </div>
          )}
        </div>
      </section>

      {/* Props table */}
      {component.props.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
            Props
          </h2>
          <div className="overflow-x-auto rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--studio-border)] bg-[var(--bg-elevated)]">
                  <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">
                    Default
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">
                    Required
                  </th>
                </tr>
              </thead>
              <tbody>
                {component.props.map((prop) => (
                  <tr
                    key={prop.name}
                    className="border-b border-[var(--studio-border)]"
                  >
                    <td className="px-4 py-2 font-mono text-[var(--text-primary)]">
                      {prop.name}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">
                      {prop.type}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {prop.defaultValue ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {prop.required ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Code section */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Code
        </h2>
        {editing ? (
          <div className="space-y-3">
            <div className="h-[400px] overflow-hidden rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)]">
              <MonacoEditor
                height="100%"
                language="typescript"
                theme="vs-dark"
                value={editCode}
                onChange={(value) => setEditCode(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <pre className="overflow-auto rounded-[var(--studio-radius-lg)] bg-[var(--bg-elevated)] p-4 text-sm font-mono text-[var(--text-primary)]">
              {component.code}
            </pre>
          </div>
        )}
      </section>

      {/* Version History */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Version History
        </h2>
        <ComponentVersionHistory
          componentId={component.id}
          orgId={component.orgId}
        />
      </section>
    </div>
  );
}
