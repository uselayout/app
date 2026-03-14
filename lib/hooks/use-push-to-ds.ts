import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useOrgStore } from "@/lib/store/organization";
import { useProjectStore } from "@/lib/store/project";

interface PushComponentOptions {
  name: string;
  code: string;
  source: "explorer" | "extraction";
  description?: string;
}

export function usePushToDs() {
  const orgId = useOrgStore((s) => s.currentOrgId);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const [pushing, setPushing] = useState(false);

  const pushComponent = useCallback(
    async (opts: PushComponentOptions) => {
      if (!orgId || !currentProjectId || pushing) return false;

      setPushing(true);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/design-system/push`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tokens: [],
              components: [
                {
                  name: opts.name,
                  code: opts.code,
                  source: opts.source,
                  description: opts.description,
                },
              ],
              projectId: currentProjectId,
            }),
          }
        );

        if (!res.ok) {
          const body = await res
            .json()
            .catch(() => ({ error: "Push failed" }));
          throw new Error(
            (body as { error?: string }).error ?? "Push failed"
          );
        }

        const result = await res.json() as {
          componentsCreated: number;
          componentsSkipped: number;
        };

        if (result.componentsCreated > 0) {
          toast.success(`Pushed "${opts.name}" to design system`);
          return true;
        } else if (result.componentsSkipped > 0) {
          toast.info(`"${opts.name}" already exists in design system`);
          return false;
        }

        return false;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to push component"
        );
        return false;
      } finally {
        setPushing(false);
      }
    },
    [orgId, currentProjectId, pushing]
  );

  return { pushComponent, pushing, canPush: !!orgId && !!currentProjectId };
}
