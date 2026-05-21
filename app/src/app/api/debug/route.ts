import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null;
  const keyPrefix = rawKey ? rawKey.slice(0, 24) : null;
  const keyLen = rawKey ? rawKey.length : 0;

  const geminiKey = process.env.GEMINI_API_KEY ?? null;
  const geminiPrefix = geminiKey ? geminiKey.slice(0, 6) : null;
  const geminiLen = geminiKey?.length ?? 0;

  // Quick probe — confirms key is valid and reachable from Vercel runtime
  let geminiProbe: { ok: boolean; status?: number; error?: string } = { ok: false };
  if (geminiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const probeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Say OK" }] }],
            generationConfig: { maxOutputTokens: 4 },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      geminiProbe = probeRes.ok
        ? { ok: true, status: probeRes.status }
        : { ok: false, status: probeRes.status, error: (await probeRes.text()).slice(0, 200) };
    } catch (e) {
      geminiProbe = { ok: false, error: e instanceof Error ? e.message : "unknown" };
    }
  }

  const { data, error, count } = await supabase
    .from("events")
    .select("id, source", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(3);

  return NextResponse.json({
    env: { url, keyPrefix, keyLen, geminiPrefix, geminiLen },
    gemini: geminiProbe,
    query: {
      error: error ? { message: error.message, code: error.code, details: error.details } : null,
      count: count ?? null,
      sample: data ?? null,
    },
  });
}
