"""
NOAA/NWS Active Alerts ingestor.

Clusters per-county alerts by (event_type_slug, geohash3, onset_6h_bucket) to
avoid showing 50+ duplicate rows for a single storm system.
"""
import logging
from datetime import datetime, timezone
from typing import Any

import pygeohash as geohash

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import map_noaa_event_type, map_noaa_severity

logger = logging.getLogger(__name__)

NOAA_URL = "https://api.weather.gov/alerts/active?status=actual"


def _floor_to_6h(dt: datetime) -> str:
    """Return YYYYMMDD_HH with HH ∈ {00, 06, 12, 18}."""
    bucket_hour = (dt.hour // 6) * 6
    return dt.strftime(f"%Y%m%d_{bucket_hour:02d}")


def _extract_centroid(feature: dict) -> tuple[float, float] | None:
    geom = feature.get("geometry")
    if not geom:
        return None
    geom_type = geom.get("type", "")
    coords = geom.get("coordinates", [])
    if geom_type == "Point" and len(coords) >= 2:
        return coords[1], coords[0]  # lat, lon
    if geom_type == "Polygon" and coords:
        ring = coords[0]
        return (sum(p[1] for p in ring) / len(ring),
                sum(p[0] for p in ring) / len(ring))
    if geom_type == "MultiPolygon" and coords:
        all_pts = [p for poly in coords for ring in poly for p in ring]
        return (sum(p[1] for p in all_pts) / len(all_pts),
                sum(p[0] for p in all_pts) / len(all_pts))
    return None


def _bbox_geometry(alerts: list[dict]) -> dict | None:
    """Bounding-box Polygon over all alert centroids."""
    lats = [a["lat"] for a in alerts]
    lons = [a["lon"] for a in alerts]
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    if min_lat == max_lat and min_lon == max_lon:
        return None  # single point — no polygon needed
    return {
        "type": "Polygon",
        "coordinates": [[
            [min_lon, min_lat], [max_lon, min_lat],
            [max_lon, max_lat], [min_lon, max_lat],
            [min_lon, min_lat],
        ]],
    }


class NOAAIngestor(BaseIngestor):
    source = "NOAA"
    url = NOAA_URL
    headers = {
        "User-Agent": "DisasterPlatform/1.0 (contact@example.com)",
        "Accept": "application/geo+json",
    }

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        features = raw_data.get("features", [])

        # ── Pass 1: parse, filter, bin into clusters ──────────────────────────
        clusters: dict[tuple, list[dict]] = {}

        for feature in features:
            try:
                props = feature.get("properties", {})
                if props.get("severity") not in ("Severe", "Extreme"):
                    continue

                centroid = _extract_centroid(feature)
                if centroid is None:
                    continue
                lat, lon = centroid

                event_name = props.get("event") or "Weather Alert"
                event_slug = event_name.lower().replace(" ", "_")

                onset_str = props.get("onset") or props.get("sent")
                onset_dt = datetime.now(tz=timezone.utc)
                if onset_str:
                    try:
                        onset_dt = datetime.fromisoformat(onset_str.replace("Z", "+00:00"))
                    except Exception:
                        pass

                gh3 = geohash.encode(lat, lon, precision=3)
                bucket = _floor_to_6h(onset_dt)
                key = (event_slug, gh3, bucket)

                expires_str = props.get("expires")
                is_expired = False
                if expires_str:
                    try:
                        expires = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                        is_expired = expires < datetime.now(tz=timezone.utc)
                    except Exception:
                        pass

                clusters.setdefault(key, []).append({
                    "lat": lat,
                    "lon": lon,
                    "event_name": event_name,
                    "event_slug": event_slug,
                    "severity_raw": props.get("severity", ""),
                    "is_expired": is_expired,
                    "status_raw": props.get("status", ""),
                    "onset_dt": onset_dt,
                    "headline": props.get("headline") or event_name,
                    "area_desc": props.get("areaDesc") or "",
                    "gh3": gh3,
                    "bucket": bucket,
                    "sample_id": props.get("id") or "",
                    "props": props,
                })
            except Exception as e:
                logger.warning("[NOAA] Pass-1 parse error: %s", e)

        # ── Pass 2: build one NormalizedEvent per cluster ─────────────────────
        events: list[NormalizedEvent] = []

        for (event_slug, gh3, bucket), alerts in clusters.items():
            try:
                n = len(alerts)
                event_name = alerts[0]["event_name"]

                title = (f"{n} {event_name}s" if n > 1 else alerts[0]["headline"])

                # Severity: max across cluster (Extreme > Severe)
                has_extreme = any(a["severity_raw"] == "Extreme" for a in alerts)
                severity_raw = "Extreme" if has_extreme else "Severe"
                severity = map_noaa_severity(severity_raw)

                disaster_type = map_noaa_event_type(event_name)

                # Status: ACTIVE if any alert is non-expired Actual
                is_active = any(
                    not a["is_expired"] and a["status_raw"] == "Actual"
                    for a in alerts
                )
                status = "ACTIVE" if is_active else "CLOSED"

                # Centroid
                lat = sum(a["lat"] for a in alerts) / n
                lon = sum(a["lon"] for a in alerts) / n

                geometry = _bbox_geometry(alerts)

                started_at = min(a["onset_dt"] for a in alerts)

                # Region: up to 3 distinct areaDesc values
                area_descs = list(dict.fromkeys(
                    a["area_desc"] for a in alerts if a["area_desc"]
                ))[:3]
                region = "; ".join(area_descs) or None

                external_id = f"NOAA_{event_slug}_{gh3}_{bucket}"

                events.append(NormalizedEvent(
                    external_id=external_id,
                    source="NOAA",
                    type=disaster_type,
                    title=title,
                    description=None,
                    severity=severity,
                    status=status,
                    lat=lat,
                    lon=lon,
                    geometry=geometry,
                    country="United States",
                    region=region,
                    started_at=started_at,
                    raw_data={
                        "cluster_size": n,
                        "event_type": event_name,
                        "geohash": gh3,
                        "bucket": bucket,
                        "sample_id": alerts[0]["sample_id"],
                    },
                    source_url=None,
                ))
            except Exception as e:
                logger.warning("[NOAA] Pass-2 cluster error (%s): %s", event_slug, e)

        logger.info("[NOAA] %d alerts → %d clusters", len(features), len(events))
        return events
