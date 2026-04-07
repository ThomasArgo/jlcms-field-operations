import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";

const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function requireSupabase() {
  if (supabase) return supabase;

  throw new Error(
    "Supabase is not configured. Add your Supabase keys to the project root .env file before calling the API."
  );
}
