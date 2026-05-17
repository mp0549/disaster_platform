import type { EventDetail } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/constants";

interface MetadataGridProps {
  event: EventDetail;
}

interface MetaItem {
  label: string;
  value: React.ReactNode;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function MetaCell({ label, value }: MetaItem) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#f0f0f0]">
      <dt className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#9ca3af]">
        {label}
      </dt>
      <dd className="text-[13px] text-[#1f2937] font-medium break-words">
        {value || <span className="text-[#9ca3af] font-normal">—</span>}
      </dd>
    </div>
  );
}

export default function MetadataGrid({ event }: MetadataGridProps) {
  const items: MetaItem[] = [
    {
      label: "Coordinates",
      value: `${event.lat.toFixed(4)}°, ${event.lon.toFixed(4)}°`,
    },
    {
      label: "Country",
      value: event.country,
    },
    {
      label: "Region",
      value: event.region,
    },
    {
      label: "Started",
      value: formatDate(event.startedAt),
    },
    {
      label: "Last Updated",
      value: formatDate(event.updatedAt),
    },
    {
      label: "Source",
      value: SOURCE_LABELS[event.source] || event.source,
    },
    {
      label: "External ID",
      value: (
        <span className="font-mono text-[12px] text-[#6b7280]">{event.externalId}</span>
      ),
    },
    {
      label: "Record Created",
      value: formatDate(event.createdAt),
    },
  ];

  return (
    <div>
      <h2
        className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-0"
        id="metadata-heading"
      >
        Event Details
      </h2>
      <dl
        className="grid grid-cols-2 gap-x-8"
        aria-labelledby="metadata-heading"
      >
        {items.map((item) => (
          <MetaCell key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </div>
  );
}
