"use client";

import { ALL_DISASTER_TYPES, TYPE_COLORS, TYPE_LABELS } from "@/lib/constants";
import type { DisasterType } from "@/lib/types";

interface TypeFilterProps {
  selected: DisasterType[];
  onChange: (types: DisasterType[]) => void;
}

export default function TypeFilter({ selected, onChange }: TypeFilterProps) {
  const allSelected = selected.length === ALL_DISASTER_TYPES.length;
  const noneSelected = selected.length === 0;

  function toggle(type: DisasterType) {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="label-mono">Type</span>
        <div className="flex items-center gap-1.5 text-[10px] font-medium">
          <button
            type="button"
            onClick={() => onChange([...ALL_DISASTER_TYPES])}
            disabled={allSelected}
            className="text-dark-accent hover:text-blue-400 transition-colors duration-150 disabled:opacity-30 disabled:hover:text-dark-accent disabled:cursor-default uppercase tracking-wider"
          >
            All
          </button>
          <span className="text-dark-muted opacity-50" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={noneSelected}
            className="text-dark-accent hover:text-blue-400 transition-colors duration-150 disabled:opacity-30 disabled:hover:text-dark-accent disabled:cursor-default uppercase tracking-wider"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {ALL_DISASTER_TYPES.map((type) => {
          const isActive = selected.includes(type);
          const color = TYPE_COLORS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              aria-pressed={isActive}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-150 interactive ${
                isActive ? "bg-white/5" : "opacity-40 hover:opacity-80"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
                style={{
                  backgroundColor: isActive ? color : "#4b5563",
                  boxShadow: isActive ? `0 0 6px ${color}60` : "none",
                }}
              />
              <span
                className="text-[12px] font-medium"
                style={{ color: isActive ? "#e5e5e5" : "#6b7280" }}
              >
                {TYPE_LABELS[type]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
