"""
GDACS GeoRSS ingestor — parses XML/GeoRSS feed from gdacs.org.
"""
import hashlib
import logging
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
from xml.etree import ElementTree

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import map_gdacs_event_type, strip_html

logger = logging.getLogger(__name__)

GDACS_URL = "https://www.gdacs.org/xml/rss.xml"

# XML namespaces used in GDACS GeoRSS feed
NAMESPACES = {
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
    "gdacs": "http://www.gdacs.org",
    "dc": "http://purl.org/dc/elements/1.1/",
    "georss": "http://www.georss.org/georss",
}


def _get_text(element: ElementTree.Element, tag: str, ns: dict | None = None) -> str | None:
    el = element.find(tag, ns or NAMESPACES)
    return el.text.strip() if el is not None and el.text else None


class GDACSIngestor(BaseIngestor):
    source = "GDACS"
    url = GDACS_URL

    def fetch_and_normalize(self) -> list[NormalizedEvent]:
        response = self.fetch(self.url)
        return self._parse_xml(response.text)

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        # Not used directly — fetch_and_normalize handles XML
        return []

    def _parse_xml(self, xml_text: str) -> list[NormalizedEvent]:
        events = []
        try:
            root = ElementTree.fromstring(xml_text)
        except ElementTree.ParseError as e:
            logger.error("[GDACS] Failed to parse XML: %s", e)
            return events

        channel = root.find("channel")
        if channel is None:
            return events

        for item in channel.findall("item"):
            try:
                # External ID: prefer guid, fall back to hash of link
                guid_el = item.find("guid")
                link_el = item.find("link")
                if guid_el is not None and guid_el.text:
                    external_id = guid_el.text.strip()
                elif link_el is not None and link_el.text:
                    external_id = "GDACS_" + hashlib.md5(link_el.text.encode()).hexdigest()[:12]
                else:
                    continue

                title = _get_text(item, "title") or "GDACS Event"
                description_raw = _get_text(item, "description") or ""
                description = strip_html(description_raw)[:2000] if description_raw else None

                # Coordinates from GeoRSS or geo namespace
                lat_str = _get_text(item, "geo:lat") or _get_text(item, "georss:point")
                lon_str = _get_text(item, "geo:long")

                if lat_str and " " in lat_str and lon_str is None:
                    # georss:point format: "lat lon"
                    parts = lat_str.split()
                    lat, lon = float(parts[0]), float(parts[1])
                elif lat_str and lon_str:
                    lat, lon = float(lat_str), float(lon_str)
                else:
                    logger.debug("[GDACS] No coordinates for item %s, skipping.", external_id)
                    continue

                # Disaster type from gdacs:eventtype or title keywords
                event_type_raw = _get_text(item, "gdacs:eventtype") or ""
                if event_type_raw:
                    disaster_type = map_gdacs_event_type(event_type_raw.strip())
                else:
                    # Infer from title
                    t = title.lower()
                    if "earthquake" in t or " eq " in t:
                        disaster_type = "EARTHQUAKE"
                    elif "cyclone" in t or "typhoon" in t or "hurricane" in t or "storm" in t:
                        disaster_type = "STORM"
                    elif "flood" in t:
                        disaster_type = "FLOOD"
                    elif "volcan" in t:
                        disaster_type = "VOLCANO"
                    elif "wildfire" in t or "fire" in t:
                        disaster_type = "WILDFIRE"
                    elif "drought" in t:
                        disaster_type = "DROUGHT"
                    else:
                        disaster_type = "OTHER"

                # Severity from gdacs:alertlevel
                alert_level = _get_text(item, "gdacs:alertlevel") or ""
                alert_map = {"GREEN": "LOW", "ORANGE": "MODERATE", "RED": "HIGH"}
                severity = alert_map.get(alert_level.upper())

                # Country
                country = _get_text(item, "gdacs:country")

                # Geometry from gdacs:bbox if present
                bbox_str = _get_text(item, "gdacs:bbox")
                geometry = None
                if bbox_str:
                    try:
                        parts = [float(x) for x in bbox_str.split()]
                        if len(parts) == 4:
                            min_lon, min_lat, max_lon, max_lat = parts
                            geometry = {
                                "type": "Polygon",
                                "coordinates": [[
                                    [min_lon, min_lat],
                                    [max_lon, min_lat],
                                    [max_lon, max_lat],
                                    [min_lon, max_lat],
                                    [min_lon, min_lat],
                                ]],
                            }
                    except (ValueError, TypeError):
                        pass

                # Pub date
                pub_date_str = _get_text(item, "pubDate") or _get_text(item, "dc:date")
                started_at = datetime.now(tz=timezone.utc)
                if pub_date_str:
                    try:
                        started_at = parsedate_to_datetime(pub_date_str)
                    except Exception:
                        try:
                            started_at = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                        except Exception:
                            pass

                events.append(NormalizedEvent(
                    external_id=external_id,
                    source="GDACS",
                    type=disaster_type,
                    title=title,
                    description=description,
                    severity=severity,
                    status="ACTIVE",
                    lat=lat,
                    lon=lon,
                    geometry=geometry,
                    country=country,
                    region=None,
                    started_at=started_at,
                    raw_data={"title": title, "guid": external_id, "description": description_raw},
                ))
            except Exception as e:
                logger.warning("[GDACS] Failed to parse item: %s", e)
                continue

        return events
