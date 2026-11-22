import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  announceVacatedSlot,
  dismissVacatedSlot,
  resetVacatedSlots,
  useVacatedSlot,
} from "./vacated-slot";
import type { Appointment } from "../types";

const APPT: Appointment = {
  id: "a1",
  petId: "p1",
  date: "2026-11-13",
  startTime: "09:00",
  durationMinutes: 60,
  serviceType: "full_groom",
  status: "cancelled",
  source: "manual",
  flaggedReason: null,
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-02T12:00:00"));
});
afterEach(() => {
  vi.useRealTimers();
  act(() => resetVacatedSlots());
});

describe("vacated slot store (HU-5.2)", () => {
  it("offers the slot a future full groom leaves behind", () => {
    const { result } = renderHook(() => useVacatedSlot());
    act(() => announceVacatedSlot(APPT));
    expect(result.current).toEqual({
      date: "2026-11-13",
      startTime: "09:00",
      durationMinutes: 60,
      previousPetId: "p1",
    });
  });

  it("evaluates two vacated slots one after the other", () => {
    const { result } = renderHook(() => useVacatedSlot());
    act(() => {
      announceVacatedSlot(APPT);
      announceVacatedSlot({ ...APPT, id: "a2", petId: "p2" });
    });
    expect(result.current?.previousPetId).toBe("p1");
    act(() => dismissVacatedSlot());
    expect(result.current?.previousPetId).toBe("p2");
    act(() => dismissVacatedSlot());
    expect(result.current).toBeNull();
  });

  it("ignores quick services, which don't take part in size matching", () => {
    const { result } = renderHook(() => useVacatedSlot());
    act(() => announceVacatedSlot({ ...APPT, serviceType: "quick_service" }));
    expect(result.current).toBeNull();
  });

  it("ignores slots in the past", () => {
    const { result } = renderHook(() => useVacatedSlot());
    act(() => announceVacatedSlot({ ...APPT, date: "2026-10-30" }));
    expect(result.current).toBeNull();
  });
});
