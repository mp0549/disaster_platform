import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Verify event exists
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("event_updates")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      updates: (data ?? []).map((u) => ({
        id: u.id,
        changedFields: u.changed_fields,
        snapshot: u.snapshot,
        createdAt: u.created_at,
      })),
    });
  } catch (error) {
    console.error("GET /api/events/:id/updates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
