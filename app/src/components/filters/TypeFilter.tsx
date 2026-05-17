"use client";

import { ALL_DISASTER_TYPES, TYPE_COLORS, TYPE_LABELS, TYPE_EMOJI } from "@/lib/constants";
import type { DisasterType } from "@/lib/types";

interface TypeFilterProps {
  selected: DisasterType[];
  onChange: (types: DisasterType[]) => void;
}

export default function TypeFilter({ selected, onChange }: TypeFilterProps) {
  function toggle(type: DisasterType) {
    if (selected.includes(type)) {
      const next = selected.filter((t) => t !== type);
      // Don't allow deselecting all
      if (next.length > 0) onChange(next);
    } else {
      onChange([...selected, type]);
    }
  }

  function selectAll() {
    onChange([...ALL_DISASTER_TYPES]);
  }

  const allSelected = selected.length === ALL_DISASTER_TYPES.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="label-mono">Type</span>
        {!allSelected && (
          <button
            onClick={selectAll}
            className="text-[10px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors duration-150"
          >
            All
          </button>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {ALL_DISASTER_TYPES.map((type) => {
          const isActive = selected.includes(type as DisasterType);
          const color = TYPE_COLORS[type as DisasterType];
          return (
            <button
              key={type}
              onClick={() => toggle(type as DisasterType)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-150 interactive ${
                isActive
                  ? "bg-white/5"
                  : "opacity-40 hover:opacity-70"
              }`}
              style={{ cursor: "pointer" }}
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
                {TYPE_LABELS[type as DisasterType]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
