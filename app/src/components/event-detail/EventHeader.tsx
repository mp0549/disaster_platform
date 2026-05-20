import Link from "next/link";
import { DOMAIN_RAMPS, TYPE_TO_DOMAIN, TYPE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import type { EventDetail } from "@/lib/types";

interface EventHeaderProps {
  event: EventDetail;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventHeader({ event }: EventHeaderProps) {
  const domain = TYPE_TO_DOMAIN[event.type] ?? "infra";
  const ramp = DOMAIN_RAMPS[domain];

  const metaParts: string[] = [
    formatEventDate(event.startedAt),
    SOURCE_LABELS[event.source] || event.source,
    ...(event.severity ? [event.severity] : []),
    event.status,
  ];

  return (
    <div className="border-b border-light-border pb-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12px] text-light-subtle hover:text-light-muted transition-colors duration-150 mb-8 group"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1"
        >
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {TYPE_LABELS[event.type]}
      </Link>

      <h1
        className="text-[38px] sm:text-[46px] font-bold leading-[1.04] text-light-strong mb-4 max-w-3xl"
        style={{ letterSpacing: "-0.03em" }}
      >
        {event.title}
      </h1>

      <p className="text-[12px] text-light-subtle mb-5 tracking-wide">
        {metaParts.join("  ·  ")}
      </p>

      {event.description && (
        <p
          className="text-[14px] text-light-muted leading-relaxed max-w-2xl italic pl-4 border-l-[2px]"
          style={{ borderColor: `${ramp[400]}55` }}
        >
          {event.description}
        </p>
      )}
    </div>
  );
}
