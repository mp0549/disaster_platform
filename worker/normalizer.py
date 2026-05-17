"""
Field mapping utilities and lookup tables for normalizing event data.
"""

# US State centroids (lat, lon)
US_STATE_CENTROIDS: dict[str, tuple[float, float]] = {
    "Alabama": (32.806671, -86.791130),
    "Alaska": (61.370716, -152.404419),
    "Arizona": (33.729759, -111.431221),
    "Arkansas": (34.969704, -92.373123),
    "California": (36.116203, -119.681564),
    "Colorado": (39.059811, -105.311104),
    "Connecticut": (41.597782, -72.755371),
    "Delaware": (39.318523, -75.507141),
    "Florida": (27.766279, -81.686783),
    "Georgia": (33.040619, -83.643074),
    "Hawaii": (21.094318, -157.498337),
    "Idaho": (44.240459, -114.478828),
    "Illinois": (40.349457, -88.986137),
    "Indiana": (39.849426, -86.258278),
    "Iowa": (42.011539, -93.210526),
    "Kansas": (38.526600, -96.726486),
    "Kentucky": (37.668140, -84.670067),
    "Louisiana": (31.169960, -91.867805),
    "Maine": (44.693947, -69.381927),
    "Maryland": (39.063946, -76.802101),
    "Massachusetts": (42.230171, -71.530106),
    "Michigan": (43.326618, -84.536095),
    "Minnesota": (45.694454, -93.900192),
    "Mississippi": (32.741646, -89.678696),
    "Missouri": (38.456085, -92.288368),
    "Montana": (46.921925, -110.454353),
    "Nebraska": (41.125370, -98.268082),
    "Nevada": (38.313515, -117.055374),
    "New Hampshire": (43.452492, -71.563896),
    "New Jersey": (40.298904, -74.521011),
    "New Mexico": (34.840515, -106.248482),
    "New York": (42.165726, -74.948051),
    "North Carolina": (35.630066, -79.806419),
    "North Dakota": (47.528912, -99.784012),
    "Ohio": (40.388783, -82.764915),
    "Oklahoma": (35.565342, -96.928917),
    "Oregon": (44.572021, -122.070938),
    "Pennsylvania": (40.590752, -77.209755),
    "Rhode Island": (41.680893, -71.511780),
    "South Carolina": (33.856892, -80.945007),
    "South Dakota": (44.299782, -99.438828),
    "Tennessee": (35.747845, -86.692345),
    "Texas": (31.054487, -97.563461),
    "Utah": (40.150032, -111.862434),
    "Vermont": (44.045876, -72.710686),
    "Virginia": (37.769337, -78.169968),
    "Washington": (47.400902, -121.490494),
    "West Virginia": (38.491226, -80.954453),
    "Wisconsin": (44.268543, -89.616508),
    "Wyoming": (42.755966, -107.302490),
    # Territories
    "Puerto Rico": (18.220833, -66.590149),
    "Virgin Islands": (18.335765, -64.896335),
    "Guam": (13.444304, 144.793731),
    "American Samoa": (-14.270972, -170.132217),
    "Northern Mariana Islands": (15.0979, 145.6739),
    "District of Columbia": (38.897438, -77.026817),
}

