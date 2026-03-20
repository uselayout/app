"use client";

import { useEffect } from "react";
import { useBillingStore } from "@/lib/store/billing";
import { useSession } from "@/lib/auth-client";

/** Fetch billing data on mount if user is authenticated */
export function useBilling() {
  const { data: session } = useSession();
  const { subscription, credits, loading, error, fetchBilling } = useBillingStore();

  useEffect(() => {
    if (session?.user && !subscription && !loading) {
      void fetchBilling();
    }
  }, [session?.user, subscription, loading, fetchBilling]);

  const tier = subscription?.tier ?? "free";
  const isHosted = tier === "pro" || tier === "team";

  const layoutMdRemaining = credits
    ? credits.layoutMdRemaining + credits.topupLayoutMd
    : 0;
  const testQueryRemaining = credits
    ? credits.testQueryRemaining + credits.topupTestQuery
    : 0;

  return {
    subscription,
    credits,
    tier,
    isHosted,
    layoutMdRemaining,
    testQueryRemaining,
    loading,
    error,
    refetch: fetchBilling,
  };
}
