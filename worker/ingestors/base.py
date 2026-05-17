"""
Base ingestor class providing HTTP session, retry logic, error handling, and DB upsert.
All ingestors inherit from this class.
"""
import logging
import time
from abc import ABC, abstractmethod
from typing import Any

import httpx

from db import upsert_event, update_source_status
from models import NormalizedEvent

logger = logging.getLogger(__name__)

# HTTP client config
DEFAULT_TIMEOUT = 30.0
MAX_RETRIES = 3
RETRY_BACKOFF = [1, 2, 4]  # seconds


class BaseIngestor(ABC):
    """Abstract base class for all data source ingestors."""

    source: str  # Must be overridden — must match EventSource enum value
    headers: dict[str, str] = {}

    def __init__(self) -> None:
        if not hasattr(self, "source") or not self.source:
            raise NotImplementedError("Ingestor subclass must define `source`.")

    def fetch(self, url: str, **kwargs: Any) -> httpx.Response:
        """
        Fetch a URL with retry logic.
        Raises httpx.HTTPError on final failure.
        """
        headers = {
            "User-Agent": "DisasterPlatform/1.0 (contact@example.com)",
            **self.headers,
        }
        for attempt, wait in enumerate(RETRY_BACKOFF):
            try:
                with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
                    response = client.get(url, headers=headers, **kwargs)
                    response.raise_for_status()
                    return response
            except (httpx.HTTPError, httpx.TimeoutException) as e:
                if attempt < MAX_RETRIES - 1:
                    logger.warning(
                        "[%s] Fetch attempt %d/%d failed for %s: %s. Retrying in %ds...",
                        self.source, attempt + 1, MAX_RETRIES, url, e, wait,
                    )
                    time.sleep(wait)
                else:
                    logger.error(
                        "[%s] All %d fetch attempts failed for %s: %s",
                        self.source, MAX_RETRIES, url, e,
                    )
                    raise

    @abstractmethod
    def normalize(self, raw_data: Any) -> list[NormalizedEvent]:
        """
        Parse raw API response and return a list of normalized events.
        Must be implemented by each subclass.
        """
        ...

    def ingest(self) -> int:
        """
        Main entry point: fetch → normalize → upsert.
        Updates SourceStatus on success or failure.
        Returns number of events processed.
        """
        logger.info("[%s] Starting ingestion.", self.source)
        try:
            events = self.fetch_and_normalize()
            count = 0
            for event in events:
                try:
                    upsert_event(event.model_dump())
                    count += 1
                except Exception as e:
                    logger.error("[%s] Failed to upsert event %s: %s", self.source, event.external_id, e)

            update_source_status(self.source, event_count=count, is_healthy=True)
            logger.info("[%s] Ingestion complete. %d events processed.", self.source, count)
            return count

        except Exception as e:
            error_msg = str(e)[:500]
            logger.error("[%s] Ingestion failed: %s", self.source, error_msg)
            update_source_status(self.source, event_count=0, error=error_msg, is_healthy=False)
            return 0

    def fetch_and_normalize(self) -> list[NormalizedEvent]:
        """
        Subclasses can override this for full control of fetch + normalize flow.
        Default: call fetch() with self.url, pass response to normalize().
        """
        if not hasattr(self, "url"):
            raise NotImplementedError("Either define `url` or override `fetch_and_normalize()`.")
        response = self.fetch(self.url)
        return self.normalize(response.json())
