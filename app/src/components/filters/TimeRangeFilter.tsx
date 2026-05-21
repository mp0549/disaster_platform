"use client";

type TimeRange = "live" | "24h" | "7d" | "30d" | "all";

interface TimeRangeFilterProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "live", label: "LIVE" },
  { value: "24h",  label: "24h" },
  { value: "7d",   label: "7d" },
  { value: "30d",  label: "30d" },
  { value: "all",  label: "All" },
];

export default function TimeRangeFilter({ selected, onChange }: TimeRangeFilterProps) {
  return (
    <div>
      <span className="label-mono block mb-1.5">Time Range</span>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          const isLive = opt.value === "live";

          let className =
            "flex-1 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-150 interactive border ";

          if (isLive) {
            className += isActive
              ? "flex items-center justify-center gap-1.5 bg-[#0F6E56]/20 border-[#5DCAA5]/40 text-[#5DCAA5]"
              : "flex items-center justify-center gap-1.5 bg-white/5 border-transparent text-dark-muted hover:text-dark-text hover:bg-white/8";
          } else {
            className += isActive
              ? "bg-[#FAEEDA]/15 border-[#EF9F27]/30 text-[#EF9F27]"
              : "bg-white/5 border-transparent text-dark-muted hover:text-dark-text hover:bg-white/8";
          }

          return (
            <button key={opt.value} onClick={() => onChange(opt.value)} className={className}>
              {isLive && (
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? "bg-[#5DCAA5] animate-pulse" : "bg-[#5DCAA5]/40"
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
