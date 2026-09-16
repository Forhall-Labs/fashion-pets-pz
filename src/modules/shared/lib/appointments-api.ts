// Los nombres de campo de /appointments ya coinciden 1:1 con el tipo
// `Appointment` del frontend — a diferencia de owners/pets, no hace falta
// mapear nombres. Sí hace falta normalizar startTime: Postgres devuelve el
// tipo `time` como "HH:MM:SS" (a veces con fracción de segundos), y todo el
// frontend (tiles, formularios) asume "HH:MM".

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

function normalize(record: Appointment): Appointment {
  return { ...record, startTime: record.startTime.slice(0, 5) };
}

export const appointmentsApi = {
  // Sin from/to: usado por usePetForm.ts para el chequeo de citas futuras al
  // cambiar la frecuencia de una mascota — necesita ver todas, no un rango.
  list: () => apiClient.get<Appointment[]>("/appointments").then((rs) => rs.map(normalize)),
  listByRange: (from: string, to: string) =>
    apiClient
      .get<Appointment[]>(`/appointments${toQueryString({ from, to })}`)
      .then((rs) => rs.map(normalize)),
  get: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`).then(normalize),
  create: (input: AppointmentInput, idempotencyKey: string) =>
    apiClient
      .post<Appointment>("/appointments", input, {
        headers: { "Idempotency-Key": idempotencyKey },
      })
      .then(normalize),
  update: (id: string, input: Partial<AppointmentInput>) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, input).then(normalize),
  cancel: (id: string) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, { status: "cancelled" }).then(normalize),
};
