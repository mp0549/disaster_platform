"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Header from "./layout/Header";
import StatsBar from "./layout/StatsBar";
import FilterPanel from "./filters/FilterPanel";
import ViewToggle from "./layout/ViewToggle";
import Spinner from "./ui/Spinner";
import ErrorBoundary from "./ErrorBoundary";
import { useEvents } from "@/hooks/useEvents";
import { ALL_DISASTER_TYPES } from "@/lib/constants";
import { DEFAULT_MAP_SETTINGS } from "@/lib/types";
import type { FilterState, MapSettings } from "@/lib/types";

// Lazy-load the globe (heavy Three.js import — client only)
const Globe = dynamic(() => import("./globe/Globe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <span className="label-mono">Loading Globe</span>
      </div>
    </div>
  ),
});

// Lazy-load the 2D map (MapLibre GL — client only)
const MapView2D = dynamic(() => import("./map2d/MapView2D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <span className="label-mono">Loading Map</span>
      </div>
    </div>
  ),
});

export default function DashboardView() {
  const [view, setView] = useState<"3d" | "2d">("2d");
  const [filters, setFilters] = useState<FilterState>({
    types: [...ALL_DISASTER_TYPES],
    severity: null,
    timeRange: "30d",
  });
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);

  const { events } = useEvents(filters);

  // Apply client-side severity filter (already filtered by time/type via API)
  const filteredEvents = useMemo(() => {
    if (!filters.severity) return events;
    return events.filter((e) => e.severity === filters.severity);
  }, [events, filters.severity]);

  return (
    <div className="globe-page relative overflow-hidden bg-dark-bg">
      <Header />
      <StatsBar />

      {/* Main content — below header (48px) + stats bar (40px) = 88px */}
      <div className="absolute inset-0 top-[88px]">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          eventCount={filteredEvents.length}
          mapSettings={mapSettings}
          onMapSettingsChange={setMapSettings}
        />

        {/* Visualization area — globe or 2D map */}
        <div className="absolute inset-0 left-[260px]">
          <div className="absolute top-4 right-4 z-10">
            <ViewToggle value={view} onChange={setView} />
          </div>

          {view === "3d" ? (
            <ErrorBoundary
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="label-mono text-[#ef4444]">WebGL unavailable</p>
                    <p className="text-[12px] text-dark-muted mt-2">
                      Your browser may not support WebGL. Try Chrome or Firefox.
                    </p>
                  </div>
                </div>
              }
            >
              <Globe events={filteredEvents} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="label-mono text-[#ef4444]">Map unavailable</p>
                    <p className="text-[12px] text-dark-muted mt-2">
                      Could not load the 2D map. Try Chrome or Firefox.
                    </p>
                  </div>
                </div>
              }
            >
              <MapView2D events={filteredEvents} settings={mapSettings} />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
