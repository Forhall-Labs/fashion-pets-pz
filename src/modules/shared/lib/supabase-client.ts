import { createBrowserClient } from "@supabase/ssr";

// Solo para Auth (signInWithPassword / getSession / signOut). Nunca usar
// `.from(...)` acá: todo acceso a datos pasa por la API (ver api-client.ts) —
// este cliente jamás debe tocar las tablas directamente.
//
// createBrowserClient (en vez de createClient de @supabase/supabase-js)
// guarda la sesión en cookies en vez de localStorage, para que proxy.ts
// pueda leerla del lado del servidor y proteger rutas antes del render.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
