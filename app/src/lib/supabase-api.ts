/**
 * Supabase client for use in Next.js API routes.
 * Uses the publishable key + PostgREST — no direct DB connection required.
 * RLS is disabled on all tables so the publishable key has full read access.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Singleton for API routes (server-side, no cookie handling needed)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
