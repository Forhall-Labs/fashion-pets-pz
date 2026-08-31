// Los nombres de campo de /appointments ya coinciden 1:1 con el tipo
// `Appointment` del frontend — a diferencia de owners/pets, no hace falta
// una capa de mapeo. Solo lo necesario para HU-1.3 (detectar citas futuras
// al cambiar la frecuencia de una mascota); el resto de Epic 2 lo amplía.

import type { Appointment } from "../types";
import { apiClient } from "./api-client";

export const appointmentsApi = {
  list: () => apiClient.get<Appointment[]>("/appointments"),
  cancel: (id: string) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, { status: "cancelled" }),
};
