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
