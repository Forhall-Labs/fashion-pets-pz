export interface MapPoint {
  lat: number;
  lng: number;
}

/** El punto que se cargó en el formulario, o null si no hay coordenadas. */
export function toMapPoint(p: { lat: number | null; lng: number | null }): MapPoint | null {
  return p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null;
}

/**
 * Qué mandarle al API sobre las coordenadas:
 * - undefined: el punto no cambió, no se manda (el API decide con la dirección).
 * - un punto: se marcó o se movió; gana sobre el geocoding.
 * - null: se quitó el punto; el API vuelve a geocodificar la dirección.
 */
export function pointChange(
  initial: MapPoint | null,
  current: MapPoint | null,
): MapPoint | null | undefined {
  if (initial?.lat === current?.lat && initial?.lng === current?.lng) return undefined;
  return current;
}
