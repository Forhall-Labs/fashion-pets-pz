"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { mockData, TODAY_ISO } from "@/modules/shared/lib/mock-data";
import { upcomingAppointmentsForOwner, getPet } from "@/modules/shared/lib/selectors";
import { whatsAppLinkForAllUpcoming } from "@/modules/shared/lib/whatsapp";
import { ApiError } from "@/modules/shared/lib/api-client";
import { ownersApi } from "@/modules/shared/lib/owners-api";
import { petsApi } from "@/modules/shared/lib/pets-api";

// Puerto de "Ficha del Dueño" (renderOwnerDetail() en app.js), ahora contra
// la API real para el dueño y sus mascotas (GET /pets?ownerId=... — sin
// paginar, un solo dueño nunca tiene tantas mascotas como para necesitarla).
// "Próximas citas" y el WhatsApp de recordatorio siguen sobre mockData a
// propósito — Epic 2 es quien conecta appointments/agenda de verdad; acá
// solo degradan a "sin citas" (los ids reales no matchean los del mock, así
// que nunca hay falsos positivos, solo un estado vacío).
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

  const owner = ownerQuery.data ?? null;
  const pets = petsQuery.data?.data ?? [];
  const notFound = ownerQuery.error instanceof ApiError && ownerQuery.error.status === 404;
  const loading = ownerQuery.isLoading || (ownerQuery.isSuccess && petsQuery.isLoading);
  const error =
    !notFound && (ownerQuery.error || petsQuery.error) ? "No se pudo cargar el dueño." : null;

  const upcoming = owner
    ? upcomingAppointmentsForOwner(mockData, owner.id, TODAY_ISO).map((a) => ({
        ...a,
        pet: getPet(mockData, a.petId)!,
      }))
    : [];
  const waLink = owner ? whatsAppLinkForAllUpcoming(mockData, owner, TODAY_ISO) : null;

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
