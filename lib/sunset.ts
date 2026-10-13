/**
 * Studio wind-down switch. Set NEXT_PUBLIC_SUNSET_DATE (e.g. "20 November 2026")
 * to show closure notices across marketing, dashboard and Studio, and to stop
 * accepting new access requests. Unset means no change.
 *
 * NEXT_PUBLIC_ vars are inlined at build time, so changing it needs a redeploy.
 */
export function sunsetDate(): string | null {
  return process.env.NEXT_PUBLIC_SUNSET_DATE?.trim() || null;
}
