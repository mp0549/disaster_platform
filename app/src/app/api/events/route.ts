import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const typeParam = searchParams.get("type");
  const severityParam = searchParams.get("severity");
  const sinceParam = searchParams.get("since");
  const limitParam = searchParams.get("limit");

  const limit = Math.min(parseInt(limitParam || "500", 10) || 500, 2000);

  try {
    let query = supabase
      .from("events")
      .select(
        "id, external_id, source, type, title, severity, status, lat, lon, country, started_at, updated_at"
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

    const { data, error } = await query;

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

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
