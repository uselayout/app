export type ApiKeyScope = "read" | "write";

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  keyPreview: string;
  scopes: ApiKeyScope[];
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  secretKey: string;
}
