"""
Database connection pool and upsert helpers.
Uses psycopg2 for raw SQL writes — no ORM needed for the worker.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

from config import config

logger = logging.getLogger(__name__)

# Connection pool — min 1, max 5 connections
_pool: ThreadedConnectionPool | None = None

# Expected snake_case column names in the events table
EXPECTED_EVENT_COLUMNS = {
    "id",
    "external_id",
    "source",
    "type",
    "title",
    "description",
    "severity",
    "status",
    "lat",
    "lon",
    "geometry",
    "country",
    "region",
    "started_at",
    "updated_at",
    "created_at",
    "raw_data",
    "ai_summary",
    "ai_summary_generated_at",
    "impact_score",
    "population_exposure",
    "event_group_id",
    "satellite_image_url",
    "source_url",
}


def get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=config.DATABASE_URL,
        )
    return _pool


def get_conn() -> psycopg2.extensions.connection:
    return get_pool().getconn()


def return_conn(conn: psycopg2.extensions.connection) -> None:
    get_pool().putconn(conn)


def startup_check() -> None:
    """
    Assert that all expected snake_case columns exist on the events table.
    If any column is missing, log FATAL and raise SystemExit.
    This surfaces Prisma schema drift immediately rather than silently writing broken data.
    """
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'events'
                  AND table_schema = 'public'
                """
            )
            existing = {row[0] for row in cur.fetchall()}
            missing = EXPECTED_EVENT_COLUMNS - existing
            if missing:
                logger.critical(
                    "Schema mismatch detected. Missing columns in 'events' table: %s. "
                    "Run 'prisma migrate deploy' to sync the schema.",
                    missing,
                )
                raise SystemExit(1)
            logger.info("Startup schema check passed. All %d expected columns present.", len(EXPECTED_EVENT_COLUMNS))
    finally:
        if conn:
            return_conn(conn)


def upsert_event(event: dict[str, Any]) -> tuple[bool, dict[str, Any] | None]:
    """
    Upsert a normalized event dict into the events table.
    Returns (is_new, old_row_or_none).
    If old_row is not None, change detection should be performed by the caller.
    """
    conn = None
    try:
        conn = get_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Fetch existing row for change detection
            cur.execute(
                "SELECT * FROM events WHERE source = %s AND external_id = %s",
                (event["source"], event["external_id"]),
            )
            existing = cur.fetchone()

            # Build geometry JSON string
            geometry_json = json.dumps(event["geometry"]) if event.get("geometry") else None
            raw_data_json = json.dumps(event["raw_data"])

            cur.execute(
                """
                INSERT INTO events (
                    id, external_id, source, type, title, description, severity, status,
                    lat, lon, geometry, country, region, started_at, raw_data, source_url,
                    updated_at, created_at
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s::jsonb, %s, %s, %s, %s::jsonb, %s,
                    NOW(), NOW()
                )
                ON CONFLICT (source, external_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    severity = EXCLUDED.severity,
                    status = EXCLUDED.status,
                    lat = EXCLUDED.lat,
                    lon = EXCLUDED.lon,
                    geometry = EXCLUDED.geometry,
                    country = EXCLUDED.country,
                    region = EXCLUDED.region,
                    raw_data = EXCLUDED.raw_data,
                    source_url = COALESCE(EXCLUDED.source_url, events.source_url),
                    updated_at = NOW()
                RETURNING id, external_id, source
                """,
                (
                    event["external_id"],
                    event["source"],
                    event["type"],
                    event["title"],
                    event.get("description"),
                    event.get("severity"),
                    event.get("status", "UNKNOWN"),
                    event["lat"],
                    event["lon"],
                    geometry_json,
                    event.get("country"),
                    event.get("region"),
                    event["started_at"],
                    raw_data_json,
                    event.get("source_url"),
                ),
            )
            result = cur.fetchone()

            # If existing row, check for changes and write EventUpdate
            if existing:
                tracked_fields = ["title", "description", "severity", "status", "lat", "lon", "geometry", "country", "region"]
                changed = []
                for field in tracked_fields:
                    old_val = existing.get(field)
                    new_val = event.get(field)
                    # Normalize for comparison
                    if field == "geometry":
                        old_val = json.dumps(old_val) if old_val else None
                        new_val = geometry_json
                    if str(old_val) != str(new_val):
                        changed.append(field)

                if changed:
                    snapshot = dict(existing)
                    # Convert non-serializable types
                    for k, v in snapshot.items():
                        if isinstance(v, datetime):
                            snapshot[k] = v.isoformat()
                    cur.execute(
                        """
                        INSERT INTO event_updates (id, event_id, changed_fields, snapshot, created_at)
                        VALUES (gen_random_uuid(), %s, %s::jsonb, %s::jsonb, NOW())
                        """,
                        (result["id"], json.dumps(changed), json.dumps(snapshot)),
                    )

            conn.commit()
            return (existing is None), dict(existing) if existing else None

    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            return_conn(conn)


def update_source_status(source: str, *, event_count: int = 0, error: str | None = None, is_healthy: bool = True) -> None:
    """Upsert a SourceStatus record for the given source."""
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO source_status (id, source, last_fetched_at, event_count, last_error, is_healthy, updated_at)
                VALUES (gen_random_uuid(), %s, NOW(), %s, %s, %s, NOW())
                ON CONFLICT (source) DO UPDATE SET
                    last_fetched_at = NOW(),
                    event_count = EXCLUDED.event_count,
                    last_error = EXCLUDED.last_error,
                    is_healthy = EXCLUDED.is_healthy,
                    updated_at = NOW()
                """,
                (source, event_count, error, is_healthy),
            )
            conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error("Failed to update source_status for %s: %s", source, e)
    finally:
        if conn:
            return_conn(conn)
