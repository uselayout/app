/**
 * Triggers a redeploy of the Layout UI docs site (ui.staging.layout.design)
 * so gallery kit changes show up in its brand switcher and theme registry.
 *
 * The site bakes kit themes at build time (its prebuild syncs the gallery
 * API), so any change to what the gallery serves — a kit approved, hidden,
 * deleted, or its style profile regenerated — needs a rebuild to appear.
 *
 * Fire-and-forget: never throws, never blocks the caller. Debounced so a
 * burst of admin actions queues one build, not one per click. No-op unless
 * both env vars are set:
 *   LAYOUT_UI_DEPLOY_HOOK_URL   Coolify deploy endpoint for the layout-ui app
 *                               (use force=true: kit-only changes leave the git
 *                               SHA unchanged, so a cached build would skip the
 *                               theme sync and serve stale themes)
 *   LAYOUT_UI_DEPLOY_HOOK_TOKEN Coolify API token
 */

const DEBOUNCE_MS = 120_000;

let lastTriggeredAt = 0;

export function triggerUiRedeploy(reason: string): void {
  const url = process.env.LAYOUT_UI_DEPLOY_HOOK_URL;
  const token = process.env.LAYOUT_UI_DEPLOY_HOOK_TOKEN;
  if (!url || !token) return;

  const now = Date.now();
  if (now - lastTriggeredAt < DEBOUNCE_MS) {
    console.log(`[ui-redeploy] debounced (${reason})`);
    return;
  }
  lastTriggeredAt = now;

  void fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
    .then((res) => {
      console.log(`[ui-redeploy] triggered (${reason}): HTTP ${res.status}`);
    })
    .catch((err: unknown) => {
      console.error(
        `[ui-redeploy] failed (${reason}):`,
        err instanceof Error ? err.message : err,
      );
    });
}
