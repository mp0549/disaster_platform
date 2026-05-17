import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("source_status")
      .select("*")
      .order("source", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      sources: (data ?? []).map((s) => ({
        source: s.source,
        lastFetchedAt: s.last_fetched_at,
        eventCount: s.event_count,
        lastError: s.last_error,
        isHealthy: s.is_healthy,
      })),
    });
  } catch (error) {
    console.error("GET /api/sources error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
