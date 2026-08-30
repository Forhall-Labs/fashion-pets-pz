// Helpers de dominio puros — mismo comportamiento que los `db.*` helpers de
// docs/prototype/app.js, pero recibiendo los datos como parámetro en vez de
// leer un `db` global (más fácil de testear y de reemplazar por queries reales).

import { fromISODate } from "./date-utils";
import type { Appointment, MockData, Pet } from "../types";

export function getOwner(data: MockData, id: string) {
  return data.owners.find((o) => o.id === id);
}

export function getPet(data: MockData, id: string) {
  return data.pets.find((p) => p.id === id);
}

export function getAppointment(data: MockData, id: string) {
  return data.appointments.find((a) => a.id === id);
}

export function petsOfOwner(data: MockData, ownerId: string) {
  return data.pets.filter((p) => p.ownerId === ownerId);
}

export function isIncomplete(pet: Pet) {
  return !pet.groomingFrequency || !pet.avgServiceDuration;
}

export interface PetLocation {
  lat: number | null;
  lng: number | null;
  address: string | null;
  has: boolean;
}

export function petLocation(data: MockData, pet: Pet): PetLocation {
  if (pet.lat != null && pet.lng != null) {
    return { lat: pet.lat, lng: pet.lng, address: pet.locationAddress, has: true };
  }
  const owner = getOwner(data, pet.ownerId);
  if (owner && owner.lat != null && owner.lng != null) {
    return { lat: owner.lat, lng: owner.lng, address: owner.address, has: true };
  }
  return { lat: null, lng: null, address: null, has: false };
}

export function isBlackoutDate(data: MockData, iso: string) {
  return data.blackoutPeriods.some((b) => iso >= b.startDate && iso <= b.endDate);
}

export function appointmentsOnDate(data: MockData, iso: string) {
  return data.appointments.filter((a) => a.date === iso);
}

export function hasActiveAppointment(data: MockData, petId: string) {
  return data.appointments.some((a) => a.petId === petId && a.status === "scheduled");
}

export function upcomingAppointmentsForOwner(data: MockData, ownerId: string, todayIso: string) {
  const pets = petsOfOwner(data, ownerId);
  return data.appointments
    .filter(
      (a: Appointment) =>
        pets.some((p) => p.id === a.petId) && a.status === "scheduled" && a.date >= todayIso,
    )
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((+fromISODate(toIso) - +fromISODate(fromIso)) / 86_400_000);
}
