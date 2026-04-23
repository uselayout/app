import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CHECKLIST_VERSION = 2;

export interface OnboardingSteps {
  apiKeyAdded: boolean;
  figmaTokenAdded: boolean;
  geminiKeyAdded: boolean;
  extracted: boolean;
  viewedLayoutMd: boolean;
  generatedVariant: boolean;
  componentSaved: boolean;
  cliInstalled: boolean;
  figmaPluginInstalled: boolean;
  extensionInstalled: boolean;
  readDocs: boolean;
}

export type StepKey = keyof OnboardingSteps;

interface OnboardingState {
  dismissed: boolean;
  modalOpen: boolean;
  lastSeenVersion: number;
  steps: OnboardingSteps;
  markStep: (key: StepKey) => void;
  dismiss: () => void;
  openModal: () => void;
  closeModal: () => void;
  resurface: () => void;
  reset: () => void;
  setLastSeenVersion: (version: number) => void;
}

const defaultSteps: OnboardingSteps = {
  apiKeyAdded: false,
  figmaTokenAdded: false,
  geminiKeyAdded: false,
  extracted: false,
  viewedLayoutMd: false,
  generatedVariant: false,
  componentSaved: false,
  cliInstalled: false,
  figmaPluginInstalled: false,
  extensionInstalled: false,
  readDocs: false,
};

interface PersistedV1 {
  dismissed?: boolean;
  steps?: {
    apiKeyAdded?: boolean;
    extracted?: boolean;
    viewedLayoutMd?: boolean;
    installedMcp?: boolean;
    generatedVariant?: boolean;
  };
}

export function migrateOnboardingState(
  persistedState: unknown,
  fromVersion: number
): Partial<OnboardingState> | unknown {
  if (fromVersion >= CHECKLIST_VERSION) {
    return persistedState;
  }
  const prev = (persistedState ?? {}) as PersistedV1;
  const prevSteps = prev.steps ?? {};
  const v1Complete =
    !!prevSteps.extracted &&
    !!prevSteps.viewedLayoutMd &&
    !!prevSteps.installedMcp &&
    !!prevSteps.generatedVariant;

  // Resurface users who dismissed v1 before finishing — v2 adds meaningful
  // new steps (component save, plugin, extension) that are worth showing.
  const shouldResurface = !!prev.dismissed && !v1Complete;

  return {
    dismissed: shouldResurface ? false : prev.dismissed ?? false,
    lastSeenVersion: 0,
    steps: {
      ...defaultSteps,
      apiKeyAdded: !!prevSteps.apiKeyAdded,
      extracted: !!prevSteps.extracted,
      viewedLayoutMd: !!prevSteps.viewedLayoutMd,
      generatedVariant: !!prevSteps.generatedVariant,
      cliInstalled: !!prevSteps.installedMcp,
    },
  } satisfies Partial<OnboardingState>;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      dismissed: false,
      modalOpen: false,
      lastSeenVersion: 0,
      steps: { ...defaultSteps },

      markStep: (key) =>
        set((state) =>
          state.steps[key] ? state : { steps: { ...state.steps, [key]: true } }
        ),

      dismiss: () => set({ dismissed: true, modalOpen: false }),

      openModal: () => set({ modalOpen: true }),

      closeModal: () => set({ modalOpen: false }),

      resurface: () => set({ dismissed: false }),

      reset: () =>
        set({
          dismissed: false,
          modalOpen: false,
          lastSeenVersion: 0,
          steps: { ...defaultSteps },
        }),

      setLastSeenVersion: (version) => set({ lastSeenVersion: version }),
    }),
    {
      name: "layout-onboarding-v1",
      version: CHECKLIST_VERSION,
      partialize: (state) => ({
        dismissed: state.dismissed,
        lastSeenVersion: state.lastSeenVersion,
        steps: state.steps,
      }),
      migrate: (persistedState, fromVersion) =>
        migrateOnboardingState(persistedState, fromVersion) as OnboardingState,
    }
  )
);
