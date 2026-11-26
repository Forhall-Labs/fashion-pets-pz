"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Un QueryClient por sesión de browser (no por render) — instanciarlo en
// useState evita recrearlo en cada render y evita compartirlo entre
// requests en el server, por eso este componente es "use client".
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
