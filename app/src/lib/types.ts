// Enums matching Prisma schema

export type EventSource = "USGS" | "EONET" | "GDACS" | "FEMA" | "RELIEFWEB" | "FIRMS" | "NOAA";

export type DisasterType =
  | "EARTHQUAKE"
  | "WILDFIRE"
  | "FLOOD"
  | "STORM"
  | "VOLCANO"
  | "DROUGHT"
  | "OTHER";

export type Severity = "LOW" | "MODERATE" | "HIGH" | "EXTREME";

export type EventStatus = "ACTIVE" | "CLOSED" | "UNKNOWN";

// API response types

export interface EventSummary {
  id: string;
  externalId: string;
  source: EventSource;
  type: DisasterType;
  title: string;
  severity: Severity | null;
  status: EventStatus;
  lat: number;
  lon: number;
  country: string | null;
  startedAt: string;
  updatedAt: string;
}

export interface EventDetail {
  id: string;
  externalId: string;
  source: EventSource;
  type: DisasterType;
  title: string;
  description: string | null;
  severity: Severity | null;
  status: EventStatus;
  lat: number;
  lon: number;
  geometry: GeoJSON.GeoJSON | null;
  country: string | null;
  region: string | null;
  startedAt: string;
  updatedAt: string;
  createdAt: string;
  rawData: Record<string, unknown>;
  aiSummary: string | null;
  aiSummaryGeneratedAt: string | null;
}

export interface EventUpdate {
  id: string;
  changedFields: string[];
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface EventListResponse {
  events: EventSummary[];
  count: number;
}

export interface EventDetailResponse {
  event: EventDetail;
}

export interface EventUpdatesResponse {
  updates: EventUpdate[];
}

export interface SummarizeResponse {
  aiSummary: string;
  aiSummaryGeneratedAt: string;
  cached: boolean;
}

export interface SourceStatus {
  source: EventSource;
  lastFetchedAt: string | null;
  eventCount: number;
  lastError: string | null;
  isHealthy: boolean;
}

export interface SourcesResponse {
  sources: SourceStatus[];
}

export interface StatsResponse {
  totalEvents: number;
  activeEvents: number;
  byType: Record<DisasterType, number>;
  bySeverity: Record<Severity, number>;
  bySource: Record<EventSource, number>;
  lastUpdated: string;
}

// Filter state

export interface FilterState {
  types: DisasterType[];
  severity: Severity | null;
  timeRange: "24h" | "7d" | "30d" | "all";
}

// Weather (Open-Meteo)

export interface WeatherData {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
}
