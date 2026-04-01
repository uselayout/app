"use client";

import { useCallback, useRef } from "react";
import { useExtractionStore } from "@/lib/store/extraction";
import { useProjectStore } from "@/lib/store/project";
import { getStoredApiKey, getStoredFigmaApiKey } from "@/lib/hooks/use-api-key";
import { useOrgStore } from "@/lib/store/organization";
import type { ExtractionResult, Project } from "@/lib/types";

export function useExtraction() {
  const startExtraction = useExtractionStore((s) => s.startExtraction);
  const updateStep = useExtractionStore((s) => s.updateStep);
  const setProgress = useExtractionStore((s) => s.setProgress);
  const setStreamingContent = useExtractionStore((s) => s.setStreamingContent);
  const setError = useExtractionStore((s) => s.setError);
  const completeExtraction = useExtractionStore((s) => s.completeExtraction);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);
  const updateLayoutMd = useProjectStore((s) => s.updateLayoutMd);
  const syncTokensFromLayoutMd = useProjectStore((s) => s.syncTokensFromLayoutMd);
  const currentOrgId = useOrgStore((s) => s.currentOrgId);

  const abortRef = useRef<AbortController | null>(null);
  const layoutMdAccumulator = useRef<string>("");

  const runExtraction = useCallback(
    async (project: Project, accessToken?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      layoutMdAccumulator.current = "";

      const isFigma = project.sourceType === "figma";

      startExtraction([
        { id: "connect", label: "Connecting to source", status: "running" },
        { id: "extract", label: "Extracting design data", status: "pending" },
        { id: "generate", label: "Generating layout.md", status: "pending" },
      ]);

      try {
        // Guard: website extraction requires a source URL
        if (!isFigma && !project.sourceUrl) {
          throw new Error("No source URL set for this project. Please set the website URL before re-extracting.");
        }

        // Pre-flight: check credits before starting extraction (skip if user has BYOK key)
        const byokKey = getStoredApiKey();
        if (!byokKey) {
          try {
            const creditsRes = await fetch("/api/billing/credits", { credentials: "include" });
            if (creditsRes.ok) {
              const { credits } = await creditsRes.json();
              const hasCredits = ((credits.layoutMdRemaining ?? 0) + (credits.topupLayoutMd ?? 0)) > 0;
              if (!hasCredits) {
                throw new Error(
                  "No layout.md credits remaining. Add your own Anthropic API key in Settings \u2192 API Keys, or buy a credit pack in Settings \u2192 Billing."
                );
              }
            }
          } catch (err) {
            // Re-throw credit errors, ignore network failures (let extraction attempt proceed)
            if (err instanceof Error && err.message.includes("No layout.md credits")) throw err;
          }
        }

        // Step 1: Run extraction
        updateStep("connect", { status: "complete" });
        updateStep("extract", { status: "running" });
        setProgress(10);

        const extractUrl = isFigma
          ? "/api/extract/figma"
          : "/api/extract/website";
        const figmaToken = accessToken || (isFigma ? getStoredFigmaApiKey() : "");
        const extractBody = isFigma
          ? { figmaUrl: project.sourceUrl, accessToken: figmaToken }
          : { url: project.sourceUrl, projectId: project.id };

        const extractRes = await fetch(extractUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractBody),
          signal: controller.signal,
        });

        if (!extractRes.ok) {
          if (extractRes.status === 503) {
            throw new Error(
              "Server is restarting. Please wait a few seconds and try again."
            );
          }
          throw new Error(
            `Extraction failed: ${extractRes.status} ${extractRes.statusText}`
          );
        }

        // Parse SSE stream
        const extractionData = await parseSSEStream(
          extractRes,
          (event) => {
            if (event.type === "step") {
              if (event.step === "queued") {
                updateStep("extract", {
                  status: "running",
                  detail: event.detail as string,
                });
              } else {
                const percent = typeof event.percent === "number" ? event.percent : 0;
                setProgress(10 + Math.round(percent * 0.6));
                if (event.detail) {
                  updateStep("extract", {
                    detail: event.detail as string,
                  });
                }
              }
            }
          },
          controller.signal
        );

        if (!extractionData) {
          throw new Error("No extraction data received");
        }

        const sizeSummary = [
          extractionData.tokens.colors.length > 0 && `${extractionData.tokens.colors.length} colours`,
          extractionData.tokens.typography.length > 0 && `${extractionData.tokens.typography.length} typography`,
          extractionData.components.length > 0 && `${extractionData.components.length} components`,
          Object.keys(extractionData.cssVariables).length > 0 && `${Object.keys(extractionData.cssVariables).length} variables`,
        ].filter(Boolean).join(", ");

        updateStep("extract", { status: "complete", detail: sizeSummary || "Extraction complete" });
        setProgress(70);
        updateExtractionData(project.id, extractionData);

        // Step 2: Generate layout.md
        updateStep("generate", { status: "running" });

        // Save previous layout.md version before overwriting
        if (project.layoutMd && project.layoutMd.length > 0 && currentOrgId) {
          await fetch(`/api/organizations/${currentOrgId}/projects/${project.id}/layout-md-versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layoutMd: project.layoutMd, source: "generation" }),
          }).catch(() => {}); // Non-blocking — don't fail extraction if version save fails
        }

        // Pass screenshots through — they're resized server-side before sending to Claude
        const extractionDataForSynthesis = extractionData;

        const apiKey = getStoredApiKey();
        const genRes = await fetch("/api/generate/layout-md", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "X-Api-Key": apiKey } : {}),
          },
          body: JSON.stringify({ extractionData: extractionDataForSynthesis }),
          signal: controller.signal,
        });

        if (!genRes.ok) {
          if (genRes.status === 503) {
            throw new Error(
              "Server is restarting. Please wait a few seconds and try again."
            );
          }
          if (genRes.status === 402) {
            const body = await genRes.json().catch(() => null);
            throw new Error(
              body?.error ?? "No credits remaining. Top up or add your own API key in Settings → API Keys."
            );
          }
          if (genRes.status === 500) {
            throw new Error(
              "layout.md generation failed. Add your own Anthropic API key in Settings → API Keys to continue."
            );
          }
          throw new Error(
            `layout.md generation failed: ${genRes.status} ${genRes.statusText}`
          );
        }

        // Stream layout.md text into lightweight extraction store (no Supabase persist)
        const reader = genRes.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let layoutMd = "";
        let lastFlush = 0;
        const FLUSH_INTERVAL = 200; // ms between UI updates

        const STALE_TIMEOUT_MS = 120_000; // 120s with no data after first chunk = stale
        let receivedFirstChunk = false;

        while (true) {
          const readPromise = reader.read();

          // Only enforce stale timeout after we've received at least one chunk
          // (time-to-first-token can be 60-120s for large multimodal prompts)
          let staleTimer: ReturnType<typeof setTimeout> | undefined;
          const result = await Promise.race([
            readPromise.finally(() => { if (staleTimer) clearTimeout(staleTimer); }),
            ...(receivedFirstChunk
              ? [
                  new Promise<{ done: true; value: undefined }>((resolve) => {
                    staleTimer = setTimeout(() => {
                      reader.cancel();
                      resolve({ done: true, value: undefined });
                    }, STALE_TIMEOUT_MS);
                  }),
                ]
              : []),
          ]);

          if (result.done) break;

          receivedFirstChunk = true;
          layoutMd += decoder.decode(result.value, { stream: true });
          layoutMdAccumulator.current = layoutMd;

          const now = Date.now();
          if (now - lastFlush >= FLUSH_INTERVAL) {
            lastFlush = now;
            setStreamingContent(layoutMd);
            setProgress(Math.min(99, 70 + Math.round((layoutMd.length / 25000) * 29)));
          }
        }

        // Write final content to project store (single Supabase persist)
        if (layoutMd.length > 0) {
          updateLayoutMd(project.id, layoutMd);
          syncTokensFromLayoutMd(project.id);
        }
        setStreamingContent(null);
        updateStep("generate", { status: "complete" });
        setProgress(100);
        completeExtraction();
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unknown error";

        // If we have partial layout.md content, save it so the user doesn't lose progress
        if (layoutMdAccumulator.current.length > 200) {
          updateLayoutMd(project.id, layoutMdAccumulator.current);
          setStreamingContent(null);
          setError(
            `${message}. Your partial progress has been saved.`,
            "extract"
          );
        } else {
          setError(message, "extract");
        }
      }
    },
    [
      startExtraction,
      updateStep,
      setProgress,
      setStreamingContent,
      setError,
      completeExtraction,
      updateExtractionData,
      updateLayoutMd,
      currentOrgId,
    ]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { runExtraction, abort };
}

interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

async function parseSSEStream(
  response: Response,
  onEvent: (event: SSEEvent) => void,
  signal: AbortSignal
): Promise<ExtractionResult | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = "";
  let result: ExtractionResult | null = null;

  while (true) {
    if (signal.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(trimmed.slice(6)) as SSEEvent;
        if (event.type === "complete" && event.data) {
          result = event.data as ExtractionResult;
        } else if (event.type === "error") {
          throw new Error((event.message as string) ?? "Extraction error");
        } else {
          onEvent(event);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return result;
}
