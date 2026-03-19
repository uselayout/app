import { create } from "zustand";
import type { ExtractionStatus, ExtractionStep } from "@/lib/types";

interface ExtractionState {
  status: ExtractionStatus;
  progress: number;
  steps: ExtractionStep[];
  currentStep: string | null;
  error: string | null;
  errorStep: string | null;
  streamingContent: string | null;

  // Actions
  startExtraction: (steps: ExtractionStep[]) => void;
  updateStep: (
    stepId: string,
    update: Partial<ExtractionStep>
  ) => void;
  setProgress: (progress: number) => void;
  setStreamingContent: (content: string | null) => void;
  setError: (error: string, step?: string) => void;
  completeExtraction: () => void;
  resetExtraction: () => void;
}

export const useExtractionStore = create<ExtractionState>()((set) => ({
  status: "idle",
  progress: 0,
  steps: [],
  currentStep: null,
  error: null,
  errorStep: null,
  streamingContent: null,

  startExtraction: (steps) =>
    set({
      status: "running",
      progress: 0,
      steps,
      currentStep: steps[0]?.id ?? null,
      error: null,
      errorStep: null,
      streamingContent: null,
    }),

  updateStep: (stepId, update) =>
    set((state) => {
      const steps = state.steps.map((s) =>
        s.id === stepId ? { ...s, ...update } : s
      );
      const currentStep =
        update.status === "running" ? stepId : state.currentStep;
      return { steps, currentStep };
    }),

  setProgress: (progress) => set({ progress }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  setError: (error, step) =>
    set({
      status: "failed",
      error,
      errorStep: step ?? null,
    }),

  completeExtraction: () =>
    set({
      status: "complete",
      progress: 100,
      currentStep: null,
    }),

  resetExtraction: () =>
    set({
      status: "idle",
      progress: 0,
      steps: [],
      currentStep: null,
      error: null,
      errorStep: null,
      streamingContent: null,
    }),
}));
