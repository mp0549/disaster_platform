import Link from "next/link";
import { TypeBadge, SeverityBadge, StatusBadge, SourceBadge } from "@/components/ui/Badge";
import type { EventDetail } from "@/lib/types";

interface EventHeaderProps {
  event: EventDetail;
}

export default function EventHeader({ event }: EventHeaderProps) {
  return (
    <div className="border-b border-[#e5e5e5] pb-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-[#374151] transition-colors duration-150 mb-6 group"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
        >
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Back to Globe
      </Link>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <TypeBadge type={event.type} />
        <SeverityBadge severity={event.severity} />
        <StatusBadge status={event.status} />
        <SourceBadge source={event.source} />
      </div>

      {/* Title */}
      <h1
        className="text-[28px] font-bold leading-tight text-[#111827] mb-3"
        style={{ letterSpacing: "-0.02em" }}
      >
        {event.title}
      </h1>

      {/* Description */}
      {event.description && (
        <p className="text-[14px] text-[#4b5563] leading-relaxed max-w-2xl">
          {event.description}
        </p>
      )}
    </div>
  );
}
