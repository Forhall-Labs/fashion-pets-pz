import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { addMonths, toISODate } from "@/modules/shared/lib/date-utils";
import { TODAY_ISO } from "@/modules/shared/lib/mock-data";

import { useAgendaView } from "./useAgendaView";

describe("useAgendaView", () => {
  it("starts on the month view anchored to today", () => {
    const { result } = renderHook(() => useAgendaView());

    expect(result.current.view).toBe("month");
    expect(result.current.anchor).toBe(TODAY_ISO);
    expect(result.current.weekDays).toBeNull();
    expect(result.current.openAppointmentId).toBeNull();
  });

  it("shifts the anchor by a month at a time in month view", () => {
    const { result } = renderHook(() => useAgendaView());

    act(() => result.current.shift(1));

    expect(result.current.anchor).toBe(addMonths(TODAY_ISO, 1));
  });

  it("computes a monday-to-sunday range and label when switching to week view", () => {
    const { result } = renderHook(() => useAgendaView());

    act(() => result.current.setView("week"));

    expect(result.current.weekDays).toHaveLength(7);
    const monday = new Date(result.current.weekDays![0] + "T00:00:00");
    expect(monday.getDay()).toBe(1);
    expect(result.current.label).toContain("–");
  });

  it("resets to today when goToToday is called after navigating away", () => {
    const { result } = renderHook(() => useAgendaView());

    act(() => result.current.shift(1));
    act(() => result.current.goToToday());

    expect(result.current.anchor).toBe(TODAY_ISO);
  });

  it("jumps to the chosen month and switches the view via gotoMonth", () => {
    const { result } = renderHook(() => useAgendaView());
    const anchorDate = new Date(TODAY_ISO + "T00:00:00");

    act(() => result.current.setView("year"));
    act(() => result.current.gotoMonth(0));

    expect(result.current.view).toBe("month");
    expect(result.current.anchor).toBe(toISODate(new Date(anchorDate.getFullYear(), 0, 1)));
  });

  it("opens and closes the appointment modal", () => {
    const { result } = renderHook(() => useAgendaView());

    act(() => result.current.openAppointment("a1"));
    expect(result.current.openAppointmentId).toBe("a1");

    act(() => result.current.closeAppointment());
    expect(result.current.openAppointmentId).toBeNull();
  });
});
