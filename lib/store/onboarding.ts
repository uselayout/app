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
  _hasHydrated: boolean;
  dismissed: boolean;
  modalOpen: boolean;
  lastSeenVersion: number;
  steps: OnboardingSteps;
  markStep: (key: StepKey) => void;
  dismiss: () => void;
  openModal: () => void;
  closeModal: () => void;
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

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
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
      migrate: (persistedState, fromVersion) => {
        if (fromVersion >= CHECKLIST_VERSION) {
          return persistedState;
        }
        const prev = (persistedState ?? {}) as PersistedV1;
        const prevSteps = prev.steps ?? {};
        return {
          dismissed: prev.dismissed ?? false,
          lastSeenVersion: 0,
          steps: {
            ...defaultSteps,
            apiKeyAdded: !!prevSteps.apiKeyAdded,
            extracted: !!prevSteps.extracted,
            viewedLayoutMd: !!prevSteps.viewedLayoutMd,
            generatedVariant: !!prevSteps.generatedVariant,
            cliInstalled: !!prevSteps.installedMcp,
          },
        } as Partial<OnboardingState>;
      },
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ _hasHydrated: true });
      },
    }
  )
);
