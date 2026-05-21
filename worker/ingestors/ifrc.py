"""
IFRC GO (International Federation of Red Cross) global disaster events ingestor.
Covers humanitarian emergencies worldwide — floods in Bangladesh, cyclones in Philippines,
droughts in Ethiopia, etc. Public API, no key required.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import get_country_centroid, map_ifrc_disaster_type, ifrc_severity

logger = logging.getLogger(__name__)


class IFRCIngestor(BaseIngestor):
    source = "IFRC"

    @property
    def url(self) -> str:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=180)).strftime("%Y-%m-%d")
        return (
            "https://go.ifrc.org/api/v2/event/"
            f"?format=json&limit=100&ordering=-disaster_start_date"
            f"&disaster_start_date__gte={cutoff}"
        )

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        events = []
        items = raw_data.get("results", [])

        for item in items:
            try:
                event_id = str(item.get("id", ""))
                if not event_id:
                    continue

                name = item.get("name") or "IFRC Emergency"

                dtype = item.get("dtype") or {}
                dtype_name = dtype.get("name", "") if isinstance(dtype, dict) else ""
                disaster_type = map_ifrc_disaster_type(dtype_name)

                # Geocode from first country with a known centroid
                countries = item.get("countries") or []
                country_name = None
                lat, lon = None, None
                for c in countries:
                    cname = c.get("name") if isinstance(c, dict) else None
                    if not cname:
                        continue
                    centroid = get_country_centroid(cname)
                    if centroid:
                        country_name = cname
                        lat, lon = centroid
                        break

                if lat is None or lon is None:
                    logger.debug("[IFRC] No centroid for event %s (%s), skipping.", event_id, name)
                    continue

                date_str = item.get("disaster_start_date") or item.get("created_at")
                started_at = datetime.now(tz=timezone.utc)
                if date_str:
                    try:
                        started_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except Exception:
                        pass

                num_affected = item.get("num_affected") or 0
                severity = ifrc_severity(int(num_affected) if num_affected else 0)

                summary = item.get("summary") or None
                if summary:
                    summary = summary[:2000]

                events.append(NormalizedEvent(
                    external_id=event_id,
                    source="IFRC",
                    type=disaster_type,
                    title=name,
                    description=summary,
                    severity=severity,
                    status="ACTIVE",
                    lat=lat,
                    lon=lon,
                    geometry=None,
                    country=country_name,
                    region=None,
                    started_at=started_at,
                    raw_data=item,
                    source_url=f"https://go.ifrc.org/emergencies/{event_id}",
                ))
            except Exception as e:
                logger.warning("[IFRC] Failed to normalize event %s: %s", item.get("id"), e)
                continue

        return events
