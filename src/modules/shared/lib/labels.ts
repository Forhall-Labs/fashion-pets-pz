import type { AppointmentStatus, GroomingFrequency, PetSize, Weekday } from "../types";

export const SIZE_LABEL: Record<PetSize, string> = {
  small: "Pequeño",
  medium: "Mediano",
  extra_large: "Extra grande",
};

export const FREQ_LABEL: Record<GroomingFrequency, string> = {
  twice_a_month: "Dos veces al mes",
  once_a_month: "Una vez al mes",
  once_every_two_months: "Cada dos meses",
};

// Los servicios del catálogo usan su propio nombre (ver service-catalog.ts).
export const FULL_GROOM_LABEL = "Grooming completo";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const DAY_OPTIONS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABEL: Record<Weekday, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};
