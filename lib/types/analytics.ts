export type AnalyticsEventType =
  | "mcp.tool_call"
  | "component.viewed"
  | "component.copied"
  | "token.exported"
  | "candidate.generated"
  | "project.extracted";

export interface AnalyticsEvent {
  id: string;
  orgId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, unknown>;
  apiKeyId: string | null;
  userId: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalMcpCalls: number;
  totalComponentViews: number;
  totalTokenExports: number;
  topComponents: Array<{ name: string; count: number }>;
  topMcpTools: Array<{ tool: string; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
}
