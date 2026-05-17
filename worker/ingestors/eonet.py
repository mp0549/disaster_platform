"""
NASA EONET (Earth Observatory Natural Event Tracker) ingestor.
"""
import logging
from datetime import datetime, timezone
from typing import Any

from config import config
from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import map_eonet_category

logger = logging.getLogger(__name__)


class EONETIngestor(BaseIngestor):
    source = "EONET"

    @property
    def url(self) -> str:
        base = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100"
        if config.NASA_API_KEY:
            base += f"&api_key={config.NASA_API_KEY}"
        return base

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        events = []
        for item in raw_data.get("events", []):
            try:
                geometries = item.get("geometry", [])
                if not geometries:
                    continue

                # Use the most recent geometry point
                last_geom = geometries[-1]
                coords = last_geom.get("coordinates", [])
                if not coords:
                    continue

                # Handle point or polygon
                if last_geom.get("type") == "Point":
                    lon, lat = coords[0], coords[1]
                    geometry = None
                elif last_geom.get("type") in ("Polygon", "MultiPolygon"):
                    # Use centroid of first ring
                    ring = coords[0] if last_geom.get("type") == "Polygon" else coords[0][0]
                    lon = sum(p[0] for p in ring) / len(ring)
                    lat = sum(p[1] for p in ring) / len(ring)
                    geometry = last_geom
                else:
                    continue

                # Get category
                categories = item.get("categories", [])
                category_id = categories[0].get("id", "") if categories else ""
                disaster_type = map_eonet_category(category_id)

                # Parse date
                date_str = last_geom.get("date", "")
                try:
                    started_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    started_at = datetime.now(tz=timezone.utc)

                status = "CLOSED" if item.get("closed") else "ACTIVE"

                events.append(NormalizedEvent(
                    external_id=item["id"],
                    source="EONET",
                    type=disaster_type,
                    title=item.get("title", "EONET Event"),
                    description=item.get("description") or None,
                    severity=None,
                    status=status,
                    lat=lat,
                    lon=lon,
                    geometry=geometry,
                    country=None,
                    region=None,
                    started_at=started_at,
                    raw_data=item,
                ))
            except Exception as e:
                logger.warning("[EONET] Failed to normalize event %s: %s", item.get("id"), e)
                continue
        return events

    def fetch_and_normalize(self) -> list[NormalizedEvent]:
        response = self.fetch(self.url)
        return self.normalize(response.json())
