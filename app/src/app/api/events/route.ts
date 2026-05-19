import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const typeParam = searchParams.get("type");
  const severityParam = searchParams.get("severity");
  const sinceParam = searchParams.get("since");
  const limitParam = searchParams.get("limit");
  const debug = searchParams.get("debug") === "1";

  const limit = Math.min(parseInt(limitParam || "500", 10) || 500, 2000);

  try {
    let query = supabase
      .from("events")
      .select(
        "id, external_id, source, type, title, severity, status, lat, lon, country, started_at, updated_at",
        { count: "exact" }
      )
      .order("started_at", { ascending: false })
      .limit(limit);

    if (typeParam) {
      const types = typeParam.split(",").map((t) => t.trim().toUpperCase());
      query = query.in("type", types);
    }

    if (severityParam) {
      const severities = severityParam.split(",").map((s) => s.trim().toUpperCase());
      query = query.in("severity", severities);
    }

    if (sinceParam) {
      try {
        const since = new Date(sinceParam);
        query = query.gte("started_at", since.toISOString());
      } catch {
        // ignore malformed date
      }
    }

    const { data, error, count: dbCount } = await query;

    console.log("[api/events]", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.slice(0, 24),
      filters: { typeParam, severityParam, sinceParam, limit },
      error: error ? { message: error.message, code: error.code, details: error.details } : null,
      dataLen: data?.length ?? null,
      dbCount,
    });

    if (error) throw error;

    const events = (data ?? []).map((e) => ({
      id: e.id,
      externalId: e.external_id,
      source: e.source,
      type: e.type,
      title: e.title,
      severity: e.severity,
      status: e.status,
      lat: e.lat,
      lon: e.lon,
      country: e.country,
      startedAt: e.started_at,
      updatedAt: e.updated_at,
    }));

    const payload: Record<string, unknown> = { events, count: events.length };
    if (debug) {
      payload.debug = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.slice(0, 24),
        dbCount,
        dataLen: data?.length ?? null,
        filters: { typeParam, severityParam, sinceParam, limit },
      };
    }
    return NextResponse.json(payload);
  } catch (error) {
    const e = error as { message?: string; code?: string; details?: string };
    console.error("[api/events] caught error:", e);
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(debug ? { debugError: { message: e?.message, code: e?.code, details: e?.details } } : {}),
      },
      { status: 500 }
    );
  }
}
