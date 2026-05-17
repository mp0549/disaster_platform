-- Disaster Platform Seed Data
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Uses NOW() so dates are always within the last 30 days

-- Clear existing data
TRUNCATE events CASCADE;
TRUNCATE source_status CASCADE;

-- ── Events ────────────────────────────────────────────────────────────────────
INSERT INTO events (external_id, source, type, title, description, severity, status, lat, lon, country, region, started_at, updated_at, raw_data) VALUES

-- USGS Earthquakes (3)
('usgs-2024-001', 'USGS', 'EARTHQUAKE', 'M 6.8 - 42km NE of Kathmandu, Nepal', 'Significant earthquake felt across the Kathmandu Valley. Aftershock sequence ongoing.', 'HIGH', 'ACTIVE', 27.98, 85.68, 'NP', 'Bagmati Province', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', '{"mag": 6.8, "depth_km": 10}'),
('usgs-2024-002', 'USGS', 'EARTHQUAKE', 'M 5.9 - Banda Sea, Indonesia', 'Deep-focus earthquake. No tsunami warning issued.', 'MODERATE', 'CLOSED', -5.12, 129.84, 'ID', 'Maluku', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', '{"mag": 5.9, "depth_km": 220}'),
('usgs-2024-003', 'USGS', 'EARTHQUAKE', 'M 7.1 - Off the coast of Oaxaca, Mexico', 'Strong earthquake. PTWC issued a tsunami information statement. Multiple aftershocks recorded.', 'EXTREME', 'ACTIVE', 15.73, -97.20, 'MX', 'Oaxaca', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours', '{"mag": 7.1, "depth_km": 20}'),

-- EONET Events (3)
('eonet-2024-001', 'EONET', 'WILDFIRE', 'Dixie Complex Fire — Northern California', 'Large wildfire burning in Plumas and Butte counties. Evacuations ordered for multiple communities.', 'EXTREME', 'ACTIVE', 40.12, -121.48, 'US', 'California', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 hours', '{"area_acres": 45000, "containment_pct": 12}'),
('eonet-2024-002', 'EONET', 'VOLCANO', 'Kilauea Eruption — Hawaii Volcanoes National Park', 'Lava lake active in Halemaʻumaʻu Crater. No lava flow threat to communities at this time.', 'MODERATE', 'ACTIVE', 19.41, -155.29, 'US', 'Hawaii', NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days', '{"vei": 1, "so2_tonnes_day": 2000}'),
('eonet-2024-003', 'EONET', 'WILDFIRE', 'Bootleg Fire — Klamath Falls, Oregon', 'Wildfire generating its own weather system (pyrocumulonimbus). Critical fire weather conditions.', 'HIGH', 'ACTIVE', 42.35, -121.03, 'US', 'Oregon', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day', '{"area_acres": 28000, "containment_pct": 5}'),

-- GDACS Events (3)
('gdacs-2024-001', 'GDACS', 'FLOOD', 'Brahmaputra River Flooding — Bangladesh', 'Monsoon flooding affecting Sylhet and Sunamganj districts. Over 400,000 people displaced.', 'HIGH', 'ACTIVE', 24.89, 91.87, 'BD', 'Sylhet Division', NOW() - INTERVAL '4 days', NOW() - INTERVAL '12 hours', '{"affected_people": 420000, "displaced": 120000}'),
('gdacs-2024-002', 'GDACS', 'STORM', 'Typhoon Goni — Philippine Sea', 'Super typhoon making landfall on Catanduanes Island. Maximum sustained winds 315 km/h.', 'EXTREME', 'ACTIVE', 13.58, 124.12, 'PH', 'Bicol Region', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours', '{"wind_kmh": 315, "category": 5}'),
('gdacs-2024-003', 'GDACS', 'EARTHQUAKE', 'M 6.4 - Central Turkey', 'Destructive earthquake in eastern Anatolia. Building collapses reported in multiple villages.', 'HIGH', 'ACTIVE', 38.42, 39.51, 'TR', 'Malatya Province', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', '{"mag": 6.4, "depth_km": 7}'),

-- FEMA Events (3)
('fema-2024-001', 'FEMA', 'WILDFIRE', 'Montana Grassfire Complex', 'Fast-moving grassfire driven by strong winds across eastern Montana. Multiple ranches threatened.', 'HIGH', 'ACTIVE', 46.88, -107.32, 'US', 'Montana', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day', '{"area_acres": 12000, "containment_pct": 30}'),
('fema-2024-002', 'FEMA', 'FLOOD', 'Atchafalaya Basin Flooding — Louisiana', 'Record rainfall causing major flooding along the Atchafalaya River. FEMA disaster declaration approved.', 'HIGH', 'ACTIVE', 30.18, -91.55, 'US', 'Louisiana', NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days', '{"discharge_cfs": 1800000, "fema_dr": "DR-4721"}'),
('fema-2024-003', 'FEMA', 'STORM', 'Hurricane Milton — Florida Gulf Coast', 'Category 4 hurricane made landfall near Siesta Key. Storm surge up to 18 feet reported.', 'EXTREME', 'CLOSED', 27.32, -82.55, 'US', 'Florida', NOW() - INTERVAL '18 days', NOW() - INTERVAL '12 days', '{"wind_kmh": 250, "category": 4, "storm_surge_ft": 18}'),

-- RELIEFWEB Events (3)
('rw-2024-001', 'RELIEFWEB', 'DROUGHT', 'Horn of Africa Drought Emergency', 'Severe multi-season drought affecting southern Somalia. Famine conditions in Bay and Bakool regions.', 'EXTREME', 'ACTIVE', 2.05, 45.34, 'SO', 'Bay Region', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days', '{"affected_people": 7800000, "ipc_phase": 5}'),
('rw-2024-002', 'RELIEFWEB', 'FLOOD', 'Pakistan Monsoon Floods 2024', 'Unprecedented monsoon flooding affecting Sindh and Balochistan provinces. One-third of country submerged.', 'EXTREME', 'ACTIVE', 26.52, 68.77, 'PK', 'Sindh', NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days', '{"affected_people": 33000000, "deaths": 1500}'),
('rw-2024-003', 'RELIEFWEB', 'STORM', 'Cyclone Freddy — Mozambique and Malawi', 'Record-breaking cyclone making second landfall. Catastrophic flooding in Quelimane and Malawi highlands.', 'EXTREME', 'CLOSED', -17.88, 36.89, 'MZ', 'Zambezia Province', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days', '{"wind_kmh": 185, "deaths": 800, "record": "longest_cyclone"}'),

-- FIRMS Events (2)
('firms-2024-001', 'FIRMS', 'WILDFIRE', 'Queensland Bushfire — Darling Downs', 'Rapid-spread bushfire threatening agricultural land and rural properties in southern Queensland.', 'HIGH', 'ACTIVE', -27.55, 151.92, 'AU', 'Queensland', NOW() - INTERVAL '11 days', NOW() - INTERVAL '2 days', '{"frp_mw": 890, "detection_count": 342}'),
('firms-2024-002', 'FIRMS', 'WILDFIRE', 'Amazon Deforestation Fire — Pará State', 'Large fire complex detected in Pará state linked to illegal deforestation activity.', 'HIGH', 'ACTIVE', -7.22, -52.14, 'BR', 'Pará', NOW() - INTERVAL '13 days', NOW() - INTERVAL '1 day', '{"frp_mw": 1240, "area_km2": 580}'),

-- NOAA Events (2)
('noaa-2024-001', 'NOAA', 'STORM', 'Atlantic Hurricane Lee — Category 5', 'Rapidly intensifying hurricane in the central Atlantic. Forecast track uncertain; watches issued for Caribbean islands.', 'EXTREME', 'ACTIVE', 18.42, -50.11, 'US', 'Atlantic Ocean', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours', '{"wind_mph": 165, "pressure_mb": 926, "category": 5}'),
('noaa-2024-002', 'NOAA', 'FLOOD', 'Texas Flash Flood Emergency', 'Atmospheric river producing extreme rainfall over the Hill Country. Flash flood emergency issued for 12 counties.', 'HIGH', 'ACTIVE', 30.27, -98.87, 'US', 'Texas', NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 hours', '{"rainfall_24h_in": 18.4, "gauges_flooded": 34}');

-- ── Source Status ─────────────────────────────────────────────────────────────
INSERT INTO source_status (source, last_fetched_at, event_count, last_error, is_healthy) VALUES
('USGS',       NOW() - INTERVAL '15 minutes', 3,  NULL, true),
('EONET',      NOW() - INTERVAL '22 minutes', 3,  NULL, true),
('GDACS',      NOW() - INTERVAL '30 minutes', 3,  NULL, true),
('FEMA',       NOW() - INTERVAL '18 minutes', 3,  NULL, true),
('RELIEFWEB',  NOW() - INTERVAL '45 minutes', 3,  NULL, true),
('FIRMS',      NOW() - INTERVAL '12 minutes', 2,  NULL, true),
('NOAA',       NOW() - INTERVAL '20 minutes', 2,  NULL, true);

-- Verify
SELECT COUNT(*) AS event_count FROM events;
SELECT COUNT(*) AS source_count FROM source_status;
