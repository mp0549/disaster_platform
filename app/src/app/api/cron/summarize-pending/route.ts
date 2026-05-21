import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";
import { supabaseWrite } from "@/lib/supabase-write";
import { generateEventSummary } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cap per invocation. We pace below Gemini's per-minute free-tier limit
// (~15 RPM on Flash-Lite) and stay well inside Vercel's 60s function budget.
const BATCH_SIZE = 5;

// Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is set.
// If CRON_SECRET is unset (preview/dev), allow no-auth so local testing works.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pending, error } = await supabase
    .from("events")
    .select("id, title, type, severity, country, lat, lon, description, started_at")
    .is("ai_summary", null)
    .order("started_at", { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const writer = supabaseWrite ?? supabase;
  const summarized: string[] = [];
  let rateLimitedAfter = 0;
  let errored = 0;

  for (const ev of pending ?? []) {
    const result = await generateEventSummary({
      title: ev.title,
      type: ev.type,
      severity: ev.severity,
      country: ev.country,
      lat: ev.lat,
      lon: ev.lon,
      description: ev.description,
      startedAt: ev.started_at,
    });

    if (result.ok) {
      await writer
        .from("events")
        .update({ ai_summary: result.text, ai_summary_generated_at: new Date().toISOString() })
        .eq("id", ev.id);
      summarized.push(ev.id);
    } else if (result.reason === "rate_limited") {
      rateLimitedAfter = summarized.length;
      break;
    } else if (result.reason === "no_key") {
      // No point continuing the batch
      break;
    } else {
      errored += 1;
    }
  }

  return NextResponse.json({
    attempted: pending?.length ?? 0,
    summarized: summarized.length,
    errored,
    stoppedOnRateLimit: rateLimitedAfter > 0 || (pending?.length ?? 0) > summarized.length + errored,
  });
}
