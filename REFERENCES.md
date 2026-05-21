# REFERENCES.md — Competitive Landscape & Prior Art

This document summarizes existing tools in the disaster intelligence space.
It serves as both a competitive baseline and a source of taxonomy/design decisions
for this platform. The goal: match what these tools do well, automate what they do
manually, and add what none of them have.

---

## NASA Disasters Mapping Portal
**URL**: https://disasters-nasa.hub.arcgis.com/

### What it does
A centralized ArcGIS Hub hosting NASA's geospatial data products for disaster
response. Transforms Earth observation data into GIS formats (REST, WMS, KML)
for emergency management workflows. Manually curated — not a live feed.

### Disaster Taxonomy (NASA Portal's type list — informed our initial design)
Cyclones, Earthquakes, Extreme Temperature, Floods, Landslides, Tornadoes,
Volcanoes, Wildfires, Industrial/Technological Disasters
(We collapsed this into 7 types — see Key Taxonomy Decisions at the bottom)

### UI Features
- Extensive data layer library (damage proxy maps, flood extent, precipitation)
- Filter by disaster type, year, data format
- "StoryMaps" / event journals for major incidents — curated narratives + layers

### Public APIs
NASA ArcGIS REST Server: https://maps.disasters.nasa.gov/ags04/rest/services

### Weaknesses (our opportunities)
- No single global live view — fragmented across sub-dashboards
- Manually curated, not automated
- No AI enrichment or situation summaries
- No unified event schema across sources
- Static, not real-time

---

## NASA FIRMS (Fire Information for Resource Management System)
**URL**: https://firms.modaps.eosdis.nasa.gov/map/

### What it does
Near real-time global active fire and thermal anomaly monitoring. Processes
MODIS and VIIRS satellite data within 3 hours of overpass. Best-in-class
for wildfire specifically.

### Disaster Taxonomy
Active Fires, Thermal Anomalies — classified by sensor:
MODIS (Terra/Aqua), VIIRS (S-NPP/NOAA-20/NOAA-21), Landsat-8/9

### UI Features
- Fire count layer toggles (24h, 48h, 7-day)
- Time-range sliders
- Corrected reflectance satellite background (true/false color)
- Burn area measurement tool
- Time series grapher for fire pixel counts over a region
- Basic and Advanced modes (advanced: confidence levels, fire radiative power)

### Public APIs
FIRMS API: https://firms.modaps.eosdis.nasa.gov/api/
Returns CSV, JSON, KML. Requires free MAP_KEY. Already integrated in our pipeline.

### Weaknesses (our opportunities)
- Wildfire-only — no other disaster types
- No integration with wind, moisture, or other contextual signals
- No AI layer
- No situation report / event page concept

---

## GDACS (Global Disaster Alert and Coordination System)
**URL**: https://www.gdacs.org/

### What it does
UN + European Commission joint system providing real-time disaster alerts and
impact estimations. Designed to trigger international humanitarian response in
the first phase of a disaster. Alert-focused, not analysis-focused.

### Disaster Taxonomy
Earthquakes, Tropical Cyclones, Floods, Volcanoes, Tsunamis
(narrower than NASA portal — no wildfires, landslides, or drought)

### Alert Severity System (adopt this for our severity model)
- 🔴 Red — high humanitarian impact
- 🟠 Orange — medium impact
- 🟢 Green — minor impact
Severity is impact-model-based, not just physical magnitude. This is the right
approach — adopt it for our severity enum framing.

### UI Features
- Color-coded alert system (Red/Orange/Green)
- Event detail pages: population density in impact zone, country vulnerability
  index, satellite map snapshots
- Sidebar filters: disaster type + time period (24h / 4 days / week)

### Public APIs
Full feed reference: https://www.gdacs.org/feed_reference.aspx
Formats: RSS, GeoRSS, JSON, REST API. Updates every 6 minutes. Already in pipeline.

### Weaknesses (our opportunities)
- Dated UI, no advanced GIS layering
- Alert hub only — no deep analysis or enrichment
- No AI summaries
- Only 5 disaster types
- No unified cross-source view

---

## NASA EONET (Earth Observatory Natural Event Tracker)
**URL**: https://eonet.gsfc.nasa.gov/

### What it does
A metadata API and portal providing a curated, machine-readable stream of natural
events. Functions as a linkage service connecting event locations to relevant
satellite imagery in NASA Worldview. Developer-friendly but metadata-only.

