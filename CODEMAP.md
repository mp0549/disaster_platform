# Codemap

One-line index of every source file. **Keep this current** — when you create, delete, rename, or significantly change the purpose of a file in the same edit, update the corresponding line here. Agents load this instead of globbing.

Conventions:
- `[dead]` — file appears unused in the live codebase; cleanup candidate.
- `[stub]` — placeholder, body is `export {}` or returns 501.
- Lines stay under ~120 chars. Purpose first, "uses X / used by Y" only when non-obvious.

---

## Root

- `CLAUDE.md` — project context for Claude. Stack, env vars, key files, architecture gotchas, roadmap, session log.
- `REFERENCES.md` — competitive landscape + canonical disaster-type taxonomy decisions.
- `CODEMAP.md` — this file.
- `vercel.json` — Vercel build config (buildCommand, framework).

## `app/` — Next.js 14 App Router frontend (Vercel root)

### Config
- `app/package.json` — deps + scripts; `db:seed`/`seed` scripts call the dead seed.ts (drop when seed.ts goes).
- `app/tailwind.config.ts` — Tailwind theme (currently almost stock; design-system tokens still live in `globals.css`).
- `app/next.config.ts`, `app/tsconfig.json`, `app/postcss.config.mjs`, `app/eslint.config.mjs` — standard configs.

### Prisma (schema-only; Prisma is NOT used at runtime)
- `app/prisma/schema.prisma` — source-of-truth schema for `events`, `event_updates`, `source_status` + enums. App reads via Supabase JS, not Prisma.

### Pages + layouts
- `app/src/app/layout.tsx` — root layout: fonts, global CSS, body shell.
- `app/src/app/page.tsx` — `/` route; renders `<DashboardView />`.
- `app/src/app/not-found.tsx` — 404 page (dark theme, big "Not Found").
- `app/src/app/events/[id]/page.tsx` — event detail (force-dynamic). Reads event row, renders Header/Map/Metadata/AISummary/Weather/ReliefWeb/UpdateTimeline.
- `app/src/app/events/[id]/loading.tsx` — Suspense skeleton for the detail page.
- `app/src/app/monitor/page.tsx` — internal ops view; orchestrates data fetching, renders SourceStatusTable + EventsTable. Inline styles (dark theme, internal-only).
- `app/src/app/monitor/SourceStatusTable.tsx` — source health table (used by monitor).
- `app/src/app/monitor/EventsTable.tsx` — latest events table (used by monitor).
- `app/src/app/monitor/fmtTime.ts` — "Xs/m/h/d ago" formatter shared by the two monitor tables.

### API routes
- `app/src/app/api/events/route.ts` — main list endpoint; filters by type/severity/since/status. Supports `?debug=1`.
- `app/src/app/api/events/[id]/route.ts` — single event fetch (used by `useEventDetail` SWR hook).
- `app/src/app/api/events/[id]/updates/route.ts` — event_updates timeline for an event.
- `app/src/app/api/events/[id]/summarize/route.ts` — Gemini summary endpoint; caches into `events.ai_summary`.
- `app/src/app/api/sources/route.ts` — `source_status` table dump for the monitor and any external watcher.
- `app/src/app/api/stats/route.ts` — aggregate counts (totals, by-type, by-severity, by-source).
- `app/src/app/api/debug/route.ts` — env-vars + sample-query echo for diagnostics.

