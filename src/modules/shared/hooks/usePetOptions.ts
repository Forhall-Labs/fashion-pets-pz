"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ownersApi } from "../lib/owners-api";
import { petsApi } from "../lib/pets-api";

// Mascotas para un <select>, como "Nombre — Dueño" para desambiguar nombres
// repetidos entre dueños (caso real: dos "Chocolate"). Compartido entre el
// formulario de cita y la lista de espera.
export function usePetOptions() {
  const petsQuery = useQuery({
    // 100 es el máximo que acepta PaginationQueryDto (@Max(100) en el
    // backend) — ver la misma nota en useAgendaData.ts.
    queryKey: ["pets", { limit: 100 }],
    queryFn: () => petsApi.list({ limit: 100 }),
  });
  // En paralelo con petsQuery (no encadenada): un solo request extra que
  // reusa GET /owners tal cual, sin pedir el dueño mascota por mascota.
  const ownersQuery = useQuery({
    queryKey: ["owners", { limit: 100 }],
    queryFn: () => ownersApi.list({ limit: 100 }),
  });
  const ownersById = useMemo(
    () => new Map(ownersQuery.data?.data.map((o) => [o.id, o]) ?? []),
    [ownersQuery.data],
  );
  const pets = useMemo(() => petsQuery.data?.data ?? [], [petsQuery.data]);
  const petOptions = useMemo(
    () =>
      pets.map((p) => {
        const owner = ownersById.get(p.ownerId);
        return { id: p.id, label: owner ? `${p.name} — ${owner.name}` : p.name };
      }),
    [pets, ownersById],
  );

  return {
    pets,
    ownersById,
    petOptions,
    // Combinado: si solo mirara petsQuery, el select mostraría nombres sin
    // dueño hasta que llegue ownersQuery.
    loading: petsQuery.isLoading || ownersQuery.isLoading,
    error: petsQuery.isError || ownersQuery.isError,
  };
}
