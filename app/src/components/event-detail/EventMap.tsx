"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface EventMapProps {
  lat: number;
  lon: number;
  title: string;
  geometry?: unknown;
}

export default function EventMap({ lat, lon, title, geometry }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let map: import("leaflet").Map;

    async function init() {
      const L = (await import("leaflet")).default;

      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(mapRef.current!, {
        center: [lat, lon],
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark tile layer (CartoDB Dark Matter)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
          errorTileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        }
      ).addTo(map);

      // Custom marker
      const customIcon = L.divIcon({
        className: "",
        html: `<div style="
          width: 14px; height: 14px;
          background: #ef4444;
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.3), 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([lat, lon], { icon: customIcon })
        .bindTooltip(title, { permanent: false, direction: "top", offset: [0, -10] })
        .addTo(map);

      // Render geometry overlay if available
      if (geometry) {
        try {
          const geoLayer = L.geoJSON(geometry as GeoJSON.GeoJSON, {
            style: {
              color: "#3b82f6",
              weight: 2,
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
              opacity: 0.7,
            },
          }).addTo(map);
          if (geoLayer.getBounds().isValid()) {
            map.fitBounds(geoLayer.getBounds(), { padding: [30, 30], maxZoom: 10 });
          }
        } catch {
          // Ignore invalid geometry
        }
      }

      mapInstanceRef.current = map;
    }

    init();

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, title, geometry]);

  return (
    <div>
      <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-3">
        Location
      </h2>
      <div
        ref={mapRef}
        className="w-full rounded-lg overflow-hidden border border-[#e5e5e5]"
        style={{ height: "400px" }}
        role="img"
        aria-label={`Map showing location of ${title}`}
      />
    </div>
  );
}
