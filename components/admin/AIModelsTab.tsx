"use client";

import { useState, useEffect, useCallback } from "react";

interface AiModelRow {
  id: string;
  label: string;
  provider: string;
  maxOutputTokens: number;
  creditCost: number;
  inputCostPerM: number;
  outputCostPerM: number;
  byokOnly: boolean;
  userSelectable: boolean;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface TaskDefault {
  task: string;
  modelId: string;
}

const TASK_LABELS: Record<string, string> = {
  extraction: "Extraction (layout.md synthesis)",
  editor: "Editor (edit / fix layout.md)",
  "simple-edit": "Simple edits (inspector style changes)",
};

interface CostStats {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  count: number;
}

const PROVIDERS = ["claude", "gemini"] as const;

const emptyModel: AiModelRow = {
  id: "",
  label: "",
  provider: "claude",
  maxOutputTokens: 64000,
  creditCost: 1,
  inputCostPerM: 0,
  outputCostPerM: 0,
  byokOnly: false,
  userSelectable: true,
  enabled: true,
  isDefault: false,
  sortOrder: 0,
};

export function AIModelsTab({ toast }: { toast: (msg: string, type?: "success" | "error") => void }) {
  const [models, setModels] = useState<AiModelRow[]>([]);
  const [costByModel, setCostByModel] = useState<Record<string, CostStats>>({});
  const [taskDefaults, setTaskDefaults] = useState<TaskDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<AiModelRow>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState<AiModelRow>({ ...emptyModel });
  const [saving, setSaving] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-models");
      if (!res.ok) return;
      const data = await res.json();
      setModels(data.models ?? []);
      setCostByModel(data.costByModel ?? {});
      setTaskDefaults(data.taskDefaults ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editValues }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to update", "error");
        return;
      }
      toast(data.message, "success");
      setEditingId(null);
      setEditValues({});
      fetchModels();
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newModel.id.trim() || !newModel.label.trim()) {
      toast("Model ID and label are required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModel),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to add", "error");
        return;
      }
      toast(data.message, "success");
      setShowAddForm(false);
      setNewModel({ ...emptyModel });
      fetchModels();
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete model "${id}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/ai-models?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to delete", "error");
        return;
      }
      toast(data.message, "success");
      fetchModels();
    } catch {
      toast("Network error", "error");
    }
  };

  const handleSetDefault = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to update", "error");
        return;
      }
      toast(`${id} set as default`, "success");
      fetchModels();
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (res.ok) fetchModels();
    } catch {
      // ignore
    }
  };

  const handleTaskDefaultChange = async (task: string, modelId: string) => {
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, modelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to update", "error");
        return;
      }
      toast(data.message, "success");
      fetchModels();
    } catch {
      toast("Network error", "error");
    }
  };

  // Calculate total hosted cost this period
  const totalCost = Object.values(costByModel).reduce((sum, c) => sum + c.totalCost, 0);
  const totalGenerations = Object.values(costByModel).reduce((sum, c) => sum + c.count, 0);

  if (loading) {
    return <div className="text-sm text-[var(--text-muted)] p-4">Loading models...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cost overview */}
      <div
        className="rounded-lg p-5 space-y-3"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--studio-border)" }}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Cost Overview (Last 30 Days)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {"\u00A3"}{totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Total hosted cost</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{totalGenerations}</div>
            <div className="text-xs text-[var(--text-muted)]">Total generations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {totalGenerations > 0 ? `\u00A3${(totalCost / totalGenerations).toFixed(3)}` : "-"}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Avg cost per generation</div>
          </div>
        </div>

        {/* Per-model breakdown */}
        {Object.keys(costByModel).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-[var(--text-secondary)]">By Model</h4>
            {Object.entries(costByModel).map(([modelId, stats]) => (
              <div key={modelId} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{modelId}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-muted)]">{stats.count} calls</span>
                  <span className="text-[var(--text-primary)] font-medium">{"\u00A3"}{stats.totalCost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Models table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--studio-border)" }}
      >
        <div className="flex items-center justify-between px-5 py-3" style={{ background: "var(--bg-surface)" }}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Models</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: showAddForm ? "var(--bg-hover)" : "var(--studio-accent)",
              color: showAddForm ? "var(--text-primary)" : "var(--text-on-accent)",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add Model"}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-5 py-4 space-y-3" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--studio-border)" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Model ID</label>
                <input
                  type="text"
                  value={newModel.id}
                  onChange={(e) => setNewModel((p) => ({ ...p, id: e.target.value }))}
                  placeholder="claude-opus-4-7"
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Label</label>
                <input
                  type="text"
                  value={newModel.label}
                  onChange={(e) => setNewModel((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Claude Opus 4.7"
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Provider</label>
                <select
                  value={newModel.provider}
                  onChange={(e) => setNewModel((p) => ({ ...p, provider: e.target.value }))}
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                >
                  {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Credit Cost</label>
                <input
                  type="number"
                  value={newModel.creditCost}
                  onChange={(e) => setNewModel((p) => ({ ...p, creditCost: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Input Cost ($/1M tokens)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newModel.inputCostPerM}
                  onChange={(e) => setNewModel((p) => ({ ...p, inputCostPerM: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Output Cost ($/1M tokens)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newModel.outputCostPerM}
                  onChange={(e) => setNewModel((p) => ({ ...p, outputCostPerM: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Max Output Tokens</label>
                <input
                  type="number"
                  value={newModel.maxOutputTokens}
                  onChange={(e) => setNewModel((p) => ({ ...p, maxOutputTokens: parseInt(e.target.value) || 32000 }))}
                  className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <input type="checkbox" checked={newModel.byokOnly} onChange={(e) => setNewModel((p) => ({ ...p, byokOnly: e.target.checked }))} />
                  BYOK Only
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <input type="checkbox" checked={newModel.userSelectable} onChange={(e) => setNewModel((p) => ({ ...p, userSelectable: e.target.checked }))} />
                  User Selectable
                </label>
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !newModel.id.trim() || !newModel.label.trim()}
              className="rounded-md px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{ background: "var(--studio-accent)", color: "var(--text-on-accent)" }}
            >
              {saving ? "Adding..." : "Add Model"}
            </button>
          </div>
        )}

        {/* Models list */}
        <div style={{ background: "var(--bg-panel)" }}>
          {models.map((model) => {
            const isEditing = editingId === model.id;
            const stats = costByModel[model.id];

            return (
              <div
                key={model.id}
                className="flex items-center justify-between px-5 py-3 text-xs"
                style={{ borderBottom: "1px solid var(--studio-border)" }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Enabled toggle */}
                  <button
                    onClick={() => toggleEnabled(model.id, !model.enabled)}
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      background: model.enabled ? "#34d399" : "var(--studio-border)",
                    }}
                    title={model.enabled ? "Enabled (click to disable)" : "Disabled (click to enable)"}
                  />

                  {/* Model info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">{model.label}</span>
                      {model.isDefault && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                          DEFAULT
                        </span>
                      )}
                      {model.byokOnly && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                          BYOK
                        </span>
                      )}
                      {!model.userSelectable && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: "rgba(148,163,184,0.15)", color: "#94a3b8" }}>
                          INTERNAL
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--text-muted)] mt-0.5">
                      {model.id} · {model.provider}
                      {stats ? ` · ${stats.count} calls · \u00A3${stats.totalCost.toFixed(2)}` : ""}
                    </div>
                  </div>
                </div>

                {/* Edit fields or static display */}
                <div className="flex items-center gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)]">Credits</label>
                        <input
                          type="number"
                          value={editValues.creditCost ?? model.creditCost}
                          onChange={(e) => setEditValues((p) => ({ ...p, creditCost: parseInt(e.target.value) || 0 }))}
                          className="w-16 rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)]">In $/1M</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.inputCostPerM ?? model.inputCostPerM}
                          onChange={(e) => setEditValues((p) => ({ ...p, inputCostPerM: parseFloat(e.target.value) || 0 }))}
                          className="w-20 rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)]">Out $/1M</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.outputCostPerM ?? model.outputCostPerM}
                          onChange={(e) => setEditValues((p) => ({ ...p, outputCostPerM: parseFloat(e.target.value) || 0 }))}
                          className="w-20 rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleSave(model.id)}
                        disabled={saving}
                        className="rounded px-2 py-1 text-[10px] font-medium"
                        style={{ background: "var(--studio-accent)", color: "var(--text-on-accent)" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditValues({}); }}
                        className="rounded px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="text-[var(--text-primary)] font-medium">
                          {model.creditCost} credit{model.creditCost !== 1 ? "s" : ""}
                        </div>
                        <div className="text-[var(--text-muted)]">
                          ${model.inputCostPerM} / ${model.outputCostPerM}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setEditingId(model.id); setEditValues({}); }}
                          className="rounded px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          Edit
                        </button>
                        {!model.isDefault && (
                          <button
                            onClick={() => handleSetDefault(model.id)}
                            className="rounded px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(model.id)}
                          className="rounded px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task defaults */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--studio-border)" }}
      >
        <div className="px-5 py-3" style={{ background: "var(--bg-surface)" }}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Task Defaults</h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Which model is used for each task. Changes take effect within 60 seconds.
          </p>
        </div>
        <div style={{ background: "var(--bg-panel)" }}>
          {taskDefaults.map((td) => (
            <div
              key={td.task}
              className="flex items-center justify-between px-5 py-3 text-xs"
              style={{ borderBottom: "1px solid var(--studio-border)" }}
            >
              <span className="text-[var(--text-primary)] font-medium">
                {TASK_LABELS[td.task] ?? td.task}
              </span>
              <select
                value={td.modelId}
                onChange={(e) => handleTaskDefaultChange(td.task, e.target.value)}
                className="appearance-none rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
