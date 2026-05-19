"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";
import type { EventSummary } from "@/lib/types";
import {
  TYPE_COLORS,
  TYPE_EMOJI,
  TYPE_LABELS,
  SEVERITY_COLORS,
} from "@/lib/constants";
import { INITIAL_VIEW, OPENFREEMAP_STYLE_URL } from "./mapStyle";

// CSS import lives here so it only loads when this component is actually used
import "maplibre-gl/dist/maplibre-gl.css";

interface MapView2DProps {
  events: EventSummary[];
}

const SEVERITY_RADII: Record<string, number> = {
  LOW: 5,
  MODERATE: 7,
  HIGH: 10,
  EXTREME: 14,
};

function buildGeoJSON(events: EventSummary[]) {
  return {
    type: "FeatureCollection" as const,
    features: events.map((e) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [e.lon, e.lat],
      },
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

// Build a MapLibre match expression array from a plain Record
function matchExpr(property: string, map: Record<string, unknown>, fallback: unknown): any {
  const expr: unknown[] = ["match", ["get", property]];
  for (const [key, value] of Object.entries(map)) {
    expr.push(key, value);
  }
  expr.push(fallback);
  return expr;
}

function applyDarkTheme(map: MaplibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    try {
      const id = layer.id.toLowerCase();
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", "#0a0a0f");
      } else if (layer.type === "fill") {
        if (id.includes("water") || id.includes("ocean") || id.includes("sea") || id.includes("lake")) {
          map.setPaintProperty(layer.id, "fill-color", "#0d1b2a");
          map.setPaintProperty(layer.id, "fill-opacity", 0.9);
        } else if (
          id.includes("park") || id.includes("forest") || id.includes("wood") ||
          id.includes("green") || id.includes("grass") || id.includes("scrub") ||
          id.includes("farmland") || id.includes("meadow")
        ) {
          map.setPaintProperty(layer.id, "fill-color", "#0d1219");
        } else if (id.includes("building")) {
          map.setPaintProperty(layer.id, "fill-color", "#111122");
          map.setPaintProperty(layer.id, "fill-opacity", 0.8);
        } else {
          map.setPaintProperty(layer.id, "fill-color", "#0f0f1a");
        }
      } else if (layer.type === "line") {
        if (id.includes("water") || id.includes("river") || id.includes("stream") || id.includes("canal")) {
          map.setPaintProperty(layer.id, "line-color", "#0d1b2a");
        } else if (
          id.includes("admin") || id.includes("border") || id.includes("boundary") || id.includes("country")
        ) {
          map.setPaintProperty(layer.id, "line-color", "#2a2a4e");
          map.setPaintProperty(layer.id, "line-opacity", 0.7);
        } else if (
          id.includes("road") || id.includes("highway") || id.includes("motorway") ||
          id.includes("street") || id.includes("rail") || id.includes("transit") ||
          id.includes("tunnel") || id.includes("bridge") || id.includes("path")
        ) {
          map.setPaintProperty(layer.id, "line-color", "#1a1a2e");
        } else {
          map.setPaintProperty(layer.id, "line-color", "#1a1a2e");
        }
      } else if (layer.type === "symbol") {
        try {
          map.setPaintProperty(layer.id, "text-color", "#4a4a6a");
          map.setPaintProperty(layer.id, "text-halo-color", "#0a0a0f");
          map.setPaintProperty(layer.id, "text-halo-width", 1.5);
        } catch {
          // Some symbol layers don't have these paint properties
        }
      }
    } catch {
      // Skip layers that don't support the property
    }
  }
}

