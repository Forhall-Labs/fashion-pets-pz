"use client";

import { useRouter } from "next/navigation";

import { getAppointment, getOwner, getPet, petLocation } from "../lib/selectors";
import type { MockData } from "../types";
import { whatsAppLinkForAppointment } from "../lib/whatsapp";

// Puerto de openAppointmentDetail() — solo lectura por ahora. Editar,
// reprogramar y cancelar quedan para la próxima etapa (necesitan mutaciones
// contra la API real, no mock local).
export function useAppointmentDetailModal(
  data: MockData,
  appointmentId: string,
  onClose: () => void,
) {
  const router = useRouter();
  const appt = getAppointment(data, appointmentId);
  const pet = appt ? getPet(data, appt.petId)! : null;
  const owner = pet ? getOwner(data, pet.ownerId)! : null;
  const loc = pet ? petLocation(data, pet) : null;
  const waLink = appt && pet && owner ? whatsAppLinkForAppointment(appt, pet, owner) : null;

  function goToOwner() {
    if (!owner) return;
    onClose();
    router.push(`/owners/${owner.id}`);
  }

  return { appt, pet, owner, loc, waLink, goToOwner };
}
