// FR-17 / FR-17a: nunca se envía nada automáticamente — solo se compone el
// mensaje y se abre wa.me con el chat correcto. El Admin aprieta "enviar"
// dentro de WhatsApp. Puerto de docs/prototype/app.js.

import { digitsOnly, formatDateLong } from "./date-utils";
import type { Appointment, MockData, Owner, Pet } from "../types";
import { petsOfOwner } from "./selectors";

export function whatsAppLinkForAppointment(appt: Appointment, pet: Pet, owner: Owner) {
  const phoneDigits = digitsOnly(owner.phone);
  if (phoneDigits.length < 7) return null;
  const kind = appt.serviceType === "quick_service" ? "un servicio rápido" : "un turno de grooming";
  const message = `Hola ${owner.name}! Te recordamos ${kind} para ${pet.name} el ${formatDateLong(appt.date)} a las ${appt.startTime}. ¡Te esperamos en la peluquería! 🐾`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function whatsAppLinkForAllUpcoming(data: MockData, owner: Owner, todayIso: string) {
  const phoneDigits = digitsOnly(owner.phone);
  if (phoneDigits.length < 7) return null;
  const pets = petsOfOwner(data, owner.id);
  const upcoming = data.appointments
    .filter(
      (a) => pets.some((p) => p.id === a.petId) && a.status === "scheduled" && a.date >= todayIso,
    )
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  if (!upcoming.length) return null;
  const lines = upcoming
    .map((a) => {
      const pet = pets.find((p) => p.id === a.petId);
      return `• ${pet?.name}: ${formatDateLong(a.date)} a las ${a.startTime}`;
    })
    .join("\n");
  const message = `Hola ${owner.name}! Te recordamos las próximas citas:\n${lines}\n¡Te esperamos! 🐾`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
