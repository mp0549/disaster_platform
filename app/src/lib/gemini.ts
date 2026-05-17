/**
 * Gemini Flash 2.0 API client for generating event situation summaries.
 * Uses fetch directly — no SDK needed.
 * Hard 8-second timeout to stay well under Vercel's 10s serverless limit.
 */

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

export async function generateEventSummary(event: EventContext): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const prompt = `You are a disaster intelligence analyst. Given the following disaster event data, write exactly 3 concise sentences summarizing the situation, potential impact, and recommended awareness level. Be factual and specific.

Event: ${event.title}
Type: ${event.type}
Severity: ${event.severity ?? "Unknown"}
Location: ${event.country ?? "Unknown"} (${event.lat.toFixed(4)}, ${event.lon.toFixed(4)})
Description: ${event.description ?? "No description available"}
Started: ${event.startedAt}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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
      console.error("Gemini API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text.trim() : null;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Gemini API timeout after 8 seconds.");
    } else {
      console.error("Gemini API error:", error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
