import { createClient } from "@supabase/supabase-js";

// Solo para Auth (signInWithPassword / getSession / signOut). Nunca usar
// `.from(...)` acá: todo acceso a datos pasa por la API (ver api-client.ts) —
// este cliente jamás debe tocar las tablas directamente.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
