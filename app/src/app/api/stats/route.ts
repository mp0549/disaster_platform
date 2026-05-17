import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("type, severity, source, status");

    if (error) throw error;

    const all = events ?? [];
    const totalEvents = all.length;
    const activeEvents = all.filter((e) => e.status === "ACTIVE").length;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const e of all) {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      if (e.severity) bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
      bySource[e.source] = (bySource[e.source] ?? 0) + 1;
    }

    return NextResponse.json({
      totalEvents,
      activeEvents,
      byType,
      bySeverity,
      bySource,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
