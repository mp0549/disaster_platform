"""
NASA FIRMS (Fire Information for Resource Management System) ingestor.
Groups fire detections into ~40km clusters using Geohash precision 4.
Skips entirely if FIRMS_MAP_KEY is not set.
"""
import csv
import io
import logging
from datetime import datetime, timezone
from typing import Any

import pygeohash as geohash

from config import config
from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import firms_confidence_to_severity

logger = logging.getLogger(__name__)


class FIRMSIngestor(BaseIngestor):
    source = "FIRMS"

    @property
    def url(self) -> str | None:
        if not config.FIRMS_MAP_KEY:
            return None
        return (
            f"https://firms.modaps.eosdis.nasa.gov/api/area/csv"
            f"/{config.FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/world/1"
        )

    def fetch_and_normalize(self) -> list[NormalizedEvent]:
        if not config.FIRMS_MAP_KEY:
            logger.warning("[FIRMS] FIRMS_MAP_KEY not set. Skipping wildfire satellite data.")
            return []

        response = self.fetch(self.url)
        return self._parse_csv(response.text)

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        return []

    def _parse_csv(self, csv_text: str) -> list[NormalizedEvent]:
        """Parse FIRMS CSV and cluster detections by Geohash precision 4."""
        # Clusters: geohash4 → list of detection dicts
        clusters: dict[str, list[dict]] = {}

        reader = csv.DictReader(io.StringIO(csv_text))
        for row in reader:
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                gh4 = geohash.encode(lat, lon, precision=4)
                if gh4 not in clusters:
                    clusters[gh4] = []
                clusters[gh4].append(row)
            except (KeyError, ValueError):
                continue

        events = []
        for gh4, detections in clusters.items():
            try:
                # Compute centroid
                lats = [float(d["latitude"]) for d in detections]
                lons = [float(d["longitude"]) for d in detections]
                centroid_lat = sum(lats) / len(lats)
                centroid_lon = sum(lons) / len(lons)

                # Determine confidence (use max confidence in cluster)
                confidences = []
                for d in detections:
                    try:
                        confidences.append(float(d.get("confidence", 0)))
                    except (ValueError, TypeError):
                        pass
                max_confidence = max(confidences) if confidences else 50.0
                severity = firms_confidence_to_severity(max_confidence)

                # Representative satellite info
                sample = detections[0]
                satellite = sample.get("satellite", "VIIRS")
                confidence_str = f"{max_confidence:.0f}%"

                # Date from acq_date + acq_time
                acq_date = sample.get("acq_date", "")
                acq_time = sample.get("acq_time", "0000")
                started_at = datetime.now(tz=timezone.utc)
                if acq_date:
                    try:
                        time_str = acq_time.zfill(4)
                        dt_str = f"{acq_date}T{time_str[:2]}:{time_str[2:]}:00Z"
                        started_at = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                    except (ValueError, IndexError):
                        pass

                # Bounding box geometry
                min_lat, max_lat = min(lats), max(lats)
                min_lon, max_lon = min(lons), max(lons)
                bbox_geometry = {
                    "type": "Polygon",
                    "coordinates": [[
                        [min_lon, min_lat],
                        [max_lon, min_lat],
                        [max_lon, max_lat],
                        [min_lon, max_lat],
                        [min_lon, min_lat],
                    ]],
                }

                events.append(NormalizedEvent(
                    external_id=f"FIRMS_{gh4}",
                    source="FIRMS",
                    type="WILDFIRE",
                    title=f"Active Fire — {gh4} ({centroid_lat:.2f}, {centroid_lon:.2f})",
                    description=f"Satellite: {satellite}, Confidence: {confidence_str}",
                    severity=severity,
                    status="ACTIVE",
                    lat=centroid_lat,
                    lon=centroid_lon,
                    geometry=bbox_geometry,
                    country=None,
                    region=None,
                    started_at=started_at,
                    raw_data={
                        "geohash": gh4,
                        "detection_count": len(detections),
                        "max_confidence": max_confidence,
                        "satellite": satellite,
                    },
                ))
            except Exception as e:
                logger.warning("[FIRMS] Failed to process cluster %s: %s", gh4, e)
                continue

        logger.info("[FIRMS] Processed %d detections into %d clusters.", sum(len(v) for v in clusters.values()), len(events))
        return events
