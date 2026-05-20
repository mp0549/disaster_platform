"use client";

import TypeFilter from "./TypeFilter";
import SeverityFilter from "./SeverityFilter";
import TimeRangeFilter from "./TimeRangeFilter";
import AdvancedSettings from "./AdvancedSettings";
import { ALL_DISASTER_TYPES, DEFAULT_FILTERS } from "@/lib/constants";
import type { FilterState, MapSettings } from "@/lib/types";

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  eventCount: number;
  mapSettings: MapSettings;
  onMapSettingsChange: (next: MapSettings) => void;
}

function isDefaultFilters(f: FilterState): boolean {
  return (
    f.timeRange === DEFAULT_FILTERS.timeRange &&
    f.severity === DEFAULT_FILTERS.severity &&
    f.types.length === ALL_DISASTER_TYPES.length
  );
}

export default function FilterPanel({
  filters,
  onChange,
  eventCount,
  mapSettings,
  onMapSettingsChange,
}: FilterPanelProps) {
  const isModified = !isDefaultFilters(filters);

  return (
    <div
      className="glass absolute left-0 top-0 bottom-0 z-30 w-[260px] flex flex-col overflow-y-auto"
      style={{ paddingTop: "22px" }}
    >
      {/* Panel header */}
      <div className="px-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold tracking-[0.12em] text-dark-text uppercase">
            Filters
          </span>
          <div className="flex items-center gap-1.5 label-mono">
            {isModified && (
              <>
                <button
                  type="button"
                  onClick={() => onChange({ ...DEFAULT_FILTERS, types: [...ALL_DISASTER_TYPES] })}
                  className="text-dark-accent hover:text-blue-400 transition-colors duration-150 uppercase tracking-wider"
                >
                  Reset
                </button>
                <span aria-hidden className="opacity-50">·</span>
              </>
            )}
            <span className="tabular-nums">{eventCount.toLocaleString()} events</span>
          </div>
        </div>
      </div>

      {/* Filter sections */}
      <div className="px-5 py-4 flex flex-col gap-6 flex-1">
        <TimeRangeFilter
          selected={filters.timeRange}
          onChange={(timeRange) => onChange({ ...filters, timeRange })}
        />

        <div className="w-full h-px bg-white/5" />

        <TypeFilter
          selected={filters.types}
          onChange={(types) => onChange({ ...filters, types })}
        />

        <div className="w-full h-px bg-white/5" />

        <SeverityFilter
          selected={filters.severity}
          onChange={(severity) => onChange({ ...filters, severity })}
        />

        <div className="w-full h-px bg-white/5" />

        <AdvancedSettings settings={mapSettings} onChange={onMapSettingsChange} />
      </div>

      {/* Footer — data source attribution */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-[10px] text-[#4b5563] leading-relaxed">
          USGS · EONET · GDACS · FEMA · NOAA
          <br />
          FIRMS · ReliefWeb
        </p>
      </div>
    </div>
  );
}
