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
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
