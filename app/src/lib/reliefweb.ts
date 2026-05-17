export interface ReliefWebReport {
  id: string;
  title: string;
  url: string;
  date: string | null;
}

export async function fetchReliefWebReports(country: string): Promise<ReliefWebReport[]> {
  try {
    const url = new URL("https://api.reliefweb.int/v1/reports");
    url.searchParams.set("appname", "disaster-platform");
    url.searchParams.set("filter[field]", "country.name");
    url.searchParams.set("filter[value]", country);
    url.searchParams.set("limit", "5");
    url.searchParams.set("preset", "latest");
    url.searchParams.set("fields[include][]", "title");
    url.searchParams.set("fields[include][]", "date");
    url.searchParams.set("fields[include][]", "url");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data?.data ?? [];

    return items.map((item: { id: string; fields: { title?: string; url?: string; date?: { created?: string } } }) => ({
      id: String(item.id),
      title: item.fields?.title ?? "Untitled Report",
      url: item.fields?.url ?? "#",
      date: item.fields?.date?.created ?? null,
    }));
  } catch {
    return [];
  }
}