### Lib (server-safe + client-safe utilities)
- `app/src/lib/supabase-api.ts` — single Supabase JS client used by every API route + server component. Publishable key, no auth persistence.
- `app/src/lib/api.ts` — client-side fetch helpers (relative URLs, no-store). One function per API route.
- `app/src/lib/types.ts` — all shared TS types: enums, EventSummary, EventDetail, FilterState, WeatherData, etc.
- `app/src/lib/constants.ts` — TYPE_COLORS, TYPE_LABELS, SEVERITY_SCALE, SOURCE_LABELS, WMO_WEATHER_CODES.
- `app/src/lib/geo.ts` — `latLonToVector3` / `latLonToQuaternion` for 3D placement on the globe.
- `app/src/lib/gemini.ts` — Gemini Flash 2.0 client. 8s timeout for Vercel 10s limit. 3-sentence disaster-analyst prompt.
- `app/src/lib/weather.ts` — Open-Meteo current-conditions fetcher.
- `app/src/lib/reliefweb.ts` — ReliefWeb v1 API client (country filter only — known limitation, enrichment slice fixes).

### Hooks (client-side SWR wrappers)
- `app/src/hooks/useEvents.ts` — SWR over `/api/events` with filters; 60s poll.
- `app/src/hooks/useEventDetail.ts` — SWR over `/api/events/[id]`.
- `app/src/hooks/useStats.ts` — SWR over `/api/stats`; 60s poll.

### Components: layout
- `app/src/components/DashboardView.tsx` — root client view; wires filters + useEvents + Globe/MapView2D + view toggle.
- `app/src/components/layout/Header.tsx` — top app bar; brand + nav.
- `app/src/components/layout/StatsBar.tsx` — small live-counts strip below header.
- `app/src/components/layout/ViewToggle.tsx` — 2D ↔ 3D button group.
- `app/src/components/ErrorBoundary.tsx` — class-based boundary with reset; used to isolate Globe/Map crashes.

### Components: filters
- `app/src/components/filters/FilterPanel.tsx` — sidebar wrapper; composes the filter widgets + AdvancedSettings.
- `app/src/components/filters/TypeFilter.tsx` — checkbox grid for disaster types.
- `app/src/components/filters/SeverityFilter.tsx` — radio buttons for severity.
- `app/src/components/filters/TimeRangeFilter.tsx` — pills: LIVE / 24h / 7d / 30d / all.
- `app/src/components/filters/AdvancedSettings.tsx` — collapsible "Display" section with toggles for clustering + zones (drives `MapSettings`).

### Components: UI primitives (`app/src/components/ui/`)
- `Badge.tsx` — `TypeBadge`, `SeverityBadge`, `StatusBadge`, `SourceBadge`. Style-from-data badges keyed on enums.
- `Card.tsx` — light-theme panel wrapper. Props: `tint` (neutral|sky), `flush` (drops padding for divided lists).
- `EmptyState.tsx` — centered "nothing here" block for list panels.
- `ExternalLink.tsx` — `<a target="_blank" rel="noopener noreferrer">` wrapper. Canonical way to link externally.
- `SectionHeader.tsx` — the `text-[11px] uppercase tracking-wide` section heading; optional `rightSlot` for badges/counts, optional `id` for aria-labelledby.
- `Skeleton.tsx` — `Skeleton` + `SkeletonText`. Shimmer placeholders.
- `Spinner.tsx` — circular loading indicator (sm/md/lg).
- `Toggle.tsx` — dark-theme switch (label + optional description). Used by AdvancedSettings.

### Components: event detail
- `app/src/components/event-detail/EventHeader.tsx` — title + badges + back link (light theme).
- `app/src/components/event-detail/MetadataGrid.tsx` — 2-col `<dl>` of event fields (coords, country, region, dates, source, external id).
- `app/src/components/event-detail/EventMap.tsx` — MapLibre map zoomed to the event's lat/lon + geometry. Client-only (dynamic import).
- `app/src/components/event-detail/AISummary.tsx` — renders cached Gemini summary; triggers `/summarize` on mount if missing.
- `app/src/components/event-detail/WeatherPanel.tsx` — Open-Meteo current conditions for event coords. Client fetch.
- `app/src/components/event-detail/ReliefWebPanel.tsx` — ReliefWeb reports for event country. Client fetch.
- `app/src/components/event-detail/UpdateTimeline.tsx` — timeline of `event_updates` changes.

