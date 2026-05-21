import type { ReliefWebReport } from "@/lib/reliefweb";
import type { DisasterType } from "@/lib/types";

// Conservative mapping — prefer no results over wrong ones
const TYPE_TO_RELIEFWEB: Partial<Record<DisasterType, string>> = {
  EARTHQUAKE: "Earthquake",
  WILDFIRE: "Wild Fire",
  FLOOD: "Flood",
  STORM: "Tropical Cyclone",
  VOLCANO: "Volcano",
  DROUGHT: "Drought",
};

export async function fetchEnrichedReliefWebReports(
  country: string | null,
  type: DisasterType,
  startedAt: string
): Promise<ReliefWebReport[]> {
  if (!country) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const reliefwebType = TYPE_TO_RELIEFWEB[type];
    const since = new Date(new Date(startedAt).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const body: Record<string, unknown> = {
      filter: {
        operator: "AND",
        conditions: [
          { field: "country.name", value: country },
          { field: "date.created", value: { from: since } },
          ...(reliefwebType ? [{ field: "disaster_type.name", value: reliefwebType }] : []),
        ],
      },
      fields: { include: ["title", "url", "date"] },
      sort: ["date.created:desc"],
      limit: 5,
    };

    const res = await fetch("https://api.reliefweb.int/v1/reports?appname=disaster-platform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data?.data ?? []).map((item: { id: string; fields: { title?: string; url?: string; date?: { created?: string } } }) => ({
      id: String(item.id),
      title: item.fields?.title ?? "Untitled Report",
      url: item.fields?.url ?? "#",
      date: item.fields?.date?.created ?? null,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
