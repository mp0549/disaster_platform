"use client";

import { ALL_DISASTER_TYPES, TYPE_COLORS, TYPE_EMOJI, TYPE_LABELS } from "@/lib/constants";
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
      <div className="flex items-center justify-between mb-1.5">
        <span className="label-mono">Type</span>
        <div className="flex items-center gap-1.5 text-[10px] font-medium">
          <button
            type="button"
            onClick={() => onChange([...ALL_DISASTER_TYPES])}
            disabled={allSelected}
            className="text-[#EF9F27] hover:text-[#BA7517] transition-colors duration-150 active:scale-[0.95] disabled:opacity-30 disabled:cursor-default uppercase tracking-wider"
          >
            All
          </button>
          <span className="text-dark-muted opacity-50" aria-hidden>·</span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={noneSelected}
            className="text-[#EF9F27] hover:text-[#BA7517] transition-colors duration-150 active:scale-[0.95] disabled:opacity-30 disabled:cursor-default uppercase tracking-wider"
          >
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0.5">
        {ALL_DISASTER_TYPES.map((type) => {
          const isActive = selected.includes(type);
          const color = TYPE_COLORS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-all duration-150 active:scale-[0.97] ${
                isActive
                  ? "bg-[#FAEEDA]/10 border border-[#EF9F27]/25"
                  : "border border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <span
                className={`text-[12px] leading-none shrink-0 transition-transform duration-200 ease-out ${
                  isActive ? "scale-[1.25]" : "scale-100"
                }`}
              >
                {TYPE_EMOJI[type]}
              </span>
              <span
                className="text-[11px] font-medium truncate"
                style={{ color: isActive ? color : "#6b7280" }}
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