# Country centroids for ReliefWeb geocoding
COUNTRY_CENTROIDS: dict[str, tuple[float, float]] = {
    "Afghanistan": (33.93911, 67.709953),
    "Albania": (41.153332, 20.168331),
    "Algeria": (28.033886, 1.659626),
    "Angola": (-11.202692, 17.873887),
    "Argentina": (-38.416097, -63.616672),
    "Armenia": (40.069099, 45.038189),
    "Australia": (-25.274398, 133.775136),
    "Austria": (47.516231, 14.550072),
    "Azerbaijan": (40.143105, 47.576927),
    "Bangladesh": (23.684994, 90.356331),
    "Bolivia": (-16.290154, -63.588653),
    "Bosnia and Herzegovina": (43.915886, 17.679076),
    "Brazil": (-14.235004, -51.92528),
    "Burkina Faso": (12.364566, -1.561593),
    "Burma": (21.913965, 95.956223),
    "Cambodia": (12.565679, 104.990963),
    "Cameroon": (7.369722, 12.354722),
    "Canada": (56.130366, -106.346771),
    "Central African Republic": (6.611111, 20.939444),
    "Chad": (15.454166, 18.732207),
    "Chile": (-35.675147, -71.542969),
    "China": (35.86166, 104.195397),
    "Colombia": (4.570868, -74.297333),
    "Congo": (-0.228021, 15.827659),
    "Costa Rica": (9.748917, -83.753428),
    "Côte d'Ivoire": (7.539989, -5.54708),
    "Cuba": (21.521757, -77.781167),
    "Democratic Republic of the Congo": (-4.038333, 21.758664),
    "Dominican Republic": (18.735693, -70.162651),
    "Ecuador": (-1.831239, -78.183406),
    "Egypt": (26.820553, 30.802498),
    "El Salvador": (13.794185, -88.89653),
    "Ethiopia": (9.145, 40.489673),
    "France": (46.227638, 2.213749),
    "Georgia": (42.315407, 43.356892),
    "Germany": (51.165691, 10.451526),
    "Ghana": (7.946527, -1.023194),
    "Greece": (39.074208, 21.824312),
    "Guatemala": (15.783471, -90.230759),
    "Guinea": (9.945587, -9.696645),
    "Haiti": (18.971187, -72.285215),
    "Honduras": (15.199999, -86.241905),
    "India": (20.593684, 78.96288),
    "Indonesia": (-0.789275, 113.921327),
    "Iran": (32.427908, 53.688046),
    "Iraq": (33.223191, 43.679291),
    "Italy": (41.87194, 12.56738),
    "Japan": (36.204824, 138.252924),
    "Jordan": (30.585164, 36.238414),
    "Kazakhstan": (48.019573, 66.923684),
    "Kenya": (-0.023559, 37.906193),
    "Laos": (19.85627, 102.495496),
    "Lebanon": (33.854721, 35.862285),
    "Libya": (26.3351, 17.228331),
    "Madagascar": (-18.766947, 46.869107),
    "Malawi": (-13.254308, 34.301525),
    "Malaysia": (4.210484, 101.975766),
    "Mali": (17.570692, -3.996166),
    "Mauritania": (21.00789, -10.940835),
    "Mexico": (23.634501, -102.552784),
    "Morocco": (31.791702, -7.09262),
    "Mozambique": (-18.665695, 35.529562),
    "Myanmar": (21.913965, 95.956223),
    "Nepal": (28.394857, 84.124008),
    "Nicaragua": (12.865416, -85.207229),
    "Niger": (17.607789, 8.081666),
    "Nigeria": (9.081999, 8.675277),
    "North Korea": (40.339852, 127.510093),
    "Pakistan": (30.375321, 69.345116),
    "Panama": (8.537981, -80.782127),
    "Papua New Guinea": (-6.314993, 143.95555),
    "Paraguay": (-23.442503, -58.443832),
    "Peru": (-9.189967, -75.015152),
    "Philippines": (12.879721, 121.774017),
    "Portugal": (39.399872, -8.224454),
    "Romania": (45.943161, 24.96676),
    "Russia": (61.52401, 105.318756),
    "Saudi Arabia": (23.885942, 45.079162),
    "Senegal": (14.497401, -14.452362),
    "Sierra Leone": (8.460555, -11.779889),
    "Somalia": (5.152149, 46.199616),
    "South Africa": (-30.559482, 22.937506),
    "South Sudan": (6.876991, 31.306978),
    "Spain": (40.463667, -3.74922),
    "Sri Lanka": (7.873054, 80.771797),
    "Sudan": (12.862807, 30.217636),
    "Syria": (34.802075, 38.996815),
    "Taiwan": (23.69781, 120.960515),
    "Tajikistan": (38.861034, 71.276093),
    "Tanzania": (-6.369028, 34.888822),
    "Thailand": (15.870032, 100.992541),
    "Timor-Leste": (-8.874217, 125.727539),
    "Turkey": (38.963745, 35.243322),
    "Turkmenistan": (38.969719, 59.556278),
    "Uganda": (1.373333, 32.290275),
    "Ukraine": (48.379433, 31.16558),
    "United States": (37.09024, -95.712891),
    "Uruguay": (-32.522779, -55.765835),
    "Uzbekistan": (41.377491, 64.585262),
    "Venezuela": (6.42375, -66.58973),
    "Vietnam": (14.058324, 108.277199),
    "Yemen": (15.552727, 48.516388),
    "Zimbabwe": (-19.015438, 29.154857),
}


def get_us_state_centroid(state_name: str) -> tuple[float, float] | None:
    """Return the centroid for a US state or territory."""
    return US_STATE_CENTROIDS.get(state_name)


def get_country_centroid(country_name: str) -> tuple[float, float] | None:
    """Return the centroid for a country."""
    return COUNTRY_CENTROIDS.get(country_name)


