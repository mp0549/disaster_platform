import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase-api";
import { DOMAIN_RAMPS, TYPE_TO_DOMAIN } from "@/lib/constants";
import { mapEnrichmentRow } from "@/lib/enrichment/enrich";
import Header from "@/components/layout/Header";
import EventHeader from "@/components/event-detail/EventHeader";
import MetadataGrid from "@/components/event-detail/MetadataGrid";
import AISummary from "@/components/event-detail/AISummary";
import WeatherPanel from "@/components/event-detail/WeatherPanel";
import ReliefWebPanel from "@/components/event-detail/ReliefWebPanel";
import UpdateTimeline from "@/components/event-detail/UpdateTimeline";
import NewsPanel from "@/components/event-detail/NewsPanel";
import WikipediaPanel from "@/components/event-detail/WikipediaPanel";
import SimilarEvents from "@/components/event-detail/SimilarEvents";
import SourceLink from "@/components/event-detail/SourceLink";
import EnrichmentProvider from "@/components/event-detail/EnrichmentProvider";
import type { EventDetail, EventEnrichment } from "@/lib/types";

import dynamicImport from "next/dynamic";
const EventMap = dynamicImport(() => import("@/components/event-detail/EventMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#111] rounded-lg border border-[#1f1f2e] animate-pulse" />
  ),
});

// Always render at request time — never attempt DB calls during build
export const dynamic = "force-dynamic";

interface EventPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  try {
    const { data } = await supabase
      .from("events")
      .select("title, type, country")
      .eq("id", params.id)
      .maybeSingle();

    if (!data) return { title: "Event Not Found" };

    return {
      title: data.title,
      description: `${data.type} event in ${data.country || "unknown location"}. Real-time disaster intelligence.`,
    };
  } catch {
    return { title: "Event" };
  }
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="event-page">
      <Header />
      <main className="pt-16 pb-24">
        <div className="max-w-[1080px] mx-auto px-6 mt-16 flex flex-col items-center gap-4 text-center">
          <p className="label-mono text-[#ef4444]">Failed to load event</p>
          <p className="text-[13px] text-[#6b7280]">{message}</p>
          <a href="/" className="text-[13px] text-[#3b82f6] hover:underline">
            ← Back to dashboard
          </a>
        </div>
      </main>
    </div>
  );
}

export default async function EventPage({ params }: EventPageProps) {
  const [{ data: raw, error }, { data: enrichmentRaw }] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("event_enrichment").select("*").eq("event_id", params.id).maybeSingle(),
  ]);

  if (error) {
    return <ErrorState message="Could not connect to the database. Try again in a moment." />;
  }

  if (!raw) notFound();

  const event: EventDetail = {
    id: raw.id,
    externalId: raw.external_id,
    source: raw.source as EventDetail["source"],
    type: raw.type as EventDetail["type"],
    title: raw.title,
    description: raw.description ?? null,
    severity: (raw.severity ?? null) as EventDetail["severity"],
    status: raw.status as EventDetail["status"],
    lat: raw.lat,
    lon: raw.lon,
    geometry: raw.geometry as EventDetail["geometry"],
    country: raw.country ?? null,
    region: raw.region ?? null,
    startedAt: raw.started_at,
    updatedAt: raw.updated_at,
    createdAt: raw.created_at,
    rawData: (raw.raw_data ?? {}) as Record<string, unknown>,
    aiSummary: raw.ai_summary ?? null,
    aiSummaryGeneratedAt: raw.ai_summary_generated_at ?? null,
    sourceUrl: raw.source_url ?? null,
  };

  const enrichment: EventEnrichment | null = enrichmentRaw
    ? mapEnrichmentRow(enrichmentRaw as Record<string, unknown>)
    : null;

  const domain = TYPE_TO_DOMAIN[event.type] ?? "infra";
  const domainColor = DOMAIN_RAMPS[domain][400];

  return (
    <div className="event-page">
      <Header />

      <EnrichmentProvider
        initialEnrichment={enrichment}
        eventId={event.id}
        status={event.status}
      >
        <main className="pt-16 pb-24">
          <div className="max-w-[1080px] mx-auto px-6">
            <div className="mt-8 flex flex-col gap-10">

              <div className="panel-reveal" style={{ animationDelay: "0ms" }}>
                <EventHeader event={event} />
                <div className="mt-4">
                  <SourceLink source={event.source} sourceUrl={event.sourceUrl} />
                </div>
              </div>

              <div className="panel-reveal" style={{ animationDelay: "60ms" }}>
                <AISummary
                  eventId={event.id}
                  initialSummary={event.aiSummary}
                  initialGeneratedAt={event.aiSummaryGeneratedAt}
                />
              </div>

              <div className="panel-reveal grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ animationDelay: "120ms" }}>
                <EventMap
                  lat={event.lat}
                  lon={event.lon}
                  title={event.title}
                  geometry={event.geometry}
                />
                <MetadataGrid event={event} accentColor={domainColor} />
              </div>

              <div className="panel-reveal grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ animationDelay: "180ms" }}>
                <NewsPanel accentColor={domainColor} />
                <ReliefWebPanel country={event.country} accentColor={domainColor} />
              </div>

              <div className="panel-reveal grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ animationDelay: "210ms" }}>
                <WeatherPanel lat={event.lat} lon={event.lon} accentColor={domainColor} />
                <WikipediaPanel accentColor={domainColor} />
              </div>

              <div className="panel-reveal" style={{ animationDelay: "240ms" }}>
                <UpdateTimeline eventId={event.id} accentColor={domainColor} />
              </div>

              <div className="panel-reveal" style={{ animationDelay: "270ms" }}>
                <SimilarEvents accentColor={domainColor} />
              </div>

            </div>
          </div>
        </main>
      </EnrichmentProvider>
    </div>
  );
}
