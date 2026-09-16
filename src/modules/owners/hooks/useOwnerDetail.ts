"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/modules/shared/lib/api-client";
import { ownersApi } from "@/modules/shared/lib/owners-api";
import { petsApi } from "@/modules/shared/lib/pets-api";
import { appointmentsApi } from "@/modules/shared/lib/appointments-api";
import { whatsAppLinkForAllUpcoming } from "@/modules/shared/lib/whatsapp";
import { toISODate } from "@/modules/shared/lib/date-utils";

// Ventana hacia adelante para "próximas citas" — un año alcanza y sobra
// para lo que un dueño puede tener agendado a la vez.
const UPCOMING_WINDOW_DAYS = 365;

function dateWindow() {
  const now = Date.now();
  return {
    todayIso: toISODate(new Date(now)),
    untilIso: toISODate(new Date(now + UPCOMING_WINDOW_DAYS * 86_400_000)),
  };
}

// Puerto de "Ficha del Dueño" (renderOwnerDetail() en app.js), ahora contra
// la API real para dueño, mascotas (GET /pets?ownerId=... — sin paginar, un
// solo dueño nunca tiene tantas mascotas como para necesitarla) y citas
// (Epic 2: "Próximas citas" y el WhatsApp de recordatorio ya no leen mockData).
export function useOwnerDetail(ownerId: string) {
  const [openAppointmentId, setOpenAppointmentId] = useState<string | null>(null);

  const ownerQuery = useQuery({
    queryKey: ["owners", "detail", ownerId],
    queryFn: () => ownersApi.get(ownerId),
    retry: (failureCount, err) =>
      err instanceof ApiError && err.status === 404 ? false : failureCount < 3,
  });

  const petsQuery = useQuery({
    queryKey: ["pets", { ownerId }],
    queryFn: () => petsApi.list({ ownerId }),
    enabled: ownerQuery.isSuccess,
  });

  // Date.now() es impuro y el linter de React Compiler lo rechaza dentro
  // del cuerpo del hook o de un useMemo — pero sí tolera la llamada como
  // argumento inicial de useState (se ejecuta una sola vez, al montar), y a
  // diferencia de useRef, el valor de useState se puede leer durante el
  // render sin violar la regla de "no leer refs durante el render".
  const [{ todayIso, untilIso }] = useState(dateWindow());
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", { from: todayIso, to: untilIso }],
    queryFn: () => appointmentsApi.listByRange(todayIso, untilIso),
    enabled: petsQuery.isSuccess,
  });

  const owner = ownerQuery.data ?? null;
  const pets = petsQuery.data?.data ?? [];
  const notFound = ownerQuery.error instanceof ApiError && ownerQuery.error.status === 404;
  const loading =
    ownerQuery.isLoading ||
    (ownerQuery.isSuccess && petsQuery.isLoading) ||
    (petsQuery.isSuccess && appointmentsQuery.isLoading);
  const error =
    !notFound && (ownerQuery.error || petsQuery.error || appointmentsQuery.error)
      ? "No se pudo cargar el dueño."
      : null;

  const upcoming = (appointmentsQuery.data ?? [])
    .filter((a) => a.status === "scheduled" && pets.some((p) => p.id === a.petId))
    .map((a) => ({ ...a, pet: pets.find((p) => p.id === a.petId)! }))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const waLink = owner ? whatsAppLinkForAllUpcoming(owner, upcoming) : null;

  return {
    owner,
    pets,
    upcoming,
    waLink,
    loading,
    notFound,
    error,
    openAppointmentId,
    openAppointment: setOpenAppointmentId,
    closeAppointment: () => setOpenAppointmentId(null),
  };
}
