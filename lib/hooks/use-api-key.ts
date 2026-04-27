"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "sd_anthropic_key";

export function useApiKey() {
  const [key, setKeyState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });

  const setKey = (k: string) => {
    localStorage.setItem(STORAGE_KEY, k);
    markKeySet("anthropic");
    setKeyState(k);
  };

  const clearKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKeyState("");
  };

  return { key, setKey, clearKey };
}

/** Read the stored API key outside of React components */
export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

const GOOGLE_STORAGE_KEY = "sd_google_key";

export function useGoogleApiKey() {
  const [key, setKeyState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(GOOGLE_STORAGE_KEY) ?? "";
  });

  const setKey = (k: string) => {
    localStorage.setItem(GOOGLE_STORAGE_KEY, k);
    markKeySet("google");
    setKeyState(k);
  };

  const clearKey = () => {
    localStorage.removeItem(GOOGLE_STORAGE_KEY);
    setKeyState("");
  };

  return { key, setKey, clearKey };
}

export function getStoredGoogleApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GOOGLE_STORAGE_KEY) ?? "";
}

const OPENAI_STORAGE_KEY = "sd_openai_key";

export function useOpenAIKey() {
  const [key, setKeyState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(OPENAI_STORAGE_KEY) ?? "";
  });

  const setKey = (k: string) => {
    localStorage.setItem(OPENAI_STORAGE_KEY, k);
    markKeySet("openai");
    setKeyState(k);
  };

  const clearKey = () => {
    localStorage.removeItem(OPENAI_STORAGE_KEY);
    setKeyState("");
  };

  return { key, setKey, clearKey };
}

export function getStoredOpenAIKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OPENAI_STORAGE_KEY) ?? "";
}

const FIGMA_STORAGE_KEY = "sd_figma_pat";

export function useFigmaApiKey() {
  const [key, setKeyState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(FIGMA_STORAGE_KEY) ?? "";
  });

  const setKey = (k: string) => {
    localStorage.setItem(FIGMA_STORAGE_KEY, k);
    markKeySet("figma");
    setKeyState(k);
  };

  const clearKey = () => {
    localStorage.removeItem(FIGMA_STORAGE_KEY);
    setKeyState("");
  };

  return { key, setKey, clearKey };
}

export function getStoredFigmaApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(FIGMA_STORAGE_KEY) ?? "";
}

// ─── Key-loss detection ──────────────────────────────────────────────────────
// When a key is saved, we also set an "ever_set" flag. If the flag exists but
// the key is gone (e.g. user switched Chrome profile), we know it was lost.

const EVER_SET_SUFFIX = "_ever_set";

/** Mark that a key was previously configured */
function markKeyEverSet(storageKey: string) {
  localStorage.setItem(storageKey + EVER_SET_SUFFIX, "1");
}

/** Check if a key was previously configured but is now missing */
export function wasKeyLost(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  const everSet = localStorage.getItem(storageKey + EVER_SET_SUFFIX) === "1";
  const currentValue = localStorage.getItem(storageKey);
  return everSet && !currentValue;
}

// ─── Reactive key status hook ────────────────────────────────────────────────
// Reacts to storage events (cross-tab), visibility changes (same-tab navigation
// back from settings), and direct calls to the set/clear functions above.

type KeyStatus = {
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
  hasOpenAIKey: boolean;
  hasFigmaKey: boolean;
  /** True if any key was previously set but is now missing */
  hasLostKeys: boolean;
  /** Which specific keys were lost */
  lostKeys: ("anthropic" | "google" | "openai" | "figma")[];
};

let keyStatusListeners: Array<() => void> = [];

function emitKeyStatusChange() {
  for (const listener of keyStatusListeners) listener();
}

function subscribeKeyStatus(listener: () => void) {
  keyStatusListeners.push(listener);
  return () => {
    keyStatusListeners = keyStatusListeners.filter((l) => l !== listener);
  };
}

