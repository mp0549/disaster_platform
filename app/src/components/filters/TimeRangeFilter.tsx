"use client";

type TimeRange = "live" | "24h" | "7d" | "30d" | "all";

interface TimeRangeFilterProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "live", label: "LIVE" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All" },
];

export default function TimeRangeFilter({ selected, onChange }: TimeRangeFilterProps) {
  return (
    <div>
      <span className="label-mono block mb-2">Time Range</span>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          const isLive = opt.value === "live";

          const base =
            "flex-1 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-150 interactive";

          const className = isLive
            ? `${base} flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-[#22c55e]/15 text-[#22c55e]"
                  : "bg-white/5 text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/8"
              }`
            : `${base} ${
                isActive
                  ? "bg-[#3b82f6] text-white"
                  : "bg-white/5 text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/8"
              }`;

          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={className}
            >
              {isLive && (
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-[#22c55e] animate-pulse" : "bg-[#22c55e]/40"
                  }`}
                  aria-hidden
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
