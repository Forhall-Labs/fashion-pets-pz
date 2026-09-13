"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { toISODate } from "@/modules/shared/lib/date-utils";
import { appointmentsApi } from "@/modules/shared/lib/appointments-api";
import { petsApi } from "@/modules/shared/lib/pets-api";
import { shopConfigApi } from "@/modules/shared/lib/shop-config-api";
import { blackoutPeriodsApi } from "@/modules/shared/lib/blackout-periods-api";
import type { Pet } from "@/modules/shared/types";

import type { CalView } from "./useAgendaView";

// Mismo cálculo de grid de 42 celdas que usaba useMonthGrid — se trae ese
// rango completo (no solo el mes calendario) para no cortar citas de los
// bordes que Mes sí muestra (días de la semana anterior/siguiente).
function monthGridRange(anchorDate: Date) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 41);
  return { from: toISODate(gridStart), to: toISODate(gridEnd) };
}

function rangeFor(view: CalView, anchor: string, anchorDate: Date, weekDays: string[] | null) {
  if (view === "day") return { from: anchor, to: anchor };
  if (view === "week") return { from: weekDays![0], to: weekDays![6] };
  if (view === "month") return monthGridRange(anchorDate);
  const year = anchorDate.getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

// Trae los datos reales que necesita cualquier vista de Agenda: citas del
// rango visible, todas las mascotas (para resolver petId -> nombre en los
// tiles, sin N+1 fetches), config del shop (horario/duración de servicio
// rápido) y períodos de blackout (resaltado). loading/error alimentan
// directamente los estados vacío/error+Reintentar de HU-2.1.
export function useAgendaData(
  view: CalView,
  anchor: string,
  anchorDate: Date,
  weekDays: string[] | null,
) {
  const { from, to } = rangeFor(view, anchor, anchorDate, weekDays);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", { from, to }],
    queryFn: () => appointmentsApi.listByRange(from, to),
  });
  const petsQuery = useQuery({
    queryKey: ["pets", { limit: 200 }],
    queryFn: () => petsApi.list({ limit: 200 }),
  });
  const shopConfigQuery = useQuery({ queryKey: ["shop-config"], queryFn: shopConfigApi.get });
  const blackoutQuery = useQuery({
    queryKey: ["blackout-periods"],
    queryFn: blackoutPeriodsApi.list,
  });

  const petsById = useMemo(
    () => new Map<string, Pet>((petsQuery.data?.data ?? []).map((p) => [p.id, p])),
    [petsQuery.data],
  );

  const appointments = appointmentsQuery.data ?? [];
  const loading = appointmentsQuery.isLoading || petsQuery.isLoading || shopConfigQuery.isLoading;
  const hasError = !!(
    appointmentsQuery.error ||
    petsQuery.error ||
    shopConfigQuery.error ||
    blackoutQuery.error
  );

  function refetch() {
    void appointmentsQuery.refetch();
    void petsQuery.refetch();
    void shopConfigQuery.refetch();
    void blackoutQuery.refetch();
  }

  return {
    appointments,
    petsById,
    shopConfig: shopConfigQuery.data ?? null,
    blackoutPeriods: blackoutQuery.data ?? [],
    loading,
    error: hasError,
    refetch,
  };
}
