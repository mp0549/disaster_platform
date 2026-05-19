import { fmtTime } from "./fmtTime";

export type SourceStatusRow = {
  source: string;
  last_fetched_at: string | null;
  event_count: number;
  last_error: string | null;
  is_healthy: boolean;
  updated_at: string | null;
};

interface Props {
  sources: SourceStatusRow[];
  bySource: Record<string, number>;
  error: string | null;
}

const TH_STYLE = { padding: "8px 12px" } as const;
const HEADER_ROW_STYLE = {
  textAlign: "left" as const,
  color: "#9ca3af",
  borderBottom: "1px solid #1f1f2e",
};

export default function SourceStatusTable({ sources, bySource, error }: Props) {
  return (
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
      {error && <p style={{ color: "#ef4444", fontSize: 12 }}>Error: {error}</p>}
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={HEADER_ROW_STYLE}>
            <th style={TH_STYLE}>Source</th>
            <th style={TH_STYLE}>Healthy</th>
            <th style={TH_STYLE}>Last fetched</th>
            <th style={TH_STYLE}>Last batch</th>
            <th style={TH_STYLE}>Total events</th>
            <th style={TH_STYLE}>Last error</th>
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
  );
}
