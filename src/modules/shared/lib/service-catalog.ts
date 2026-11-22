import { FULL_GROOM_LABEL } from "./labels";
import type { Appointment, PetSize, Service } from "../types";

/** Duración sugerida del servicio para el tamaño de la mascota. */
export function durationFor(service: Service, size: PetSize): number {
  if (size === "small") return service.durationSmallMinutes;
  if (size === "medium") return service.durationMediumMinutes;
  return service.durationExtraLargeMinutes;
}

/** Nombre a mostrar del servicio de una cita ("Grooming completo" o el del catálogo). */
export function serviceNameOf(
  appt: Pick<Appointment, "serviceType" | "serviceId">,
  servicesById: ReadonlyMap<string, Service>,
): string {
  if (appt.serviceType === "full_groom") return FULL_GROOM_LABEL;
  return (appt.serviceId && servicesById.get(appt.serviceId)?.name) || "Servicio";
}
