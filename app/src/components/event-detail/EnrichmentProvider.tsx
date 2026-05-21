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
  const [isLoading, setIsLoading] = useState(needsRefresh(initialEnrichment, status));

  useEffect(() => {
    if (!needsRefresh(initialEnrichment, status)) return;

    let cancelled = false;
    setIsLoading(true);

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
