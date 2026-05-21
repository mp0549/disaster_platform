import { supabase } from "@/lib/supabase-api";
import type { DisasterType } from "@/lib/types";

export async function fetchSimilarEventIds(
  currentId: string,
  type: DisasterType,
  country: string | null,
  region: string | null
): Promise<string[]> {
  // Try country match first; fall back to region
  const locationField = country ? "country" : "region";
  const locationValue = country ?? region;
  if (!locationValue) return [];

  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("type", type)
    .eq(locationField, locationValue)
    .neq("id", currentId)
    .order("started_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((row: { id: string }) => row.id);
}
