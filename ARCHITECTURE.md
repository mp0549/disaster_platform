# Architecture — Global Disaster Intelligence Platform

## System Overview

A real-time geospatial intelligence platform that ingests, normalizes, enriches, and visualizes global disaster data. Three independently deployed services share a single PostgreSQL database.

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DATA SOURCES                         │
│  USGS · EONET · GDACS · FEMA · FIRMS · NOAA · ReliefWeb             │
└──────────────┬───────────────────────────────────────────────────────┘
               │ HTTP polling (5–60 min intervals)
               ▼
┌──────────────────────────┐
│   INGESTION WORKER       │  Python · FastAPI · APScheduler
│   (Railway)              │  - One ingestor per source
│                          │  - Normalizes to unified schema
│   GET /health            │  - Deduplicates on (source, external_id)
│                          │  - Logs field changes as EventUpdates
└──────────┬───────────────┘
           │ PostgreSQL INSERT/UPDATE
           ▼
┌──────────────────────────┐
│   NEON POSTGRESQL        │  Shared database
│                          │  Tables: events, event_updates, source_status
│                          │  Accessed by both worker (writes) and app (reads)
└──────────┬───────────────┘
           │ Prisma Client queries
           ▼
┌──────────────────────────┐         ┌─────────────────────┐
│   NEXT.JS APPLICATION    │         │  ENRICHMENT APIs     │
│   (Vercel)               │◄───────►│  - Gemini Flash 2.0  │
│                          │         │  - Open-Meteo         │
│   /api/* — REST API      │         │  - ReliefWeb          │
│   / — 3D Globe (Three.js)│         └─────────────────────┘
│   /events/:id — Detail   │
│     (SSR + Leaflet)      │
└──────────────────────────┘
           │
           ▼
       [ Browser ]
```

## Deployment Topology

| Service          | Platform | Tier   | Purpose                      |
|------------------|----------|--------|------------------------------|
| Next.js App      | Vercel   | Free   | Frontend + API routes        |
| PostgreSQL       | Neon     | Free   | Persistent storage           |
| Ingestion Worker | Railway  | $5/mo  | Background data polling      |

### Critical: Database Connection Strategy

Two different connection strings are required:

- **Vercel (Next.js)** → Neon **pooled** connection (PgBouncer, port 6432). Each Vercel serverless function invocation opens a new TCP connection — without PgBouncer, Neon's free-tier limit (10 direct connections) is exhausted immediately under real traffic.
- **Railway (Worker)** → Neon **direct** connection (port 5432). The Python worker is a long-lived process. PgBouncer's transaction-mode pooling breaks multi-statement transactions used by the upsert + change detection logic.

## Database Schema

Three tables:

- **events** — Unified disaster event records from all sources. Composite unique on `(source, external_id)` for deduplication. Includes V2 stub fields (`impact_score`, `population_exposure`, `event_group_id`, `satellite_image_url`) for future features.
- **event_updates** — Changelog entries created when an existing event's tracked fields change during re-ingestion. Records `changed_fields` (JSON array) and `snapshot` (full event state before the update).
- **source_status** — One row per data source tracking last fetch time, event count, health status, and last error message.

## API Layer

All endpoints are Next.js API routes under `/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | Filterable event list (type, severity, source, bbox, since) |
| `/api/events/:id` | GET | Full event detail |
| `/api/events/:id/updates` | GET | Change history |
| `/api/events/:id/summarize` | POST | On-demand AI summary generation |
| `/api/events/stream` | GET | SSE stub — returns 501 |
| `/api/sources` | GET | Ingestion health dashboard |
| `/api/stats` | GET | Aggregated counts for dashboard |

### Antimeridian Handling

The `/api/events?bbox=` parameter correctly handles queries that span the 180° antimeridian (e.g., Pacific Ocean queries). When `minLon > maxLon`, the filter uses `lon >= minLon OR lon <= maxLon` instead of the standard range check.

## Ingestion Pipeline

Each ingestor inherits from `BaseIngestor` which provides:
- HTTP client with 3-retry exponential backoff (1s, 2s, 4s)
- Error catching — exceptions update `SourceStatus.lastError` and never crash the scheduler
- Deduplication via `ON CONFLICT (source, external_id) DO UPDATE`
- Change detection — compares 9 tracked fields before update; writes `EventUpdate` records on any change

### Polling Intervals

| Source | Interval | Notes |
|--------|----------|-------|
| USGS Hourly | 5 min | All earthquakes past hour |
| USGS Daily | 30 min | All earthquakes past day |
| USGS Weekly | 6 hours | M2.5+ past week |
| NASA EONET | 15 min | Open natural events |
| GDACS | 10 min | GeoRSS XML feed |
| NOAA/NWS | 10 min | Active US weather alerts |
| NASA FIRMS | 30 min | Wildfire satellite (requires MAP_KEY) |
| OpenFEMA | 60 min | US disaster declarations |
| ReliefWeb | 60 min | Humanitarian reports |

### FIRMS Clustering

FIRMS returns thousands of individual fire detection points. Raw deduplication on coordinates would create duplicate events across polls. Instead, points are clustered by Geohash precision 4 (~40km × 20km cells). Each unique Geohash = one persistent event. This keeps event count manageable (~100-500 clusters globally) while preserving geographic accuracy.

### FEMA Spatial Jitter

FEMA data only includes US state names, not precise coordinates. Multiple active FEMA declarations for the same state would land at the exact same 3D coordinate, causing Z-fighting in Three.js's InstancedMesh depth sorting. A deterministic hash-seeded ±0.25° jitter is applied to FEMA coordinates, spreading markers visually while keeping them near the correct state centroid.

### Schema Sync Safety

The Python worker writes via raw SQL column names. Prisma uses camelCase → snake_case mapping via `@map()`. A mismatch (e.g., a renamed column) would silently write broken data. The worker runs `startup_check()` at launch: it queries `information_schema.columns` and asserts all 20 expected column names exist. If any are missing, it logs `FATAL` and exits — surfacing the mismatch immediately at deploy time.

## AI Integration Points

### Current (MVP)

**Situation Summaries**: Gemini Flash 2.0 generates 3-sentence event summaries on first page visit. Cached in DB after generation. Rate: ~15 RPM, 1500/day free tier.

Gemini call has an 8-second `AbortController` timeout — mandatory to stay under Vercel's 10-second serverless function limit.

### Future (V2)

- **Anomaly Detection**: Compare incoming events against historical baselines. Integration: post-normalization hook in ingestion pipeline.
- **Trend Narration**: Daily/weekly auto-generated reports. Integration: scheduled job in worker + new API route.
- **Cross-Source Correlation**: LLM-based deduplication across sources. Integration: `event_group_id` field.
- **Impact Assessment**: Population exposure estimation. Integration: `impact_score` + `population_exposure` fields.

## V2 Extension Points

| Feature | Structural Groundwork |
|---------|----------------------|
| Real-time push (SSE) | `/api/events/stream` stub returns 501 |
| Cross-source grouping | `event_group_id` field in events table |
| Impact scoring | `impact_score` + `population_exposure` fields |
| Satellite imagery | `satellite_image_url` field |
| WebSocket live updates | Replace SSE stub with WebSocket implementation |

## Known Tradeoffs

1. **Polling vs. push**: All sources polled on intervals. Events appear with up to N-minute delay. Most sources don't offer push delivery.
2. **Python + Node split**: Two runtimes add deployment complexity. Each excels at its job — Python for XML/CSV parsing and scheduling, Node for SSR and React.
3. **On-demand AI summaries**: First visitor sees a loading state. Conserves the 1500/day free quota.
4. **FIRMS clustering**: Some fire granularity lost for manageability.
5. **FEMA geocoding**: State-centroid coordinates, not precise disaster locations.
6. **Single database**: Both services hit the same Neon instance. Adequate for free-tier traffic; would need read replicas at scale.

## Future Migration Notes

- **Adding a data source**: New file in `worker/ingestors/`, new value in `EventSource` enum (Prisma migration required), register job in `scheduler.py`.
- **Switching to real-time**: Implement `/api/events/stream` SSE endpoint. Worker needs to notify the app — options: database triggers + pg_notify, or shared Redis pub/sub.
- **Adding user accounts**: New Prisma models for User, SavedFilter, AlertSubscription. Auth via NextAuth.js.
- **Schema changes**: Always update `db.py`'s `EXPECTED_EVENT_COLUMNS` set in the same commit as any Prisma `@map()` column rename.
