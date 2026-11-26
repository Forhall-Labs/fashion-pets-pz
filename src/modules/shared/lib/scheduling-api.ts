import { apiClient } from "./api-client";

// HU-3.1 — motor de agenda anual. El año objetivo (año actual + 1) lo
// decide el servidor con la zona de Costa Rica, no el reloj del navegador.

export interface SchedulingPetNote {
  petId: string;
  petName: string;
  reason: string;
}

export interface SchedulingWaitlistNote extends SchedulingPetNote {
  dueDate: string;
}

export interface SchedulingPetCount {
  petId: string;
  petName: string;
  count: number;
}

export interface SchedulingPreview {
  targetYear: number;
  appointmentsToCreate: number;
  pets: SchedulingPetCount[];
  waitlist: SchedulingWaitlistNote[];
  skipped: SchedulingPetNote[];
  /** Cuándo se crearon por última vez citas automáticas para ese año (ISO), o null. */
  lastScheduledAt: string | null;
}

export interface SchedulingReport {
  targetYear: number;
  created: number;
  pets: SchedulingPetCount[];
  waitlist: SchedulingWaitlistNote[];
  skipped: SchedulingPetNote[];
  failed: SchedulingPetNote[];
}

export const schedulingApi = {
  preview: () => apiClient.get<SchedulingPreview>("/scheduling/preview"),
  run: () => apiClient.post<SchedulingReport>("/scheduling/run", {}),
};
