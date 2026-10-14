import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly at startup rather than silently returning empty data,
  // which is much easier to debug than "why is my property list empty".
  console.error(
    "Missing Supabase config. Copy .env.example to .env and fill in " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project's API settings."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");