export default function MapView2D({ events }: MapView2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const isLoadedRef = useRef(false);
  const pulseRafRef = useRef<number>(0);
  const eventsRef = useRef(events);
  const router = useRouter();

  // Keep eventsRef current so the style.load closure uses latest data
  eventsRef.current = events;

  const geoJSON = useMemo(() => buildGeoJSON(events), [events]);

  // Initialize map once on mount; destroy on unmount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let localCleanup: (() => void) | undefined;

    async function init() {
      const maplibregl = (await import("maplibre-gl")).default;

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: OPENFREEMAP_STYLE_URL,
        center: INITIAL_VIEW.center,
        zoom: INITIAL_VIEW.zoom,
        pitch: INITIAL_VIEW.pitch,
        bearing: INITIAL_VIEW.bearing,
        attributionControl: false,
      });

      mapRef.current = map as unknown as MaplibreMap;

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-left"
      );
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");

      map.on("load", () => {
        applyDarkTheme(map as unknown as MaplibreMap);

        // Atmospheric horizon for the tilted view. MapLibre 5's setSky replaces
        // Mapbox's setFog and the legacy `type: "sky"` layer (neither exist here).
        map.setSky({
          "sky-color": "rgb(8, 12, 30)",
          "sky-horizon-blend": 0.6,
          "horizon-color": "rgb(20, 30, 60)",
          "horizon-fog-blend": 0.5,
          "fog-color": "rgb(5, 5, 12)",
          "fog-ground-blend": 0.2,
          "atmosphere-blend": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 0.8,
            5, 0.6,
            10, 0,
          ],
        });

        // GeoJSON source (starts empty; populated immediately below)
        map.addSource("events", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        // Outer glow / halo — larger radius, low opacity, blurred
        map.addLayer({
          id: "events-halo",
          type: "circle",
          source: "events",
          paint: {
            "circle-color": matchExpr("type", TYPE_COLORS, "#6b7280"),
            "circle-radius": matchExpr("severity", {
              LOW: SEVERITY_RADII.LOW * 2.8,
              MODERATE: SEVERITY_RADII.MODERATE * 2.6,
              HIGH: SEVERITY_RADII.HIGH * 2.3,
              EXTREME: SEVERITY_RADII.EXTREME * 2.0,
            }, 16),
            "circle-opacity": 0.12,
            "circle-blur": 1.5,
          },
        });

        // Pulse ring — EXTREME events only; animated via rAF
        map.addLayer({
          id: "events-pulse",
          type: "circle",
          source: "events",
          filter: ["==", ["get", "severity"], "EXTREME"],
          paint: {
            "circle-color": matchExpr("type", TYPE_COLORS, "#ef4444"),
            "circle-radius": 20,
            "circle-opacity": 0.3,
            "circle-blur": 0.8,
          },
        });

        // Main marker layer
        map.addLayer({
          id: "events-main",
          type: "circle",
          source: "events",
          paint: {
            "circle-color": matchExpr("type", TYPE_COLORS, "#6b7280"),
            "circle-radius": matchExpr("severity", SEVERITY_RADII, 7),
            "circle-opacity": 0.92,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "rgba(255, 255, 255, 0.2)",
          },
        });

        isLoadedRef.current = true;

        // Populate with current events
        const source = map.getSource("events") as GeoJSONSource;
        if (source) source.setData(buildGeoJSON(eventsRef.current));

        // Pulse animation — sine-driven radius on EXTREME ring
        let pulseT = 0;
        function animatePulse() {
          pulseT += 0.04;
          const radius = 18 + Math.sin(pulseT) * 8;
          const opacity = 0.15 + Math.sin(pulseT) * 0.12;
          if (map.getLayer("events-pulse")) {
            map.setPaintProperty("events-pulse", "circle-radius", radius);
            map.setPaintProperty("events-pulse", "circle-opacity", opacity);
          }
          pulseRafRef.current = requestAnimationFrame(animatePulse);
        }
        animatePulse();

        // Click → event detail page
        map.on("click", "events-main", (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const id = feature.properties?.id as string | undefined;
          if (id) router.push(`/events/${id}`);
        });

        // Hover popup
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "map-popup",
          offset: 14,
        });

        map.on("mouseenter", "events-main", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = e.features?.[0];
          if (!feature) return;

          const props = feature.properties ?? {};
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          const type = props.type as keyof typeof TYPE_COLORS;
          const severity = props.severity as string;
          const severityColor =
            SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ?? "#6b7280";

          popup
            .setLngLat(coords)
            .setHTML(
              `<div class="map-popup-inner">
                <div class="map-popup-header">
                  <span>${TYPE_EMOJI[type] ?? "⚠️"}</span>
                  <span class="map-popup-type">${TYPE_LABELS[type] ?? type}</span>
                </div>
                <div class="map-popup-title">${props.title ?? ""}</div>
                ${props.country ? `<div class="map-popup-meta">${props.country}</div>` : ""}
                ${severity ? `<span class="map-popup-severity" style="color:${severityColor}">${severity}</span>` : ""}
              </div>`
            )
            .addTo(map);
        });

        map.on("mouseleave", "events-main", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
      });

      localCleanup = () => {
        cancelAnimationFrame(pulseRafRef.current);
        isLoadedRef.current = false;
        map.remove();
        mapRef.current = null;
      };
    }

    init();

    return () => localCleanup?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync events data whenever the filtered set changes
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const source = mapRef.current.getSource("events") as GeoJSONSource;
    if (source) source.setData(geoJSON);
  }, [geoJSON]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#0a0a0f" }}
    />
  );
}
