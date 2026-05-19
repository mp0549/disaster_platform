"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";
import type { EventSummary } from "@/lib/types";
import { INITIAL_VIEW, OPENFREEMAP_STYLE_URL } from "./mapStyle";
import { applyDarkTheme } from "./darkTheme";
import { buildGeoJSON, addEventLayers, buildPopupHTML } from "./layers";

// CSS import lives here so it only loads when this component is actually used
import "maplibre-gl/dist/maplibre-gl.css";

interface MapView2DProps {
  events: EventSummary[];
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

      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
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

        addEventLayers(map as unknown as MaplibreMap);
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
          const id = feature?.properties?.id as string | undefined;
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

          popup
            .setLngLat(coords)
            .setHTML(
              buildPopupHTML({
                type: props.type ?? "OTHER",
                severity: props.severity ?? "",
                title: props.title ?? "",
                country: props.country ?? "",
              })
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

  return <div ref={containerRef} className="w-full h-full bg-dark-bg" />;
}
