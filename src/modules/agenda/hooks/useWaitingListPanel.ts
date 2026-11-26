"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SIZE_LABEL } from "@/modules/shared/lib/labels";
import { waitingListApi, type WaitingEntry } from "@/modules/shared/lib/waiting-list-api";
import { waitingDays } from "@/modules/shared/lib/waiting-list-format";
import type { PetSize } from "@/modules/shared/types";

const SIZES = Object.keys(SIZE_LABEL) as PetSize[];

export interface WaitingPanelItem {
  entry: WaitingEntry;
  days: number;
  /** 0–1: qué tan llena va la barra de espera (relativa a la que más espera). */
  waitShare: number;
}

// Panel "Lista de espera" de la Agenda: quiénes esperan un lugar, el que más
// espera primero (las pendientes de limpieza al final), con un resumen por tamaño. Misma query que la pantalla
// "Lista de espera", así se actualizan juntas.
export function useWaitingListPanel(nowOverride?: number) {
  const [open, setOpen] = useState(true);
  // Fijo al montar: los días de espera no cambian mientras se mira la pantalla.
  const [now] = useState(() => nowOverride ?? Date.now());
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["waiting-list"], queryFn: waitingListApi.list });
  const [confirmingCleanup, setConfirmingCleanup] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);

  // Limpiar = quitar de la lista entradas cuya mascota ya tiene una cita
  // activa ("pendiente de limpieza"). Una sola o todas de una vez; si alguna
  // falla, las demás se quitan igual y se avisa cuántas quedaron.
  const cleanup = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => waitingListApi.remove(id)));
      return results.filter((r) => r.status === "rejected").length;
    },
    onMutate: () => setCleanupError(null),
    onSuccess: (failed) => {
      setConfirmingCleanup(false);
      if (failed > 0) {
        setCleanupError(
          failed === 1
            ? "No se pudo quitar 1 entrada. Probá de nuevo."
            : `No se pudieron quitar ${failed} entradas. Probá de nuevo.`,
        );
      }
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["waiting-list"] }),
  });

  const { items, bySize, staleCount } = useMemo(() => {
    const entries = query.data ?? [];
    const withDays = entries
      .map((entry) => ({ entry, days: waitingDays(entry.createdAt, now) }))
      // Primero las que se pueden agendar (la que más espera arriba); las
      // "pendiente de limpieza" van al final, no hay nada que agendar ahí.
      .sort(
        (a, b) =>
          Number(!!a.entry.staleReason) - Number(!!b.entry.staleReason) ||
          b.days - a.days ||
          a.entry.petName.localeCompare(b.entry.petName),
      );
    // Escala mínima de 30 días para que una espera corta no se vea "llena".
    const scale = Math.max(30, ...withDays.map((x) => x.days));
    return {
      items: withDays.map((x) => ({ ...x, waitShare: Math.min(1, x.days / scale) })),
      bySize: SIZES.map((size) => ({
        size,
        count: entries.filter((e) => e.size === size && !e.staleReason).length,
      })),
      staleCount: entries.filter((e) => e.staleReason).length,
    };
  }, [query.data, now]);

  const staleIds = items.filter((i) => i.entry.staleReason).map((i) => i.entry.id);

  return {
    open,
    toggle: () => setOpen((v) => !v),
    items,
    bySize,
    staleCount,
    removeOne: (id: string) => cleanup.mutate([id]),
    askCleanupAll: () => setConfirmingCleanup(true),
    cancelCleanupAll: () => setConfirmingCleanup(false),
    confirmCleanupAll: () => cleanup.mutate(staleIds),
    confirmingCleanup,
    cleaning: cleanup.isPending,
    cleaningIds: cleanup.isPending ? (cleanup.variables ?? []) : [],
    cleanupError,
    loading: query.isPending,
    error: query.isError,
    reload: () => void query.refetch(),
  };
}
