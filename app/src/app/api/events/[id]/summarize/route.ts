import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";
import { supabaseWrite } from "@/lib/supabase-write";
import { generateEventSummary } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Return cached summary if already generated
    if (event.ai_summary && event.ai_summary_generated_at) {
      return NextResponse.json({
        aiSummary: event.ai_summary,
        aiSummaryGeneratedAt: event.ai_summary_generated_at,
        cached: true,
      });
    }

    // Generate new summary
    const summary = await generateEventSummary({
      title: event.title,
      type: event.type,
      severity: event.severity,
      country: event.country,
      lat: event.lat,
      lon: event.lon,
      description: event.description,
      startedAt: event.started_at,
    });

    if (!summary) {
      // Gemini key absent or timed out — not a service failure, just unavailable
      return NextResponse.json({ aiSummary: null, cached: false });
    }

    const generatedAt = new Date().toISOString();

    await (supabaseWrite ?? supabase)
      .from("events")
      .update({ ai_summary: summary, ai_summary_generated_at: generatedAt })
      .eq("id", id);

    return NextResponse.json({
      aiSummary: summary,
      aiSummaryGeneratedAt: generatedAt,
      cached: false,
    });
  } catch (error) {
    console.error("POST /api/events/:id/summarize error:", error);
    return NextResponse.json(
      { error: "AI summarization temporarily unavailable" },
      { status: 503 }
    );
  }
}
