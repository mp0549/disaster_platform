import type { Map as MaplibreMap } from "maplibre-gl";

/**
 * Re-color the OpenFreeMap (or any vanilla MapLibre) style to a dark palette
 * that matches the rest of the dashboard. Uses heuristics on layer ids since
 * the source style is not under our control.
 */
export function applyDarkTheme(map: MaplibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    try {
      const id = layer.id.toLowerCase();

      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", "#0a0a0f");
      } else if (layer.type === "fill") {
        paintFill(map, layer.id, id);
      } else if (layer.type === "line") {
        paintLine(map, layer.id, id);
      } else if (layer.type === "symbol") {
        paintSymbol(map, layer.id);
      }
    } catch {
      // Skip layers that don't support the property
    }
  }
}

function paintFill(map: MaplibreMap, layerId: string, idLower: string) {
  if (matchesAny(idLower, ["water", "ocean", "sea", "lake"])) {
    map.setPaintProperty(layerId, "fill-color", "#0d1b2a");
    map.setPaintProperty(layerId, "fill-opacity", 0.9);
  } else if (matchesAny(idLower, ["park", "forest", "wood", "green", "grass", "scrub", "farmland", "meadow"])) {
    map.setPaintProperty(layerId, "fill-color", "#0d1219");
  } else if (idLower.includes("building")) {
    map.setPaintProperty(layerId, "fill-color", "#111122");
    map.setPaintProperty(layerId, "fill-opacity", 0.8);
  } else {
    map.setPaintProperty(layerId, "fill-color", "#0f0f1a");
  }
}

function paintLine(map: MaplibreMap, layerId: string, idLower: string) {
  if (matchesAny(idLower, ["water", "river", "stream", "canal"])) {
    map.setPaintProperty(layerId, "line-color", "#0d1b2a");
  } else if (matchesAny(idLower, ["admin", "border", "boundary", "country"])) {
    map.setPaintProperty(layerId, "line-color", "#2a2a4e");
    map.setPaintProperty(layerId, "line-opacity", 0.7);
  } else {
    // Roads, rail, paths, and everything else
    map.setPaintProperty(layerId, "line-color", "#1a1a2e");
  }
}

function paintSymbol(map: MaplibreMap, layerId: string) {
  try {
    map.setPaintProperty(layerId, "text-color", "#4a4a6a");
    map.setPaintProperty(layerId, "text-halo-color", "#0a0a0f");
    map.setPaintProperty(layerId, "text-halo-width", 1.5);
  } catch {
    // Some symbol layers don't have these paint properties
  }
}

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}
