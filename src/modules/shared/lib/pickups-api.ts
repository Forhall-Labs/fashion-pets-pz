// GET /pickups y GET /pickups/route (Épica 6). Las formas coinciden 1:1 con
// pickups.rules.ts del API; lo único que se normaliza es lat/lng (Numeric).

import { apiClient, toQueryString } from "./api-client";

export type PickupFlag = "location_missing" | "invalid_appointment_data";
export type ExclusionReason = "location_missing" | "invalid_address" | "unsupported_region";

export interface PickupItem {
  appointmentId: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  startTime: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  flags: PickupFlag[];
}

export interface RouteStop {
  address: string;
  lat: number;
  lng: number;
  pets: Pick<PickupItem, "appointmentId" | "petId" | "petName" | "ownerName">[];
}

export interface PickupRoute {
  date: string;
  stops: RouteStop[];
  excluded: { appointmentId: string; petName: string; reason: ExclusionReason }[];
  signature: string;
}

const num = (v: number | string | null) => (v == null ? null : Number(v));

export const pickupsApi = {
  list: (date: string) =>
    apiClient
      .get<{ date: string; pickups: PickupItem[] }>(`/pickups${toQueryString({ date })}`)
      .then((r) => r.pickups.map((p) => ({ ...p, lat: num(p.lat), lng: num(p.lng) }))),
  route: (date: string) =>
    apiClient.get<PickupRoute>(`/pickups/route${toQueryString({ date })}`).then((r) => ({
      ...r,
      stops: r.stops.map((s) => ({ ...s, lat: Number(s.lat), lng: Number(s.lng) })),
    })),
};

/** Misma firma que arma el API: ids de las citas, ordenados. */
export function pickupSignature(pickups: Pick<PickupItem, "appointmentId">[]): string {
  return pickups
    .map((p) => p.appointmentId)
    .sort()
    .join(",");
}
