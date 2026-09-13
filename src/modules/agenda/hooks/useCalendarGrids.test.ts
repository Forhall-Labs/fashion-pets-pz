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

  it("marks today's mini-day as having an appointment", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() =>
      useYearGrid(mockData.appointments, mockData.blackoutPeriods, today.getFullYear()),
    );

    const month = result.current.months[today.getMonth()];
    const todayMiniDay = month.miniDays.find((d) => d?.iso === TODAY_ISO);

    expect(todayMiniDay?.hasAppt).toBe(true);
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
