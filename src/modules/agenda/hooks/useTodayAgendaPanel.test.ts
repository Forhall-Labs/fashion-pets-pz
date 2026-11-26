import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Appointment, Pet } from "@/modules/shared/types";

import { useTodayAgendaPanel } from "./useTodayAgendaPanel";

const PET: Pet = {
  id: "p1",
  ownerId: "o1",
  name: "Rex",
  breed: null,
  size: "small",
  isAggressive: false,
  groomingFrequency: null,
  needsPickup: false,
  locationAddress: null,
  lat: null,
  lng: null,
  avgServiceDuration: null,
};
const PETS = new Map([[PET.id, PET]]);

function appt(
  id: string,
  startTime: string,
  durationMinutes: number,
  status = "scheduled",
): Appointment {
  return {
    id,
    petId: PET.id,
    date: "2026-11-26",
    startTime,
    durationMinutes,
    serviceType: "full_groom",
    serviceId: null,
    status: status as Appointment["status"],
    source: "manual",
    flaggedReason: null,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 26, 16, 9)); // 16:09 local
});
afterEach(() => vi.useRealTimers());

describe("useTodayAgendaPanel", () => {
  it("keeps an appointment that already started but has not ended", () => {
    const { result } = renderHook(() =>
      useTodayAgendaPanel([appt("a", "14:00", 90), appt("b", "15:30", 90)], PETS),
    );
    // 14:00–15:30 ya terminó; 15:30–17:00 sigue en curso.
    expect(result.current.items.map((i) => i.appt.id)).toEqual(["b"]);
  });

  it("still lists today's cancellations even if their time passed", () => {
    const { result } = renderHook(() =>
      useTodayAgendaPanel([appt("a", "09:00", 60, "cancelled")], PETS),
    );
    expect(result.current.items.map((i) => i.appt.id)).toEqual(["a"]);
  });

  it("says there were no appointments when the day is empty", () => {
    const { result } = renderHook(() => useTodayAgendaPanel([], PETS));
    expect(result.current.emptyMessage).toBe("No hay citas hoy.");
  });

  it("says how many already passed when none are left", () => {
    const { result } = renderHook(() =>
      useTodayAgendaPanel([appt("a", "09:00", 60), appt("b", "10:00", 60)], PETS),
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.emptyMessage).toBe("No quedan citas por hoy: ya pasaron las 2 del día.");
  });

  it("uses the singular for a single past appointment", () => {
    const { result } = renderHook(() => useTodayAgendaPanel([appt("a", "09:00", 60)], PETS));
    expect(result.current.emptyMessage).toBe("No quedan citas por hoy: ya pasó la única del día.");
  });
});
