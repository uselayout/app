"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Detects when a new deployment has happened by comparing the X-Build-SHA
 * header from API responses against the initial value seen on page load.
 *
 * Returns `true` when the server has been updated and the client should
 * prompt the user to refresh.
 */
export function useDeploymentCheck() {
  const [hasNewDeployment, setHasNewDeployment] = useState(false);
  const initialSha = useRef<string | null>(null);

  useEffect(() => {
    // Intercept fetch responses to check for build SHA changes
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      const buildSha = response.headers.get("x-build-sha");
      if (buildSha && buildSha !== "dev") {
        if (initialSha.current === null) {
          initialSha.current = buildSha;
        } else if (buildSha !== initialSha.current) {
          setHasNewDeployment(true);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const dismiss = () => setHasNewDeployment(false);

  return { hasNewDeployment, dismiss };
}
