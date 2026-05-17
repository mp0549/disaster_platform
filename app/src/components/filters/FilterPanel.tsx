"use client";

import TypeFilter from "./TypeFilter";
import SeverityFilter from "./SeverityFilter";
import TimeRangeFilter from "./TimeRangeFilter";
import type { FilterState } from "@/lib/types";

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  eventCount: number;
}

export default function FilterPanel({ filters, onChange, eventCount }: FilterPanelProps) {
  return (
    <div
      className="glass absolute left-0 top-0 bottom-0 z-30 w-[260px] flex flex-col overflow-y-auto"
      style={{ paddingTop: "22px" }}
    >
      {/* Panel header */}
      <div className="px-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.12em] text-[#e5e5e5] uppercase">
            Filters
          </span>
          <span className="label-mono">
            {eventCount.toLocaleString()} events
          </span>
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
