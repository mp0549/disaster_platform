/**
 * Client-side fetch helpers for the disaster platform API.
 */

import type {
  EventListResponse,
  EventDetailResponse,
  EventUpdatesResponse,
  SummarizeResponse,
  SourcesResponse,
  StatsResponse,
  FilterState,
} from "./types";

// All API calls are relative — the browser hits whichever origin served the page,
// so this works on production, preview deployments, and any custom domain alike.

function buildEventsUrl(filters?: Partial<FilterState>): string {
  const params = new URLSearchParams();

  if (filters?.types && filters.types.length > 0) {
    params.set("type", filters.types.join(","));
  }

  if (filters?.severity) {
    params.set("severity", filters.severity);
  }

  if (filters?.timeRange && filters.timeRange !== "all") {
    const now = new Date();
    const msMap = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    const since = new Date(now.getTime() - msMap[filters.timeRange]);
    params.set("since", since.toISOString());
  }

  const query = params.toString();
  return `/api/events${query ? `?${query}` : ""}`;
}

export async function fetchEvents(
  filters?: Partial<FilterState>
): Promise<EventListResponse> {
  const url = buildEventsUrl(filters);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  return res.json();
}

export async function fetchEventDetail(id: string): Promise<EventDetailResponse> {
  const res = await fetch(`/api/events/${id}`, { cache: "no-store" });
  if (res.status === 404) throw new Error("Event not found");
  if (!res.ok) throw new Error(`Failed to fetch event: ${res.status}`);
  return res.json();
}

export async function fetchEventUpdates(id: string): Promise<EventUpdatesResponse> {
  const res = await fetch(`/api/events/${id}/updates`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch updates: ${res.status}`);
  return res.json();
}

export async function triggerSummarize(id: string): Promise<SummarizeResponse> {
  const res = await fetch(`/api/events/${id}/summarize`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Summarize failed: ${res.status}`);
  return res.json();
}

export async function fetchSources(): Promise<SourcesResponse> {
  const res = await fetch(`/api/sources`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch sources: ${res.status}`);
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`/api/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}
