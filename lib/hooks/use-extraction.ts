"use client";

import { useCallback, useRef } from "react";
import { useExtractionStore } from "@/lib/store/extraction";
import { useProjectStore } from "@/lib/store/project";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import type { ExtractionResult, Project } from "@/lib/types";

export function useExtraction() {
  const startExtraction = useExtractionStore((s) => s.startExtraction);
  const updateStep = useExtractionStore((s) => s.updateStep);
  const setProgress = useExtractionStore((s) => s.setProgress);
  const setError = useExtractionStore((s) => s.setError);
  const completeExtraction = useExtractionStore((s) => s.completeExtraction);
  const updateExtractionData = useProjectStore((s) => s.updateExtractionData);
  const updateDesignMd = useProjectStore((s) => s.updateDesignMd);

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
          : { url: project.sourceUrl };

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

        // Strip screenshots to avoid sending large base64 data
        const extractionDataForSynthesis = { ...extractionData, screenshots: [] };

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
          throw new Error(
            `DESIGN.md generation failed: ${genRes.status} ${genRes.statusText}`
          );
        }

        // Stream DESIGN.md text
        const reader = genRes.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let designMd = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          designMd += decoder.decode(value, { stream: true });
          updateDesignMd(project.id, designMd);
          setProgress(Math.min(100, 70 + Math.round((designMd.length / 8000) * 30)));
        }

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
      setError,
      completeExtraction,
      updateExtractionData,
      updateDesignMd,
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
