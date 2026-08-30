import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Appointment, Pet } from "@/modules/shared/types";

import { useAppointmentTile } from "./useAppointmentTile";

const basePet: Pet = {
  id: "p1",
  ownerId: "o1",
  name: "Rex",
  breed: "Labrador",
  size: "extra_large",
  isAggressive: false,
  groomingFrequency: "once_a_month",
  needsPickup: true,
  locationAddress: null,
  lat: null,
  lng: null,
  avgServiceDuration: 60,
};

const baseAppt: Appointment = {
  id: "a1",
  petId: "p1",
  date: "2026-08-30",
  startTime: "09:00",
  durationMinutes: 60,
  serviceType: "full_groom",
  status: "scheduled",
  source: "manual",
  flaggedReason: null,
};

describe("useAppointmentTile", () => {
  it("builds the base class list and title for a plain appointment", () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() => useAppointmentTile(baseAppt, basePet, onOpen));

    expect(result.current.className).toBe("appt-tile");
    expect(result.current.title).toBe("Rex — 09:00");
    expect(result.current.cancelledSuffix).toBe("");
  });

  it("adds is-quick, is-auto and is-exception classes for the matching appointment fields", () => {
    const onOpen = vi.fn();
    const appt: Appointment = {
      ...baseAppt,
      serviceType: "quick_service",
      source: "auto_scheduled",
      flaggedReason: "Excepción",
    };
    const { result } = renderHook(() => useAppointmentTile(appt, basePet, onOpen));

    expect(result.current.className).toBe("appt-tile is-quick is-auto is-exception");
  });

  it("renders the cancelled suffix when the appointment was cancelled", () => {
    const onOpen = vi.fn();
    const appt: Appointment = { ...baseAppt, status: "cancelled" };
    const { result } = renderHook(() => useAppointmentTile(appt, basePet, onOpen));

    expect(result.current.cancelledSuffix).toBe(" (cancelada)");
  });

  it("stops propagation and opens the appointment by id on click", () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() => useAppointmentTile(baseAppt, basePet, onOpen));
    const stopPropagation = vi.fn();

    result.current.handleClick({ stopPropagation } as unknown as React.MouseEvent);

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("a1");
  });
});
