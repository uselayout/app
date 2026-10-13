import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const createAccessRequestMock = vi.fn();

vi.mock("@/lib/supabase/invite-codes", () => ({
  createAccessRequest: (...args: unknown[]) => createAccessRequestMock(...args),
}));

import { POST } from "./route";

const VALID_BODY = {
  name: "Ada",
  email: "ada@example.com",
  whatBuilding: "A dashboard",
  howHeard: "Google",
};

function post(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/access-requests", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/access-requests", () => {
  beforeEach(() => {
    createAccessRequestMock.mockReset();
    createAccessRequestMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid request when no sunset date is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUNSET_DATE", "");
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBeLessThan(300);
    expect(createAccessRequestMock).toHaveBeenCalledOnce();
  });

  it("refuses new requests with 410 once a sunset date is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUNSET_DATE", "20 November 2026");
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(410);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/20 November 2026/);
    expect(createAccessRequestMock).not.toHaveBeenCalled();
  });
});
