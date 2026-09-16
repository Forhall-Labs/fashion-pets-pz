import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { fromISODate } from "@/modules/shared/lib/date-utils";
import { mockData, TODAY_ISO } from "@/modules/shared/lib/mock-data";

import { useYearGrid } from "./useCalendarGrids";

describe("useYearGrid", () => {
  it("returns 12 months of 42 mini-day slots each", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() =>
      useYearGrid(mockData.appointments, mockData.blackoutPeriods, today.getFullYear()),
    );

    expect(result.current.months).toHaveLength(12);
    expect(result.current.months.every((m) => m.miniDays.length === 42)).toBe(true);
  });

  it("counts today's scheduled appointments on its mini-day", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() =>
      useYearGrid(mockData.appointments, mockData.blackoutPeriods, today.getFullYear()),
    );

    const month = result.current.months[today.getMonth()];
    const todayMiniDay = month.miniDays.find((d) => d?.iso === TODAY_ISO);
    const expectedCount = mockData.appointments.filter(
      (a) => a.date === TODAY_ISO && a.status === "scheduled",
    ).length;

    expect(todayMiniDay?.count).toBe(expectedCount);
    expect(expectedCount).toBeGreaterThan(0);
  });

  it("does not count a cancelled appointment towards the day's count", () => {
    const cancelled = mockData.appointments.find((a) => a.status === "cancelled");
    if (!cancelled) throw new Error("fixture expects at least one cancelled appointment");
    const day = fromISODate(cancelled.date);
    const { result } = renderHook(() =>
      useYearGrid(mockData.appointments, mockData.blackoutPeriods, day.getFullYear()),
    );

    const month = result.current.months[day.getMonth()];
    const miniDay = month.miniDays.find((d) => d?.iso === cancelled.date);
    const scheduledCount = mockData.appointments.filter(
      (a) => a.date === cancelled.date && a.status === "scheduled",
    ).length;

    expect(miniDay?.count).toBe(scheduledCount);
  });

  it("flags a day inside a configured blackout period", () => {
    const today = fromISODate(TODAY_ISO);
    const blackoutDay = mockData.blackoutPeriods[0]!.startDate;
    const { result } = renderHook(() =>
      useYearGrid(mockData.appointments, mockData.blackoutPeriods, today.getFullYear()),
    );

    const month = result.current.months[fromISODate(blackoutDay).getMonth()];
    const day = month.miniDays.find((d) => d?.iso === blackoutDay);

    expect(day?.blackout).toBe(true);
  });
});
