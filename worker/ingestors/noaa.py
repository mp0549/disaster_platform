"""
NOAA/NWS Active Alerts ingestor.
"""
import logging
from datetime import datetime, timezone
from typing import Any

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import map_noaa_event_type, map_noaa_severity

logger = logging.getLogger(__name__)

NOAA_URL = "https://api.weather.gov/alerts/active?status=actual"


class NOAAIngestor(BaseIngestor):
    source = "NOAA"
    url = NOAA_URL
    # NWS requires a User-Agent header with contact info
    headers = {
        "User-Agent": "DisasterPlatform/1.0 (contact@example.com)",
        "Accept": "application/geo+json",
    }

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        events = []
        features = raw_data.get("features", [])

        for feature in features:
            try:
                props = feature.get("properties", {})
                external_id = props.get("id")
                if not external_id:
                    continue

                event_name = props.get("event") or "Weather Alert"
                disaster_type = map_noaa_event_type(event_name)
                headline = props.get("headline") or event_name
                description = (props.get("description") or "")[:2000]

                severity_raw = props.get("severity", "")

                # Skip watches/advisories — only ingest confirmed warnings (Severe/Extreme)
                if severity_raw not in ("Severe", "Extreme"):
                    continue

                severity = map_noaa_severity(severity_raw)

                # Determine status
                status_raw = props.get("status", "")
                expires_str = props.get("expires")
                if expires_str:
                    try:
                        expires = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                        is_expired = expires < datetime.now(tz=timezone.utc)
                    except Exception:
                        is_expired = False
                else:
                    is_expired = False
                status = "CLOSED" if (status_raw != "Actual" or is_expired) else "ACTIVE"

                # Extract coordinates from GeoJSON geometry
                geom = feature.get("geometry")
                lat, lon = None, None
                geojson_geometry = None

                if geom:
                    geom_type = geom.get("type", "")
                    coords = geom.get("coordinates", [])

                    if geom_type == "Point" and len(coords) >= 2:
                        lon, lat = coords[0], coords[1]
                    elif geom_type == "Polygon" and coords:
                        ring = coords[0]
                        lon = sum(p[0] for p in ring) / len(ring)
                        lat = sum(p[1] for p in ring) / len(ring)
                        geojson_geometry = geom
                    elif geom_type == "MultiPolygon" and coords:
                        all_points = [p for poly in coords for ring in poly for p in ring]
                        lon = sum(p[0] for p in all_points) / len(all_points)
                        lat = sum(p[1] for p in all_points) / len(all_points)
                        geojson_geometry = geom

                if lat is None or lon is None:
                    # Try to use affected zone centroid from areaDesc (skip if no coords)
                    logger.debug("[NOAA] No coordinates for alert %s, skipping.", external_id)
                    continue

                area_desc = props.get("areaDesc") or ""
                onset_str = props.get("onset") or props.get("sent")
                started_at = datetime.now(tz=timezone.utc)
                if onset_str:
                    try:
                        started_at = datetime.fromisoformat(onset_str.replace("Z", "+00:00"))
                    except Exception:
                        pass

                events.append(NormalizedEvent(
                    external_id=external_id,
                    source="NOAA",
                    type=disaster_type,
                    title=headline,
                    description=description or None,
                    severity=severity,
                    status=status,
                    lat=lat,
                    lon=lon,
                    geometry=geojson_geometry,
                    country="United States",
                    region=area_desc[:500] if area_desc else None,
                    started_at=started_at,
                    raw_data=props,
                    source_url=props.get("@id"),
                ))
            except Exception as e:
                logger.warning("[NOAA] Failed to normalize alert: %s", e)
                continue

        return events
