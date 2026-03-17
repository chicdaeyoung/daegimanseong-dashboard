import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Copy .env.example to .env.local and add your Supabase project values.",
      );
    }
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

