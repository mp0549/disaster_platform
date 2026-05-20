import type { DisasterType, Severity, EventSource } from "./types";

// Disaster type color palette
export const TYPE_COLORS: Record<DisasterType, string> = {
  EARTHQUAKE: "#f97316",
  WILDFIRE: "#ef4444",
  FLOOD: "#3b82f6",
  STORM: "#8b5cf6",
  VOLCANO: "#f59e0b",
  DROUGHT: "#a16207",
  OTHER: "#6b7280",
};

// Three.js hex colors (number format)
export const TYPE_COLORS_HEX: Record<DisasterType, number> = {
  EARTHQUAKE: 0xf97316,
  WILDFIRE: 0xef4444,
  FLOOD: 0x3b82f6,
  STORM: 0x8b5cf6,
  VOLCANO: 0xf59e0b,
  DROUGHT: 0xa16207,
  OTHER: 0x6b7280,
};

export const TYPE_LABELS: Record<DisasterType, string> = {
  EARTHQUAKE: "Earthquake",
  WILDFIRE: "Wildfire",
  FLOOD: "Flood",
  STORM: "Storm",
  VOLCANO: "Volcano",
  DROUGHT: "Drought",
  OTHER: "Other",
};

export const TYPE_EMOJI: Record<DisasterType, string> = {
  EARTHQUAKE: "⚡",
  WILDFIRE: "🔥",
  FLOOD: "🌊",
  STORM: "🌪️",
  VOLCANO: "🌋",
  DROUGHT: "☀️",
  OTHER: "⚠️",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  EXTREME: "Extreme",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: "#22c55e",
  MODERATE: "#eab308",
  HIGH: "#f97316",
  EXTREME: "#ef4444",
};

export const SEVERITY_SCALE: Record<Severity, number> = {
  LOW: 0.7,
  MODERATE: 1.0,
  HIGH: 1.4,
  EXTREME: 1.8,
};

export const SOURCE_LABELS: Record<EventSource, string> = {
  USGS: "USGS",
  EONET: "NASA EONET",
  GDACS: "GDACS",
  FEMA: "OpenFEMA",
  RELIEFWEB: "ReliefWeb",
  FIRMS: "NASA FIRMS",
  NOAA: "NOAA/NWS",
};

export const ALL_DISASTER_TYPES: DisasterType[] = [
  "EARTHQUAKE",
  "WILDFIRE",
  "FLOOD",
  "STORM",
  "VOLCANO",
  "DROUGHT",
  "OTHER",
];

/** Default dashboard filters; restored by the panel's Reset link. */
export const DEFAULT_FILTERS = {
  types: [...ALL_DISASTER_TYPES],
  severity: null as null,
  timeRange: "30d" as const,
};

export const ALL_SEVERITIES: Severity[] = ["LOW", "MODERATE", "HIGH", "EXTREME"];

export const ALL_SOURCES: EventSource[] = [
  "USGS",
  "EONET",
  "GDACS",
  "FEMA",
  "RELIEFWEB",
  "FIRMS",
  "NOAA",
];

// WMO weather codes to human-readable strings
export const WMO_WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight showers",
  81: "Moderate showers",
  82: "Violent showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};
