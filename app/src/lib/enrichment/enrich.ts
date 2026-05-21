import { fetchNewsItems } from "./news";
import { fetchWikipediaSummary } from "./wikipedia";
import { fetchEnrichedReliefWebReports } from "./reliefweb";
import { fetchSimilarEventIds } from "./similar";
import { extractSourceUrl } from "./source-url";
import type { EventDetail, EventEnrichment, NewsItem } from "@/lib/types";
import type { ReliefWebReport } from "@/lib/reliefweb";

interface EnrichmentBundle {
  newsItems: NewsItem[] | null;
  wikipediaUrl: string | null;
  wikipediaSummary: string | null;
  reliefwebReports: ReliefWebReport[] | null;
  similarEventIds: string[] | null;
  sourceUrl: string | null;
  partial: boolean;
}

export async function buildEnrichmentBundle(event: EventDetail): Promise<EnrichmentBundle> {
  const results = await Promise.allSettled([
    fetchNewsItems(event.type, event.country, event.startedAt),
    fetchWikipediaSummary(event.title, event.country),
    fetchEnrichedReliefWebReports(event.country, event.type, event.startedAt),
    fetchSimilarEventIds(event.id, event.type, event.country, event.region),
  ]);

  const [newsResult, wikiResult, reliefwebResult, similarResult] = results;
  const partial = results.some((r) => r.status === "rejected");

  const newsItems = newsResult.status === "fulfilled" ? newsResult.value : null;
  const wiki = wikiResult.status === "fulfilled" ? wikiResult.value : null;
  const reliefwebReports = reliefwebResult.status === "fulfilled" ? reliefwebResult.value : null;
  const similarEventIds = similarResult.status === "fulfilled" ? similarResult.value : null;

  // Fallback source_url extraction (for events that predate the backfill)
  const sourceUrl = event.sourceUrl ?? extractSourceUrl(event.source, event.rawData);

  return {
    newsItems: newsItems?.length ? newsItems : null,
    wikipediaUrl: wiki?.url ?? null,
    wikipediaSummary: wiki?.summary ?? null,
    reliefwebReports: reliefwebReports?.length ? reliefwebReports : null,
    similarEventIds: similarEventIds?.length ? similarEventIds : null,
    sourceUrl,
    partial,
  };
}

export function mapEnrichmentRow(row: Record<string, unknown>): EventEnrichment {
  return {
    eventId: row.event_id as string,
    newsItems: (row.news_items as NewsItem[]) ?? null,
    wikipediaUrl: (row.wikipedia_url as string) ?? null,
    wikipediaSummary: (row.wikipedia_summary as string) ?? null,
    reliefwebReports: (row.reliefweb_reports as ReliefWebReport[]) ?? null,
    similarEventIds: (row.similar_event_ids as string[]) ?? null,
    groundedAiSummary: (row.grounded_ai_summary as string) ?? null,
    groundedAiGeneratedAt: (row.grounded_ai_generated_at as string) ?? null,
    enrichedAt: row.enriched_at as string,
    partial: row.partial as boolean,
  };
}
