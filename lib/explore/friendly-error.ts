import { friendlyApiError } from "@/lib/api-error";

/**
 * Maps API error objects to user-friendly messages.
 * Delegates to the shared friendlyApiError helper.
 */
export function friendlyError(err: { error?: string; type?: string }): string {
  return friendlyApiError(err);
}
