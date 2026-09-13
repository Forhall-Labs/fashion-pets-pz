// FR-17 / FR-17a: nunca se envía nada automáticamente — solo se compone el
// mensaje y se abre wa.me con el chat correcto. El Admin aprieta "enviar"
// dentro de WhatsApp. Puerto de docs/prototype/app.js.

import { digitsOnly, formatDateLong } from "./date-utils";
import type { Appointment, Owner, Pet } from "../types";

export function whatsAppLinkForAppointment(appt: Appointment, pet: Pet, owner: Owner) {
  const phoneDigits = digitsOnly(owner.phone);
  if (phoneDigits.length < 7) return null;
  const kind = appt.serviceType === "quick_service" ? "un servicio rápido" : "un turno de grooming";
  const message = `Hola ${owner.name}! Te recordamos ${kind} para ${pet.name} el ${formatDateLong(appt.date)} a las ${appt.startTime}. ¡Te esperamos en la peluquería! 🐾`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export interface UpcomingForWhatsApp {
  pet: Pet;
  date: string;
  startTime: string;
}

export function whatsAppLinkForAllUpcoming(owner: Owner, upcoming: UpcomingForWhatsApp[]) {
  const phoneDigits = digitsOnly(owner.phone);
  if (phoneDigits.length < 7) return null;
  if (!upcoming.length) return null;
  const lines = upcoming
    .map((a) => `• ${a.pet.name}: ${formatDateLong(a.date)} a las ${a.startTime}`)
    .join("\n");
  const message = `Hola ${owner.name}! Te recordamos las próximas citas:\n${lines}\n¡Te esperamos! 🐾`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
