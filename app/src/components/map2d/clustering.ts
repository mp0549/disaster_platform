import type { EventSummary, Severity } from "@/lib/types";

// Grid cell size in degrees per zoom bucket.
// At zoom ≤2: 20° cells (~2200 km), zoom 3: 10° (~1100 km),
// zoom 4: 5° (~550 km), zoom ≥5: no clustering.
function cellSizeForZoom(zoom: number): number {
  if (zoom <= 2) return 20;
  if (zoom <= 3) return 10;
  if (zoom <= 4) return 5;
  return 0;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
  EXTREME: 3,
};

function maxSeverity(events: EventSummary[]): Severity {
  let best: Severity = "LOW";
  for (const e of events) {
    if (!e.severity) continue;
    if (SEVERITY_ORDER[e.severity] > SEVERITY_ORDER[best]) best = e.severity;
  }
  return best;
}

function centroid(events: EventSummary[]): [number, number] {
  const lat = events.reduce((s, e) => s + e.lat, 0) / events.length;
  const lon = events.reduce((s, e) => s + e.lon, 0) / events.length;
  return [lon, lat];
}

export function toIndividualFeature(e: EventSummary): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [e.lon, e.lat] },
    properties: {
      id: e.id,
      type: e.type,
      severity: e.severity ?? "MODERATE",
      title: e.title,
      country: e.country ?? "",
      cluster: false,
    },
  };
}

/**
 * Grid-based clustering that only groups events of the same disaster type
 * within the same geographic cell. Events of different types are never merged,
 * and geographically distant events in different cells are never merged even
 * if they share a type.
 */
export function buildClusteredGeoJSON(
  events: EventSummary[],
  zoom: number
): GeoJSON.FeatureCollection {
  const cellSize = cellSizeForZoom(zoom);

  if (cellSize === 0) {
    return { type: "FeatureCollection", features: events.map(toIndividualFeature) };
  }

  const groups = new Map<string, EventSummary[]>();
  for (const e of events) {
    const row = Math.floor(e.lat / cellSize);
    const col = Math.floor(e.lon / cellSize);
    const key = `${e.type}:${row}:${col}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const features: GeoJSON.Feature[] = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      features.push(toIndividualFeature(group[0]));
    } else {
      const [lon, lat] = centroid(group);
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {
          cluster: true,
          clusterType: group[0].type,
          clusterCount: group.length,
          severity: maxSeverity(group),
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}
