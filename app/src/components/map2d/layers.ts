import type { Map as MaplibreMap } from "maplibre-gl";
import type { EventSummary } from "@/lib/types";
import { TYPE_COLORS, TYPE_EMOJI, TYPE_LABELS, SEVERITY_COLORS } from "@/lib/constants";

export const SEVERITY_RADII: Record<string, number> = {
  LOW: 5,
  MODERATE: 7,
  HIGH: 10,
  EXTREME: 14,
};

export function buildGeoJSON(events: EventSummary[]) {
  return {
    type: "FeatureCollection" as const,
    features: events.map((e) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [e.lon, e.lat] },
      properties: {
        id: e.id,
        type: e.type,
        severity: e.severity ?? "MODERATE",
        title: e.title,
        country: e.country ?? "",
      },
    })),
  };
}

// Build a MapLibre `match` expression array from a plain Record.
// MapLibre's expression types are intentionally loose, so we use a tuple cast at the call site.
function matchExpr(property: string, map: Record<string, unknown>, fallback: unknown) {
  const expr: unknown[] = ["match", ["get", property]];
  for (const [key, value] of Object.entries(map)) {
    expr.push(key, value);
  }
  expr.push(fallback);
  return expr;
}

/**
 * Add the GeoJSON source and the three event circle layers (halo, pulse, main).
 * Call after the map's `load` event fires. Idempotent guard not included — caller
 * should only invoke once per map instance.
 */
export function addEventLayers(map: MaplibreMap) {
  map.addSource("events", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  // Outer glow — soft halo behind each marker
  map.addLayer({
    id: "events-halo",
    type: "circle",
    source: "events",
    paint: {
      "circle-color": matchExpr("type", TYPE_COLORS, "#6b7280") as never,
      "circle-radius": matchExpr(
        "severity",
        {
          LOW: SEVERITY_RADII.LOW * 2.8,
          MODERATE: SEVERITY_RADII.MODERATE * 2.6,
          HIGH: SEVERITY_RADII.HIGH * 2.3,
          EXTREME: SEVERITY_RADII.EXTREME * 2.0,
        },
        16
      ) as never,
      "circle-opacity": 0.12,
      "circle-blur": 1.5,
    },
  });

  // Pulse ring — EXTREME only, animated by caller
  map.addLayer({
    id: "events-pulse",
    type: "circle",
    source: "events",
    filter: ["==", ["get", "severity"], "EXTREME"],
    paint: {
      "circle-color": matchExpr("type", TYPE_COLORS, "#ef4444") as never,
      "circle-radius": 20,
      "circle-opacity": 0.3,
      "circle-blur": 0.8,
    },
  });

  // Main marker
  map.addLayer({
    id: "events-main",
    type: "circle",
    source: "events",
    paint: {
      "circle-color": matchExpr("type", TYPE_COLORS, "#6b7280") as never,
      "circle-radius": matchExpr("severity", SEVERITY_RADII, 7) as never,
      "circle-opacity": 0.92,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "rgba(255, 255, 255, 0.2)",
    },
  });
}

interface PopupProps {
  type: string;
  severity: string;
  title: string;
  country: string;
}

export function buildPopupHTML({ type, severity, title, country }: PopupProps): string {
  const emoji = TYPE_EMOJI[type as keyof typeof TYPE_EMOJI] ?? "⚠️";
  const typeLabel = TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type;
  const severityColor = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ?? "#6b7280";

  return `<div class="map-popup-inner">
    <div class="map-popup-header">
      <span>${emoji}</span>
      <span class="map-popup-type">${typeLabel}</span>
    </div>
    <div class="map-popup-title">${title}</div>
    ${country ? `<div class="map-popup-meta">${country}</div>` : ""}
    ${severity ? `<span class="map-popup-severity" style="color:${severityColor}">${severity}</span>` : ""}
  </div>`;
}
