"use client";

import { useState, useEffect } from "react";
import { triggerSummarize } from "@/lib/api";
import Skeleton, { SkeletonText } from "@/components/ui/Skeleton";

interface AISummaryProps {
  eventId: string;
  initialSummary?: string | null;
  initialGeneratedAt?: string | null;
}

export default function AISummary({ eventId, initialSummary, initialGeneratedAt }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary ?? null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt ?? null);
  const [isLoading, setIsLoading] = useState(!initialSummary);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialSummary) return; // Already have summary

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
    return () => { cancelled = true; };
  }, [eventId, initialSummary]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af]">
          Situation Analysis
        </h2>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f0f9ff] border border-[#bae6fd]">
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
            <path
              d="M8 2L9.5 6.5H14L10.5 9L11.5 13.5L8 11L4.5 13.5L5.5 9L2 6.5H6.5L8 2Z"
              fill="#0ea5e9"
              stroke="#0ea5e9"
              strokeWidth="0.5"
            />
          </svg>
          <span className="text-[9px] font-semibold tracking-wider text-[#0369a1] uppercase">AI</span>
        </div>
      </div>

      <div
        className="rounded-lg border border-[#e0f2fe] bg-[#f0f9ff] p-5"
      >
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
              <span className="text-[12px] text-[#0369a1]">Generating situation analysis...</span>
            </div>
            <SkeletonText lines={3} light />
          </div>
        ) : error ? (
          <p className="text-[13px] text-[#6b7280] italic">
            Analysis unavailable. The AI service may be temporarily unreachable.
          </p>
        ) : summary ? (
          <div>
            <p className="text-[14px] text-[#0c4a6e] leading-relaxed">{summary}</p>
            {generatedAt && (
              <p className="text-[10px] text-[#7dd3fc] mt-3">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
