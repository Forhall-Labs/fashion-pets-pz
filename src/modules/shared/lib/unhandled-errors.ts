// Errores que llegan a window sin que nadie los haya atrapado (excepciones en
// event handlers, promesas rechazadas sin catch). Las de render las atrapan los
// error.tsx de Next; estas no pasan por ningún error boundary.

export const UNHANDLED_ERROR_MESSAGE =
  "Ocurrió un error inesperado y la acción puede no haberse completado. Si vuelve a pasar, recargá la página.";

// Ruido conocido que no es un fallo para el usuario:
// - AbortError: una request cancelada a propósito (navegar, desmontar).
// - ResizeObserver: aviso del navegador sin efecto visible (lo dispara Leaflet).
export function isReportableError(reason: unknown): boolean {
  if (reason instanceof DOMException && reason.name === "AbortError") return false;
  if (reason instanceof Error && reason.name === "AbortError") return false;
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return !message.startsWith("ResizeObserver loop");
}
