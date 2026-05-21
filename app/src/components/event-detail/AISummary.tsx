"use client";

import { useState } from "react";
import { triggerSummarize } from "@/lib/api";
import { useEnrichment } from "./EnrichmentProvider";
import { SkeletonText } from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";

interface AISummaryProps {
  eventId: string;
  initialSummary?: string | null;
  initialGeneratedAt?: string | null;
}

function SparkleIcon() {
  return (
    <div className="flex items-center px-1.5 py-0.5 rounded bg-sky-bg border border-sky-border">
      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
        <path
          d="M6 1 L7.5 5 L11 6 L7.5 7 L6 11 L4.5 7 L1 6 L4.5 5 Z"
          fill="#0ea5e9"
        />
      </svg>
    </div>
  );
}

function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AISummary({ eventId, initialSummary, initialGeneratedAt }: AISummaryProps) {
  const { enrichment } = useEnrichment();

  const groundedSummary = enrichment?.groundedAiSummary ?? null;
  const groundedAt = enrichment?.groundedAiGeneratedAt ?? null;

  const [summary, setSummary] = useState<string | null>(initialSummary ?? null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displaySummary = groundedSummary ?? summary;
  const displayGeneratedAt = groundedAt ?? generatedAt;

  async function handleGenerate() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await triggerSummarize(eventId);
      if (result.aiSummary) {
        setSummary(result.aiSummary);
        setGeneratedAt(result.aiSummaryGeneratedAt);
      } else if (result.reason === "rate_limited") {
        const wait = result.retryAfterSeconds
          ? ` Try again in ${formatRetryAfter(result.retryAfterSeconds)}.`
          : " Try again later.";
        setErrorMessage(`AI quota reached.${wait}`);
      } else if (result.reason === "no_key") {
        setErrorMessage("AI analysis is not configured for this deployment.");
      } else {
        setErrorMessage("AI analysis temporarily unavailable.");
      }
    } catch {
      setErrorMessage("AI analysis temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  }

  // Nothing to show: render a quiet "Generate" affordance instead of auto-burning quota
  if (!displaySummary && !isLoading && !errorMessage) {
    return (
      <div>
        <SectionHeader title="Situation Analysis" rightSlot={<SparkleIcon />} />
        <Card tint="sky">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-light-muted">
              Generate a 3-sentence AI summary of this event.
            </p>
            <button
              onClick={handleGenerate}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-sky-strong/10 hover:bg-sky-strong/20 text-sky-strong border border-sky-border transition-colors duration-150 shrink-0"
            >
              Generate
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Situation Analysis" rightSlot={<SparkleIcon />} />

      <Card tint="sky">
        {isLoading ? (
          <SkeletonText lines={3} light />
        ) : errorMessage ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-light-muted italic">{errorMessage}</p>
            <button
              onClick={handleGenerate}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-sky-strong/10 hover:bg-sky-strong/20 text-sky-strong border border-sky-border transition-colors duration-150 shrink-0"
            >
              Retry
            </button>
          </div>
        ) : displaySummary ? (
          <div>
            <p className="text-[14px] text-sky-strong leading-relaxed">{displaySummary}</p>
            {displayGeneratedAt && (
              <p suppressHydrationWarning className="text-[10px] text-sky-faint mt-3">
                Generated {new Date(displayGeneratedAt).toLocaleString()}
                {groundedSummary && <span className="ml-1 opacity-70">· grounded</span>}
              </p>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
