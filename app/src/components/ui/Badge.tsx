import type { DisasterType, Severity, EventStatus, EventSource } from "@/lib/types";
import { TYPE_COLORS, SEVERITY_COLORS, SOURCE_LABELS, TYPE_LABELS } from "@/lib/constants";

interface BadgeProps {
  className?: string;
}

export function TypeBadge({ type, className = "" }: { type: DisasterType } & BadgeProps) {
  const color = TYPE_COLORS[type] || "#6b7280";
  const label = TYPE_LABELS[type] || type;
  return (
    <span
      className={`badge ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color,
        borderColor: `${color}40`,
        border: "1px solid",
      }}
    >
      {label}
    </span>
  );
}

const SEVERITY_CLASSES: Record<Severity, { bg: string; text: string; border: string }> = {
  LOW: { bg: "#22c55e20", text: "#22c55e", border: "#22c55e40" },
  MODERATE: { bg: "#eab30820", text: "#ca8a04", border: "#eab30840" },
  HIGH: { bg: "#f9731620", text: "#ea580c", border: "#f9731640" },
  EXTREME: { bg: "#ef444420", text: "#dc2626", border: "#ef444440" },
};

export function SeverityBadge({ severity, className = "" }: { severity: Severity | null } & BadgeProps) {
  if (!severity) {
    return (
      <span
        className={`badge ${className}`}
        style={{ backgroundColor: "#6b728020", color: "#6b7280", border: "1px solid #6b728040" }}
      >
        Unknown
      </span>
    );
  }
  const s = SEVERITY_CLASSES[severity];
  return (
    <span
      className={`badge ${className}`}
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {severity}
    </span>
  );
}

const STATUS_STYLES: Record<EventStatus, { bg: string; text: string; border: string; dot: string }> = {
  ACTIVE: { bg: "#22c55e15", text: "#22c55e", border: "#22c55e30", dot: "#22c55e" },
  CLOSED: { bg: "#6b728015", text: "#9ca3af", border: "#6b728030", dot: "#6b7280" },
  UNKNOWN: { bg: "#3b82f615", text: "#60a5fa", border: "#3b82f630", dot: "#3b82f6" },
};

export function StatusBadge({ status, className = "" }: { status: EventStatus } & BadgeProps) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.UNKNOWN;
  return (
    <span
      className={`badge ${className}`}
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
      />
      {status}
    </span>
  );
}

export function SourceBadge({ source, className = "" }: { source: EventSource } & BadgeProps) {
  const label = SOURCE_LABELS[source] || source;
  return (
    <span
      className={`badge ${className}`}
      style={{ backgroundColor: "#6b728015", color: "#9ca3af", border: "1px solid #6b728030" }}
    >
      {label}
    </span>
  );
}
