import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Cliente de Supabase para usar dentro de proxy.ts (ver docs/proxy.md de
// Next 16 — reemplaza al viejo middleware.ts). Lee las cookies del request
// entrante y, si Supabase renueva el token, las reescribe tanto en el
// request como en la response que efectivamente se devuelve — si se arma
// una response nueva después (p.ej. un redirect) sin copiar esas cookies,
// la renovación de sesión se pierde silenciosamente.
export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return { supabase, getResponse: () => response };
}
