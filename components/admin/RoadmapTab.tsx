"use client";

import { useState, useEffect, useCallback } from "react";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  product: string;
  status: string;
  sortOrder: number;
  voteCount: number;
}

const STATUSES = [
  { key: "considering", label: "Under consideration" },
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "shipped", label: "Shipped" },
] as const;

const PRODUCTS = [
  { key: "studio", label: "Studio" },
  { key: "cli", label: "CLI" },
  { key: "figma-plugin", label: "Figma Plugin" },
  { key: "chrome-extension", label: "Chrome Extension" },
] as const;

const statusColours: Record<string, string> = {
  considering: "#fbbf24",
  planned: "#60a5fa",
  in_progress: "#34d399",
  shipped: "#a78bfa",
};

const productBadgeStyles: Record<string, { bg: string; text: string }> = {
  studio: { bg: "var(--studio-border)", text: "var(--text-primary)" },
  cli: { bg: "rgba(16,185,129,0.15)", text: "rgb(52,211,153)" },
  "figma-plugin": { bg: "rgba(139,92,246,0.15)", text: "rgb(167,139,250)" },
  "chrome-extension": { bg: "rgba(245,158,11,0.15)", text: "rgb(251,191,36)" },
};

interface Props {
  toast: (msg: string, type?: "success" | "error") => void;
}

export function RoadmapTab({ toast }: Props) {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add/edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProduct, setFormProduct] = useState("studio");
  const [formStatus, setFormStatus] = useState("planned");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roadmap");
      if (!res.ok) return;
      const data = await res.json() as { items?: RoadmapItem[] };
      setItems(data.items ?? []);
    } catch {
      toast("Failed to load roadmap items", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormProduct("studio");
    setFormStatus("planned");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast("Title is required", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/roadmap/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            product: formProduct,
            status: formStatus,
          }),
        });
        if (!res.ok) throw new Error("Update failed");
        toast("Item updated");
      } else {
        const res = await fetch("/api/admin/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim() || undefined,
            product: formProduct,
            status: formStatus,
          }),
        });
        if (!res.ok) throw new Error("Create failed");
        toast("Item added");
      }
      resetForm();
      void fetchItems();
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: RoadmapItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description ?? "");
    setFormProduct(item.product);
    setFormStatus(item.status);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this roadmap item?")) return;
    try {
      const res = await fetch(`/api/admin/roadmap/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast("Item deleted");
      void fetchItems();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/roadmap/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    } catch {
      toast("Failed to update status", "error");
    }
  };

  const inputStyle = {
    background: "var(--bg-panel)",
    border: "1px solid var(--studio-border)",
    color: "var(--text-primary)",
  };

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading roadmap...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Add/edit form */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Roadmap items
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              {items.length} total
            </span>
          </h3>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "var(--studio-accent)", color: "var(--text-on-accent, #08090a)" }}
            >
              + Add item
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-3 p-4 rounded-lg" style={{ background: "var(--bg-panel)", border: "1px solid var(--studio-border)" }}>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Feature title (user-benefit framed)"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={inputStyle}
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
              style={inputStyle}
            />
            <div className="flex gap-3">
              <select
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                {PRODUCTS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim()}
                className="px-4 py-2 rounded-md text-xs font-semibold"
                style={{
                  background: "var(--studio-accent)",
                  color: "var(--text-on-accent, #08090a)",
                  opacity: saving || !formTitle.trim() ? 0.5 : 1,
                }}
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              <button onClick={resetForm} className="text-xs" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items grouped by status */}
      {STATUSES.map((status) => {
        const statusItems = items.filter((i) => i.status === status.key);
        if (statusItems.length === 0) return null;

        return (
          <div key={status.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: statusColours[status.key] }} />
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: statusColours[status.key] }}>
                {status.label}
              </h4>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{statusItems.length}</span>
            </div>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--studio-border)" }}
            >
              {statusItems.map((item, i) => {
                const badge = productBadgeStyles[item.product] ?? productBadgeStyles.studio;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 group"
                    style={{
                      background: i % 2 === 0 ? "var(--bg-app)" : "var(--bg-surface)",
                      borderBottom: i < statusItems.length - 1 ? "1px solid var(--studio-border)" : undefined,
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {PRODUCTS.find((p) => p.key === item.product)?.label ?? item.product}
                    </span>
                    <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {item.voteCount} vote{item.voteCount !== 1 ? "s" : ""}
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => void handleStatusChange(item.id, e.target.value)}
                      className="text-[10px] px-1.5 py-0.5 rounded outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--studio-border)" }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(item.id)}
                      className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#f87171" }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
          No roadmap items yet. Click &quot;+ Add item&quot; to get started.
        </p>
      )}
    </div>
  );
}
