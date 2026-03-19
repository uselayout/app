"use client";

import { useCallback, useRef } from "react";
import { useExtractionStore } from "@/lib/store/extraction";
import { useProjectStore } from "@/lib/store/project";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
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
  const updateDesignMd = useProjectStore((s) => s.updateDesignMd);
  const currentOrgId = useOrgStore((s) => s.currentOrgId);

  const abortRef = useRef<AbortController | null>(null);

  const runExtraction = useCallback(
    async (project: Project, accessToken?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const isFigma = project.sourceType === "figma";

      startExtraction([
        { id: "connect", label: "Connecting to source", status: "running" },
        { id: "extract", label: "Extracting design data", status: "pending" },
        { id: "generate", label: "Generating DESIGN.md", status: "pending" },
      ]);

      try {
        // Step 1: Run extraction
        updateStep("connect", { status: "complete" });
        updateStep("extract", { status: "running" });
        setProgress(10);

        const extractUrl = isFigma
          ? "/api/extract/figma"
          : "/api/extract/website";
        const extractBody = isFigma
          ? { figmaUrl: project.sourceUrl, accessToken }
          : { url: project.sourceUrl, projectId: project.id };

        const extractRes = await fetch(extractUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractBody),
          signal: controller.signal,
        });

        if (!extractRes.ok) {
          throw new Error(
            `Extraction failed: ${extractRes.status} ${extractRes.statusText}`
          );
        }

        // Parse SSE stream
        const extractionData = await parseSSEStream(
          extractRes,
          (event) => {
            if (event.type === "step") {
              const percent = typeof event.percent === "number" ? event.percent : 0;
              setProgress(10 + Math.round(percent * 0.6));
              if (event.detail) {
                updateStep("extract", {
                  detail: event.detail as string,
                });
              }
            }
          },
          controller.signal
        );

        if (!extractionData) {
          throw new Error("No extraction data received");
        }

        updateStep("extract", { status: "complete" });
        setProgress(70);
        updateExtractionData(project.id, extractionData);

        // Step 2: Generate DESIGN.md
        updateStep("generate", { status: "running" });

        // Save previous DESIGN.md version before overwriting
        if (project.designMd && project.designMd.length > 0 && currentOrgId) {
          await fetch(`/api/organizations/${currentOrgId}/projects/${project.id}/design-md-versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ designMd: project.designMd, source: "generation" }),
          }).catch(() => {}); // Non-blocking — don't fail extraction if version save fails
        }

        // Pass screenshots through — they're resized server-side before sending to Claude
        const extractionDataForSynthesis = extractionData;

        const apiKey = getStoredApiKey();
        const genRes = await fetch("/api/generate/design-md", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "X-Api-Key": apiKey } : {}),
          },
          body: JSON.stringify({ extractionData: extractionDataForSynthesis }),
          signal: controller.signal,
        });

        if (!genRes.ok) {
          if (genRes.status === 402) {
            const body = await genRes.json().catch(() => null);
            throw new Error(
              body?.error ?? "No credits remaining. Top up or add your own API key in the top bar."
            );
          }
          throw new Error(
            `DESIGN.md generation failed: ${genRes.status} ${genRes.statusText}`
          );
        }

        // Stream DESIGN.md text into lightweight extraction store (no Supabase persist)
        const reader = genRes.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let designMd = "";
        let lastFlush = 0;
        const FLUSH_INTERVAL = 200; // ms between UI updates

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          designMd += decoder.decode(value, { stream: true });

          const now = Date.now();
          if (now - lastFlush >= FLUSH_INTERVAL) {
            lastFlush = now;
            setStreamingContent(designMd);
            setProgress(Math.min(99, 70 + Math.round((designMd.length / 8000) * 29)));
          }
        }

        // Write final content to project store (single Supabase persist)
        updateDesignMd(project.id, designMd);
        setStreamingContent(null);
        updateStep("generate", { status: "complete" });
        setProgress(100);
        completeExtraction();
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message, "extract");
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
      updateDesignMd,
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
