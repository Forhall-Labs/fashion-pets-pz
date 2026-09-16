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
    // 100 es el máximo que acepta PaginationQueryDto (@Max(100) en el
    // backend) — no es ajustable por acá. Sirve para el volumen actual de
    // una sola peluquería; si en algún momento supera las 100 mascotas,
    // este mapeo petId->nombre necesita un endpoint sin paginar o resolver
    // por id bajo demanda en vez de traer todo de una.
    queryKey: ["pets", { limit: 100 }],
    queryFn: () => petsApi.list({ limit: 100 }),
  });
  const shopConfigQuery = useQuery({ queryKey: ["shop-config"], queryFn: shopConfigApi.get });
  const blackoutQuery = useQuery({
    queryKey: ["blackout-periods"],
    queryFn: blackoutPeriodsApi.list,
  });
  // Independiente del rango que esté mirando el usuario (podría estar en
  // otro mes/día) — el panel de "Hoy" siempre muestra el día real de hoy.
  const todayIso = toISODate(new Date());
  const todayQuery = useQuery({
    queryKey: ["appointments", { from: todayIso, to: todayIso }],
    queryFn: () => appointmentsApi.listByRange(todayIso, todayIso),
  });

  const petsById = useMemo(
    () => new Map<string, Pet>((petsQuery.data?.data ?? []).map((p) => [p.id, p])),
    [petsQuery.data],
  );

  const appointments = appointmentsQuery.data ?? [];
  const loading = appointmentsQuery.isLoading || petsQuery.isLoading;
  // shopConfig y blackoutPeriods no bloquean el render: shopConfig solo lo
  // usa AppointmentForm (autocompletar duración, ya tolera que no esté) y
  // blackoutPeriods es puramente cosmético (resaltado). Si cualquiera de
  // los dos falla, la Agenda tiene que seguir mostrando el calendario con
  // las citas reales — solo appointments/pets son datos que todas las
  // vistas necesitan para poder pintar algo.
  const hasError = !!(appointmentsQuery.error || petsQuery.error);

  function refetch() {
    void appointmentsQuery.refetch();
    void petsQuery.refetch();
    void shopConfigQuery.refetch();
    void blackoutQuery.refetch();
    void todayQuery.refetch();
  }

  return {
    appointments,
    petsById,
    shopConfig: shopConfigQuery.data ?? null,
    blackoutPeriods: blackoutQuery.data ?? [],
    todayAppointments: todayQuery.data ?? [],
    // Aparte de `loading`: el panel de Hoy no depende del rango que esté
    // mirando el usuario, así que no tiene sentido esperar a que cargue el
    // resto del calendario, pero sí necesita esperar su propio fetch (+
    // pets, para resolver nombres) antes de poder decir "no quedan citas" —
    // si no, un instante muestra vacío antes de que lleguen los datos
    // reales (mismo tipo de parpadeo ya arreglado en el detalle de cita).
    todayLoading: todayQuery.isLoading || petsQuery.isLoading,
    loading,
    error: hasError,
    refetch,
  };
}
