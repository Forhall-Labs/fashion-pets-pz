// FR-17 / FR-17a: nunca se envía nada automáticamente — solo se compone el
// mensaje y se abre wa.me con el chat correcto. El Admin aprieta "enviar"
// dentro de WhatsApp.
//
// HU-7.1: en vez de devolver un link o null, devuelve el motivo exacto por el
// que no se puede armar (teléfono, dato faltante, sin citas) para mostrarlo
// en pantalla. La hora de la cita no va en el mensaje, a pedido del cliente.

import { formatDateLong } from "./date-utils";
import type { Owner, Pet, ServiceType } from "../types";

// Los clientes son de Costa Rica: un número local tiene 8 dígitos y el código
// de país es 506. Un número con más dígitos se toma como que ya trae código.
const COUNTRY_CODE = "506";
const LOCAL_DIGITS = 8;
const MAX_INTERNATIONAL_DIGITS = 15;

// wa.me no documenta un límite, pero los navegadores y la app empiezan a
// cortar URLs largas; por encima de esto se parte en varios mensajes.
export const MAX_URL_LENGTH = 2000;

export interface WhatsAppMessage {
  text: string;
  url: string;
}

export type WhatsAppResult =
  { ok: true; messages: WhatsAppMessage[] } | { ok: false; error: string };

export interface UpcomingForWhatsApp {
  pet: Pick<Pet, "name">;
  date: string;
  serviceType: ServiceType;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(error: string): WhatsAppResult {
  return { ok: false, error };
}

function phoneForWhatsApp(
  phone: string | null | undefined,
): { digits: string } | { error: string } {
  const raw = String(phone ?? "").trim();
  if (!raw) return { error: "El dueño no tiene teléfono. Agregá un número válido primero." };
  if (/[^\d\s()+.-]/.test(raw)) {
    return { error: "El formato del teléfono no es válido: solo puede tener números." };
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === LOCAL_DIGITS && !raw.startsWith("+")) {
    return { error: `Al teléfono le falta el código de país. Agregá +${COUNTRY_CODE} adelante.` };
  }
  if (digits.length <= LOCAL_DIGITS || digits.length > MAX_INTERNATIONAL_DIGITS) {
    return { error: "El formato del teléfono no es válido." };
  }
  return { digits };
}

function missingDetail(item: UpcomingForWhatsApp): string | null {
  if (!item.pet.name?.trim()) return "A una de las citas le falta el nombre de la mascota.";
  if (!item.date || !ISO_DATE.test(item.date)) {
    return `A la cita de ${item.pet.name} le falta la fecha.`;
  }
  return null;
}

function serviceLabel(serviceType: ServiceType): string {
  return serviceType === "quick_service" ? "servicio rápido" : "grooming completo";
}

function dateLabel(iso: string): string {
  return `${formatDateLong(iso)} (${iso})`;
}

function toMessage(digits: string, text: string): WhatsAppMessage {
  return { text, url: `https://wa.me/${digits}?text=${encodeURIComponent(text)}` };
}

export function whatsAppForAppointment(
  appt: UpcomingForWhatsApp,
  owner: Pick<Owner, "name" | "phone">,
): WhatsAppResult {
  const phone = phoneForWhatsApp(owner.phone);
  if ("error" in phone) return fail(phone.error);
  const missing = missingDetail(appt);
  if (missing) return fail(missing);

  const kind = appt.serviceType === "quick_service" ? "un servicio rápido" : "un grooming completo";
  const text = `Hola ${owner.name}! Te recordamos ${kind} para ${appt.pet.name} el ${dateLabel(appt.date)}. ¡Te esperamos en la peluquería! 🐾`;
  return { ok: true, messages: [toMessage(phone.digits, text)] };
}

export function whatsAppForAllUpcoming(
  owner: Pick<Owner, "name" | "phone">,
  upcoming: UpcomingForWhatsApp[],
): WhatsAppResult {
  const phone = phoneForWhatsApp(owner.phone);
  if ("error" in phone) return fail(phone.error);
  if (!upcoming.length) return fail("Este dueño no tiene próximas citas.");
  for (const item of upcoming) {
    const missing = missingDetail(item);
    if (missing) return fail(missing);
  }
  if (upcoming.length === 1) return whatsAppForAppointment(upcoming[0], owner);

  const lines = upcoming.map(
    (a) => `• ${a.pet.name} (${serviceLabel(a.serviceType)}): ${dateLabel(a.date)}`,
  );
  const footer = "¡Te esperamos! 🐾";
  const header = (part: string) => `Hola ${owner.name}! Te recordamos las próximas citas${part}:`;
  const compose = (part: string, chunk: string[]) => [header(part), ...chunk, footer].join("\n");

  // Se parte por citas enteras, nunca a mitad de una línea. El encabezado se
  // mide con el "(N/N)" más largo posible para que numerar no lo pase del límite.
  const fits = (chunk: string[]) =>
    toMessage(phone.digits, compose(` (${upcoming.length}/${upcoming.length})`, chunk)).url
      .length <= MAX_URL_LENGTH;
  if (toMessage(phone.digits, compose("", lines)).url.length <= MAX_URL_LENGTH) {
    return { ok: true, messages: [toMessage(phone.digits, compose("", lines))] };
  }
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (current.length && !fits([...current, line])) {
      chunks.push(current);
      current = [];
    }
    current.push(line);
  }
  chunks.push(current);
  return {
    ok: true,
    messages: chunks.map((chunk, i) =>
      toMessage(phone.digits, compose(` (${i + 1}/${chunks.length})`, chunk)),
    ),
  };
}
