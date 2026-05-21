"""
OpenFEMA Disaster Declarations ingestor.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote

from ingestors.base import BaseIngestor
from models import NormalizedEvent
from normalizer import (
    get_us_state_centroid,
    map_fema_incident_type,
    apply_fema_jitter,
)

logger = logging.getLogger(__name__)

# State abbreviation → full name mapping for centroid lookup
STATE_ABBR = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
    "PR": "Puerto Rico", "VI": "Virgin Islands", "GU": "Guam",
    "AS": "American Samoa", "MP": "Northern Mariana Islands",
}


class FEMAIngestor(BaseIngestor):
    source = "FEMA"

    @property
    def url(self) -> str:
        # Rolling 90-day window; exclude Fire Management Assistance Grants (FM) —
        # those are funding instruments, not declared disasters.
        cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%dT00:00:00.000Z")
        filter_str = f"declarationDate ge '{cutoff}' and declarationType ne 'FM'"
        return (
            "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"
            f"?$orderby=declarationDate%20desc"
            f"&$top=200"
            f"&$filter={quote(filter_str)}"
        )

    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        events = []
        declarations = raw_data.get("DisasterDeclarationsSummaries", [])

        for decl in declarations:
            try:
                disaster_number = str(decl.get("disasterNumber", ""))
                if not disaster_number:
                    continue

                external_id = disaster_number
                incident_type = decl.get("incidentType") or "Other"
                disaster_type = map_fema_incident_type(incident_type)

                title = decl.get("declarationTitle") or f"FEMA-{disaster_number}-DR"
                state_abbr = decl.get("state") or ""
                state_name = STATE_ABBR.get(state_abbr, state_abbr)
                designated_area = decl.get("designatedArea") or ""
                description = f"{designated_area}, {state_name}".strip(", ") if designated_area else state_name

                # Geocode from state centroid
                centroid = get_us_state_centroid(state_name)
                if centroid is None:
                    logger.debug("[FEMA] No centroid for state '%s', skipping.", state_name)
                    continue
                lat, lon = centroid

                # Apply deterministic jitter to prevent Z-fighting on globe
                lat, lon = apply_fema_jitter(external_id, lat, lon)

                closeout_date = decl.get("closeoutDate")
                status = "CLOSED" if closeout_date else "ACTIVE"

                declaration_date = decl.get("declarationDate") or decl.get("incidentBeginDate")
                started_at = datetime.now(tz=timezone.utc)
                if declaration_date:
                    try:
                        started_at = datetime.fromisoformat(declaration_date.replace("Z", "+00:00"))
                    except Exception:
                        pass

                events.append(NormalizedEvent(
                    external_id=external_id,
                    source="FEMA",
                    type=disaster_type,
                    title=title,
                    description=description,
                    severity=None,
                    status=status,
                    lat=lat,
                    lon=lon,
                    geometry=None,
                    country="United States",
                    region=state_name,
                    started_at=started_at,
                    raw_data=decl,
                    source_url=f"https://www.fema.gov/disaster/{disaster_number}",
                ))
            except Exception as e:
                logger.warning("[FEMA] Failed to normalize declaration: %s", e)
                continue

        return events
