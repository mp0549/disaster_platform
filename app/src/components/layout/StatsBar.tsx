"use client";

import { useStats } from "@/hooks/useStats";
import { TYPE_COLORS, TYPE_EMOJI, TYPE_LABELS, ALL_DISASTER_TYPES } from "@/lib/constants";
import type { DisasterType } from "@/lib/types";

export default function StatsBar() {
  const { stats, isLoading } = useStats();

  return (
    <div className="fixed top-12 left-0 right-0 z-40 h-10 glass flex items-center px-6 gap-6 overflow-x-auto no-scrollbar">
      {/* Total active */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="label-mono">Active</span>
        {isLoading ? (
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#EF9F27" }}>—</span>
        ) : (
          <span
            key={stats?.activeEvents}
            className="text-[13px] font-semibold tabular-nums count-pop"
            style={{ color: "#EF9F27" }}
            aria-live="polite"
          >
            {(stats?.activeEvents ?? 0).toLocaleString()}
          </span>
        )}
      </div>

      <div className="w-px h-4 bg-dark-border shrink-0" />

      {/* Per-type breakdown */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        {ALL_DISASTER_TYPES.filter((t) => t !== "OTHER").map((type) => {
          const count = stats?.byType?.[type as DisasterType] ?? 0;
          const color = TYPE_COLORS[type as DisasterType];
          if (!isLoading && count === 0) return null;
          return (
            <div key={type} className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="label-mono" style={{ color: `${color}bb` }}>
                {TYPE_LABELS[type as DisasterType]}
              </span>
              {isLoading ? (
                <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>—</span>
              ) : (
                <span key={count} className="text-[12px] font-semibold tabular-nums count-pop" style={{ color }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Last updated */}
      {stats?.lastUpdated && (
        <>
          <div className="ml-auto w-px h-4 bg-dark-border shrink-0" />
          <span className="label-mono shrink-0">
            {new Date(stats.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </>
      )}
    </div>
  );
}
