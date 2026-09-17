import { ApiError } from "./api-client";

// Traducción genérica de errores de la API para forms de creación/edición —
// la mayoría de estos casos ya están bloqueados por la validación
// client-side, así que un mensaje genérico por status alcanza (a diferencia
// de auth-errors.ts, que sí necesita distinguir por código específico).
export function translateApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "Ya no existe — puede que lo hayan eliminado.";
    }
    if (err.status === 409) {
      return "No se pudo guardar por un conflicto con otro registro.";
    }
    if (err.status >= 400 && err.status < 500) {
      return "Revisá los datos ingresados e intentá de nuevo.";
    }
  }
  return "Ocurrió un error. Intentá de nuevo.";
}

// 409 de AppointmentValidationService trae un mensaje específico y
// accionable (horario/capacidad/blackout/overlap) — se muestra tal cual en
// vez del genérico de translateApiError(). Compartido entre el form manual
// (useAppointmentForm) y el reprogramado por drag-and-drop
// (useRescheduleAppointment), que disparan el mismo motor de validación.
export function translateAppointmentError(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return err.messages.join(" ");
  }
  return translateApiError(err);
}
