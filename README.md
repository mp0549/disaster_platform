# Disaster Intel — Real-Time Global Disaster Intelligence Platform

A real-time geospatial intelligence platform that ingests, normalizes, and visualizes global disaster data from 7 live sources on a 3D globe. Built as a portfolio project demonstrating full-stack engineering with Python, Next.js, PostgreSQL, Three.js, and AI enrichment.

---

## Features

- **3D Globe** — Three.js WebGL globe with instanced event markers, atmospheric glow shader, and idle auto-rotation
- **7 Data Sources** — USGS Earthquakes, NASA EONET, GDACS GeoRSS, OpenFEMA, NASA FIRMS (wildfire), NOAA/NWS Alerts, ReliefWeb
- **AI Summaries** — On-demand Gemini 2.0 Flash situation analysis per event (cached in DB)
- **Event Detail Pages** — SSR with Leaflet map, Open-Meteo weather panel, ReliefWeb humanitarian reports, change history timeline
- **Live Filtering** — Filter by disaster type, severity, and time range with real-time globe updates
- **Dark/Light** — Dark globe, editorial light event pages

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS |
| 3D Visualization | Three.js (WebGL, InstancedMesh, custom shaders) |
| Maps | Leaflet / react-leaflet |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 5 |
| Data Ingestion | Python 3.12, FastAPI, APScheduler |
| HTTP Client | httpx (Python), fetch (Node) |
| AI | Google Gemini 2.0 Flash |
| Deployment | Vercel (app) · Railway (worker) · Neon (DB) |

---

## Local Setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker Desktop (for local Postgres + worker)
- A Neon or local PostgreSQL database

### 1. Clone & Environment

```bash
git clone <your-repo-url>
cd disaster_platform
cp .env.example app/.env
cp worker/.env.example worker/.env
```

Edit `app/.env` — set `DATABASE_URL` to your local or Neon connection string.

### 2. Start Local Postgres + Worker (Docker)

```bash
docker-compose up -d postgres
```

Or start the full stack (Postgres + Python worker):
```bash
docker-compose up
```

### 3. Database Migration & Seed

```bash
cd app
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start the Next.js App

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Start the Python Worker (standalone)

```bash
cd worker
pip install -r requirements.txt
cp .env.example .env  # set DATABASE_URL_DIRECT
python main.py
```

Worker health: [http://localhost:8000/health](http://localhost:8000/health)

---

## Environment Variables

### app/.env

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon **pooled** connection string (port 6432, PgBouncer) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key — enables AI summaries |
| `NEXT_PUBLIC_APP_URL` | Optional | Base URL for internal API calls (default: `http://localhost:3000`) |

### worker/.env

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL_DIRECT` | Yes | Neon **direct** connection string (port 5432, no pooling) |
| `NASA_API_KEY` | Optional | Improves EONET rate limits |
| `FIRMS_MAP_KEY` | Optional | Required for NASA FIRMS wildfire satellite data |
| `WORKER_PORT` | Optional | FastAPI port (default: 8000) |

---

## Deployment

### Vercel (Frontend + API)

1. Push to GitHub. Connect repo to Vercel.
2. Set root to `/app` (or use monorepo settings).
3. Add env vars in Vercel dashboard:
   - `DATABASE_URL` — Neon **pooled** connection string (`port 6432`)
   - `GEMINI_API_KEY` — optional
4. Deploy. Prisma generates on build via `prisma generate`.

**Critical:** The app **must** use the Neon pooled connection string (PgBouncer, port 6432). Vercel serverless functions open a new DB connection per invocation — direct connections will exhaust Neon's free-tier limit under real traffic.

### Railway (Python Worker)

1. Create a new Railway project.
2. Deploy from the `/worker` directory using the included `Dockerfile`.
3. Add env vars:
   - `DATABASE_URL_DIRECT` — Neon **direct** connection string (port 5432)
   - `FIRMS_MAP_KEY`, `NASA_API_KEY` — optional
4. Deploy. The worker starts the FastAPI app and APScheduler immediately.

### Neon (Database)

1. Create a free Neon project at [neon.tech](https://neon.tech).
2. From the Neon dashboard, grab both connection strings:
   - **Pooled** (PgBouncer) for Vercel: `postgresql://...@...-pooler.neon.tech:6432/...`
   - **Direct** for Railway worker: `postgresql://...@....neon.tech:5432/...`
3. Run migrations: `npx prisma migrate deploy` (CI/CD) or `npx prisma migrate dev` (local).
4. Run seed: `npm run db:seed`.

---

## Globe Textures

For the best visual quality, download the NASA Blue Marble texture:

- **Download:** [NASA Visible Earth — Blue Marble](https://visibleearth.nasa.gov/images/57752/blue-marble-land-surface-shallow-water-and-shaded-topography)
- Save as: `app/public/textures/earth_daymap_8k.jpg`

Without this file the globe falls back to a solid procedural blue sphere — all markers and interaction still work correctly.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, data flow, tradeoffs, and V2 extension points.

---

## Project Structure

```
disaster_platform/
├── app/                   # Next.js application
│   ├── prisma/            # Schema + migrations + seed
│   ├── src/app/           # App Router pages + API routes
│   ├── src/components/    # React components
│   └── src/lib/           # Utilities, types, constants
└── worker/                # Python ingestion worker
    ├── ingestors/         # One file per data source
    ├── main.py            # FastAPI + APScheduler bootstrap
    ├── db.py              # PostgreSQL upsert helpers
    └── normalizer.py      # Field mapping + lookup tables
```
