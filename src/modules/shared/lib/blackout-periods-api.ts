import type { BlackoutPeriod } from "../types";
import { apiClient, toQueryString } from "./api-client";

export type ConflictResolution = "cancel" | "keep" | "reschedule";

export interface BlackoutPeriodInput {
  startDate: string;
  endDate: string;
  label: string | null;
  conflictResolution?: ConflictResolution;
}

export interface BlackoutConflicts {
  appointments: {
    id: string;
    petId: string;
    petName: string | null;
    date: string;
    startTime: string;
  }[];
  overlappingPeriods: BlackoutPeriod[];
}

// `failed`: citas cuya resolución falló — el backend ya las marcó como
// "necesita reprogramación manual" (HU-4.1 @error), el período quedó guardado.
export interface BlackoutSaveResult {
  period: BlackoutPeriod;
  resolved: number;
  failed: string[];
}

// La API no acepta `label: null` en el DTO (IsOptional + IsString): se omite.
function toBody(input: Partial<BlackoutPeriodInput>) {
  const { label, ...rest } = input;
  return label ? { ...rest, label } : rest;
}

export const blackoutPeriodsApi = {
  list: () => apiClient.get<BlackoutPeriod[]>("/blackout-periods"),
  conflicts: (params: { startDate: string; endDate: string; excludeId?: string }) =>
    apiClient.get<BlackoutConflicts>(`/blackout-periods/conflicts${toQueryString(params)}`),
  create: (input: BlackoutPeriodInput) =>
    apiClient.post<BlackoutSaveResult>("/blackout-periods", toBody(input)),
  update: (id: string, input: Partial<BlackoutPeriodInput>) =>
    apiClient.patch<BlackoutSaveResult>(`/blackout-periods/${id}`, toBody(input)),
  remove: (id: string) => apiClient.delete<void>(`/blackout-periods/${id}`),
};
