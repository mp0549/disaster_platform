import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      event: {
        id: data.id,
        externalId: data.external_id,
        source: data.source,
        type: data.type,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        lat: data.lat,
        lon: data.lon,
        geometry: data.geometry,
        country: data.country,
        region: data.region,
        startedAt: data.started_at,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
        rawData: data.raw_data,
        aiSummary: data.ai_summary,
        aiSummaryGeneratedAt: data.ai_summary_generated_at,
      },
    });
  } catch (error) {
    console.error("GET /api/events/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
