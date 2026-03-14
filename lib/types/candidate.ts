export type CandidateStatus = "pending" | "in_review" | "approved" | "rejected";

export interface CandidateVariant {
  name: string;
  code: string;
  rationale?: string;
}

export interface CandidateComment {
  id: string;
  candidateId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  variantIndex: number | null;
  createdAt: string;
}

export interface Candidate {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  category: string;
  componentId: string | null;
  prompt: string;
  designMdSnapshot: string | null;
  variants: CandidateVariant[];
  selectedVariantIndex: number | null;
  status: CandidateStatus;
  createdBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
