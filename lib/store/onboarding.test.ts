import { describe, it, expect } from "vitest";
import {
  CHECKLIST_VERSION,
  migrateOnboardingState,
  type OnboardingSteps,
} from "./onboarding";

type Migrated = {
  dismissed: boolean;
  lastSeenVersion: number;
  steps: OnboardingSteps;
};

describe("migrateOnboardingState", () => {
  it("passes through state already at current version", () => {
    const state = { dismissed: true, lastSeenVersion: 2, steps: {} };
    expect(migrateOnboardingState(state, CHECKLIST_VERSION)).toBe(state);
  });

  it("remaps installedMcp to cliInstalled and preserves other v1 progress", () => {
    const result = migrateOnboardingState(
      {
        dismissed: false,
        steps: {
          apiKeyAdded: true,
          extracted: true,
          viewedLayoutMd: true,
          installedMcp: true,
          generatedVariant: true,
        },
      },
      0
    ) as Migrated;

    expect(result.steps.cliInstalled).toBe(true);
    expect(result.steps.apiKeyAdded).toBe(true);
    expect(result.steps.extracted).toBe(true);
    expect(result.steps.viewedLayoutMd).toBe(true);
    expect(result.steps.generatedVariant).toBe(true);
    // New v2 keys default to false
    expect(result.steps.componentSaved).toBe(false);
    expect(result.steps.figmaTokenAdded).toBe(false);
    expect(result.steps.geminiKeyAdded).toBe(false);
    expect(result.steps.figmaPluginInstalled).toBe(false);
    expect(result.steps.extensionInstalled).toBe(false);
    expect(result.steps.readDocs).toBe(false);
  });

  it("keeps dismissed=true when the v1 user finished all required v1 steps", () => {
    const result = migrateOnboardingState(
      {
        dismissed: true,
        steps: {
          extracted: true,
          viewedLayoutMd: true,
          installedMcp: true,
          generatedVariant: true,
        },
      },
      0
    ) as Migrated;

    expect(result.dismissed).toBe(true);
  });

  it("resurfaces dismissed=false for users who dismissed v1 before finishing", () => {
    const result = migrateOnboardingState(
      {
        dismissed: true,
        steps: {
          extracted: true,
          viewedLayoutMd: false,
          installedMcp: false,
          generatedVariant: false,
        },
      },
      0
    ) as Migrated;

    expect(result.dismissed).toBe(false);
  });

  it("handles empty persisted state (first-run users)", () => {
    const result = migrateOnboardingState(undefined, 0) as Migrated;

    expect(result.dismissed).toBe(false);
    expect(result.lastSeenVersion).toBe(0);
    expect(Object.values(result.steps).every((v) => v === false)).toBe(true);
  });

  it("resets lastSeenVersion to 0 so the shell re-evaluates first-session logic", () => {
    const result = migrateOnboardingState(
      {
        dismissed: false,
        steps: { extracted: true },
      },
      0
    ) as Migrated;

    expect(result.lastSeenVersion).toBe(0);
  });
});
