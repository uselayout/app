/**
 * Returns a 503 maintenance response if maintenance mode is enabled.
 * Returns null if not in maintenance mode (caller should continue normally).
 */
export function maintenanceResponse(): Response | null {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true") return null;

  return Response.json(
    {
      error: "maintenance",
      message:
        "Layout is undergoing scheduled maintenance. Please try again shortly.",
    },
    {
      status: 503,
      headers: { "Retry-After": "600" },
    }
  );
}

export function isMaintenanceMode(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}
