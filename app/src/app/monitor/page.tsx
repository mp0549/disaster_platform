import { supabase } from "@/lib/supabase-api";
import SourceStatusTable, { type SourceStatusRow } from "./SourceStatusTable";
import EventsTable, { type EventRow } from "./EventsTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Monitor" };

export default async function MonitorPage({
  searchParams,
}: {
  searchParams: { limit?: string; source?: string };
}) {
  const limit = Math.min(parseInt(searchParams.limit || "100", 10) || 100, 1000);
  const sourceFilter = searchParams.source?.toUpperCase();

  let eventsQuery = supabase
    .from("events")
    .select(
      "id, external_id, source, type, title, severity, status, country, lat, lon, started_at, updated_at",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (sourceFilter) eventsQuery = eventsQuery.eq("source", sourceFilter);

  const [eventsRes, statusRes, bySourceRes] = await Promise.all([
    eventsQuery,
    supabase
      .from("source_status")
      .select("source, last_fetched_at, event_count, last_error, is_healthy, updated_at")
      .order("source", { ascending: true }),
    supabase.from("events").select("source"),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const sources = (statusRes.data ?? []) as SourceStatusRow[];
  const totalCount = eventsRes.count ?? events.length;

  const bySource: Record<string, number> = {};
  for (const r of (bySourceRes.data ?? []) as { source: string }[]) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  }

  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: 24,
        background: "#0a0a0a",
        color: "#e5e7eb",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontSize: 18, margin: 0 }}>Monitor</h1>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            <a href="/" style={{ color: "#3b82f6" }}>
              ← dashboard
            </a>
            {"  ·  "}
            <a href="/monitor" style={{ color: "#3b82f6" }}>
              refresh
            </a>
            {"  ·  "}
            total events: <strong style={{ color: "#fff" }}>{totalCount}</strong>
          </div>
        </div>

        <SourceStatusTable
          sources={sources}
          bySource={bySource}
          error={statusRes.error?.message ?? null}
        />

        <EventsTable
          events={events}
          sourceFilter={sourceFilter}
          error={eventsRes.error?.message ?? null}
        />
      </div>
    </div>
  );
}
