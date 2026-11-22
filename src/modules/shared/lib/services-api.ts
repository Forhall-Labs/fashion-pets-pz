import type { Service } from "../types";
import { apiClient } from "./api-client";

export type ServiceInput = Omit<Service, "id">;

// Catálogo de servicios (Épica 8). Sin borrar: un servicio se desactiva.
export const servicesApi = {
  list: () => apiClient.get<Service[]>("/services"),
  create: (input: ServiceInput, idempotencyKey: string) =>
    apiClient.post<Service>("/services", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  update: (id: string, input: Partial<ServiceInput>) =>
    apiClient.patch<Service>(`/services/${id}`, input),
};
