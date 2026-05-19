import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null;
  const keyPrefix = rawKey ? rawKey.slice(0, 24) : null;
  const keyLen = rawKey ? rawKey.length : 0;

  const { data, error, count } = await supabase
    .from("events")
    .select("id, source", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(3);

  return NextResponse.json({
    env: { url, keyPrefix, keyLen },
    query: {
      error: error ? { message: error.message, code: error.code, details: error.details } : null,
      count: count ?? null,
      sample: data ?? null,
    },
  });
}
