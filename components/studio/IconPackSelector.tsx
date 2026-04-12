"use client";

import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { ICON_PACKS, type IconPack } from "@/lib/icons/registry";
import { useProjectStore } from "@/lib/store/project";
import { injectIconSection } from "@/lib/icons/generate-layout-md-section";
import { ExternalLink } from "lucide-react";

interface IconPackSelectorProps {
  projectId?: string;
}

function PackCard({
  pack,
  enabled,
  onToggle,
}: {
  pack: IconPack;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div
      className={`rounded-md border p-3 transition-all ${
        enabled
          ? "border-[var(--studio-border-strong)] bg-[var(--bg-surface)]"
          : "border-[var(--studio-border)] bg-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {pack.name}
            </span>
            <span className="rounded bg-[var(--studio-accent-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
              {pack.license}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {pack.description}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span>{pack.iconCount.toLocaleString()}+ icons</span>
            <span className="font-mono">{pack.npmPackage}</span>
            <a
              href={pack.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Browse <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <Switch
          size="sm"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
      {enabled && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pack.commonIcons.slice(0, 12).map((name) => (
            <span
              key={name}
              className="rounded bg-[var(--studio-accent-subtle)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-secondary)]"
            >
              {name}
            </span>
          ))}
          <span className="px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            +{pack.commonIcons.length - 12} more
          </span>
        </div>
      )}
    </div>
  );
}

export function IconPackSelector({ projectId }: IconPackSelectorProps) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const updateIconPacks = useProjectStore((s) => s.updateIconPacks);
  const updateLayoutMd = useProjectStore((s) => s.updateLayoutMd);

  const selectedPacks = project?.iconPacks ?? [];

  const handleToggle = useCallback(
    (packId: string, enabled: boolean) => {
      if (!projectId) return;

      const next = enabled
        ? [...selectedPacks, packId]
        : selectedPacks.filter((id) => id !== packId);

      updateIconPacks(projectId, next);

      // Update layout.md with the new icon section
      if (project?.layoutMd) {
        const updated = injectIconSection(project.layoutMd, next);
        updateLayoutMd(projectId, updated);
      }
    },
    [projectId, selectedPacks, project?.layoutMd, updateIconPacks, updateLayoutMd],
  );

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-[var(--text-muted)]">
          Create a project to configure icon packs
        </p>
      </div>
    );
  }

  const packs = Object.values(ICON_PACKS);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="mb-1">
        <h3 className="text-xs font-medium text-[var(--text-secondary)]">
          Icon Libraries
        </h3>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          Selected packs are added to your design system. AI-generated variants will use them.
        </p>
      </div>
      {packs.map((pack) => (
        <PackCard
          key={pack.id}
          pack={pack}
          enabled={selectedPacks.includes(pack.id)}
          onToggle={(enabled) => handleToggle(pack.id, enabled)}
        />
      ))}
    </div>
  );
}
