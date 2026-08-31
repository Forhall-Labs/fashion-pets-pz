// Capa de mapeo entre la API NestJS y el tipo `Owner` del frontend — los
// nombres de campo difieren (addressLat/addressLng acá, lat/lng en `Owner`)
// así que la conversión vive en un solo lugar en vez de en cada consumidor.

import type { Owner, Weekday } from "../types";
import { apiClient, toQueryString, type Page } from "./api-client";

interface OwnerRecord {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  addressLat: string | number | null;
  addressLng: string | number | null;
  fixedVisitDay: Weekday | null;
  // Solo presente en GET /owners (list) — el conteo de mascotas viene del
  // include('pets', count) del backend, no de un fetch aparte.
  pets?: number;
}

function toOwner(record: OwnerRecord): Owner {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    address: record.address,
    lat: record.addressLat != null ? Number(record.addressLat) : null,
    lng: record.addressLng != null ? Number(record.addressLng) : null,
    fixedVisitDay: record.fixedVisitDay,
  };
}

export interface OwnerListItem extends Owner {
  petCount: number;
}

function toOwnerListItem(record: OwnerRecord): OwnerListItem {
  return { ...toOwner(record), petCount: record.pets ?? 0 };
}

export interface OwnerInput {
  name: string;
  phone: string;
  address: string | null;
  fixedVisitDay: Weekday | null;
}

function toBody(input: OwnerInput) {
  return {
    name: input.name,
    phone: input.phone,
    address: input.address || null,
    fixedVisitDay: input.fixedVisitDay || null,
  };
}

export interface ListOwnersParams {
  page?: number;
  limit?: number;
  q?: string;
  [key: string]: string | number | undefined;
}

export const ownersApi = {
  list: (params: ListOwnersParams = {}) =>
    apiClient
      .get<Page<OwnerRecord>>(`/owners${toQueryString(params)}`)
      .then((page) => ({ ...page, data: page.data.map(toOwnerListItem) })),
  get: (id: string) => apiClient.get<OwnerRecord>(`/owners/${id}`).then(toOwner),
  create: (input: OwnerInput) =>
    apiClient.post<OwnerRecord>("/owners", toBody(input)).then(toOwner),
  update: (id: string, input: OwnerInput) =>
    apiClient.patch<OwnerRecord>(`/owners/${id}`, toBody(input)).then(toOwner),
};
