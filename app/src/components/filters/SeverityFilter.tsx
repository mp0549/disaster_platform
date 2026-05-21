"use client";

import { ALL_SEVERITIES } from "@/lib/constants";
import type { Severity } from "@/lib/types";

// Severity = opacity encoding only, amber tint (GRIP rule 2 — never change hue)
const SEVERITY_OPACITY: Record<Severity, number> = {
  LOW: 0.40, MODERATE: 0.70, HIGH: 0.90, EXTREME: 1.00,
};

interface SeverityFilterProps {
  selected: Severity | null;
  onChange: (severity: Severity | null) => void;
}

function OpacityDot({ opacity, pulse }: { opacity: number; pulse?: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${pulse ? "animate-pulse" : ""}`}
      style={{ backgroundColor: `rgba(239,159,39,${opacity})` }}
    />
  );
}

export default function SeverityFilter({ selected, onChange }: SeverityFilterProps) {
  return (
    <div>
      <span className="label-mono block mb-1.5">Severity</span>

      <div className="flex gap-1">
        <button
          onClick={() => onChange(null)}
          className={`flex-1 py-1 rounded-md text-[10px] font-semibold tracking-wide transition-all duration-150 interactive ${
            selected === null
              ? "bg-[#FAEEDA]/15 text-[#EF9F27] border border-[#EF9F27]/30"
              : "bg-white/5 text-dark-muted hover:bg-white/8 border border-transparent"
          }`}
        >
          All
        </button>

        {ALL_SEVERITIES.map((sev) => {
          const isActive = selected === sev;
          const opacity = SEVERITY_OPACITY[sev];
          return (
            <button
              key={sev}
              onClick={() => onChange(isActive ? null : sev)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold tracking-wide transition-all duration-150 interactive border ${
                isActive
                  ? "bg-[#FAEEDA]/15 text-[#EF9F27] border-[#EF9F27]/30"
                  : "bg-white/5 text-dark-muted hover:bg-white/8 border-transparent"
              }`}
            >
              <OpacityDot opacity={opacity} pulse={sev === "EXTREME" && isActive} />
              <span className="hidden sm:inline">{sev.charAt(0) + sev.slice(1).toLowerCase()}</span>
              <span className="sm:hidden">{sev[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
