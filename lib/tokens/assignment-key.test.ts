import { describe, expect, it } from "vitest";
import { assignmentKey, parseAssignmentKey, MODE_SEPARATOR } from "./assignment-key";

describe("assignmentKey", () => {
  it("returns the plain roleKey when no mode is supplied", () => {
    expect(assignmentKey("bg-app")).toBe("bg-app");
  });

  it("joins roleKey and mode with the canonical separator", () => {
    expect(assignmentKey("bg-app", "dark")).toBe(`bg-app${MODE_SEPARATOR}dark`);
  });

  it("treats empty-string mode as no mode", () => {
    expect(assignmentKey("bg-app", "")).toBe("bg-app");
  });
});

describe("parseAssignmentKey", () => {
  it("parses a bare roleKey", () => {
    expect(parseAssignmentKey("bg-app")).toEqual({ roleKey: "bg-app" });
  });

  it("parses a mode-scoped key", () => {
    expect(parseAssignmentKey(`bg-app${MODE_SEPARATOR}dark`)).toEqual({
      roleKey: "bg-app",
      mode: "dark",
    });
  });

  it("round-trips through assignmentKey", () => {
    for (const [key, mode] of [
      ["bg-app", undefined],
      ["text-primary", "dark"],
      ["accent", "high-contrast"],
    ] as const) {
      const built = assignmentKey(key, mode);
      expect(parseAssignmentKey(built)).toEqual(mode ? { roleKey: key, mode } : { roleKey: key });
    }
  });
});
