// Tipos del dominio — reflejan el schema de docs/system_design.md §3.
// Todavía no hay backend: estos tipos alimentan src/modules/shared/mock-data.ts
// hasta que se reemplacen por datos reales de la API.

export type PetSize = "small" | "medium" | "extra_large";

export type GroomingFrequency = "twice_a_month" | "once_a_month" | "once_every_two_months";

export type ServiceType = "full_groom" | "quick_service";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export type AppointmentSource = "manual" | "auto_scheduled" | "waiting_list_approval";

export type WaitingListStatus = "active" | "fulfilled" | "cancelled";

export type Weekday =
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Owner {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  fixedVisitDay: Weekday | null;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  breed: string | null;
  size: PetSize;
  isAggressive: boolean;
  groomingFrequency: GroomingFrequency | null;
  needsPickup: boolean;
  locationAddress: string | null;
  lat: number | null;
  lng: number | null;
  avgServiceDuration: number | null;
}

export interface Appointment {
  id: string;
  petId: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string; // HH:MM
  durationMinutes: number;
  serviceType: ServiceType;
  status: AppointmentStatus;
  source: AppointmentSource;
  flaggedReason: string | null;
}

export interface WaitingListEntry {
  id: string;
  petId: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  status: WaitingListStatus;
  fulfilledAppointmentId: string | null;
  createdAt: string;
}

export interface BlackoutPeriod {
  id: string;
  startDate: string;
  endDate: string;
  label: string | null;
}

export interface ShopConfig {
  maxPetsPerDay: number;
  quickServiceDurationMinutes: number | null;
  openTime: string;
  closeTime: string;
}

export interface MockData {
  owners: Owner[];
  pets: Pet[];
  appointments: Appointment[];
  waitingList: WaitingListEntry[];
  blackoutPeriods: BlackoutPeriod[];
  shopConfig: ShopConfig;
}
