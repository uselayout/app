import { describe, it, expect } from "vitest";
import { substituteRecipientTokens, EMAIL_TOKENS } from "./tokens";

describe("substituteRecipientTokens", () => {
  it("replaces {{name}} and {{firstName}} with the recipient's name", () => {
    const out = substituteRecipientTokens(
      "Hi {{firstName}}, full name is {{name}}.",
      { email: "matt@layout.design", name: "Matt Thornhill" },
    );
    expect(out).toBe("Hi Matt, full name is Matt Thornhill.");
  });

  it("replaces {{email}} with the raw email", () => {
    const out = substituteRecipientTokens("You are {{email}}.", {
      email: "jane@example.com",
      name: "Jane",
    });
    expect(out).toBe("You are jane@example.com.");
  });

  it("falls back to the capitalised email local-part when name is missing", () => {
    const out = substituteRecipientTokens("Hi {{firstName}},", {
      email: "daisy@example.com",
      name: "",
    });
    expect(out).toBe("Hi Daisy,");
  });

  it("falls back to the local-part when name is null or undefined", () => {
    expect(
      substituteRecipientTokens("Hi {{name}},", {
        email: "sam@example.com",
        name: null,
      }),
    ).toBe("Hi Sam,");
    expect(
      substituteRecipientTokens("Hi {{name}},", {
        email: "sam@example.com",
        name: undefined,
      }),
    ).toBe("Hi Sam,");
  });

  it("falls back to 'there' when name is missing and local-part is empty", () => {
    const out = substituteRecipientTokens("Hi {{name}},", {
      email: "@weird.example.com",
      name: "",
    });
    expect(out).toBe("Hi there,");
  });

  it("is case- and whitespace-insensitive inside the token braces", () => {
    const out = substituteRecipientTokens(
      "{{ Name }} {{FIRSTNAME}} {{ email }}",
      { email: "jo@example.com", name: "Jo Bloggs" },
    );
    expect(out).toBe("Jo Bloggs Jo jo@example.com");
  });

  it("leaves unknown tokens untouched", () => {
    const out = substituteRecipientTokens("Hello {{unknown}}, {{name}}.", {
      email: "a@b.com",
      name: "Alice",
    });
    expect(out).toBe("Hello {{unknown}}, Alice.");
  });

  it("replaces every occurrence, not just the first", () => {
    const out = substituteRecipientTokens(
      "{{firstName}} {{firstName}} {{firstName}}",
      { email: "a@b.com", name: "Alice Smith" },
    );
    expect(out).toBe("Alice Alice Alice");
  });

  it("exports the public token list in a stable order", () => {
    expect(EMAIL_TOKENS).toEqual(["{{firstName}}", "{{name}}", "{{email}}"]);
  });
});
