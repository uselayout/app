import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingSteps {
  apiKeyAdded: boolean; // step 0 — only shown for BYOK users
  extracted: boolean; // step 1 — first project created
  viewedDesignMd: boolean; // step 2 — visited studio with non-empty designMd
  installedMcp: boolean; // step 3 — manual check (user clicks to confirm)
  generatedVariant: boolean; // step 4 — first variant generated in ExplorerCanvas
}

interface OnboardingState {
  _hasHydrated: boolean;
  dismissed: boolean;
  steps: OnboardingSteps;
  markStep: (key: keyof OnboardingSteps) => void;
  dismiss: () => void;
  reset: () => void;
  allStepsComplete: () => boolean;
}

const defaultSteps: OnboardingSteps = {
  apiKeyAdded: false,
  extracted: false,
  viewedDesignMd: false,
  installedMcp: false,
  generatedVariant: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      dismissed: false,
      steps: { ...defaultSteps },

      markStep: (key) =>
        set((state) => ({
          steps: { ...state.steps, [key]: true },
        })),

      dismiss: () => set({ dismissed: true }),

      reset: () =>
        set({
          dismissed: false,
          steps: { ...defaultSteps },
        }),

      allStepsComplete: () => {
        const { steps } = get();
        return (
          steps.extracted &&
          steps.viewedDesignMd &&
          steps.installedMcp &&
          steps.generatedVariant
        );
      },
    }),
    {
      name: "layout-onboarding-v1",
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ _hasHydrated: true });
      },
    }
  )
);
