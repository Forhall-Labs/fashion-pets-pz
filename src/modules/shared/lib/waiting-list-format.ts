import { formatDateShort } from "./date-utils";

// Formatos de la lista de espera, compartidos entre la pantalla "Lista de
// espera" y el panel de la Agenda.

export function waitingDays(createdAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - Date.parse(createdAt)) / 86_400_000));
}

export function waitingRangeLabel(start: string | null, end: string | null) {
  if (start && end) return `${formatDateShort(start)} – ${formatDateShort(end)}`;
  if (start) return `Desde ${formatDateShort(start)}`;
  if (end) return `Hasta ${formatDateShort(end)}`;
  return "Sin rango preferido";
}
