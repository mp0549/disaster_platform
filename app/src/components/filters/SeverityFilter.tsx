"use client";

import { ALL_SEVERITIES, SEVERITY_COLORS } from "@/lib/constants";
import type { Severity } from "@/lib/types";

interface SeverityFilterProps {
  selected: Severity | null;
  onChange: (severity: Severity | null) => void;
}

export default function SeverityFilter({ selected, onChange }: SeverityFilterProps) {
  return (
    <div>
      <span className="label-mono block mb-2">Severity</span>
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onChange(null)}
          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-150 interactive ${
            selected === null ? "bg-white/5" : "opacity-40 hover:opacity-70"
          }`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: selected === null ? "#9ca3af" : "#4b5563" }}
          />
          <span
            className="text-[12px] font-medium"
            style={{ color: selected === null ? "#e5e5e5" : "#6b7280" }}
          >
            All
          </span>
        </button>

        {ALL_SEVERITIES.map((sev) => {
          const isActive = selected === sev;
          const color = SEVERITY_COLORS[sev];
          return (
            <button
              key={sev}
              onClick={() => onChange(isActive ? null : sev)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-150 interactive ${
                isActive ? "bg-white/5" : "opacity-40 hover:opacity-70"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? color : "#4b5563",
                  boxShadow: isActive ? `0 0 6px ${color}60` : "none",
                }}
              />
              <span
                className="text-[12px] font-medium"
                style={{ color: isActive ? "#e5e5e5" : "#6b7280" }}
              >
                {sev.charAt(0) + sev.slice(1).toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
