"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";
import type { EventSummary, MapSettings } from "@/lib/types";
import { INITIAL_VIEW, OPENFREEMAP_STYLE_URL } from "./mapStyle";
import { applyDarkTheme } from "./darkTheme";
import {
  buildGeoJSON,
  buildZonesGeoJSON,
  setupEventLayers,
  setupZoneLayers,
  buildPopupHTML,
  type EventLayersHandle,
  type ZoneLayersHandle,
} from "./layers";
import { buildClusteredGeoJSON } from "./clustering";

import "maplibre-gl/dist/maplibre-gl.css";

interface MapView2DProps {
  events: EventSummary[];
  settings: MapSettings;
}

function getSourceData(events: EventSummary[], clustering: boolean, zoom: number) {
  return clustering ? buildClusteredGeoJSON(events, zoom) : buildGeoJSON(events);
}

export default function MapView2D({ events, settings }: MapView2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const isLoadedRef = useRef(false);
  const pulseRafRef = useRef<number>(0);
  const eventsRef = useRef(events);
  const settingsRef = useRef(settings);
  const zoomRef = useRef(INITIAL_VIEW.zoom);
  const layersHandleRef = useRef<EventLayersHandle | null>(null);
  const zonesHandleRef = useRef<ZoneLayersHandle | null>(null);
  const router = useRouter();

  eventsRef.current = events;
  settingsRef.current = settings;

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

        map.setSky({
          "sky-color": "rgb(8, 12, 30)",
          "sky-horizon-blend": 0.6,
          "horizon-color": "rgb(20, 30, 60)",
          "horizon-fog-blend": 0.5,
          "fog-color": "rgb(5, 5, 12)",
          "fog-ground-blend": 0.2,
          "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 5, 0.6, 10, 0],
        });

        layersHandleRef.current = setupEventLayers(map as unknown as MaplibreMap, {
          clustering: settingsRef.current.clustering,
        });
        zonesHandleRef.current = setupZoneLayers(map as unknown as MaplibreMap, {
          visible: settingsRef.current.zones,
        });
        isLoadedRef.current = true;

        const source = map.getSource("events") as GeoJSONSource;
        if (source) {
          source.setData(getSourceData(eventsRef.current, settingsRef.current.clustering, zoomRef.current));
        }
        zonesHandleRef.current?.setData(eventsRef.current);

        // Re-cluster when integer zoom level changes (only matters when clustering on)
        let lastZoomLevel = Math.floor(INITIAL_VIEW.zoom);
        map.on("zoom", () => {
          const z = map.getZoom();
          zoomRef.current = z;
          const zLevel = Math.floor(z);
          if (zLevel !== lastZoomLevel && settingsRef.current.clustering) {
            lastZoomLevel = zLevel;
            const src = map.getSource("events") as GeoJSONSource;
            if (src) src.setData(buildClusteredGeoJSON(eventsRef.current, z));
          }
        });

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

        map.on("click", "events-main", (e) => {
          const feature = e.features?.[0];
          const id = feature?.properties?.id as string | undefined;
          if (id) router.push(`/events/${id}`);
        });

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
        layersHandleRef.current = null;
        zonesHandleRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    }

    init();

    return () => localCleanup?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild source + layers when clustering toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current || !layersHandleRef.current) return;

    layersHandleRef.current.remove();
    layersHandleRef.current = setupEventLayers(map, { clustering: settings.clustering });

    const source = map.getSource("events") as GeoJSONSource;
    if (source) source.setData(getSourceData(eventsRef.current, settings.clustering, zoomRef.current));
  }, [settings.clustering]);

  // Cheap visibility toggle for zone layers
  useEffect(() => {
    zonesHandleRef.current?.setVisible(settings.zones);
  }, [settings.zones]);

  // Sync events data — re-cluster if enabled
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const source = mapRef.current.getSource("events") as GeoJSONSource;
    if (source) source.setData(getSourceData(events, settings.clustering, zoomRef.current));
    zonesHandleRef.current?.setData(events);
  }, [events, settings.clustering]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full h-full bg-dark-bg" />;
}
