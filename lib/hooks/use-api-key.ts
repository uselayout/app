"use client";

import { useState } from "react";

const STORAGE_KEY = "sd_anthropic_key";

export function useApiKey() {
  const [key, setKeyState] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });

  const setKey = (k: string) => {
    localStorage.setItem(STORAGE_KEY, k);
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
