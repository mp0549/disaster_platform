import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";
import { supabaseWrite } from "@/lib/supabase-write";
import { buildEnrichmentBundle, mapEnrichmentRow } from "@/lib/enrichment/enrich";
import { generateGroundedSummary } from "@/lib/gemini";
import type { EventDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

const ACTIVE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PARTIAL_RETRY_MS = 10 * 60 * 1000; // floor — don't slam upstream APIs on partial rows

function isStale(row: Record<string, unknown> | null, status: string, force: boolean): boolean {
  if (force || !row) return true;
  const age = Date.now() - new Date(row.enriched_at as string).getTime();
  if (row.partial) return age > PARTIAL_RETRY_MS;
  if (status === "ACTIVE") return age > ACTIVE_TTL_MS;
  return false; // CLOSED events never stale unless partial
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const force = req.nextUrl.searchParams.get("force") === "1";

  try {
    // Fetch event and existing enrichment in parallel
    const [{ data: raw, error: eventErr }, { data: existingRaw }] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("event_enrichment").select("*").eq("event_id", id).maybeSingle(),
    ]);

    if (eventErr || !raw) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Return cached enrichment if still fresh
    if (!isStale(existingRaw, raw.status, force)) {
      return NextResponse.json(mapEnrichmentRow(existingRaw!));
    }

    const event: EventDetail = {
      id: raw.id,
      externalId: raw.external_id,
      source: raw.source,
      type: raw.type,
      title: raw.title,
      description: raw.description ?? null,
      severity: raw.severity ?? null,
      status: raw.status,
      lat: raw.lat,
      lon: raw.lon,
      geometry: raw.geometry ?? null,
      country: raw.country ?? null,
      region: raw.region ?? null,
      startedAt: raw.started_at,
      updatedAt: raw.updated_at,
      createdAt: raw.created_at,
      rawData: raw.raw_data ?? {},
      aiSummary: raw.ai_summary ?? null,
      aiSummaryGeneratedAt: raw.ai_summary_generated_at ?? null,
      sourceUrl: raw.source_url ?? null,
    };

    const bundle = await buildEnrichmentBundle(event);

    // Generate grounded AI summary if we have sources
    const hasSources =
      (bundle.newsItems?.length ?? 0) > 0 ||
      bundle.wikipediaSummary ||
      (bundle.reliefwebReports?.length ?? 0) > 0;

    let groundedAiSummary: string | null = null;
    let groundedAiGeneratedAt: string | null = null;
    let groundedRetryable = false;

    if (hasSources) {
      const result = await generateGroundedSummary(
        { title: event.title, type: event.type, severity: event.severity, country: event.country, lat: event.lat, lon: event.lon, description: event.description, startedAt: event.startedAt },
        {
          newsTitles: bundle.newsItems?.map((n) => n.title) ?? [],
          wikipediaSummary: bundle.wikipediaSummary,
          reliefwebTitles: bundle.reliefwebReports?.map((r) => r.title) ?? [],
        }
      );
      if (result.ok) {
        groundedAiSummary = result.text;
        groundedAiGeneratedAt = new Date().toISOString();
      } else if (result.reason === "rate_limited" || result.reason === "error") {
        // Retry on next request when quota window resets or transient errors clear
        groundedRetryable = true;
      }
      // "no_key" is not retryable — saving with partial:false avoids infinite retries
    }

    const enrichedAt = new Date().toISOString();

    const row = {
      event_id: id,
      news_items: bundle.newsItems,
      wikipedia_url: bundle.wikipediaUrl,
      wikipedia_summary: bundle.wikipediaSummary,
      reliefweb_reports: bundle.reliefwebReports,
      similar_event_ids: bundle.similarEventIds,
      grounded_ai_summary: groundedAiSummary,
      grounded_ai_generated_at: groundedAiGeneratedAt,
      enriched_at: enrichedAt,
      partial: bundle.partial || groundedRetryable,
    };

    const writer = supabaseWrite ?? supabase;

    // Also update source_url on the event row if we resolved one and it's missing
    if (bundle.sourceUrl && !raw.source_url) {
      await writer.from("events").update({ source_url: bundle.sourceUrl }).eq("id", id);
    }

    await writer.from("event_enrichment").upsert(row, { onConflict: "event_id" });

    return NextResponse.json(mapEnrichmentRow({ ...row } as Record<string, unknown>));
  } catch (error) {
    console.error("POST /api/events/:id/enrich error:", error);
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}
