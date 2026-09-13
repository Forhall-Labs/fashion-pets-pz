import { NextResponse, type NextRequest } from "next/server";

import { createProxyClient } from "@/modules/shared/lib/supabase-proxy";

// Reemplaza al viejo middleware.ts (deprecado en Next 16, ver
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
// Antes, la única protección de rutas era el guard client-side de
// useAppShell: la página protegida completa se mandaba y montaba en el
// browser antes de decidir si expulsar al usuario. Acá el redirect a
// /login pasa en el servidor, antes de mandar ese HTML/JS.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createProxyClient(request);

  // getUser() (no getSession()) revalida el JWT contra Supabase Auth en
  // vez de confiar ciegamente en la cookie — necesario para que el guard
  // sea real del lado del servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    const redirect = NextResponse.redirect(loginUrl);
    // getUser() puede haber refrescado o limpiado la sesión (setAll ya corrió
    // sobre getResponse()) — sin copiar esas cookies acá, el redirect las
    // descarta y una cookie stale/inválida queda pegada en el browser.
    for (const cookie of getResponse().cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return getResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