function getKeyStatusSnapshot(): KeyStatus {
  if (typeof window === "undefined") {
    return { hasAnthropicKey: false, hasGoogleKey: false, hasOpenAIKey: false, hasFigmaKey: false, hasLostKeys: false, lostKeys: [] };
  }
  const hasAnthropicKey = !!localStorage.getItem(STORAGE_KEY);
  const hasGoogleKey = !!localStorage.getItem(GOOGLE_STORAGE_KEY);
  const hasOpenAIKey = !!localStorage.getItem(OPENAI_STORAGE_KEY);
  const hasFigmaKey = !!localStorage.getItem(FIGMA_STORAGE_KEY);

  const lostKeys: KeyStatus["lostKeys"] = [];
  if (wasKeyLost(STORAGE_KEY)) lostKeys.push("anthropic");
  if (wasKeyLost(GOOGLE_STORAGE_KEY)) lostKeys.push("google");
  if (wasKeyLost(OPENAI_STORAGE_KEY)) lostKeys.push("openai");
  if (wasKeyLost(FIGMA_STORAGE_KEY)) lostKeys.push("figma");

  return { hasAnthropicKey, hasGoogleKey, hasOpenAIKey, hasFigmaKey, hasLostKeys: lostKeys.length > 0, lostKeys };
}

// Cache the snapshot to avoid re-creating objects on every call
let cachedSnapshot = getKeyStatusSnapshot();

function getSnapshot(): KeyStatus {
  return cachedSnapshot;
}

function refreshSnapshot() {
  const next = getKeyStatusSnapshot();
  // Only update reference if values actually changed
  if (
    next.hasAnthropicKey !== cachedSnapshot.hasAnthropicKey ||
    next.hasGoogleKey !== cachedSnapshot.hasGoogleKey ||
    next.hasOpenAIKey !== cachedSnapshot.hasOpenAIKey ||
    next.hasFigmaKey !== cachedSnapshot.hasFigmaKey ||
    next.hasLostKeys !== cachedSnapshot.hasLostKeys
  ) {
    cachedSnapshot = next;
    emitKeyStatusChange();
  }
}

// Set up global listeners once
if (typeof window !== "undefined") {
  // Cross-tab changes
  window.addEventListener("storage", () => refreshSnapshot());
  // Same-tab: user navigates back from settings
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshSnapshot();
  });
}

/**
 * Reactive hook that tracks whether API keys are present in localStorage.
 * Updates on cross-tab storage events and when the tab regains focus.
 */
export function useKeyStatus(): KeyStatus {
  // Refresh on mount in case keys changed while component was unmounted
  useEffect(() => { refreshSnapshot(); }, []);
  return useSyncExternalStore(subscribeKeyStatus, getSnapshot, () => cachedSnapshot);
}

/**
 * Call after saving a key to mark it as "ever set" for key-loss detection.
 * Also refreshes the reactive snapshot.
 */
export function markKeySet(provider: "anthropic" | "google" | "openai" | "figma") {
  const storageKey =
    provider === "anthropic" ? STORAGE_KEY
    : provider === "google" ? GOOGLE_STORAGE_KEY
    : provider === "openai" ? OPENAI_STORAGE_KEY
    : FIGMA_STORAGE_KEY;
  markKeyEverSet(storageKey);
  refreshSnapshot();
}

/** Dismiss the key-loss banner by clearing the ever_set flags for lost keys */
export function dismissKeyLoss() {
  if (typeof window === "undefined") return;
  // Only clear ever_set for keys that are currently lost (not ones that are present)
  if (wasKeyLost(STORAGE_KEY)) localStorage.removeItem(STORAGE_KEY + EVER_SET_SUFFIX);
  if (wasKeyLost(GOOGLE_STORAGE_KEY)) localStorage.removeItem(GOOGLE_STORAGE_KEY + EVER_SET_SUFFIX);
  if (wasKeyLost(OPENAI_STORAGE_KEY)) localStorage.removeItem(OPENAI_STORAGE_KEY + EVER_SET_SUFFIX);
  if (wasKeyLost(FIGMA_STORAGE_KEY)) localStorage.removeItem(FIGMA_STORAGE_KEY + EVER_SET_SUFFIX);
  refreshSnapshot();
}
