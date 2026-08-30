"use client";

import { useState } from "react";

import { mockData, TODAY_ISO } from "@/modules/shared/mock-data";
import {
  getOwner,
  getPet,
  petsOfOwner,
  upcomingAppointmentsForOwner,
} from "@/modules/shared/selectors";
import { whatsAppLinkForAllUpcoming } from "@/modules/shared/whatsapp";

// Puerto de "Ficha del Dueño" (renderOwnerDetail() en app.js). Editar
// dueño/mascota (modales/formularios) queda para la próxima etapa.
export function useOwnerDetail(ownerId: string) {
  const [openAppointmentId, setOpenAppointmentId] = useState<string | null>(null);
  const owner = getOwner(mockData, ownerId);

  const pets = owner ? petsOfOwner(mockData, owner.id) : [];
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
    openAppointmentId,
    openAppointment: setOpenAppointmentId,
    closeAppointment: () => setOpenAppointmentId(null),
  };
}
