"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEnrichment } from "./EnrichmentProvider";
import SectionHeader from "@/components/ui/SectionHeader";
import Skeleton from "@/components/ui/Skeleton";
import { SEVERITY_COLORS, TYPE_EMOJI, TYPE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import type { EventSummary } from "@/lib/types";

interface SimilarEventsPanelProps {
  accentColor?: string;
}

async function fetchEventsByIds(ids: string[]): Promise<EventSummary[]> {
  const results = await Promise.allSettled(
    ids.map((id) =>
      fetch(`/api/events/${id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data?.event as EventSummary | null)
    )
  );
  return results.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []));
}

export default function SimilarEvents({ accentColor }: SimilarEventsPanelProps) {
  const { enrichment, isLoading } = useEnrichment();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [fetching, setFetching] = useState(false);

  const ids = enrichment?.similarEventIds ?? null;

  useEffect(() => {
    if (!ids?.length) return;
    setFetching(true);
    fetchEventsByIds(ids)
      .then(setEvents)
      .finally(() => setFetching(false));
  }, [ids]);

  if (isLoading || (!events.length && !fetching && !isLoading)) return null;

  return (
    <div>
      <SectionHeader title="Similar Past Events" accent={accentColor} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fetching
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-light-border p-4 space-y-2">
                <Skeleton height="12px" width="60%" light />
                <Skeleton height="14px" width="85%" light />
                <Skeleton height="10px" width="40%" light />
              </div>
            ))
          : events.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="group rounded-lg border border-light-border bg-light-panel p-4 hover:bg-light-hover transition-colors duration-150 flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px]">{TYPE_EMOJI[ev.type]}</span>
                  <span className="text-[10px] font-medium text-light-subtle tracking-wide uppercase">
                    {TYPE_LABELS[ev.type]}
                  </span>
                  {ev.severity && (
                    <span
                      className="ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ color: SEVERITY_COLORS[ev.severity], background: `${SEVERITY_COLORS[ev.severity]}18` }}
                    >
                      {ev.severity}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-light-strong font-medium leading-snug line-clamp-2 group-hover:translate-x-0.5 transition-transform duration-150">
                  {ev.title}
                </p>
                <p className="text-[10px] text-light-subtle mt-auto">
                  {SOURCE_LABELS[ev.source]} ·{" "}
                  {new Date(ev.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </Link>
            ))}
      </div>
    </div>
  );
}
