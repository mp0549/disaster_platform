import type { DisasterType, Severity, EventStatus, EventSource } from "@/lib/types";
import {
  TYPE_COLORS, TYPE_LABELS, SOURCE_LABELS,
  DOMAIN_RAMPS, TYPE_TO_DOMAIN, STATUS_BADGE_COLORS,
} from "@/lib/constants";

// Shared pill shape — callers can add className for extra spacing
const BASE = "inline-flex items-center gap-1 rounded-full text-[11px] font-semibold tracking-wide px-2.5 py-0.5 border whitespace-nowrap";

interface BadgeProps { className?: string }

export function TypeBadge({ type, className = "" }: { type: DisasterType } & BadgeProps) {
  const color = TYPE_COLORS[type] || "#6b7280";
  const label = TYPE_LABELS[type] || type;
  return (
    <span
      className={`${BASE} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}35`,
      }}
    >
      {label}
    </span>
  );
}

export function SeverityBadge({ severity, className = "" }: { severity: Severity | null } & BadgeProps) {
  if (!severity) {
    return (
      <span
        className={`${BASE} ${className}`}
        style={{ backgroundColor: "#6b728012", color: "#6b7280", borderColor: "#6b728025" }}
      >
        Unknown
      </span>
    );
  }
  // Severity uses amber tint — size/opacity encoding only (per GRIP rule 2)
  const ramp = DOMAIN_RAMPS.natural;
  return (
    <span
      className={`${BASE} ${className}`}
      style={{
        backgroundColor: ramp[50],
        color: ramp[800],
        borderColor: `${ramp[600]}40`,
      }}
    >
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
    </span>
  );
}

export function StatusBadge({ status, className = "" }: { status: EventStatus } & BadgeProps) {
  const s = STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS.UNKNOWN;
  const dotColor = status === "ACTIVE" ? "#EF9F27" : status === "CLOSED" ? "#9ca3af" : "#AFA9EC";
  return (
    <span
      className={`${BASE} ${className}`}
      style={{
        backgroundColor: s.bg,
        color: s.text,
        borderColor: `${s.text}30`,
      }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function SourceBadge({ source, className = "" }: { source: EventSource } & BadgeProps) {
  const label = SOURCE_LABELS[source] || source;
  return (
    <span
      className={`${BASE} ${className}`}
      style={{ backgroundColor: "rgba(107,114,128,0.08)", color: "#9ca3af", borderColor: "rgba(107,114,128,0.18)" }}
    >
      {label}
    </span>
  );
}

/** Domain-tinted badge for use on event detail pages */
export function DomainBadge({ type, className = "" }: { type: string } & BadgeProps) {
  const domain = TYPE_TO_DOMAIN[type] ?? "infra";
  const ramp = DOMAIN_RAMPS[domain];
  return (
    <span
      className={`${BASE} ${className}`}
      style={{ backgroundColor: ramp[50], color: ramp[800], borderColor: `${ramp[600]}40` }}
    >
      {domain.charAt(0).toUpperCase() + domain.slice(1)}
    </span>
  );
}
