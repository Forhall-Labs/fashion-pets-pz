// HU-5.2: "se liberó un lugar". Cancelar (detalle de cita) y mover a otro día
// (drag-and-drop en Agenda) avisan acá; <VacatedSlotHost/> en el shell lo
// escucha y abre la recomendación de la lista de espera. Un store chico en
// vez de pasar callbacks por cada pantalla que puede liberar un lugar.

import { useSyncExternalStore } from "react";

import { toISODate } from "./date-utils";
import type { Appointment } from "../types";

export interface VacatedSlot {
  date: string;
  startTime: string;
  durationMinutes: number;
  /** La mascota que tenía el lugar: de ahí sale el tamaño a recomendar. */
  previousPetId: string;
}

// Una cola y no un solo valor: dos lugares liberados seguidos se evalúan
// cada uno por su lado (HU-5.2 "Two vacated slots at once").
let queue: VacatedSlot[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Avisa que `appt` dejó su lugar. Solo cuenta un grooming completo de hoy en
 * adelante: un servicio rápido no participa del matching por tamaño (HU-5.4)
 * y un lugar en el pasado ya no se puede volver a ocupar.
 */
export function announceVacatedSlot(appt: Appointment) {
  if (appt.serviceType !== "full_groom") return;
  if (appt.date < toISODate(new Date())) return;
  queue = [
    ...queue,
    {
      date: appt.date,
      startTime: appt.startTime,
      durationMinutes: appt.durationMinutes,
      previousPetId: appt.petId,
    },
  ];
  emit();
}

export function dismissVacatedSlot() {
  queue = queue.slice(1);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVacatedSlot(): VacatedSlot | null {
  return useSyncExternalStore(
    subscribe,
    () => queue[0] ?? null,
    () => null,
  );
}

/** Solo para tests. */
export function resetVacatedSlots() {
  queue = [];
  emit();
}
