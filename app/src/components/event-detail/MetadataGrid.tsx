"use client";

import { useState } from "react";
import type { EventDetail } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/constants";
import SectionHeader from "@/components/ui/SectionHeader";

interface MetadataGridProps {
  event: EventDetail;
  accentColor?: string;
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

function PinIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="w-3 h-3 shrink-0 text-light-subtle"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 1a3 3 0 0 1 3 3c0 2-3 7-3 7S3 6 3 4a3 3 0 0 1 3-3z" />
      <circle cx="6" cy="4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1" width="7" height="9" rx="1" />
      <path d="M4 3H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1" />
    </svg>
  );
}

function MetaCell({ label, value }: MetaItem) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-light-divider hover:bg-[#FAEEDA]/20 transition-colors duration-150 px-1 -mx-1 rounded-sm">
      <dt className="text-[10px] font-semibold tracking-[0.1em] uppercase text-light-subtle">
        {label}
      </dt>
      <dd suppressHydrationWarning className="text-[13px] text-light-text font-medium break-words">
        {value || <span className="text-light-subtle font-normal">—</span>}
      </dd>
    </div>
  );
}

function CopyCoordCell({ lat, lon }: { lat: number; lon: number }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`${lat}, ${lon}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-light-divider hover:bg-[#FAEEDA]/20 transition-colors duration-150 px-1 -mx-1 rounded-sm group/coord">
      <dt className="text-[10px] font-semibold tracking-[0.1em] uppercase text-light-subtle">
        Coordinates
      </dt>
      <dd className="text-[13px] text-light-text font-medium flex items-center gap-1.5">
        <PinIcon />
        {lat.toFixed(4)}°, {lon.toFixed(4)}°
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover/coord:opacity-100 transition-opacity duration-150 text-light-subtle hover:text-light-muted ml-0.5"
          title="Copy coordinates"
        >
          {copied ? (
            <span className="text-[11px] font-medium" style={{ color: "#22c55e" }}>✓</span>
          ) : (
            <ClipboardIcon />
          )}
        </button>
      </dd>
    </div>
  );
}

export default function MetadataGrid({ event, accentColor }: MetadataGridProps) {
  const items: MetaItem[] = [
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
      <SectionHeader id="metadata-heading" title="Event Details" accent={accentColor} className="mb-0" />
      <CopyCoordCell lat={event.lat} lon={event.lon} />
      <dl
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-8"
        aria-labelledby="metadata-heading"
      >
        {items.map((item) => (
          <MetaCell key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </div>
  );
}