### Disaster Taxonomy
Dust and Haze, Icebergs, Sea and Lake Ice, Severe Storms, Snow, Volcanoes,
Water Color, Wildfires
(notably: no earthquakes — EONET does not track seismic events)

### UI Features
- Chronological list of open/closed events
- Worldview integration: clicking an event auto-configures a map with
  appropriate satellite layers (e.g. thermal bands for volcanoes)
- Open/Closed status filter

### Public APIs
EONET API v3: https://eonet.gsfc.nasa.gov/docs/v3
Returns GeoJSON/JSON for events, categories, sources. Already in pipeline.

### Weaknesses (our opportunities)
- Metadata only — no hosted data layers
- No enrichment (weather, population, AI)
- No event detail pages beyond a Worldview redirect
- No cross-source fusion

---

## GitHub Reference Projects

### Natural-Disaster-Tracker
React + Google Maps + EONET only. Minimal filtering, no historical data,
no enrichment. Proof that the basic concept works; we go significantly further.

### HyP3 NASA Disasters
Backend SAR processing pipeline for flood/displacement maps from Sentinel-1.
Not a dashboard — relevant as a future satellite imagery data source.

### NASA-Disaster-RAG
RAG app for querying NASA disaster history via natural language + Streamlit map.
Interesting AI angle but no live data, no globe, no enrichment pipeline.
Validates the AI query concept as a potential V2 feature.

### NASA-IMPACT
Foundation models + VEDA dashboard for Earth observation at scale. Highly
fragmented across tools. VEDA UI is a relevant design reference for data-dense
geospatial dashboards.

---

## Our Differentiation Summary

| Capability | NASA Portal | GDACS | FIRMS | EONET | This Platform |
|---|---|---|---|---|---|
| Live multi-source ingestion | ❌ | ✅ | ✅ | ✅ | ✅ |
| Unified event schema | ❌ | ❌ | ❌ | ❌ | ✅ |
| 3D globe interface | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI situation summaries | ❌ | ❌ | ❌ | ❌ | ✅ |
| Auto-generated event pages | ❌ | ✅ | ❌ | ❌ | ✅ |
| Weather context per event | ❌ | ❌ | ❌ | ❌ | ✅ |
| Humanitarian reports (ReliefWeb) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update timeline per event | ❌ | ❌ | ❌ | ❌ | ✅ |
| Impact-based severity model | ❌ | ✅ | ❌ | ❌ | ✅ |
| Browse by disaster type (live) | ✅ | ✅ | ❌ | ✅ | ✅ |

## Key Taxonomy Decisions (informed by reference tools)

### Disaster types (what we ship)

`EARTHQUAKE | WILDFIRE | FLOOD | STORM | VOLCANO | DROUGHT | OTHER`

Seven types. Source mapping decisions:

| Upstream concept | Maps to | Reasoning |
|---|---|---|
| GDACS TC (tropical cyclone) | STORM | No distinct cyclone data stream; all rotational systems are storms |
| GDACS TS (tsunami) | OTHER | Rare; GDACS feed rarely produces these; a distinct TSUNAMI type would be mostly empty |
| FEMA hurricane / typhoon | STORM | Same as above |
| NOAA cyclone alerts | STORM | Same as above |
| IFRC tsunami | OTHER | A tsunami is a secondary effect, not an earthquake; was incorrectly mapped to EARTHQUAKE — fixed |
| EONET landslides | OTHER | No dedicated ingestor; volume too low for a dedicated type |
| IFRC cold/heat wave | OTHER | NOAA does not currently emit extreme-temperature alerts as distinct events |
| EONET snow / ice | OTHER | Not a disaster type in the GDACS or ReliefWeb sense |

**Why not more types?** The reference tools (NASA Portal, GDACS) do track Cyclone, Tsunami,
Landslide, and Extreme Temperature separately. We collapse them because:
1. Our current ingestors don't produce a reliable volume of distinct events for them.
2. Empty filter categories degrade the dashboard UX.
3. The 7-type set covers >95% of the events in the DB.

When a dedicated ingestor is added for any of these (e.g. a Pacific tsunami warning feed),
add the enum value then.

### Severity model

Impact-based (Red/Orange/Green → Extreme/High/Moderate/Low) following GDACS convention,
not raw physical magnitude. GDACS `alertlevel` maps directly: GREEN→LOW, ORANGE→MODERATE,
RED→HIGH. USGS magnitude maps: <3.0→LOW, <5.0→MODERATE, <7.0→HIGH, ≥7.0→EXTREME.

### EONET note

Does not track earthquakes — USGS is the authoritative source for seismic data.
