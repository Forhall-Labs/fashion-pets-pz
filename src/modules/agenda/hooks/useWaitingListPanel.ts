"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
  const query = useQuery({ queryKey: ["waiting-list"], queryFn: waitingListApi.list });

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

  return {
    open,
    toggle: () => setOpen((v) => !v),
    items,
    bySize,
    staleCount,
    loading: query.isPending,
    error: query.isError,
    reload: () => void query.refetch(),
  };
}
