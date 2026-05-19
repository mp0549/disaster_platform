import { fmtTime } from "./fmtTime";

export type EventRow = {
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

interface Props {
  events: EventRow[];
  sourceFilter: string | undefined;
  error: string | null;
}

const TH_STYLE = { padding: "8px 8px" } as const;
const TD_STYLE = { padding: "4px 8px" } as const;
const HEADER_ROW_STYLE = {
  textAlign: "left" as const,
  color: "#9ca3af",
  borderBottom: "1px solid #1f1f2e",
};

export default function EventsTable({ events, sourceFilter, error }: Props) {
  return (
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
      {error && <p style={{ color: "#ef4444", fontSize: 12 }}>Error: {error}</p>}
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead>
          <tr style={HEADER_ROW_STYLE}>
            <th style={TH_STYLE}>Updated</th>
            <th style={TH_STYLE}>Source</th>
            <th style={TH_STYLE}>Type</th>
            <th style={TH_STYLE}>Sev</th>
            <th style={TH_STYLE}>Status</th>
            <th style={TH_STYLE}>Title</th>
            <th style={TH_STYLE}>Country</th>
            <th style={TH_STYLE}>Lat,Lon</th>
            <th style={TH_STYLE}>External ID</th>
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
                <td style={{ ...TD_STYLE, color: "#9ca3af", whiteSpace: "nowrap" }}>
                  {fmtTime(e.updated_at)}
                </td>
                <td style={{ ...TD_STYLE, color: "#fff" }}>{e.source}</td>
                <td style={TD_STYLE}>{e.type}</td>
                <td style={TD_STYLE}>{e.severity ?? "—"}</td>
                <td style={TD_STYLE}>{e.status}</td>
                <td style={{ ...TD_STYLE, color: "#fff" }}>
                  <a href={`/events/${e.id}`} style={{ color: "#fff" }}>
                    {e.title}
                  </a>
                </td>
                <td style={TD_STYLE}>{e.country ?? "—"}</td>
                <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>
                  {e.lat.toFixed(2)}, {e.lon.toFixed(2)}
                </td>
                <td style={{ ...TD_STYLE, color: "#6b7280" }}>{e.external_id}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
