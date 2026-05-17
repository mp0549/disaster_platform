"""
ReliefWeb API ingestor — creates events from humanitarian reports tagged with disaster types.
"""
import logging
from datetime import datetime, timezone
from typing import Any

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import get_country_centroid, map_reliefweb_disaster_type

logger = logging.getLogger(__name__)

RELIEFWEB_URL = (
    "https://api.reliefweb.int/v1/reports"
    "?appname=disaster-platform"
    "&limit=50"
    "&preset=latest"
    "&profile=list"
    "&fields[include][]=title"
    "&fields[include][]=date"
    "&fields[include][]=country"
    "&fields[include][]=disaster_type"
    "&fields[include][]=url"
)


class ReliefWebIngestor(BaseIngestor):
    source = "RELIEFWEB"
    url = RELIEFWEB_URL

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        events = []
        items = raw_data.get("data", [])

        for item in items:
            try:
                report_id = str(item.get("id", ""))
                if not report_id:
                    continue

                fields = item.get("fields", {})
                title = fields.get("title") or "ReliefWeb Report"

                # Disaster type
                disaster_types = fields.get("disaster_type", [])
                if not disaster_types:
                    continue  # Skip reports with no disaster type
                disaster_type_name = disaster_types[0].get("name", "")
                disaster_type = map_reliefweb_disaster_type(disaster_type_name)

                # Country — required for geocoding
                countries = fields.get("country", [])
                country_name = countries[0].get("name") if countries else None
                if not country_name:
                    continue

                centroid = get_country_centroid(country_name)
                if centroid is None:
                    logger.debug("[ReliefWeb] No centroid for country '%s', skipping.", country_name)
                    continue
                lat, lon = centroid

                # Date
                date_info = fields.get("date", {})
                date_str = date_info.get("created") or date_info.get("original")
                started_at = datetime.now(tz=timezone.utc)
                if date_str:
                    try:
                        started_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except Exception:
                        pass

                events.append(NormalizedEvent(
                    external_id=report_id,
                    source="RELIEFWEB",
                    type=disaster_type,
                    title=title,
                    description=None,
                    severity=None,
                    status="ACTIVE",
                    lat=lat,
                    lon=lon,
                    geometry=None,
                    country=country_name,
                    region=None,
                    started_at=started_at,
                    raw_data=fields,
                ))
            except Exception as e:
                logger.warning("[ReliefWeb] Failed to normalize report %s: %s", item.get("id"), e)
                continue

        return events
