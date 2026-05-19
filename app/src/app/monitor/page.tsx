import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export const metadata = { title: "Monitor" };

type EventRow = {
  id: string;
  external_id: string;
  source: string;
  type: string;
  title: string;
  severity: string | null;
  status: string;
  country: string | null;
  lat: number;
  lon: number;
  started_at: string;
  updated_at: string;
};

type SourceStatusRow = {
  source: string;
  last_fetched_at: string | null;
  event_count: number;
  last_error: string | null;
  is_healthy: boolean;
  updated_at: string | null;
};

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

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

        {/* Source status */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: 1,
              margin: "0 0 8px 0",
            }}
          >
            Source status
          </h2>
          {statusRes.error && (
            <p style={{ color: "#ef4444", fontSize: 12 }}>Error: {statusRes.error.message}</p>
          )}
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#9ca3af", borderBottom: "1px solid #1f1f2e" }}>
                <th style={{ padding: "8px 12px" }}>Source</th>
                <th style={{ padding: "8px 12px" }}>Healthy</th>
                <th style={{ padding: "8px 12px" }}>Last fetched</th>
                <th style={{ padding: "8px 12px" }}>Last batch</th>
                <th style={{ padding: "8px 12px" }}>Total events</th>
                <th style={{ padding: "8px 12px" }}>Last error</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, color: "#6b7280" }}>
                    No source_status rows yet — the worker hasn&apos;t recorded a fetch cycle.
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.source} style={{ borderBottom: "1px solid #111" }}>
                    <td style={{ padding: "6px 12px", color: "#fff" }}>
                      <a href={`/monitor?source=${s.source}`} style={{ color: "#fff" }}>
                        {s.source}
                      </a>
                    </td>
                    <td style={{ padding: "6px 12px", color: s.is_healthy ? "#10b981" : "#ef4444" }}>
                      {s.is_healthy ? "ok" : "fail"}
                    </td>
                    <td style={{ padding: "6px 12px" }}>{fmtTime(s.last_fetched_at)}</td>
                    <td style={{ padding: "6px 12px" }}>{s.event_count}</td>
                    <td style={{ padding: "6px 12px" }}>{bySource[s.source] ?? 0}</td>
                    <td style={{ padding: "6px 12px", color: s.last_error ? "#ef4444" : "#4b5563" }}>
                      {s.last_error ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Events */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontSize: 13,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 1,
                margin: 0,
              }}
            >
              Events {sourceFilter ? `· ${sourceFilter}` : ""} · showing {events.length}
            </h2>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {sourceFilter && (
                <a href="/monitor" style={{ color: "#3b82f6" }}>
                  clear filter
                </a>
              )}
            </div>
          </div>
          {eventsRes.error && (
            <p style={{ color: "#ef4444", fontSize: 12 }}>Error: {eventsRes.error.message}</p>
          )}
          <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#9ca3af", borderBottom: "1px solid #1f1f2e" }}>
                <th style={{ padding: "8px 8px" }}>Updated</th>
                <th style={{ padding: "8px 8px" }}>Source</th>
                <th style={{ padding: "8px 8px" }}>Type</th>
                <th style={{ padding: "8px 8px" }}>Sev</th>
                <th style={{ padding: "8px 8px" }}>Status</th>
                <th style={{ padding: "8px 8px" }}>Title</th>
                <th style={{ padding: "8px 8px" }}>Country</th>
                <th style={{ padding: "8px 8px" }}>Lat,Lon</th>
                <th style={{ padding: "8px 8px" }}>External ID</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 12, color: "#6b7280" }}>
                    No events.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #111" }}>
                    <td style={{ padding: "4px 8px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                      {fmtTime(e.updated_at)}
                    </td>
                    <td style={{ padding: "4px 8px", color: "#fff" }}>{e.source}</td>
                    <td style={{ padding: "4px 8px" }}>{e.type}</td>
                    <td style={{ padding: "4px 8px" }}>{e.severity ?? "—"}</td>
                    <td style={{ padding: "4px 8px" }}>{e.status}</td>
                    <td style={{ padding: "4px 8px", color: "#fff" }}>
                      <a href={`/events/${e.id}`} style={{ color: "#fff" }}>
                        {e.title}
                      </a>
                    </td>
                    <td style={{ padding: "4px 8px" }}>{e.country ?? "—"}</td>
                    <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                      {e.lat.toFixed(2)}, {e.lon.toFixed(2)}
                    </td>
                    <td style={{ padding: "4px 8px", color: "#6b7280" }}>{e.external_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
