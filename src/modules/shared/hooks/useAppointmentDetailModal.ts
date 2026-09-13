"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { appointmentsApi } from "../lib/appointments-api";
import { petsApi } from "../lib/pets-api";
import { ownersApi } from "../lib/owners-api";
import { ApiError } from "../lib/api-client";
import { whatsAppLinkForAppointment } from "../lib/whatsapp";

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

// Puerto de openAppointmentDetail(), ahora contra la API real: 3 queries
// encadenadas (cita -> mascota -> dueño), cada una independiente — así un
// fallo puntual en una sección (p.ej. el dueño) no tira abajo el resto del
// panel, y una entidad borrada (404 en cualquiera de las tres) se distingue
// de un error de red genérico (HU-2.2 @validation/@error).
export function useAppointmentDetailModal(appointmentId: string, onClose: () => void) {
  const router = useRouter();

  const apptQuery = useQuery({
    queryKey: ["appointments", "detail", appointmentId],
    queryFn: () => appointmentsApi.get(appointmentId),
    retry: (failureCount, err) => !isNotFound(err) && failureCount < 2,
  });

  const petId = apptQuery.data?.petId;
  const petQuery = useQuery({
    queryKey: ["pets", "detail", petId],
    queryFn: () => petsApi.get(petId!),
    enabled: !!petId,
    retry: (failureCount, err) => !isNotFound(err) && failureCount < 2,
  });

  const ownerId = petQuery.data?.ownerId;
  const ownerQuery = useQuery({
    queryKey: ["owners", "detail", ownerId],
    queryFn: () => ownersApi.get(ownerId!),
    enabled: !!ownerId,
    retry: (failureCount, err) => !isNotFound(err) && failureCount < 2,
  });

  const appt = apptQuery.data ?? null;
  const pet = petQuery.data ?? null;
  const owner = ownerQuery.data ?? null;

  const loc = pet
    ? pet.lat != null && pet.lng != null
      ? { address: pet.locationAddress, has: true }
      : owner && owner.lat != null && owner.lng != null
        ? { address: owner.address, has: true }
        : { address: null, has: false }
    : null;

  const waLink = appt && pet && owner ? whatsAppLinkForAppointment(appt, pet, owner) : null;

  function goToOwner() {
    if (!owner) return;
    onClose();
    router.push(`/owners/${owner.id}`);
  }

  return {
    loading: apptQuery.isLoading,
    // La cita, o la mascota que referencia, ya no existen — el panel entero
    // no tiene nada sensato que mostrar (todo el resto de la UI depende de
    // ambas), a diferencia del dueño (ver ownerSectionError abajo).
    notFound: isNotFound(apptQuery.error) || (!!petId && isNotFound(petQuery.error)),
    loadError:
      (!!apptQuery.error && !isNotFound(apptQuery.error)) ||
      (!!petQuery.error && !isNotFound(petQuery.error)),
    appt,
    pet,
    owner,
    ownerSectionError: !!ownerId && (!!ownerQuery.error || isNotFound(ownerQuery.error)),
    loc,
    waLink,
    goToOwner,
  };
}
