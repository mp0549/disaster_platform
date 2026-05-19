"use client";

import { useState, useEffect } from "react";
import { triggerSummarize } from "@/lib/api";
import { SkeletonText } from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";

interface AISummaryProps {
  eventId: string;
  initialSummary?: string | null;
  initialGeneratedAt?: string | null;
}

function AIBadge() {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-bg border border-sky-border">
      <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
        <path
          d="M8 2L9.5 6.5H14L10.5 9L11.5 13.5L8 11L4.5 13.5L5.5 9L2 6.5H6.5L8 2Z"
          fill="#0ea5e9"
          stroke="#0ea5e9"
          strokeWidth="0.5"
        />
      </svg>
      <span className="text-[9px] font-semibold tracking-wider text-sky-text uppercase">AI</span>
    </div>
  );
}

export default function AISummary({ eventId, initialSummary, initialGeneratedAt }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary ?? null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt ?? null);
  const [isLoading, setIsLoading] = useState(!initialSummary);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialSummary) return;

    let cancelled = false;

    async function generate() {
      try {
        const result = await triggerSummarize(eventId);
        if (!cancelled) {
          setSummary(result.aiSummary);
          setGeneratedAt(result.aiSummaryGeneratedAt);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [eventId, initialSummary]);

  return (
    <div>
      <SectionHeader title="Situation Analysis" rightSlot={<AIBadge />} />

      <Card tint="sky">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 border-2 border-sky-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-[12px] text-sky-text">Generating situation analysis...</span>
            </div>
            <SkeletonText lines={3} light />
          </div>
        ) : error ? (
          <p className="text-[13px] text-light-muted italic">
            Analysis unavailable. The AI service may be temporarily unreachable.
          </p>
        ) : summary ? (
          <div>
            <p className="text-[14px] text-sky-strong leading-relaxed">{summary}</p>
            {generatedAt && (
              <p className="text-[10px] text-sky-faint mt-3">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
