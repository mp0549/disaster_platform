import type { Map as MaplibreMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import type { EventSummary } from "@/lib/types";
import { TYPE_COLORS, TYPE_EMOJI, TYPE_LABELS, SEVERITY_COLORS } from "@/lib/constants";
import { toIndividualFeature } from "./clustering";

export const SEVERITY_RADII: Record<string, number> = {
  LOW: 5,
  MODERATE: 7,
  HIGH: 10,
  EXTREME: 14,
};

// Build a MapLibre `match` expression from a plain Record.
function matchExpr(property: string, map: Record<string, unknown>, fallback: unknown) {
  const expr: unknown[] = ["match", ["get", property]];
  for (const [key, value] of Object.entries(map)) expr.push(key, value);
  expr.push(fallback);
  return expr;
}

// Properties with cluster=true are synthetic cluster aggregations.
// Individual event features always have cluster=false (or absent pre-clustering).
const CLUSTER_FILTER = ["==", ["get", "cluster"], true] as never;
const NOT_CLUSTER_FILTER = ["!=", ["get", "cluster"], true] as never;

export function buildGeoJSON(events: EventSummary[]) {
  return {
    type: "FeatureCollection" as const,
    features: events.map(toIndividualFeature),
  };
}

export interface EventLayersHandle {
  remove: () => void;
}

/**
 * Set up the events source + all rendering layers. Clustering is done
 * client-side (see clustering.ts); this function just wires up the MapLibre
 * layers that consume the pre-processed GeoJSON.
 *
 * Layers added:
 *  - events-clusters       (only if clustering on) — colored circle per cluster
 *  - events-cluster-count  (only if clustering on) — count label
 *  - events-halo           — soft glow behind each individual point
 *  - events-pulse          — animated ring on EXTREME individual points
 *  - events-main           — main marker circle for each individual point
 */
export function setupEventLayers(
  map: MaplibreMap,
  options: { clustering: boolean }
): EventLayersHandle {
  map.addSource("events", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  const onClusterClick = (e: MapMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["events-clusters"] });
    const feature = features[0];
    if (!feature) return;
    const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
    map.easeTo({ center: coords, zoom: map.getZoom() + 2 });
  };

  if (options.clustering) {
    map.addLayer({
      id: "events-clusters",
      type: "circle",
      source: "events",
      filter: CLUSTER_FILTER,
      paint: {
        // Clusters are colored by their disaster type — no more generic blue
        "circle-color": matchExpr("clusterType", TYPE_COLORS, "#6b7280") as never,
        "circle-opacity": 0.4,
        "circle-stroke-color": matchExpr("clusterType", TYPE_COLORS, "#9ca3af") as never,
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": 0.85,
        "circle-radius": [
          "step", ["get", "clusterCount"],
          16,      // < 5
          5,  20,  // 5+
          20, 26,  // 20+
          100, 32, // 100+
        ] as never,
      },
    });

    map.addLayer({
      id: "events-cluster-count",
      type: "symbol",
      source: "events",
      filter: CLUSTER_FILTER,
      layout: {
        "text-field": ["get", "clusterCount"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 11,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(10, 10, 20, 0.7)",
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

export function setupZoneLayers(map: MaplibreMap, options: { visible: boolean }): ZoneLayersHandle {
  map.addSource("events-zones", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  const initialVisibility = options.visible ? "visible" : "none";
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
