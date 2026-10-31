// HU-6.3: links para abrir la ruta en Google Maps o Waze. Se usan los links
// web universales: en un teléfono con la app instalada la abren, y sin la app
// caen en la versión web — así no hace falta detectar si está instalada.

interface Point {
  lat: number;
  lng: number;
}

export class MapLinkError extends Error {}

const coord = (p: Point) => `${p.lat},${p.lng}`;

function assertValid(stops: Point[]) {
  if (!stops.length) throw new MapLinkError("La ruta no tiene paradas válidas.");
  for (const s of stops) {
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) {
      throw new MapLinkError("Una de las paradas tiene coordenadas inválidas.");
    }
  }
}

/** Google Maps: la última parada es el destino y las anteriores, waypoints en orden. */
export function googleMapsUrl(stops: Point[]): string {
  assertValid(stops);
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", coord(stops[stops.length - 1]));
  url.searchParams.set("travelmode", "driving");
  if (stops.length > 1) url.searchParams.set("waypoints", stops.slice(0, -1).map(coord).join("|"));

  // Se relee la URL armada y se cuentan las paradas: si por cualquier motivo
  // falta una, se corta acá en vez de abrir una ruta incompleta.
  const built = new URL(url.toString());
  const waypoints = built.searchParams.get("waypoints");
  const count =
    (waypoints ? waypoints.split("|").length : 0) + (built.searchParams.get("destination") ? 1 : 0);
  if (count !== stops.length) {
    throw new MapLinkError("El link de Google Maps no incluye todas las paradas.");
  }
  return url.toString();
}

/**
 * Waze no admite varias paradas en un link: navega a una sola. La pantalla
 * abre la primera y muestra el resto en orden para seguir desde ahí.
 */
export function wazeUrl(stop: Point): string {
  assertValid([stop]);
  return `https://waze.com/ul?ll=${encodeURIComponent(coord(stop))}&navigate=yes`;
}
