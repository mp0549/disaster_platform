"""
USGS Earthquake API ingestors — three feeds at different time windows.
"""
import logging
from datetime import datetime, timezone
from typing import Any

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import usgs_magnitude_to_severity

logger = logging.getLogger(__name__)


class _USGSBaseIngestor(BaseIngestor):
    source = "USGS"
    url: str  # Set by subclass

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        events = []
        features = raw_data.get("features", [])
        for feature in features:
            try:
                props = feature.get("properties", {})
                coords = feature.get("geometry", {}).get("coordinates", [])
                if len(coords) < 2:
                    continue

                lon, lat = coords[0], coords[1]
                mag = props.get("mag") or 0.0
                place = props.get("place") or ""
                time_ms = props.get("time") or 0

                # Parse country/region from "place" (e.g. "45 km SE of Hualien, Taiwan")
                country = None
                region = None
                if "," in place:
                    parts = place.rsplit(",", 1)
                    region = parts[0].strip()
                    country = parts[1].strip()
                else:
                    region = place

                status_raw = props.get("status", "")
                status = "ACTIVE" if status_raw == "reviewed" else "UNKNOWN"

                started_at = datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc)

                events.append(NormalizedEvent(
                    external_id=feature["id"],
                    source="USGS",
                    type="EARTHQUAKE",
                    title=props.get("title") or f"M {mag:.1f} Earthquake",
                    description=place or None,
                    severity=usgs_magnitude_to_severity(mag),
                    status=status,
                    lat=lat,
                    lon=lon,
                    geometry=None,
                    country=country,
                    region=region,
                    started_at=started_at,
                    raw_data=feature,
                    source_url=props.get("url"),
                ))
            except Exception as e:
                logger.warning("[USGS] Failed to normalize feature: %s", e)
                continue
        return events


class USGSIngestorHourly(_USGSBaseIngestor):
    """Polls the hourly feed — M2.5+ earthquakes in the last hour. Interval: 5 min."""
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson"


class USGSIngestorDaily(_USGSBaseIngestor):
    """Polls the daily feed — M2.5+ earthquakes in the last day. Interval: 30 min."""
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"


class USGSIngestorWeekly(_USGSBaseIngestor):
    """Polls the weekly feed — M2.5+ earthquakes in the last week. Interval: 6 hours."""
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson"
