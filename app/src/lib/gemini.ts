/**
 * Gemini Flash 2.0 API client for generating event situation summaries.
 * Uses fetch directly — no SDK needed.
 * Hard 8-second timeout to stay well under Vercel's 10s serverless limit.
 */

interface GroundingSources {
  newsTitles: string[];
  wikipediaSummary: string | null;
  reliefwebTitles: string[];
}

interface EventContext {
  title: string;
  type: string;
  severity: string | null;
  country: string | null;
  lat: number;
  lon: number;
  description: string | null;
  startedAt: string;
}

export type SummaryResult =
  | { ok: true; text: string }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number | null }
  | { ok: false; reason: "no_key" }
  | { ok: false; reason: "error" };

// Parses Google's RPC-style retry hint: details[].retryDelay = "37s" / "PT24H" / "1.5s"
function parseRetryAfter(body: string): number | null {
  try {
    const parsed = JSON.parse(body);
    const details = parsed?.error?.details;
    if (!Array.isArray(details)) return null;
    for (const d of details) {
      const delay: unknown = d?.retryDelay;
      if (typeof delay !== "string") continue;
      // ISO 8601 duration "PT24H" / "PT15M" / "PT3.5S"
      const iso = delay.match(/^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/);
      if (iso) {
        const h = parseFloat(iso[1] ?? "0");
        const m = parseFloat(iso[2] ?? "0");
        const s = parseFloat(iso[3] ?? "0");
        return Math.round(h * 3600 + m * 60 + s);
      }
      // Bare "37s"
      const bare = delay.match(/^(\d+(?:\.\d+)?)s$/);
      if (bare) return Math.round(parseFloat(bare[1]));
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateEventSummary(event: EventContext): Promise<SummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "no_key" };
  }

  const prompt = `You are a disaster intelligence analyst. Given the following disaster event data, write exactly 3 concise sentences summarizing the situation, potential impact, and recommended awareness level. Be factual and specific.

Event: ${event.title}
Type: ${event.type}
Severity: ${event.severity ?? "Unknown"}
Location: ${event.country ?? "Unknown"} (${event.lat.toFixed(4)}, ${event.lon.toFixed(4)})
Description: ${event.description ?? "No description available"}
Started: ${event.startedAt}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  // 8-second abort controller — required to stay under Vercel's 10s hard limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
          topP: 0.8,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini API error:", response.status, body);
      if (response.status === 429) {
        return { ok: false, reason: "rate_limited", retryAfterSeconds: parseRetryAfter(body) };
      }
      return { ok: false, reason: "error" };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim().length > 0
      ? { ok: true, text: text.trim() }
      : { ok: false, reason: "error" };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Gemini API timeout after 8 seconds.");
    } else {
      console.error("Gemini API error:", error);
    }
    return { ok: false, reason: "error" };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateGroundedSummary(
  event: EventContext,
  sources: GroundingSources
): Promise<SummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: "no_key" };

  const sourceBlock = [
    ...sources.newsTitles.map((t, i) => `[${i + 1}] News: ${t}`),
    ...(sources.wikipediaSummary ? [`[W] Wikipedia: ${sources.wikipediaSummary}`] : []),
    ...sources.reliefwebTitles.map((t, i) => `[R${i + 1}] ReliefWeb: ${t}`),
  ].join("\n");

  const prompt = `You are a disaster intelligence analyst. Using ONLY the provided sources below, write exactly 3 concise sentences summarizing this event's situation, scale, and impact. Cite sources inline by their bracket label (e.g. [1], [W]). Do not assert any fact not grounded in the sources.

Event: ${event.title}
Type: ${event.type}
Severity: ${event.severity ?? "Unknown"}
Location: ${event.country ?? "Unknown"} (${event.lat.toFixed(4)}, ${event.lon.toFixed(4)})
Started: ${event.startedAt}

Sources:
${sourceBlock || "No sources available — state that information is limited."}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300, topP: 0.8 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini grounded API error:", response.status, body);
      if (response.status === 429) {
        return { ok: false, reason: "rate_limited", retryAfterSeconds: parseRetryAfter(body) };
      }
      return { ok: false, reason: "error" };
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim().length > 0
      ? { ok: true, text: text.trim() }
      : { ok: false, reason: "error" };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Gemini grounded API timeout after 8 seconds.");
    } else {
      console.error("Gemini grounded API error:", error);
    }
    return { ok: false, reason: "error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
