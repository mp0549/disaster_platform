import type { NewsItem } from "@/lib/types";

function extractTag(xml: string, tag: string): string {
  const cdata = new RegExp(`<${tag}><\\!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "s").exec(xml)?.[1];
  if (cdata) return cdata.trim();
  const plain = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "s").exec(xml)?.[1];
  return plain?.trim() ?? "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchNewsItems(
  type: string,
  country: string | null,
  startedAt: string
): Promise<NewsItem[]> {
  const year = new Date(startedAt).getFullYear();
  const query = [type.toLowerCase(), country, year].filter(Boolean).join(" ");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return [];

    const xml = await res.text();
    const items: NewsItem[] = [];

    // Split on <item> boundaries
    const chunks = xml.split("<item>").slice(1);
    for (const chunk of chunks.slice(0, 6)) {
      const title = decodeEntities(extractTag(chunk, "title"));
      const link = extractTag(chunk, "link") || (chunk.match(/https?:\/\/[^\s<"]+/)?.[0] ?? "");
      const pubDate = extractTag(chunk, "pubDate");
      const sourceName = extractTag(chunk, "source");

      if (title && link) {
        items.push({ title, url: link, source: sourceName, publishedAt: pubDate || null });
      }
    }

    // Sort newest first; items without a parseable date go to the end
    items.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
