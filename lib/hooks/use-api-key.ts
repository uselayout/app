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
