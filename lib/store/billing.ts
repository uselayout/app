"use client";

import { create } from "zustand";
import type { Subscription, CreditBalance } from "@/lib/types/billing";

interface BillingState {
  subscription: Subscription | null;
  credits: CreditBalance | null;
  loading: boolean;
  error: string | null;

  fetchBilling: () => Promise<void>;
  clearBilling: () => void;
}

export const useBillingStore = create<BillingState>()((set) => ({
  subscription: null,
  credits: null,
  loading: false,
  error: null,

  fetchBilling: async () => {
    set({ loading: true, error: null });

    try {
      const [subRes, creditsRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/credits"),
      ]);

      if (!subRes.ok || !creditsRes.ok) {
        set({ loading: false, error: "Failed to fetch billing data" });
        return;
      }

      const subData = await subRes.json();
      const creditsData = await creditsRes.json();

      set({
        subscription: subData.subscription,
        credits: creditsData.credits,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch billing data",
      });
    }
  },

  clearBilling: () => {
    set({ subscription: null, credits: null, loading: false, error: null });
  },
}));
