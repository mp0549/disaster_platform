import type { Map as MaplibreMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import type { EventSummary } from "@/lib/types";
import { TYPE_COLORS, TYPE_EMOJI, TYPE_LABELS, SEVERITY_COLORS } from "@/lib/constants";

export const SEVERITY_RADII: Record<string, number> = {
  LOW: 5,
  MODERATE: 7,
  HIGH: 10,
  EXTREME: 14,
};

const CLUSTER_MAX_ZOOM = 5;
const CLUSTER_RADIUS = 50;

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
// MapLibre's expression types are intentionally loose, so callers cast at the use site.
function matchExpr(property: string, map: Record<string, unknown>, fallback: unknown) {
  const expr: unknown[] = ["match", ["get", property]];
  for (const [key, value] of Object.entries(map)) {
    expr.push(key, value);
  }
  expr.push(fallback);
  return expr;
}

const NOT_CLUSTER_FILTER = ["!", ["has", "point_count"]] as never;

export interface EventLayersHandle {
  remove: () => void;
}

/**
 * Set up the events source + all rendering layers. Returns a handle whose
 * `remove()` tears everything down so callers can rebuild with new options
 * (e.g. when the user toggles clustering at runtime).
 *
 * Layers added:
 *  - events-clusters       (only if clustering on) — circle bubble for grouped points
 *  - events-cluster-count  (only if clustering on) — point-count label
 *  - events-halo           — soft glow behind each unclustered point
 *  - events-pulse          — animated ring on EXTREME unclustered points (caller animates)
 *  - events-main           — main marker circle for each unclustered point
 */
export function setupEventLayers(
  map: MaplibreMap,
  options: { clustering: boolean }
): EventLayersHandle {
  map.addSource("events", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: options.clustering,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: CLUSTER_RADIUS,
  });

  // Click a cluster → zoom to the level at which it expands. Bound only when
  // clustering is on so toggling off cleanly detaches it.
  const onClusterClick = (e: MapMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["events-clusters"] });
    const feature = features[0];
    if (!feature) return;
    const clusterId = feature.properties?.cluster_id as number | undefined;
    if (clusterId === undefined) return;

    const source = map.getSource("events") as GeoJSONSource;
    source.getClusterExpansionZoom(clusterId).then((zoom) => {
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      map.easeTo({ center: coords, zoom });
    }).catch(() => {
      // Cluster may have expired between hover and click — ignore
    });
  };

  if (options.clustering) {
    map.addLayer({
      id: "events-clusters",
      type: "circle",
      source: "events",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(59, 130, 246, 0.32)",
        "circle-stroke-color": "rgba(59, 130, 246, 0.75)",
        "circle-stroke-width": 1.5,
        // Larger bubbles for bigger clusters
        "circle-radius": [
          "step",
          ["get", "point_count"],
          16,  // < 10 points
          10, 22, // 10+ → 22
          50, 28, // 50+ → 28
          200, 36, // 200+ → 36
        ],
      },
    });

    map.addLayer({
      id: "events-cluster-count",
      type: "symbol",
      source: "events",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(10, 10, 20, 0.6)",
        "text-halo-width": 1,
      },
    });

    map.on("click", "events-clusters", onClusterClick);
    map.on("mouseenter", "events-clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "events-clusters", () => {
      map.getCanvas().style.cursor = "";
    });
  }

  map.addLayer({
    id: "events-halo",
    type: "circle",
    source: "events",
    filter: NOT_CLUSTER_FILTER,
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

  map.addLayer({
    id: "events-pulse",
    type: "circle",
    source: "events",
    filter: ["all", NOT_CLUSTER_FILTER, ["==", ["get", "severity"], "EXTREME"]] as never,
    paint: {
      "circle-color": matchExpr("type", TYPE_COLORS, "#ef4444") as never,
      "circle-radius": 20,
      "circle-opacity": 0.3,
      "circle-blur": 0.8,
    },
  });

  map.addLayer({
    id: "events-main",
    type: "circle",
    source: "events",
    filter: NOT_CLUSTER_FILTER,
    paint: {
      "circle-color": matchExpr("type", TYPE_COLORS, "#6b7280") as never,
      "circle-radius": matchExpr("severity", SEVERITY_RADII, 7) as never,
      "circle-opacity": 0.92,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "rgba(255, 255, 255, 0.2)",
    },
  });

  return {
    remove: () => {
      if (options.clustering) {
        map.off("click", "events-clusters", onClusterClick);
      }
      // Layers removed in reverse order so dependent layers go first
      const layerIds = [
        "events-main",
        "events-pulse",
        "events-halo",
        "events-cluster-count",
        "events-clusters",
      ];
      for (const id of layerIds) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource("events")) map.removeSource("events");
    },
  };
}

// ─── Zones (affected-area polygons) ─────────────────────────────────────────

function isPolygonalGeometry(g: GeoJSON.Geometry | null | undefined): g is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return !!g && (g.type === "Polygon" || g.type === "MultiPolygon");
}

export function buildZonesGeoJSON(events: EventSummary[]) {
  return {
    type: "FeatureCollection" as const,
    features: events
      .filter((e) => isPolygonalGeometry(e.geometry ?? null))
      .map((e) => ({
        type: "Feature" as const,
        geometry: e.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        properties: {
          id: e.id,
          type: e.type,
          severity: e.severity ?? "MODERATE",
          title: e.title,
        },
      })),
  };
}

export interface ZoneLayersHandle {
  setVisible: (visible: boolean) => void;
  setData: (events: EventSummary[]) => void;
  remove: () => void;
}

/**
 * Add a separate source + fill/line layers for events with polygon geometry.
 * Placed below the point layers so markers still sit on top. Visibility is
 * toggled via `setVisible(boolean)` — no rebuild needed.
 */
export function setupZoneLayers(map: MaplibreMap, options: { visible: boolean }): ZoneLayersHandle {
  map.addSource("events-zones", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  const initialVisibility = options.visible ? "visible" : "none";

  // Find the first event point layer to insert zones beneath it
  const beforeId = ["events-halo", "events-clusters", "events-main"].find((id) => map.getLayer(id));

  map.addLayer(
    {
      id: "events-zones-fill",
      type: "fill",
      source: "events-zones",
      layout: { visibility: initialVisibility },
      paint: {
        "fill-color": matchExpr("type", TYPE_COLORS, "#6b7280") as never,
        "fill-opacity": 0.14,
      },
    },
    beforeId
  );

  map.addLayer(
    {
      id: "events-zones-line",
      type: "line",
      source: "events-zones",
      layout: { visibility: initialVisibility, "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": matchExpr("type", TYPE_COLORS, "#9ca3af") as never,
        "line-width": 1,
        "line-opacity": 0.55,
      },
    },
    beforeId
  );

  return {
    setVisible: (visible: boolean) => {
      const v = visible ? "visible" : "none";
      if (map.getLayer("events-zones-fill")) map.setLayoutProperty("events-zones-fill", "visibility", v);
      if (map.getLayer("events-zones-line")) map.setLayoutProperty("events-zones-line", "visibility", v);
    },
    setData: (events: EventSummary[]) => {
      const src = map.getSource("events-zones") as GeoJSONSource | undefined;
      if (src) src.setData(buildZonesGeoJSON(events));
    },
    remove: () => {
      for (const id of ["events-zones-line", "events-zones-fill"]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource("events-zones")) map.removeSource("events-zones");
    },
  };
}

// ─── Popup ──────────────────────────────────────────────────────────────────

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
