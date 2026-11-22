// /waiting-list (Épica 5). Las formas coinciden con waiting-list.service.ts
// del API; createdAt llega como ISO instant y las fechas como YYYY-MM-DD.

import type { Appointment, PetSize } from "../types";
import { apiClient, toQueryString } from "./api-client";

export interface WaitingEntry {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  /** string y no PetSize: un tamaño inválido llega tal cual para marcarlo. */
  size: PetSize | string;
  createdAt: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  staleReason?: string | null;
}

export interface WaitingEntryInput {
  petId: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
}

export interface VacatedSlotQuery {
  date: string;
  size: string | null;
}

export type Recommendation =
  | { status: "manual_review"; reason: string }
  | {
      status: "match" | "open_no_match";
      ranked: boolean;
      candidates: WaitingEntry[];
      flagged: { entryId: string; petName: string; reason: string }[];
    };

export interface SlotInput {
  date: string;
  startTime: string;
  durationMinutes: number;
}

// Sin el campo vacío: el DTO del API rechaza null en fechas opcionales de
// alta, y "sin rango" es justamente no mandarlas.
function toBody(input: WaitingEntryInput) {
  return {
    petId: input.petId,
    ...(input.preferredStartDate ? { preferredStartDate: input.preferredStartDate } : {}),
    ...(input.preferredEndDate ? { preferredEndDate: input.preferredEndDate } : {}),
  };
}

export const waitingListApi = {
  list: () => apiClient.get<WaitingEntry[]>("/waiting-list"),
  create: (input: WaitingEntryInput, idempotencyKey: string) =>
    apiClient.post<WaitingEntry>("/waiting-list", toBody(input), {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  update: (id: string, input: Omit<WaitingEntryInput, "petId">) =>
    apiClient.patch<WaitingEntry>(`/waiting-list/${id}`, input),
  remove: (id: string) => apiClient.delete<void>(`/waiting-list/${id}`),
  suggestedRange: (petId: string) =>
    apiClient.get<{ start: string; end: string } | null>(
      `/waiting-list/suggested-range${toQueryString({ petId })}`,
    ),
  recommendations: (slot: VacatedSlotQuery) =>
    apiClient.get<Recommendation>(
      `/waiting-list/recommendations${toQueryString({ date: slot.date, size: slot.size ?? undefined })}`,
    ),
  approve: (id: string, slot: SlotInput) =>
    apiClient.post<{ appointment: Appointment; staleReason: string | null }>(
      `/waiting-list/${id}/approve`,
      slot,
    ),
};
