"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/modules/shared/lib/api-client";
import { ownersApi } from "@/modules/shared/lib/owners-api";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Puerto de la pantalla "Dueños — Lista" (renderOwnersList() en app.js),
// ahora contra la API real, paginada y con búsqueda server-side (debounced)
// — TanStack Query cachea por (page, q) y evita re-pedir lo mismo.
export function useOwnersList() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["owners", { page, q: debouncedQuery }],
    queryFn: () => ownersApi.list({ page, limit: PAGE_SIZE, q: debouncedQuery || undefined }),
    placeholderData: (previous) => previous,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    query,
    setQuery,
    owners: data?.data ?? [],
    page,
    setPage,
    totalPages,
    total,
    loading: isLoading,
    error: error
      ? error instanceof ApiError
        ? error.messages.join(" ")
        : "No se pudieron cargar los dueños."
      : null,
  };
}