### Components: 3D globe (Three.js)
- `app/src/components/globe/Globe.tsx` — React wrapper; mounts canvas + lazy-imports GlobeScene.
- `app/src/components/globe/GlobeScene.tsx` — scene orchestrator (not a React component): renderer, camera, lights, OrbitControls, auto-rotate idle timer, animation loop, dispose. Composes EarthMesh + EventMarkers.
- `app/src/components/globe/EarthMesh.tsx` — `createEarthMesh()` factory: textured sphere + Fresnel atmosphere group. `.tsx` for folder consistency, no JSX.
- `app/src/components/globe/EventMarkers.tsx` — `createEventMarkers()` factory: InstancedMesh cones + per-instance colors + raycasting (click/hover) + per-frame pulse. `.tsx` for folder consistency, no JSX.
- `app/src/components/globe/shaders.ts` — atmosphere vertex/fragment GLSL strings.
- `app/src/components/globe/starField.ts` — procedural star points (Three.js Points object).

### Components: 2D map (MapLibre GL)
- `app/src/components/map2d/MapView2D.tsx` — orchestrator: map init, sky setup, popup wiring, click → router push, pulse rAF, data sync.
- `app/src/components/map2d/darkTheme.ts` — `applyDarkTheme()` — heuristic re-color of the OpenFreeMap style.
- `app/src/components/map2d/layers.ts` — `buildGeoJSON`, `setupEventLayers({clustering})` (returns handle with `remove()`; adds source + cluster/halo/pulse/main layers and binds cluster click), `buildPopupHTML`, `SEVERITY_RADII`.
- `app/src/components/map2d/mapStyle.ts` — OpenFreeMap style URL + initial view.

### Global styles
- `app/src/app/globals.css` — design tokens (fonts, eases), shimmer skeleton, `badge`/`label-mono`/`interactive`/`glass`/`event-page` classes, MapLibre + Leaflet dark overrides.

### Tailwind tokens
- `app/tailwind.config.ts` — semantic color palettes: `dark.*` (globe UI), `light.*` (event-detail surfaces), `sky.*` (AI tint), per-disaster type colors. **Prefer these over hex literals in JSX.**

## `worker/` — Python FastAPI + APScheduler ingestion service (Railway)

- `worker/main.py` — FastAPI bootstrap, `/health` endpoint, startup config validation + schema check.
- `worker/config.py` — `Config` class reading DATABASE_URL_DIRECT / API keys from env.
- `worker/db.py` — psycopg2 ThreadedConnectionPool (1–5 conns). `upsert_event` + `event_updates` diff logic. Direct SQL, no ORM.
- `worker/scheduler.py` — APScheduler BackgroundScheduler; registers 9 ingestion jobs across the 7 sources.
- `worker/models.py` — Pydantic `NormalizedEvent`; shape all ingestors normalize to before DB write.
- `worker/normalizer.py` — lookup tables (US state + country centroids) + mapping functions (gdacs/eonet/fema/noaa/reliefweb type → DisasterType, magnitude/confidence → Severity, HTML stripper).
- `worker/ingestors/__init__.py` — package marker.
- `worker/ingestors/base.py` — `BaseIngestor` with `fetch_and_normalize` + `ingest` orchestrator + error/status reporting.
- `worker/ingestors/usgs.py` — USGS hourly/daily/weekly GeoJSON feeds.
- `worker/ingestors/eonet.py` — NASA EONET (Earth Observatory Natural Event Tracker).
- `worker/ingestors/gdacs.py` — GDACS GeoRSS feed (parsed with feedparser).
- `worker/ingestors/fema.py` — OpenFEMA disaster declarations API.
- `worker/ingestors/noaa.py` — NOAA NWS active alerts API.
- `worker/ingestors/reliefweb.py` — ReliefWeb v1 reports API; uses country centroids for geocoding.
- `worker/ingestors/firms.py` — NASA FIRMS active-fire CSV; clusters via geohash.
