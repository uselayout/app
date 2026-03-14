export type DriftStatus = "pending" | "reviewed" | "resolved";
export type DriftChangeType = "added" | "changed" | "removed";

export interface DriftChange {
  type: DriftChangeType;
  tokenType: string;
  tokenName: string;
  oldValue?: string;
  newValue?: string;
  cssVariable?: string;
}

export interface DriftReport {
  id: string;
  orgId: string;
  projectId: string | null;
  sourceUrl: string;
  sourceType: "figma" | "website";
  status: DriftStatus;
  changes: DriftChange[];
  summary: string | null;
  tokenAdditions: number;
  tokenChanges: number;
  tokenRemovals: number;
  detectedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}
