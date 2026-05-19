import type { EventDetail } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/constants";
import SectionHeader from "@/components/ui/SectionHeader";

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
    <div className="flex flex-col gap-0.5 py-3 border-b border-light-divider">
      <dt className="text-[10px] font-semibold tracking-[0.1em] uppercase text-light-subtle">
        {label}
      </dt>
      <dd className="text-[13px] text-light-text font-medium break-words">
        {value || <span className="text-light-subtle font-normal">—</span>}
      </dd>
    </div>
  );
}

export default function MetadataGrid({ event }: MetadataGridProps) {
  const items: MetaItem[] = [
    { label: "Coordinates", value: `${event.lat.toFixed(4)}°, ${event.lon.toFixed(4)}°` },
    { label: "Country", value: event.country },
    { label: "Region", value: event.region },
    { label: "Started", value: formatDate(event.startedAt) },
    { label: "Last Updated", value: formatDate(event.updatedAt) },
    { label: "Source", value: SOURCE_LABELS[event.source] || event.source },
    {
      label: "External ID",
      value: <span className="font-mono text-[12px] text-light-muted">{event.externalId}</span>,
    },
    { label: "Record Created", value: formatDate(event.createdAt) },
  ];

  return (
    <div>
      <SectionHeader id="metadata-heading" title="Event Details" className="mb-0" />
      <dl className="grid grid-cols-2 gap-x-8" aria-labelledby="metadata-heading">
        {items.map((item) => (
          <MetaCell key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </div>
  );
}
