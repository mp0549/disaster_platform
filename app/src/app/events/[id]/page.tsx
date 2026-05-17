import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import Header from "@/components/layout/Header";
import EventHeader from "@/components/event-detail/EventHeader";
import MetadataGrid from "@/components/event-detail/MetadataGrid";
import AISummary from "@/components/event-detail/AISummary";
import WeatherPanel from "@/components/event-detail/WeatherPanel";
import ReliefWebPanel from "@/components/event-detail/ReliefWebPanel";
import UpdateTimeline from "@/components/event-detail/UpdateTimeline";
import type { EventDetail } from "@/lib/types";

// Dynamic import for Leaflet (client-only)
import dynamic from "next/dynamic";
const EventMap = dynamic(() => import("@/components/event-detail/EventMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#f3f4f6] rounded-lg border border-[#e5e5e5] animate-pulse" />
  ),
});

interface EventPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { title: true, type: true, country: true },
  });

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: event.title,
    description: `${event.type} event in ${event.country || "unknown location"}. Real-time disaster intelligence.`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const raw = await prisma.event.findUnique({
    where: { id: params.id },
  });

  if (!raw) notFound();

  // Serialize to plain object (Dates → ISO strings)
  const event: EventDetail = {
    id: raw.id,
    externalId: raw.externalId,
    source: raw.source as EventDetail["source"],
    type: raw.type as EventDetail["type"],
    title: raw.title,
    description: raw.description ?? null,
    severity: raw.severity as EventDetail["severity"] ?? null,
    status: raw.status as EventDetail["status"],
    lat: raw.lat,
    lon: raw.lon,
    geometry: raw.geometry as EventDetail["geometry"],
    country: raw.country ?? null,
    region: raw.region ?? null,
    startedAt: raw.startedAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    rawData: raw.rawData as Record<string, unknown>,
    aiSummary: raw.aiSummary ?? null,
    aiSummaryGeneratedAt: raw.aiSummaryGeneratedAt?.toISOString() ?? null,
  };

  return (
    <div className="event-page">
      <Header />

      <main className="pt-16 pb-24">
        <div className="max-w-[1080px] mx-auto px-6">
          {/* Content grid */}
          <div className="mt-8 flex flex-col gap-10">
            {/* Event header — title, badges, description */}
            <EventHeader event={event} />

            {/* Two-column layout for map + metadata */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EventMap
                lat={event.lat}
                lon={event.lon}
                title={event.title}
                geometry={event.geometry}
              />
              <MetadataGrid event={event} />
            </div>

            {/* AI Summary */}
            <AISummary
              eventId={event.id}
              initialSummary={event.aiSummary}
              initialGeneratedAt={event.aiSummaryGeneratedAt}
            />

            {/* Weather + ReliefWeb side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <WeatherPanel lat={event.lat} lon={event.lon} />
              <ReliefWebPanel country={event.country} />
            </div>

            {/* Update timeline */}
            <UpdateTimeline eventId={event.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
