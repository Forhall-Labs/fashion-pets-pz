// Los nombres de campo de /appointments ya coinciden 1:1 con el tipo
// `Appointment` del frontend — a diferencia de owners/pets, no hace falta
// una capa de mapeo.

import type { Appointment } from "../types";
import { apiClient, toQueryString } from "./api-client";

export interface AppointmentInput {
  petId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  serviceType: Appointment["serviceType"];
  flaggedReason?: string | null;
}

export const appointmentsApi = {
  // Sin from/to: usado por usePetForm.ts para el chequeo de citas futuras al
  // cambiar la frecuencia de una mascota — necesita ver todas, no un rango.
  list: () => apiClient.get<Appointment[]>("/appointments"),
  listByRange: (from: string, to: string) =>
    apiClient.get<Appointment[]>(`/appointments${toQueryString({ from, to })}`),
  get: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`),
  create: (input: AppointmentInput, idempotencyKey: string) =>
    apiClient.post<Appointment>("/appointments", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  update: (id: string, input: Partial<AppointmentInput>) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, input),
  cancel: (id: string) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, { status: "cancelled" }),
};
