import { supabase } from "./client";
import type { AuditAction, AuditActorType, AuditEntry, AuditResourceType } from "@/lib/types/audit";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface AuditLogRow {
  id: string;
  org_id: string;
  actor_id: string;
  actor_name: string | null;
  actor_type: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ─── Row Mapper ───────────────────────────────────────────────────────────────

function rowToAuditEntry(row: AuditLogRow): AuditEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorType: row.actor_type as AuditActorType,
    action: row.action as AuditAction,
    resourceType: row.resource_type as AuditResourceType,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    details: row.details ?? {},
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  };
}

// ─── Log Event ────────────────────────────────────────────────────────────────

export async function logAuditEvent(data: {
  orgId: string;
  actorId: string;
  actorName?: string;
  actorType?: AuditActorType;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const { error } = await supabase
    .from("layout_audit_log")
    .insert({
      org_id: data.orgId,
      actor_id: data.actorId,
      actor_name: data.actorName ?? null,
      actor_type: data.actorType ?? "user",
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId ?? null,
      resource_name: data.resourceName ?? null,
      details: data.details ?? {},
      ip_address: data.ipAddress ?? null,
    });

  if (error) {
    console.error("Failed to log audit event:", error.message);
  }
}

// ─── Query Filters ────────────────────────────────────────────────────────────

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ─── Get Audit Log ────────────────────────────────────────────────────────────

export async function getAuditLog(
  orgId: string,
  filters?: AuditLogFilters
): Promise<AuditEntry[]> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = supabase
    .from("layout_audit_log")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }
  if (filters?.actorId) {
    query = query.eq("actor_id", filters.actorId);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as AuditLogRow[]).map(rowToAuditEntry);
}

// ─── Get Audit Log Count ──────────────────────────────────────────────────────

export async function getAuditLogCount(
  orgId: string,
  filters?: AuditLogFilters
): Promise<number> {
  let query = supabase
    .from("layout_audit_log")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }
  if (filters?.actorId) {
    query = query.eq("actor_id", filters.actorId);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Failed to count audit log:", error.message);
    return 0;
  }

  return count ?? 0;
}
