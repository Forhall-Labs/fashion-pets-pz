// Mismo rol que owners-api.ts pero para `Pet` — mapea locationLat/locationLng
// y avgServiceDurationMinutes (API) a lat/lng/avgServiceDuration (frontend).

import type { GroomingFrequency, Pet, PetSize } from "../types";
import { apiClient, toQueryString, type Page } from "./api-client";

interface PetRecord {
  id: string;
  ownerId: string;
  name: string;
  breed: string | null;
  size: PetSize;
  isAggressive: boolean;
  groomingFrequency: GroomingFrequency | null;
  needsPickup: boolean;
  locationAddress: string | null;
  locationLat: string | number | null;
  locationLng: string | number | null;
  avgServiceDurationMinutes: number | null;
}

function toPet(record: PetRecord): Pet {
  return {
    id: record.id,
    ownerId: record.ownerId,
    name: record.name,
    breed: record.breed,
    size: record.size,
    isAggressive: record.isAggressive,
    groomingFrequency: record.groomingFrequency,
    needsPickup: record.needsPickup,
    locationAddress: record.locationAddress,
    lat: record.locationLat != null ? Number(record.locationLat) : null,
    lng: record.locationLng != null ? Number(record.locationLng) : null,
    avgServiceDuration: record.avgServiceDurationMinutes,
  };
}

export interface PetInput {
  ownerId: string;
  name: string;
  breed: string;
  size: PetSize;
  isAggressive: boolean;
  needsPickup: boolean;
  locationAddress: string | null;
  groomingFrequency: GroomingFrequency | null;
  avgServiceDuration: number | null;
}

function toBody(input: PetInput) {
  return {
    ownerId: input.ownerId,
    name: input.name,
    breed: input.breed,
    size: input.size,
    isAggressive: input.isAggressive,
    needsPickup: input.needsPickup,
    locationAddress: input.locationAddress || null,
    groomingFrequency: input.groomingFrequency || null,
    avgServiceDurationMinutes: input.avgServiceDuration || null,
  };
}

export interface ListPetsParams {
  ownerId?: string;
  page?: number;
  limit?: number;
  q?: string;
  [key: string]: string | number | undefined;
}

export const petsApi = {
  list: (params: ListPetsParams = {}) =>
    apiClient
      .get<Page<PetRecord>>(`/pets${toQueryString(params)}`)
      .then((page) => ({ ...page, data: page.data.map(toPet) })),
  create: (input: PetInput) => apiClient.post<PetRecord>("/pets", toBody(input)).then(toPet),
  update: (id: string, input: PetInput) =>
    apiClient.patch<PetRecord>(`/pets/${id}`, toBody(input)).then(toPet),
};
