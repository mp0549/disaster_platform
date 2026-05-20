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

  const isStale = generatedAt
    ? Date.now() - new Date(generatedAt).getTime() > 24 * 60 * 60 * 1000
    : false;

  return (
    <div>
      <SectionHeader title="Situation Analysis" rightSlot={<SparkleIcon />} />

      <Card tint="sky">
        {isLoading ? (
          <SkeletonText lines={3} light />
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
            {isStale && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#EF9F27" }} />
                <span className="text-[11px]" style={{ color: "#BA7517" }}>Summary may be outdated</span>
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
