interface WikipediaResult {
  url: string;
  summary: string;
}

export async function fetchWikipediaSummary(
  title: string,
  country: string | null
): Promise<WikipediaResult | null> {
  const query = [title, country].filter(Boolean).join(" ");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    // Step 1: OpenSearch to find the right page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: controller.signal, cache: "no-store" });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const pageTitle: string | undefined = searchData?.[1]?.[0];
    if (!pageTitle) return null;

    // Step 2: Page summary via REST API
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryRes = await fetch(summaryUrl, { signal: controller.signal, cache: "no-store" });
    if (!summaryRes.ok) return null;

    const summaryData = await summaryRes.json();
    const extract: string = summaryData?.extract;
    const pageUrl: string = summaryData?.content_urls?.desktop?.page;

    if (!extract || !pageUrl) return null;

    // Trim to ~400 chars
    const trimmed = extract.length > 400 ? extract.slice(0, 400).replace(/\s\S+$/, "") + "…" : extract;
    return { url: pageUrl, summary: trimmed };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
