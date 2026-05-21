"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { EventEnrichment } from "@/lib/types";

interface EnrichmentContextValue {
  enrichment: EventEnrichment | null;
  isLoading: boolean;
}

const EnrichmentContext = createContext<EnrichmentContextValue>({
  enrichment: null,
  isLoading: false,
});

export function useEnrichment() {
  return useContext(EnrichmentContext);
}

function needsRefresh(enrichment: EventEnrichment | null, status: string): boolean {
  if (!enrichment) return true;
  if (enrichment.partial) return true;
  if (status === "ACTIVE") {
    return Date.now() - new Date(enrichment.enrichedAt).getTime() > 15 * 60 * 1000;
  }
  return false;
}

interface Props {
  initialEnrichment: EventEnrichment | null;
  eventId: string;
  status: string;
  children: React.ReactNode;
}

export default function EnrichmentProvider({ initialEnrichment, eventId, status, children }: Props) {
  const [enrichment, setEnrichment] = useState<EventEnrichment | null>(initialEnrichment);
  // Don't call Date.now() during render — it differs between server and client, causing hydration
  // mismatch (#422). Show loading only when there's no data to display; stale-data refreshes are
  // handled silently in the background via useEffect.
  const [isLoading, setIsLoading] = useState(!initialEnrichment || !!initialEnrichment.partial);

  useEffect(() => {
    if (!needsRefresh(initialEnrichment, status)) return;

    let cancelled = false;
    // Only show loading spinner if there's no enrichment to display yet;
    // for stale-but-complete enrichment, update silently in the background.
    if (!initialEnrichment || initialEnrichment.partial) setIsLoading(true);

    fetch(`/api/events/${eventId}/enrich`, { method: "POST", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setEnrichment(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, initialEnrichment, status]);

  return (
    <EnrichmentContext.Provider value={{ enrichment, isLoading }}>
      {children}
    </EnrichmentContext.Provider>
  );
}
