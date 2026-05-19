/**
 * Supabase client for use in Next.js API routes.
 * Uses the publishable key + PostgREST — no direct DB connection required.
 * RLS is enabled with a `public read` policy on events/event_updates/source_status;
 * writes are not exposed to this key (the worker writes via direct DB connection).
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Singleton for API routes (server-side, no cookie handling needed)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
