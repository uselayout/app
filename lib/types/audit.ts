export type AuditAction =
  | "component.created" | "component.updated" | "component.deleted" | "component.approved" | "component.deprecated"
  | "candidate.created" | "candidate.approved" | "candidate.rejected"
  | "token.created" | "token.updated" | "token.deleted" | "token.imported"
  | "typeface.created" | "typeface.updated" | "typeface.deleted"
  | "icon.created" | "icon.updated" | "icon.deleted"
  | "api_key.created" | "api_key.revoked"
  | "member.invited" | "member.joined" | "member.removed" | "member.role_changed"
  | "project.created" | "project.deleted"
  | "drift.detected" | "drift.resolved";

export type AuditResourceType =
  | "component" | "candidate" | "token" | "typeface" | "icon"
  | "api_key" | "member" | "project" | "drift_report";

export type AuditActorType = "user" | "api_key" | "system";

export interface AuditEntry {
  id: string;
  orgId: string;
  actorId: string;
  actorName: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string | null;
  resourceName: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