def apply_fema_jitter(external_id: str, lat: float, lon: float) -> tuple[float, float]:
    """
    Apply deterministic spatial jitter to FEMA coordinates.
    Prevents Z-fighting in Three.js InstancedMesh for same-state events.
    Spreads events within ±0.25° (~28km) of state centroid.
    """
    lat_offset = (hash(external_id) % 100 - 50) / 100.0 * 0.5
    lon_offset = (hash(external_id + "lon") % 100 - 50) / 100.0 * 0.5
    return lat + lat_offset, lon + lon_offset


def map_gdacs_event_type(event_type: str) -> str:
    """Map GDACS eventtype codes to DisasterType."""
    mapping = {
        "EQ": "EARTHQUAKE",
        "TC": "STORM",
        "FL": "FLOOD",
        "VO": "VOLCANO",
        "WF": "WILDFIRE",
        "DR": "DROUGHT",
    }
    return mapping.get(event_type.upper(), "OTHER")


def map_eonet_category(category_id: str) -> str:
    """Map EONET category IDs to DisasterType."""
    mapping = {
        "wildfires": "WILDFIRE",
        "volcanoes": "VOLCANO",
        "severeStorms": "STORM",
        "floods": "FLOOD",
        "earthquakes": "EARTHQUAKE",
        "drought": "DROUGHT",
        "landslides": "OTHER",
        "snow": "OTHER",
        "icebergs": "OTHER",
        "seaLakeIce": "OTHER",
        "manmade": "OTHER",
    }
    # EONET category IDs can be strings like "wildfires"
    for key, value in mapping.items():
        if key.lower() in category_id.lower():
            return value
    return "OTHER"


def map_fema_incident_type(incident_type: str) -> str:
    """Map FEMA incidentType strings to DisasterType."""
    t = incident_type.lower()
    if "earthquake" in t:
        return "EARTHQUAKE"
    if "flood" in t:
        return "FLOOD"
    if "fire" in t:
        return "WILDFIRE"
    if any(w in t for w in ["hurricane", "tornado", "storm", "typhoon", "wind", "thunder"]):
        return "STORM"
    if "volcanic" in t or "eruption" in t:
        return "VOLCANO"
    if "drought" in t:
        return "DROUGHT"
    return "OTHER"


def map_noaa_event_type(event: str) -> str:
    """Map NWS event strings to DisasterType."""
    e = event.lower()
    if any(w in e for w in ["tornado", "hurricane", "storm", "wind", "thunder", "typhoon", "cyclone"]):
        return "STORM"
    if any(w in e for w in ["flood", "flash flood"]):
        return "FLOOD"
    if any(w in e for w in ["fire", "red flag"]):
        return "WILDFIRE"
    if "volcan" in e:
        return "VOLCANO"
    if "earthquake" in e:
        return "EARTHQUAKE"
    if "drought" in e:
        return "DROUGHT"
    return "OTHER"


def map_noaa_severity(nws_severity: str) -> str | None:
    """Map NWS severity strings to Severity enum."""
    mapping = {
        "Minor": "LOW",
        "Moderate": "MODERATE",
        "Severe": "HIGH",
        "Extreme": "EXTREME",
    }
    return mapping.get(nws_severity)


def map_reliefweb_disaster_type(disaster_type_name: str) -> str:
    """Map ReliefWeb disaster type names to DisasterType."""
    t = disaster_type_name.lower()
    if "earthquake" in t:
        return "EARTHQUAKE"
    if "flood" in t:
        return "FLOOD"
    if "fire" in t or "wildfire" in t:
        return "WILDFIRE"
    if "storm" in t or "cyclone" in t or "hurricane" in t or "typhoon" in t:
        return "STORM"
    if "volcan" in t or "eruption" in t:
        return "VOLCANO"
    if "drought" in t:
        return "DROUGHT"
    return "OTHER"


def usgs_magnitude_to_severity(magnitude: float) -> str:
    """Map USGS earthquake magnitude to Severity."""
    if magnitude < 3.0:
        return "LOW"
    elif magnitude < 5.0:
        return "MODERATE"
    elif magnitude < 7.0:
        return "HIGH"
    else:
        return "EXTREME"


def firms_confidence_to_severity(confidence: str | float) -> str:
    """Map FIRMS fire confidence to Severity."""
    try:
        val = float(confidence)
    except (ValueError, TypeError):
        return "MODERATE"
    if val < 30:
        return "LOW"
    elif val < 70:
        return "MODERATE"
    elif val <= 90:
        return "HIGH"
    else:
        return "EXTREME"


def strip_html(text: str) -> str:
    """Simple HTML tag stripper."""
    import re
    return re.sub(r"<[^>]+>", "", text).strip()
