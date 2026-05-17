"use client";

type TimeRange = "24h" | "7d" | "30d" | "all";

interface TimeRangeFilterProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
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
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-150 interactive ${
                isActive
                  ? "bg-[#3b82f6] text-white"
                  : "bg-white/5 text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/8"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
