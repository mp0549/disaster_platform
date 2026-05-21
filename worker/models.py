from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class NormalizedEvent(BaseModel):
    external_id: str
    source: str  # EventSource enum value
    type: str    # DisasterType enum value
    title: str
    description: Optional[str] = None
    severity: Optional[str] = None  # Severity enum value
    status: str = "UNKNOWN"         # EventStatus enum value
    lat: float
    lon: float
    geometry: Optional[Any] = None  # GeoJSON dict or None
    country: Optional[str] = None
    region: Optional[str] = None
    started_at: datetime
    raw_data: dict[str, Any]
    source_url: Optional[str] = None
